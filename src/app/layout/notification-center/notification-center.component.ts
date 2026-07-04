import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { RouterLink } from '@angular/router';
import { CommunicationService, Notification } from '../../application/communication/services/communication.service';

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  tone: 'info' | 'success' | 'warning';
  link?: string;
}

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule, OverlayPanelModule, RouterLink],
  templateUrl: './notification-center.component.html',
  styleUrl: './notification-center.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationCenterComponent implements OnInit {
  private readonly api = inject(CommunicationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  notifications: NotificationItem[] = [];
  loading = false;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.listNotifications()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: list => {
          this.notifications = (list ?? []).slice(0, 8).map(n => this.mapItem(n));
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.notifications = [];
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  get unreadCount(): number {
    return this.notifications.filter(notification => notification.unread).length;
  }

  markAllAsRead(): void {
    this.notifications = this.notifications.map(notification => ({ ...notification, unread: false }));
    this.cdr.markForCheck();
  }

  private mapItem(n: Notification): NotificationItem {
    const tone: NotificationItem['tone'] =
      n.status === 'FAILED' ? 'warning' : n.status === 'SENT' ? 'success' : 'info';
    return {
      id: n.id,
      title: n.subject,
      message: n.body,
      time: n.sentAt ? new Date(n.sentAt).toLocaleString() : 'Recently',
      unread: n.status === 'PENDING' || n.status === 'QUEUED',
      tone,
      link: '/app/communication/delivery-logs'
    };
  }
}
