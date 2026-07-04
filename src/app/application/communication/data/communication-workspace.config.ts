export interface CommunicationWorkspacePage {
  page: string;
  label: string;
  route: string;
  icon: string;
}

export const COMMUNICATION_PAGES: CommunicationWorkspacePage[] = [
  { page: 'announcements', label: 'Announcements', route: '/app/communication/announcements', icon: 'pi pi-megaphone' },
  { page: 'notices', label: 'Notices', route: '/app/communication/notices', icon: 'pi pi-book' },
  { page: 'conversations', label: 'Conversations', route: '/app/communication/conversations', icon: 'pi pi-comments' },
  { page: 'delivery-logs', label: 'Delivery Logs', route: '/app/communication/delivery-logs', icon: 'pi pi-send' },
  { page: 'templates', label: 'Templates', route: '/app/communication/templates', icon: 'pi pi-file-edit' }
];
