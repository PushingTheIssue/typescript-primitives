import { describe, expect, it } from 'vitest';
import { Ai } from '../index.js';

describe('Ai', () => {
  it('exposes the adapter selected by a concrete implementation', () => {
    class TestAi extends Ai {
      constructor() { super('test'); }
      async complete() { return { content: 'test', model: 'test' }; }
    }

    expect(new TestAi().adapter).toBe('test');
  });
});
