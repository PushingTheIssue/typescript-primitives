export type NotifyOptions = {
  readonly adapter: 'slack';
  readonly webhookUrl: string;
  readonly telemetry?: Telemetry;
};

export type NotifyLinkAction = {
  readonly type: 'link';
  readonly label: string;
  readonly url: string;
};

export type NotifyCallbackAction = {
  readonly type: 'callback';
  readonly label: string;
  readonly id: string;
  readonly value?: string;
};

export type NotifyAction = NotifyLinkAction | NotifyCallbackAction;

export interface Notification {
  readonly title?: string;
  readonly body?: string;
  readonly actions: readonly NotifyAction[];
}

export abstract class Notify {
  constructor(public readonly adapter: string) {}

  static async create(options: NotifyOptions): Promise<Notify> {
    if (options.adapter === 'slack') {
      const { SlackNotify } = await import('./adapters/slack/index.js');
      return new SlackNotify(options.webhookUrl, fetch, options.telemetry);
    }

    throw new Error(`Unsupported notify adapter: ${(options as { adapter: string }).adapter}`);
  }

  abstract notify(notification: Notification): Promise<void>;
}
import type { Telemetry } from '../telemetry/index.js';
