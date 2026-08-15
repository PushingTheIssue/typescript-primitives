import { Ai, type AiCompletionRequest, type AiCompletionResponse, type AiUsage } from '../../index.js';

interface OpenRouterResponse {
  readonly model?: string;
  readonly choices?: readonly [{ readonly message?: { readonly content?: string | null } }, ...unknown[]];
  readonly usage?: {
    readonly prompt_tokens?: number;
    readonly completion_tokens?: number;
    readonly total_tokens?: number;
  };
}

export class OpenRouterAi extends Ai {
  private readonly baseUrl: string;

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    baseUrl = 'https://openrouter.ai/api/v1',
    private readonly fetcher: typeof fetch = fetch,
  ) {
    super('openrouter');
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    const response = await this.fetcher(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        'content-type': 'application/json',
      },
      ...(request.signal === undefined ? {} : { signal: request.signal }),
      body: JSON.stringify({
        model: request.model ?? this.model,
        messages: request.messages,
        ...(request.temperature === undefined ? {} : { temperature: request.temperature }),
        ...(request.maxTokens === undefined ? {} : { max_tokens: request.maxTokens }),
      }),
    });

    if (!response.ok) {
      const errorBody = (await response.text()).slice(0, 1000);
      throw new Error(`OpenRouter request failed with status ${response.status}: ${errorBody}`);
    }

    const payload = await response.json() as OpenRouterResponse;
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('OpenRouter response did not contain message content');
    }

    const normalizedUsage = payload.usage ? toUsage(payload.usage) : undefined;
    return {
      content,
      model: payload.model ?? request.model ?? this.model,
      ...(normalizedUsage ? { usage: normalizedUsage } : {}),
    };
  }
}

function toUsage(usage: NonNullable<OpenRouterResponse['usage']>): AiUsage | undefined {
  const values = [usage.prompt_tokens, usage.completion_tokens, usage.total_tokens];
  if (!values.every((value) => typeof value === 'number' && Number.isFinite(value))) return undefined;

  return {
    promptTokens: usage.prompt_tokens!,
    completionTokens: usage.completion_tokens!,
    totalTokens: usage.total_tokens!,
  };
}
