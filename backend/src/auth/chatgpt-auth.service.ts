import { Injectable, Logger, HttpException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as crypto from 'crypto';
import * as http from 'http';

@Injectable()
export class ChatGPTAuthService {
  private readonly logger = new Logger(ChatGPTAuthService.name);
  private readonly clientId = 'app_EMoamEEZ73f0CkXaXp7hrann';
  private readonly authorizeUrl = 'https://auth.openai.com/oauth/authorize';
  private readonly tokenUrl = 'https://auth.openai.com/oauth/token';
  // EXACT redirect URI registered for the codex_cli client
  private readonly redirectUri = 'http://localhost:1455/auth/callback';

  private activeServer: http.Server | null = null;

  constructor(private prisma: PrismaService) {}

  /**
   * Generates the authorize URL and saves PKCE state for the tenant.
   * Also starts a temporary server on port 1455 to receive the callback.
   */
  async startLogin(tenantId: string): Promise<string> {
    const randomState = crypto.randomBytes(16).toString('hex');
    const state = `${tenantId}|${randomState}`;
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        pendingOAuthState: state,
        pendingCodeVerifier: codeVerifier,
      },
    });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'openid profile email offline_access',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      audience: 'https://api.openai.com/v1',
      codex_cli_simplified_flow: 'true',
      originator: 'codex_cli_rs',
      id_token_add_organizations: 'true',
    });

    const fullUrl = `${this.authorizeUrl}?${params.toString()}`;
    this.logger.log(`Generated Authorize URL: ${fullUrl}`);

    // Start loopback server on 1455 to capture the callback
    this.startLoopbackServer(tenantId, state);

    return fullUrl;
  }

  private startLoopbackServer(tenantId: string, expectedState: string) {
    if (this.activeServer) {
      this.activeServer.close();
      this.activeServer = null;
    }

    this.activeServer = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        if (url.pathname === '/auth/callback') {
          const code = url.searchParams.get('code');
          const state = url.searchParams.get('state');

          if (!code || state !== expectedState) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end('<h1>Auth Error</h1><p>Invalid code or state mismatch.</p>');
            return;
          }

          // Exchange code for tokens
          try {
            await this.exchangeTokens(tenantId, code, state);
            res.writeHead(302, { Location: 'http://localhost:5173/keys?chatgpt=connected' });
            res.end();
          } catch (err: any) {
            res.writeHead(302, { Location: `http://localhost:5173/keys?chatgpt=error&message=${encodeURIComponent(err.message)}` });
            res.end();
          }

          // Close server after handling
          if (this.activeServer) {
            this.activeServer.close();
            this.activeServer = null;
          }
        } else {
          res.writeHead(404);
          res.end('Not found');
        }
      } catch (e) {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    });

    this.activeServer.listen(1455, () => {
      this.logger.log('Temporary OAuth callback server listening on port 1455');
    });

    // Auto-close after 5 minutes if no callback is received
    setTimeout(() => {
      if (this.activeServer) {
        this.logger.log('OAuth callback server timed out');
        this.activeServer.close();
        this.activeServer = null;
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Exchanges the authorization code for tokens and saves to the database.
   */
  private async exchangeTokens(tenantId: string, code: string, state: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    
    if (!tenant || tenant.pendingOAuthState !== state || !tenant.pendingCodeVerifier) {
      throw new HttpException('Invalid OAuth state or missing code verifier', 400);
    }

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        code_verifier: tenant.pendingCodeVerifier,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Token exchange failed: ${error}`);
      throw new HttpException('Failed to exchange ChatGPT tokens', 400);
    }

    const data = await response.json();
    const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000);

    let accountId: string | null = null;
    if (data.id_token) {
      try {
        const payload = JSON.parse(
          Buffer.from(data.id_token.split('.')[1], 'base64').toString('utf-8')
        );
        accountId = payload.sub || payload.email || null;
      } catch (e) {
        this.logger.warn('Failed to parse ID token payload');
      }
    }

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        chatgptAccessToken: data.access_token,
        chatgptRefreshToken: data.refresh_token || null,
        chatgptExpiresAt: expiresAt,
        chatgptAccountId: accountId,
        pendingOAuthState: null,
        pendingCodeVerifier: null,
      },
    });

    this.logger.log(`ChatGPT connection successful for tenant ${tenantId}`);
  }

  /**
   * Handle legacy callback if hit directly on the NestJS API
   */
  async handleCallback(code: string, state: string): Promise<void> {
    const tenantId = state.split('|')[0];
    await this.exchangeTokens(tenantId, code, state);
  }

  /**
   * Disconnects ChatGPT for a tenant by clearing tokens.
   */
  async disconnect(tenantId: string): Promise<void> {
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        chatgptAccessToken: null,
        chatgptRefreshToken: null,
        chatgptExpiresAt: null,
        chatgptAccountId: null,
      },
    });
    this.logger.log(`ChatGPT disconnected for tenant ${tenantId}`);
  }
}
