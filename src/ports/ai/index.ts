export type AiRole = 'system' | 'user' | 'assistant';

export interface AiMessage {
  readonly role: AiRole;
  readonly content: string;
}

export interface AiCompletionRequest {
  readonly messages: readonly AiMessage[];
  readonly model?: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly signal?: AbortSignal;
}

export interface AiUsage {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
}

export interface AiCompletionResponse {
  readonly content: string;
  readonly model: string;
  readonly usage?: AiUsage;
}

export type AiOptions = {
  readonly adapter: 'openrouter';
  readonly apiKey: string;
  readonly model: string;
  readonly baseUrl?: string;
};

export abstract class Ai {
  constructor(public readonly adapter: string) {}

  static async create(options: AiOptions): Promise<Ai> {
    if (options.adapter === 'openrouter') {
      const { OpenRouterAi } = await import('./adapters/openrouter/index.js');
      return new OpenRouterAi(options.apiKey, options.model, options.baseUrl);
    }

    throw new Error(`Unsupported AI adapter: ${(options as { adapter: string }).adapter}`);
  }

  abstract complete(request: AiCompletionRequest): Promise<AiCompletionResponse>;
}
