import { Response } from 'express';
import { GatewayService } from './gateway.service';
export declare class GatewayController {
    private gatewayService;
    constructor(gatewayService: GatewayService);
    chat(body: any, req: any, res: Response): Promise<void>;
    generate(body: any, req: any, res: Response): Promise<void>;
    listModels(req: any): Promise<any>;
    getSettings(): Promise<{
        id: string;
        cooldownMinutes: number;
        maxRetries: number;
        rotationStrategy: string;
        ollamaBaseUrl: string;
    } | null>;
    updateSettings(body: any): Promise<{
        id: string;
        cooldownMinutes: number;
        maxRetries: number;
        rotationStrategy: string;
        ollamaBaseUrl: string;
    }>;
}
