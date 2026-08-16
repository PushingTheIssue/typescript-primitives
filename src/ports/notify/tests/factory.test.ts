import { describe, expect, it } from 'vitest';
import { Notify } from '../index.js';

describe('Notify.create', () => {
  it('creates the Slack adapter', async () => {
    const notify = await Notify.create({ adapter: 'slack', webhookUrl: 'https://hooks.slack.com/test' });

    expect(notify.adapter).toBe('slack');
  });

  it('rejects unsupported runtime adapter values', async () => {
    await expect(Notify.create({ adapter: 'custom' } as never))
      .rejects.toThrow('Unsupported notify adapter: custom');
  });
});
