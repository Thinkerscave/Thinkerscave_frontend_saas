import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { OverlayPanelModule } from 'primeng/overlaypanel';

interface NotificationItem {
  title: string;
  message: string;
  time: string;
  unread: boolean;
  tone: 'info' | 'success' | 'warning';
}

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule, OverlayPanelModule],
  templateUrl: './notification-center.component.html',
  styleUrl: './notification-center.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationCenterComponent {
  notifications: NotificationItem[] = [
    { title: 'System Update', message: 'ThinkersCave v2.0 shell is live.', time: '10m ago', unread: true, tone: 'info' },
    { title: 'New Enrollment', message: 'A new admission record is ready for review.', time: '1h ago', unread: true, tone: 'success' },
    { title: 'Fee Payment', message: 'Latest payment receipt was generated successfully.', time: '2h ago', unread: false, tone: 'warning' }
  ];

  get unreadCount(): number {
    return this.notifications.filter(notification => notification.unread).length;
  }

  markAllAsRead(): void {
    this.notifications = this.notifications.map(notification => ({ ...notification, unread: false }));
  }
}
