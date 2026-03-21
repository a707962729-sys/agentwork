import type { NotificationChannel } from '../NotificationManager.js';

export class ConsoleChannel implements NotificationChannel {
  name = 'console';

  async send(message: string): Promise<void> {
    console.log(`[Notification] ${message}`);
  }
}
