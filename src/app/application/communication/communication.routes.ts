import { Routes } from '@angular/router';
import { COMMUNICATION_PAGES, COMMUNICATION_ROOT } from '../../core/config/page-route-meta';

export const COMMUNICATION_ROUTES: Routes = [
  {
    path: 'communication',
    data: { ...COMMUNICATION_ROOT },
    loadComponent: () =>
      import('./components/communication-workspace/communication-workspace.component')
        .then(m => m.CommunicationWorkspaceComponent),
    children: [
      { path: '', redirectTo: 'notices', pathMatch: 'full' },
      {
        path: 'notices',
        loadComponent: () => import('./components/notice-list/notice-list.component').then(m => m.NoticeListComponent),
        data: { ...COMMUNICATION_PAGES.notices }
      },
      {
        path: 'announcements',
        loadComponent: () => import('./components/announcements-list/announcements-list.component').then(m => m.AnnouncementsListComponent),
        data: { ...COMMUNICATION_PAGES.announcements }
      },
      {
        path: 'announcements/new',
        loadComponent: () => import('./components/announcement-create/announcement-create.component').then(m => m.AnnouncementCreateComponent),
        data: { ...COMMUNICATION_PAGES.announcementsNew }
      },
      {
        path: 'announcements/:id',
        loadComponent: () => import('./components/announcement-detail/announcement-detail.component').then(m => m.AnnouncementDetailComponent),
        data: { ...COMMUNICATION_PAGES.announcementDetail }
      },
      {
        path: 'conversations',
        loadComponent: () => import('./components/conversations/conversations.component').then(m => m.ConversationsComponent),
        data: { ...COMMUNICATION_PAGES.conversations }
      },
      {
        path: 'templates',
        loadComponent: () => import('./components/templates-list/templates-list.component').then(m => m.TemplatesListComponent),
        data: { ...COMMUNICATION_PAGES.templates }
      },
      {
        path: 'templates/:id/edit',
        loadComponent: () => import('./components/template-editor/template-editor.component').then(m => m.TemplateEditorComponent),
        data: { ...COMMUNICATION_PAGES.templateEdit }
      },
      {
        path: 'delivery-logs',
        loadComponent: () => import('./components/delivery-logs/delivery-logs.component').then(m => m.DeliveryLogsComponent),
        data: { ...COMMUNICATION_PAGES.deliveryLogs }
      }
    ]
  }
];
