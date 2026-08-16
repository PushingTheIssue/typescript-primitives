import { Notify, type Notification, type NotifyAction } from '../../index.js';
import type { Telemetry } from '../../../telemetry/index.js';
import { observe } from '../../../../internal/telemetry.js';

type SlackButton = {
  readonly type: 'button';
  readonly text: { readonly type: 'plain_text'; readonly text: string };
} & (
  | { readonly url: string }
  | { readonly action_id: string; readonly value?: string }
);

type SlackBlock =
  | { readonly type: 'header'; readonly text: { readonly type: 'plain_text'; readonly text: string } }
  | { readonly type: 'section'; readonly text: { readonly type: 'mrkdwn'; readonly text: string } }
  | { readonly type: 'actions'; readonly elements: readonly SlackButton[] };

export class SlackNotify extends Notify {
  constructor(
    private readonly webhookUrl: string,
    private readonly fetcher: typeof fetch = fetch,
    private readonly telemetry?: Telemetry,
  ) {
    super('slack');
  }

  async notify(notification: Notification): Promise<void> {
    return observe(this.telemetry, 'notify', this.adapter, 'notify', async () => {
      if (notification.actions.length > 25) {
        throw new Error('Slack notification cannot contain more than 25 actions');
      }

      const blocks: SlackBlock[] = [];

      if (notification.title !== undefined) {
      blocks.push({ type: 'header', text: { type: 'plain_text', text: notification.title } });
      }
      if (notification.body !== undefined) {
      blocks.push({ type: 'section', text: { type: 'mrkdwn', text: notification.body } });
      }
      if (notification.actions.length > 0) {
      blocks.push({ type: 'actions', elements: notification.actions.map(toSlackButton) });
      }

      const response = await this.fetcher(this.webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: notification.title ?? notification.body ?? 'Notification',
        blocks,
      }),
      });

      if (!response.ok) {
      const errorBody = (await response.text()).slice(0, 1000);
      throw new Error(`Slack notification failed with status ${response.status}: ${errorBody}`);
      }
    }, { actions: notification.actions.length });
  }
}

function toSlackButton(action: NotifyAction): SlackButton {
  const text = { type: 'plain_text' as const, text: action.label };

  switch (action.type) {
    case 'link':
      return { type: 'button', text, url: action.url };
    case 'callback':
      return {
        type: 'button',
        text,
        action_id: action.id,
        ...(action.value === undefined ? {} : { value: action.value }),
      };
  }
}
