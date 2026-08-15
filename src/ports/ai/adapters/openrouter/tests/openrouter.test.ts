import { describe, expect, it, vi } from 'vitest';
import { OpenRouterAi } from '../index.js';

describe('OpenRouterAi', () => {
  it('sends a chat completion request and maps the response', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        model: 'openai/gpt-4o-mini',
        choices: [{ message: { content: 'Hello from the model.' } }],
        usage: { prompt_tokens: 4, completion_tokens: 5, total_tokens: 9 },
      }),
    });
    const ai = new OpenRouterAi('test-key', 'openai/gpt-4o-mini', 'https://router.test/', fetcher);

    await expect(ai.complete({
      messages: [{ role: 'user', content: 'Say hello.' }],
      temperature: 0.2,
      maxTokens: 20,
    })).resolves.toEqual({
      content: 'Hello from the model.',
      model: 'openai/gpt-4o-mini',
      usage: { promptTokens: 4, completionTokens: 5, totalTokens: 9 },
    });

    expect(fetcher).toHaveBeenCalledWith('https://router.test/chat/completions', expect.objectContaining({
      method: 'POST',
      headers: { authorization: 'Bearer test-key', 'content-type': 'application/json' },
    }));
    expect(JSON.parse(fetcher.mock.calls[0]![1].body)).toMatchObject({
      model: 'openai/gpt-4o-mini', temperature: 0.2, max_tokens: 20,
    });
  });

  it('reports provider errors', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => 'invalid key' });
    const ai = new OpenRouterAi('bad-key', 'test-model', 'https://router.test', fetcher);

    await expect(ai.complete({ messages: [{ role: 'user', content: 'Hello' }] }))
      .rejects.toThrow('OpenRouter request failed with status 401: invalid key');
  });

  it('passes an abort signal and rejects malformed responses', async () => {
    const signal = new AbortController().signal;
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: 42 } }] }),
    });
    const ai = new OpenRouterAi('test-key', 'test-model', 'https://router.test', fetcher);

    await expect(ai.complete({ messages: [], signal })).rejects.toThrow('did not contain message content');
    expect(fetcher).toHaveBeenCalledWith('https://router.test/chat/completions', expect.objectContaining({ signal }));
  });
});
