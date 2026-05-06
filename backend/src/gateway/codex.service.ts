import { Injectable, Logger, HttpException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UsageService } from '../usage/usage.service';

@Injectable()
export class CodexService {
  private readonly logger = new Logger(CodexService.name);
  private readonly codexBaseUrl = 'https://chatgpt.com/backend-api/codex';
  private readonly clientId = 'app_EMoamEEZ73f0CkXaXp7hrann'; // Codex CLI Client ID

  constructor(
    private prisma: PrismaService,
    private usageService: UsageService,
  ) {}

  private readonly codexModelsList = [
    { name: 'GPT-5.5', id: 'gpt-5.5' },
    { name: 'GPT-5.4', id: 'gpt-5.4' },
    { name: 'GPT-5.4-Mini', id: 'gpt-5.4-mini' },
    { name: 'GPT-5.3-Codex', id: 'gpt-5.3-codex' },
    { name: 'GPT-5.2', id: 'gpt-5.2' },
  ];

  private mapCodexModel(model: string): string {
    const mapping: Record<string, string> = {
      'GPT-5.5': 'gpt-5.5',
      'GPT-5.4': 'gpt-5.4',
      'GPT-5.4-Mini': 'gpt-5.4-mini',
      'GPT-5.3-Codex': 'gpt-5.3-codex',
      'GPT-5.2': 'gpt-5.2'
    };
    return mapping[model] || model;
  }

  getCodexModels() {
    return this.codexModelsList.map(m => ({
      name: m.name,
      modified_at: new Date().toISOString(),
      size: 0,
      digest: 'codex',
      details: { format: 'gguf', family: 'gpt', families: ['gpt'], parameter_size: 'unknown', quantization_level: 'none' }
    }));
  }

  /**
   * Proxy a request to ChatGPT Codex API.
   */
  async proxyRequest(
    endpoint: string,
    body: any,
    tenantId: string,
  ): Promise<any> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant || !tenant.chatgptAccessToken) {
      throw new HttpException('ChatGPT not connected for this tenant. Please login first.', 401);
    }

    const rawModel = body.model || tenant.defaultModel || 'gpt-4o';
    const model = this.mapCodexModel(rawModel);
    
    const accessToken = await this.getValidAccessToken(tenantId);
    const startTime = Date.now();

    try {
      const instructions = body.system || 'You are a helpful assistant.';
      const input = this.formatInput(body);

      // IMPORTANT: Some Codex models (like gpt-5.5) REQUIRE stream: true
      const requestBody = {
        model,
        store: false,
        instructions,
        input,
        stream: true, // Always use stream for Codex compatibility
      };

      const response = await fetch(`${this.codexBaseUrl}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          ...(tenant.chatgptAccountId ? { 'chatgpt-account-id': tenant.chatgptAccountId } : {}),
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Codex API error text: ${errorText}`);
        throw new HttpException(`ChatGPT Codex error: ${response.status} - ${errorText}`, response.status);
      }

      // Aggregate streaming response for non-streaming Gateway request
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is null');

      let fullText = '';
      let lastData: any = null;
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            try {
              const data = JSON.parse(dataStr);
              lastData = data;
              
              // New structure: text is in 'delta' for delta events or 'text' for done events
              if (data.delta) {
                fullText += data.delta;
              } else if (data.output_text) {
                fullText += data.output_text;
              } else if (data.text && !fullText) {
                // If we haven't collected deltas, use the full text from done event
                fullText = data.text;
              } else if (data.output && data.output[0]?.content && data.output[0].content[0]?.text) {
                fullText += data.output[0].content[0].text;
              }
            } catch (e) {
              // Ignore partial JSON
            }
          }
        }
      }

      const latencyMs = Date.now() - startTime;
      const result = {
        model: rawModel,
        created_at: new Date().toISOString(),
        message: {
          role: 'assistant',
          content: fullText || (lastData && lastData.output && lastData.output[0]?.content[0]?.text) || '',
        },
        done: true,
      };

      await this.usageService.logUsage({
        tenantId,
        endpoint,
        model: rawModel,
        status: 'SUCCESS',
        statusCode: 200,
        latencyMs,
        provider: 'codex',
        requestBody: JSON.stringify(body),
        responseBody: JSON.stringify(result),
      });

      return result;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Codex request failed', error);
      throw new HttpException(`Codex error: ${error.message}`, 502);
    }
  }

  /**
   * Proxy a streaming request to ChatGPT Codex.
   */
  async proxyStreamRequest(
    endpoint: string,
    body: any,
    tenantId: string,
  ): Promise<ReadableStream> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant || !tenant.chatgptAccessToken) {
      throw new HttpException('ChatGPT not connected', 401);
    }

    const rawModel = body.model || tenant.defaultModel || 'gpt-4o';
    const model = this.mapCodexModel(rawModel);
    
    const accessToken = await this.getValidAccessToken(tenantId);

    const instructions = body.system || 'You are a helpful assistant.';
    const input = this.formatInput(body);

    const requestBody = {
      model,
      store: false,
      instructions,
      input,
      stream: true,
    };

    const response = await fetch(`${this.codexBaseUrl}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...(tenant.chatgptAccountId ? { 'chatgpt-account-id': tenant.chatgptAccountId } : {}),
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Codex API streaming error text: ${errorText}`);
      throw new HttpException(`Codex streaming error: ${response.status} - ${errorText}`, response.status);
    }

    const codexStream = response.body;
    if (!codexStream) throw new Error('Codex response body is null');

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            try {
              const data = JSON.parse(dataStr);
              let content = '';

              if (data.type === 'response.output_text.delta' && data.delta) {
                content = data.delta;
              } else if (data.type === 'response.output_text.done' && data.text) {
                // We usually don't need to send the full text again in Ollama stream if deltas were sent
                // but we can send it as a final chunk if we want.
                // For now, let's just ignore 'done' to avoid duplication, 
                // or only send it if it's the only thing.
              } else if (data.output_text) {
                content = data.output_text;
              }

              if (content) {
                const ollamaChunk = {
                  model: rawModel,
                  created_at: new Date().toISOString(),
                  message: {
                    role: 'assistant',
                    content: content,
                  },
                  done: false,
                };
                controller.enqueue(new TextEncoder().encode(JSON.stringify(ollamaChunk) + '\n'));
              }
            } catch (e) {
              // Ignore partial JSON
            }
          }
        }
      },
      flush(controller) {
        const finalChunk = {
          model: rawModel,
          created_at: new Date().toISOString(),
          done: true,
        };
        controller.enqueue(new TextEncoder().encode(JSON.stringify(finalChunk) + '\n'));
      }
    });

    return codexStream.pipeThrough(transformStream) as any;
  }

  private formatInput(body: any): any[] {
    if (body.messages && Array.isArray(body.messages)) {
      return body.messages.map(m => {
        const role = m.role === 'system' ? 'user' : m.role;
        const contentType = role === 'assistant' ? 'output_text' : 'input_text';
        
        return {
          role,
          content: [{ type: contentType, text: m.content }]
        };
      });
    }
    return [{
      role: 'user',
      content: [{ type: 'input_text', text: body.prompt || '' }]
    }];
  }

  private mapToOllamaResponse(codexData: any, model: string): any {
    const content = codexData.output_text || 
                   (codexData.output && codexData.output[0]?.content[0]?.text) || '';
    
    return {
      model,
      created_at: new Date().toISOString(),
      message: {
        role: 'assistant',
        content,
      },
      done: true,
    };
  }

  private async getValidAccessToken(tenantId: string): Promise<string> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant || !tenant.chatgptAccessToken) {
      throw new HttpException('ChatGPT not connected', 401);
    }

    const now = new Date();
    // Refresh if expired or expiring in less than 2 minutes
    if (tenant.chatgptExpiresAt && tenant.chatgptExpiresAt.getTime() - now.getTime() < 120000) {
      if (!tenant.chatgptRefreshToken) {
        throw new HttpException('ChatGPT session expired and no refresh token available. Please login again.', 401);
      }
      return this.refreshAccessToken(tenantId, tenant.chatgptRefreshToken);
    }

    return tenant.chatgptAccessToken;
  }

  private async refreshAccessToken(tenantId: string, refreshToken: string): Promise<string> {
    const response = await fetch('https://auth.openai.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.clientId,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new HttpException('Failed to refresh ChatGPT session', 401);
    }

    const data = await response.json();
    const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000);

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        chatgptAccessToken: data.access_token,
        chatgptRefreshToken: data.refresh_token || refreshToken,
        chatgptExpiresAt: expiresAt,
      },
    });

    return data.access_token;
  }
}
