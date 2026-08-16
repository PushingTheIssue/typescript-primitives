import { describe, expect, it } from 'vitest';
import { Notify, type Notification } from '../index.js';

describe('Notify', () => {
  it('exposes the adapter selected by a concrete implementation', () => {
    class TestNotify extends Notify {
      constructor() { super('test'); }
      async notify(_notification: Notification): Promise<void> {}
    }

    expect(new TestNotify().adapter).toBe('test');
  });
});
