export interface CommunicationWorkspacePage {
  page: string;
  label: string;
  route: string;
  icon: string;
}

export const COMMUNICATION_PAGES: CommunicationWorkspacePage[] = [
  { page: 'notices', label: 'Notices', route: '/app/communication/notices', icon: 'pi pi-book' },
  { page: 'announcements', label: 'Announcements', route: '/app/communication/announcements', icon: 'pi pi-megaphone' },
  { page: 'conversations', label: 'Conversations', route: '/app/communication/conversations', icon: 'pi pi-comments' },
];
