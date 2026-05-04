import { Injectable, Logger, HttpException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { KeyRotationService, SelectedKey } from '../key-pool/key-rotation.service';
import { UsageService } from '../usage/usage.service';

export interface ProxyResult {
  success: boolean;
  data?: any;
  statusCode: number;
  retryCount: number;
  keysUsed: { id: string; label: string; result: string }[];
  latencyMs: number;
}

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);

  constructor(
    private prisma: PrismaService,
    private keyRotation: KeyRotationService,
    private usageService: UsageService,
  ) {}

  /**
   * Proxy a request to Ollama Cloud with automatic key rotation on 429.
   */
  async proxyRequest(
    endpoint: string,
    body: any,
    tenantId?: string,
  ): Promise<ProxyResult> {
    const settings = await this.prisma.settings.findUnique({ where: { id: 'global' } });
    const maxRetries = settings?.maxRetries || 3;
    const baseUrl = settings?.ollamaBaseUrl || 'https://ollama.com';

    const excludeKeyIds: string[] = [];
    const keysUsed: { id: string; label: string; result: string }[] = [];
    let retryCount = 0;
    const startTime = Date.now();

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      // Select a key
      const selectedKey = attempt === 0
        ? await this.keyRotation.selectKey(tenantId)
        : await this.keyRotation.selectKeyExcluding(excludeKeyIds, tenantId);

      if (!selectedKey) {
        const latencyMs = Date.now() - startTime;
        this.logger.error('❌ No available keys in the pool');

        // Log the failure
        await this.usageService.logUsage({
          tenantId,
          endpoint,
          model: body?.model,
          status: 'FAILED',
          statusCode: 503,
          latencyMs,
          retryCount,
          errorMessage: 'No available API keys in pool',
        });

        throw new HttpException(
          {
            error: 'No available API keys',
            message: 'All keys are either in cooldown or disabled. Please try again later.',
            keysUsed,
          },
          503,
        );
      }

      this.logger.log(`🔑 Attempt ${attempt + 1}: Using key "${selectedKey.label}" (${selectedKey.id.slice(0, 8)}...)`);

      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${selectedKey.key}`,
          },
          body: JSON.stringify({ ...body, stream: false }),
          signal: AbortSignal.timeout(120000), // 2min timeout
        });

        if (response.status === 429) {
          // Rate limited - mark key as cooling down
          this.logger.warn(`⚠️ Key "${selectedKey.label}" got 429 - rotating to next key`);
          await this.keyRotation.markCoolingDown(selectedKey.id);
          excludeKeyIds.push(selectedKey.id);
          keysUsed.push({ id: selectedKey.id, label: selectedKey.label, result: '429_RATE_LIMITED' });
          retryCount++;
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          const latencyMs = Date.now() - startTime;
          keysUsed.push({ id: selectedKey.id, label: selectedKey.label, result: `ERROR_${response.status}` });

          await this.keyRotation.recordUsage(selectedKey.id);
          await this.usageService.logUsage({
            tenantId,
            apiKeyId: selectedKey.id,
            apiKeyLabel: selectedKey.label,
            endpoint,
            model: body?.model,
            status: 'FAILED',
            statusCode: response.status,
            latencyMs,
            retryCount,
            errorMessage: errorText,
          });

          const outStatus = response.status === 401 ? 502 : response.status;
          throw new HttpException(
            { error: 'Ollama API error', statusCode: response.status, message: errorText, keysUsed },
            outStatus,
          );
        }

        // Success!
        const data = await response.json();
        const latencyMs = Date.now() - startTime;
        keysUsed.push({ id: selectedKey.id, label: selectedKey.label, result: 'SUCCESS' });

        await this.keyRotation.recordUsage(selectedKey.id);

        // Estimate tokens
        const inputText = JSON.stringify(body);
        const outputText = JSON.stringify(data);
        const tokensInput = Math.ceil(inputText.length / 4);
        const tokensOutput = Math.ceil(outputText.length / 4);

        await this.usageService.logUsage({
          tenantId,
          apiKeyId: selectedKey.id,
          apiKeyLabel: selectedKey.label,
          endpoint,
          model: body?.model,
          status: retryCount > 0 ? 'RETRIED' : 'SUCCESS',
          statusCode: 200,
          latencyMs,
          tokensInput,
          tokensOutput,
          retryCount,
        });

        this.logger.log(`✅ Request successful via key "${selectedKey.label}" (${latencyMs}ms, ${retryCount} retries)`);

        return {
          success: true,
          data,
          statusCode: 200,
          retryCount,
          keysUsed,
          latencyMs,
        };
      } catch (error) {
        if (error instanceof HttpException) throw error;

        const latencyMs = Date.now() - startTime;
        keysUsed.push({ id: selectedKey.id, label: selectedKey.label, result: 'NETWORK_ERROR' });

        await this.usageService.logUsage({
          tenantId,
          apiKeyId: selectedKey.id,
          apiKeyLabel: selectedKey.label,
          endpoint,
          model: body?.model,
          status: 'FAILED',
          statusCode: 0,
          latencyMs,
          retryCount,
          errorMessage: error.message,
        });

        throw new HttpException(
          { error: 'Network error', message: error.message, keysUsed },
          502,
        );
      }
    }

    // Exhausted all retries
    const latencyMs = Date.now() - startTime;
    await this.usageService.logUsage({
      tenantId,
      endpoint,
      model: body?.model,
      status: 'FAILED',
      statusCode: 429,
      latencyMs,
      retryCount,
      errorMessage: 'All keys rate limited after max retries',
    });

    throw new HttpException(
      {
        error: 'All keys exhausted',
        message: `All available keys were rate limited after ${retryCount} retries.`,
        keysUsed,
      },
      429,
    );
  }

  /**
   * Proxy a streaming request to Ollama Cloud with automatic key rotation on 429.
   * Returns a ReadableStream.
   */
  async proxyStreamRequest(
    endpoint: string,
    body: any,
    tenantId?: string,
  ): Promise<{ stream: ReadableStream; keysUsed: { id: string; label: string; result: string }[] }> {
    const settings = await this.prisma.settings.findUnique({ where: { id: 'global' } });
    const maxRetries = settings?.maxRetries || 3;
    const baseUrl = settings?.ollamaBaseUrl || 'https://ollama.com';

    const excludeKeyIds: string[] = [];
    const keysUsed: { id: string; label: string; result: string }[] = [];
    let retryCount = 0;
    const startTime = Date.now();

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const selectedKey = attempt === 0
        ? await this.keyRotation.selectKey(tenantId)
        : await this.keyRotation.selectKeyExcluding(excludeKeyIds, tenantId);

      if (!selectedKey) {
        throw new HttpException(
          { error: 'No available API keys', message: 'All keys are either in cooldown or disabled.', keysUsed },
          503,
        );
      }

      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${selectedKey.key}`,
          },
          body: JSON.stringify({ ...body, stream: true }),
        });

        if (response.status === 429) {
          await this.keyRotation.markCoolingDown(selectedKey.id);
          excludeKeyIds.push(selectedKey.id);
          keysUsed.push({ id: selectedKey.id, label: selectedKey.label, result: '429_RATE_LIMITED' });
          retryCount++;
          continue;
        }

        if (!response.ok || !response.body) {
          const errorText = await response.text();
          const outStatus = response.status === 401 ? 502 : response.status;
          throw new HttpException(
            { error: 'Ollama API error', message: errorText, keysUsed },
            outStatus,
          );
        }

        keysUsed.push({ id: selectedKey.id, label: selectedKey.label, result: 'SUCCESS' });
        await this.keyRotation.recordUsage(selectedKey.id);

        const latencyMs = Date.now() - startTime;
        await this.usageService.logUsage({
          tenantId,
          apiKeyId: selectedKey.id,
          apiKeyLabel: selectedKey.label,
          endpoint,
          model: body?.model,
          status: retryCount > 0 ? 'RETRIED' : 'SUCCESS',
          statusCode: 200,
          latencyMs,
          retryCount,
        });

        return { stream: response.body as any, keysUsed };
      } catch (error) {
        if (error instanceof HttpException) throw error;
        throw new HttpException({ error: 'Network error', message: error.message, keysUsed }, 502);
      }
    }

    throw new HttpException(
      { error: 'All keys exhausted', message: 'All keys were rate limited.', keysUsed },
      429,
    );
  }

  /**
   * List models available via the Ollama Cloud.
   */
  async listModels(tenantId?: string) {
    const settings = await this.prisma.settings.findUnique({ where: { id: 'global' } });
    const baseUrl = settings?.ollamaBaseUrl || 'https://ollama.com';

    const selectedKey = await this.keyRotation.selectKey(tenantId);
    if (!selectedKey) {
      throw new HttpException({ error: 'No available API keys' }, 503);
    }

    const response = await fetch(`${baseUrl}/api/tags`, {
      headers: { Authorization: `Bearer ${selectedKey.key}` },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const outStatus = response.status === 401 ? 502 : response.status;
      throw new HttpException({ error: 'Failed to list models' }, outStatus);
    }

    return response.json();
  }

  /**
   * Get settings
   */
  async getSettings() {
    return this.prisma.settings.findUnique({ where: { id: 'global' } });
  }

  /**
   * Update settings
   */
  async updateSettings(data: {
    cooldownMinutes?: number;
    maxRetries?: number;
    rotationStrategy?: string;
    ollamaBaseUrl?: string;
  }) {
    return this.prisma.settings.update({
      where: { id: 'global' },
      data,
    });
  }
}
