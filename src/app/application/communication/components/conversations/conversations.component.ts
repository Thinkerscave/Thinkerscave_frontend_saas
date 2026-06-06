import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import {
  SaasPageHeaderComponent,
  SaasPillComponent
} from '../../../../shared/ui/saas';

interface ConversationPreview {
  id: number;
  name: string;
  role: 'Parent' | 'Student' | 'Staff';
  avatar: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
  online: boolean;
}

interface ChatMessage {
  id: number;
  fromMe: boolean;
  author: string;
  text: string;
  at: string;
}

type TabKey = 'all' | 'unread' | 'parents' | 'students' | 'staff';

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

  search = '';
  activeTab: TabKey = 'all';
  selectedId: number | null = null;
  draft = '';

  conversations: ConversationPreview[] = [];
  messages: ChatMessage[] = [];

  ngOnInit(): void { this.seed(); }

  private seed(): void {
    this.conversations = [
      { id: 1, name: 'Mrs. Sharma (Parent)', role: 'Parent', avatar: 'MS', lastMessage: 'Thank you for the update on Aarav.', lastAt: this.minutesAgo(2), unread: 2, online: true },
      { id: 2, name: 'Priya Verma', role: 'Student', avatar: 'PV', lastMessage: 'Ma\'am, can I get the assignment extension?', lastAt: this.minutesAgo(15), unread: 1, online: true },
      { id: 3, name: 'Mr. Raj (Math Dept)', role: 'Staff', avatar: 'RJ', lastMessage: 'Lesson plan attached.', lastAt: this.minutesAgo(45), unread: 0, online: false },
      { id: 4, name: 'Anjali Khan (Parent)', role: 'Parent', avatar: 'AK', lastMessage: 'Will join the PTM at 4pm.', lastAt: this.minutesAgo(120), unread: 0, online: false },
      { id: 5, name: 'Rohan Mehta', role: 'Student', avatar: 'RM', lastMessage: 'Thanks teacher!', lastAt: this.minutesAgo(240), unread: 0, online: false }
    ];
    this.selectedId = 1;
    this.loadMessages(1);
  }

  loadMessages(id: number): void {
    this.selectedId = id;
    const sel = this.conversations.find(c => c.id === id);
    if (!sel) { this.messages = []; return; }
    sel.unread = 0;
    this.messages = [
      { id: 1, fromMe: false, author: sel.name, text: 'Hi Ma\'am, how is Aarav doing in class?', at: this.minutesAgo(15) },
      { id: 2, fromMe: true, author: 'You', text: 'He is doing great. Active in math and science.', at: this.minutesAgo(12) },
      { id: 3, fromMe: false, author: sel.name, text: 'That\'s wonderful to hear!', at: this.minutesAgo(8) },
      { id: 4, fromMe: true, author: 'You', text: 'We had a small group activity today and he led it well.', at: this.minutesAgo(6) },
      { id: 5, fromMe: false, author: sel.name, text: 'Thank you for the update on Aarav.', at: this.minutesAgo(2) }
    ];
    this.cdr.markForCheck();
  }

  send(): void {
    const text = this.draft.trim();
    if (!text) return;
    this.messages = [...this.messages, { id: Date.now(), fromMe: true, author: 'You', text, at: new Date().toISOString() }];
    this.draft = '';
  }

  selectTab(tab: TabKey): void { this.activeTab = tab; }

  get filtered(): ConversationPreview[] {
    const q = this.search.trim().toLowerCase();
    return this.conversations.filter(c => {
      if (this.activeTab === 'unread' && c.unread === 0) return false;
      if (this.activeTab === 'parents' && c.role !== 'Parent') return false;
      if (this.activeTab === 'students' && c.role !== 'Student') return false;
      if (this.activeTab === 'staff' && c.role !== 'Staff') return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  get selected(): ConversationPreview | null {
    return this.conversations.find(c => c.id === this.selectedId) || null;
  }

  private minutesAgo(m: number): string {
    const d = new Date(); d.setMinutes(d.getMinutes() - m);
    return d.toISOString();
  }
}
