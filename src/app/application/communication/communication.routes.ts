import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guard/role.guard';

const COMMS_ROLES = [
  'SUPER_ADMIN', 'ADMIN', 'ORGANIZATION_ADMIN', 'ORGANIZATION_OWNER',
  'PRINCIPAL', 'HR_MANAGER', 'TEACHER', 'STAFF', 'RECEPTIONIST'
];

export const COMMUNICATION_ROUTES: Routes = [
  {
    path: 'communication',
    canActivate: [roleGuard(COMMS_ROLES)],
    loadComponent: () =>
      import('./components/communication-workspace/communication-workspace.component')
        .then(m => m.CommunicationWorkspaceComponent),
    children: [
      { path: '', redirectTo: 'announcements', pathMatch: 'full' },
      {
        path: 'notices',
        loadComponent: () => import('./components/notice-list/notice-list.component').then(m => m.NoticeListComponent),
        data: { breadcrumb: 'Notices' }
      },
      {
        path: 'announcements',
        loadComponent: () => import('./components/announcements-list/announcements-list.component').then(m => m.AnnouncementsListComponent),
        data: { breadcrumb: 'Announcements' }
      },
      {
        path: 'announcements/new',
        loadComponent: () => import('./components/announcement-create/announcement-create.component').then(m => m.AnnouncementCreateComponent),
        data: { breadcrumb: 'Create Announcement' }
      },
      {
        path: 'announcements/:id',
        loadComponent: () => import('./components/announcement-detail/announcement-detail.component').then(m => m.AnnouncementDetailComponent),
        data: { breadcrumb: 'Announcement Detail' }
      },
      {
        path: 'conversations',
        loadComponent: () => import('./components/conversations/conversations.component').then(m => m.ConversationsComponent),
        data: { breadcrumb: 'Conversations' }
      },
      {
        path: 'templates',
        loadComponent: () => import('./components/templates-list/templates-list.component').then(m => m.TemplatesListComponent),
        data: { breadcrumb: 'Templates' }
      },
      {
        path: 'templates/:id/edit',
        loadComponent: () => import('./components/template-editor/template-editor.component').then(m => m.TemplateEditorComponent),
        data: { breadcrumb: 'Edit Template' }
      },
      {
        path: 'delivery-logs',
        loadComponent: () => import('./components/delivery-logs/delivery-logs.component').then(m => m.DeliveryLogsComponent),
        data: { breadcrumb: 'Delivery Logs' }
      }
    ]
  }
];
