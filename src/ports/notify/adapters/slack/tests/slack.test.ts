import { describe, expect, it, vi } from 'vitest';
import { SlackNotify } from '../index.js';

describe('SlackNotify', () => {
  it('posts structured notification blocks with a text fallback', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('ok', { status: 200 }));
    const notify = new SlackNotify('https://hooks.slack.com/test', fetcher);

    await notify.notify({
      title: 'Approval needed',
      body: 'Review this deployment.',
      actions: [
        { type: 'link', label: 'Open deployment', url: 'https://example.com/deployment' },
        { type: 'callback', label: 'Approve', id: 'approve-deployment', value: 'approve' },
      ],
    });

    expect(fetcher).toHaveBeenCalledWith('https://hooks.slack.com/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: 'Approval needed',
        blocks: [
          { type: 'header', text: { type: 'plain_text', text: 'Approval needed' } },
          { type: 'section', text: { type: 'mrkdwn', text: 'Review this deployment.' } },
          {
            type: 'actions',
            elements: [
              { type: 'button', text: { type: 'plain_text', text: 'Open deployment' }, url: 'https://example.com/deployment' },
              { type: 'button', text: { type: 'plain_text', text: 'Approve' }, action_id: 'approve-deployment', value: 'approve' },
            ],
          },
        ],
      }),
    });
  });

  it('uses a default text fallback when only actions are provided', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('ok', { status: 200 }));

    await new SlackNotify('https://hooks.slack.com/test', fetcher).notify({
      actions: [{ type: 'callback', label: 'Acknowledge', id: 'acknowledge' }],
    });

    const request = fetcher.mock.calls[0]?.[1];
    expect(request?.body).toBeDefined();
    expect(JSON.parse(String(request?.body)).text).toBe('Notification');
  });

  it('reports non-successful webhook responses', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('invalid payload', { status: 400 }));

    await expect(new SlackNotify('https://hooks.slack.com/test', fetcher).notify({ body: 'Hello', actions: [] }))
      .rejects.toThrow('Slack notification failed with status 400: invalid payload');
  });

  it('rejects more actions than Slack allows in one actions block', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const actions = Array.from({ length: 26 }, (_, index) => ({
      type: 'callback' as const,
      label: `Action ${index}`,
      id: `action-${index}`,
    }));

    await expect(new SlackNotify('https://hooks.slack.com/test', fetcher).notify({ actions }))
      .rejects.toThrow('Slack notification cannot contain more than 25 actions');
    expect(fetcher).not.toHaveBeenCalled();
  });
});
