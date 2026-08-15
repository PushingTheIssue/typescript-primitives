import { describe, expect, it } from 'vitest';
import { Ai } from '../index.js';

describe('Ai.create', () => {
  it('creates the OpenRouter adapter', async () => {
    const ai = await Ai.create({ adapter: 'openrouter', apiKey: 'test-key', model: 'test-model' });
    expect(ai.adapter).toBe('openrouter');
  });

  it('rejects unsupported runtime adapter values', async () => {
    await expect(Ai.create({ adapter: 'local' } as never))
      .rejects.toThrow('Unsupported AI adapter: local');
  });
});
