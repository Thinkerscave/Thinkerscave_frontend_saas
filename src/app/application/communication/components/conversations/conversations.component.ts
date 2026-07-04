import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LoginService } from '../../../../core/services/login.service';
import { CommunicationService, Message, MessageThread } from '../../services/communication.service';
import {
  SaasPageHeaderComponent,
  SaasPillComponent
} from '../../../../shared/ui/saas';

interface ConversationPreview {
  id: number;
  name: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

interface ChatMessage {
  id: number;
  fromMe: boolean;
  author: string;
  text: string;
  at: string;
}

type TabKey = 'all' | 'unread';

@Component({
  selector: 'app-conversations',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DatePipe, SaasPageHeaderComponent, SaasPillComponent],
  templateUrl: './conversations.component.html',
  styleUrl: './conversations.component.scss'
})
export class ConversationsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly api = inject(CommunicationService);
  private readonly loginService = inject(LoginService);

  search = '';
  activeTab: TabKey = 'all';
  selectedId: number | null = null;
  draft = '';
  loading = true;

  conversations: ConversationPreview[] = [];
  messages: ChatMessage[] = [];

  private currentUserId = 0;

  ngOnInit(): void {
    this.currentUserId = Number(this.loginService.getUser()?.id ?? 0);
    this.loadThreads();
  }

  private loadThreads(): void {
    this.loading = true;
    this.api.listThreads()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: threads => {
          this.conversations = (threads ?? []).map(t => this.toPreview(t));
          if (this.conversations.length && !this.selectedId) {
            this.loadMessages(this.conversations[0].id);
          }
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.conversations = [];
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  loadMessages(id: number): void {
    this.selectedId = id;
    this.api.listMessages(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: list => {
          this.messages = (list ?? []).map(m => this.toChatMessage(m));
          const sel = this.conversations.find(c => c.id === id);
          if (sel) sel.unread = 0;
          this.cdr.markForCheck();
        },
        error: () => {
          this.messages = [];
          this.cdr.markForCheck();
        }
      });
  }

  send(): void {
    const text = this.draft.trim();
    if (!text || !this.selectedId) return;
    this.api.postMessage(this.selectedId, text)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (msg: Message) => {
          this.messages = [...this.messages, this.toChatMessage(msg)];
          this.draft = '';
          this.cdr.markForCheck();
        }
      });
  }

  selectTab(tab: TabKey): void { this.activeTab = tab; }

  get filtered(): ConversationPreview[] {
    const q = this.search.trim().toLowerCase();
    return this.conversations.filter(c => {
      if (this.activeTab === 'unread' && c.unread === 0) return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  get selected(): ConversationPreview | null {
    return this.conversations.find(c => c.id === this.selectedId) ?? null;
  }

  private toPreview(thread: MessageThread): ConversationPreview {
    return {
      id: thread.id,
      name: thread.subject,
      lastMessage: thread.closed ? 'Thread closed' : 'Open conversation',
      lastAt: thread.lastMessageAt ?? new Date().toISOString(),
      unread: 0
    };
  }

  private toChatMessage(message: Message): ChatMessage {
    const fromMe = message.fromUserId === this.currentUserId;
    return {
      id: message.id,
      fromMe,
      author: fromMe ? 'You' : `User ${message.fromUserId}`,
      text: message.body,
      at: message.createdAt ?? new Date().toISOString()
    };
  }
}
