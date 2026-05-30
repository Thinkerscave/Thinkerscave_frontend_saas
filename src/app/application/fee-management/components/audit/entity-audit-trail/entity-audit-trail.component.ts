import { Component, OnInit , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TimelineModule } from 'primeng/timeline';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';

interface AuditEvent {
    id: string;
    timestamp: Date;
    action: string;
    actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'PAYMENT' | 'ADJUSTMENT' | 'APPROVAL' | 'EXPORT' | 'VIEW';
    performedBy: string;
    performedByRole: string;
    ipAddress: string;
    description: string;
    changes: FieldChange[];
    metadata?: any;
}

interface FieldChange {
    field: string;
    oldValue: any;
    newValue: any;
}

interface EntityInfo {
    type: string;
    id: string;
    name: string;
    status: string;
    createdAt: Date;
    lastModified: Date;
    additionalInfo: { label: string; value: string }[];
}

@Component({
    selector: 'app-entity-audit-trail',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule, TimelineModule, TagModule, TooltipModule, DialogModule],
    template: `
    <div class="entity-audit-trail">
      <div class="page-header">
        <div>
          <div class="breadcrumb">
            <a routerLink="../../">Audit Logs</a>
            <i class="pi pi-chevron-right"></i>
            <span>Entity Trail</span>
          </div>
          <h2><i class="pi pi-history"></i> {{ entityInfo.type }} Audit Trail</h2>
          <p>Complete change history for {{ entityInfo.name }}</p>
        </div>
        <div class="header-actions">
          <button pButton label="Export Trail" icon="pi pi-download" class="p-button-outlined" (click)="exportTrail()"></button>
          <button pButton label="Back" icon="pi pi-arrow-left" class="p-button-text" routerLink="../../"></button>
        </div>
      </div>

      <!-- Entity Summary Card -->
      <div class="entity-summary">
        <div class="entity-header">
          <div class="entity-icon" [ngClass]="getEntityIconClass()">
            <i [class]="getEntityIcon()"></i>
          </div>
          <div class="entity-details">
            <h3>{{ entityInfo.name }}</h3>
            <div class="entity-meta">
              <code>{{ entityInfo.id }}</code>
              <p-tag [value]="entityInfo.status" [severity]="getStatusSeverity(entityInfo.status)"></p-tag>
            </div>
          </div>
        </div>
        <div class="entity-info-grid">
          <div class="info-item">
            <span class="label">Entity Type</span>
            <span class="value">{{ entityInfo.type }}</span>
          </div>
          <div class="info-item">
            <span class="label">Created</span>
            <span class="value">{{ entityInfo.createdAt | date:'dd MMM yyyy, HH:mm' }}</span>
          </div>
          <div class="info-item">
            <span class="label">Last Modified</span>
            <span class="value">{{ entityInfo.lastModified | date:'dd MMM yyyy, HH:mm' }}</span>
          </div>
          <div class="info-item" *ngFor="let info of entityInfo.additionalInfo">
            <span class="label">{{ info.label }}</span>
            <span class="value">{{ info.value }}</span>
          </div>
        </div>
        <div class="entity-stats">
          <div class="stat">
            <span class="stat-value">{{ auditEvents.length }}</span>
            <span class="stat-label">Total Events</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ getUpdateCount() }}</span>
            <span class="stat-label">Updates</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ getUniqueUsers() }}</span>
            <span class="stat-label">Users Involved</span>
          </div>
        </div>
      </div>

      <!-- Timeline Section -->
      <div class="timeline-section">
        <div class="section-header">
          <h3><i class="pi pi-clock"></i> Activity Timeline</h3>
          <div class="timeline-legend">
            <span class="legend-item"><span class="dot create"></span> Create</span>
            <span class="legend-item"><span class="dot update"></span> Update</span>
            <span class="legend-item"><span class="dot payment"></span> Payment</span>
            <span class="legend-item"><span class="dot approval"></span> Approval</span>
            <span class="legend-item"><span class="dot delete"></span> Delete</span>
          </div>
        </div>

        <p-timeline [value]="auditEvents" align="left" styleClass="custom-timeline">
          <ng-template pTemplate="marker" let-event>
            <span class="timeline-marker" [ngClass]="getMarkerClass(event.actionType)">
              <i [class]="getActionIcon(event.actionType)"></i>
            </span>
          </ng-template>
          <ng-template pTemplate="content" let-event>
            <div class="timeline-card" [ngClass]="getCardClass(event.actionType)">
              <div class="card-header">
                <div class="action-info">
                  <p-tag [value]="event.actionType" [severity]="getActionSeverity(event.actionType)" [style]="{'font-size':'0.7rem'}"></p-tag>
                  <span class="action-desc">{{ event.description }}</span>
                </div>
                <span class="timestamp">{{ event.timestamp | date:'dd MMM yyyy, HH:mm:ss' }}</span>
              </div>

              <div class="card-body" *ngIf="event.changes.length > 0">
                <div class="changes-list">
                  <div class="change-item" *ngFor="let change of event.changes">
                    <span class="field-name">{{ change.field }}</span>
                    <div class="change-values">
                      <span class="old-value" *ngIf="change.oldValue !== null">{{ formatValue(change.oldValue) }}</span>
                      <i class="pi pi-arrow-right" *ngIf="change.oldValue !== null"></i>
                      <span class="new-value">{{ formatValue(change.newValue) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="card-footer">
                <div class="user-info">
                  <i class="pi pi-user"></i>
                  <span>{{ event.performedBy }}</span>
                  <small>({{ event.performedByRole }})</small>
                </div>
                <div class="ip-info">
                  <i class="pi pi-globe"></i>
                  <code>{{ event.ipAddress }}</code>
                </div>
                <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" pTooltip="View Full Details" (click)="viewEventDetails(event)"></button>
              </div>
            </div>
          </ng-template>
        </p-timeline>
      </div>

      <!-- Event Details Dialog -->
      <p-dialog [(visible)]="showDetailsDialog" [header]="'Event Details'" [modal]="true" [style]="{width:'600px'}">
        <div class="event-detail-content" *ngIf="selectedEvent">
          <div class="detail-header">
            <p-tag [value]="selectedEvent.actionType" [severity]="getActionSeverity(selectedEvent.actionType)"></p-tag>
            <span class="detail-timestamp">{{ selectedEvent.timestamp | date:'dd MMM yyyy, HH:mm:ss' }}</span>
          </div>

          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Event ID</span>
              <code>{{ selectedEvent.id }}</code>
            </div>
            <div class="detail-item">
              <span class="label">Performed By</span>
              <span>{{ selectedEvent.performedBy }} ({{ selectedEvent.performedByRole }})</span>
            </div>
            <div class="detail-item">
              <span class="label">IP Address</span>
              <code>{{ selectedEvent.ipAddress }}</code>
            </div>
            <div class="detail-item full-width">
              <span class="label">Description</span>
              <p>{{ selectedEvent.description }}</p>
            </div>
          </div>

          <div class="changes-detail" *ngIf="selectedEvent.changes.length > 0">
            <h5>Field Changes</h5>
            <table class="changes-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Previous Value</th>
                  <th>New Value</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let change of selectedEvent.changes">
                  <td><strong>{{ change.field }}</strong></td>
                  <td class="old">{{ change.oldValue !== null ? formatValue(change.oldValue) : '-' }}</td>
                  <td class="new">{{ formatValue(change.newValue) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="metadata-section" *ngIf="selectedEvent.metadata">
            <h5>Additional Metadata</h5>
            <pre>{{ selectedEvent.metadata | json }}</pre>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Close" (click)="showDetailsDialog = false"></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
    styles: [`
    .entity-audit-trail { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }
    .header-actions { display: flex; gap: 0.75rem; }
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; margin-bottom: 0.5rem; }
    .breadcrumb a { color: var(--primary-color); text-decoration: none; }
    .breadcrumb a:hover { text-decoration: underline; }
    .breadcrumb i { font-size: 0.75rem; color: var(--text-color-secondary); }
    .breadcrumb span { color: var(--text-color-secondary); }

    .entity-summary { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .entity-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--surface-border); }
    .entity-icon { width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .entity-icon.payment { background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); color: #16a34a; }
    .entity-icon.contract { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); color: #2563eb; }
    .entity-icon.adjustment { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); color: #d97706; }
    .entity-icon.receipt { background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); color: #9333ea; }
    .entity-icon.ledger { background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); color: #4f46e5; }
    .entity-details h3 { margin: 0 0 0.5rem; font-size: 1.25rem; }
    .entity-meta { display: flex; align-items: center; gap: 0.75rem; }
    .entity-meta code { background: var(--surface-ground); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem; }

    .entity-info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .info-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .info-item .label { font-size: 0.75rem; color: var(--text-color-secondary); text-transform: uppercase; }
    .info-item .value { font-weight: 500; }

    .entity-stats { display: flex; gap: 2rem; padding: 1rem; background: var(--surface-ground); border-radius: 8px; }
    .stat { display: flex; flex-direction: column; align-items: center; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--primary-color); }
    .stat-label { font-size: 0.75rem; color: var(--text-color-secondary); }

    .timeline-section { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .section-header h3 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .timeline-legend { display: flex; gap: 1rem; }
    .legend-item { display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; color: var(--text-color-secondary); }
    .legend-item .dot { width: 10px; height: 10px; border-radius: 50%; }
    .dot.create { background: #10b981; }
    .dot.update { background: #3b82f6; }
    .dot.payment { background: #8b5cf6; }
    .dot.approval { background: #f59e0b; }
    .dot.delete { background: #ef4444; }

    :host ::ng-deep .custom-timeline .p-timeline-event-opposite { display: none; }
    :host ::ng-deep .custom-timeline .p-timeline-event-content { padding-left: 1rem; }

    .timeline-marker { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.875rem; }
    .timeline-marker.create { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
    .timeline-marker.update { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
    .timeline-marker.delete { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
    .timeline-marker.payment { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
    .timeline-marker.adjustment { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
    .timeline-marker.approval { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); }
    .timeline-marker.export { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); }
    .timeline-marker.view { background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%); }

    .timeline-card { background: var(--surface-ground); border-radius: 10px; padding: 1rem; margin-bottom: 1rem; border-left: 3px solid var(--surface-border); transition: all 0.2s; }
    .timeline-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .timeline-card.create { border-left-color: #10b981; }
    .timeline-card.update { border-left-color: #3b82f6; }
    .timeline-card.delete { border-left-color: #ef4444; }
    .timeline-card.payment { border-left-color: #8b5cf6; }
    .timeline-card.adjustment { border-left-color: #f59e0b; }
    .timeline-card.approval { border-left-color: #06b6d4; }

    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
    .action-info { display: flex; align-items: center; gap: 0.75rem; }
    .action-desc { font-weight: 500; }
    .timestamp { font-size: 0.75rem; color: var(--text-color-secondary); }

    .card-body { padding: 0.75rem 0; border-top: 1px dashed var(--surface-border); }
    .changes-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .change-item { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem; background: var(--surface-card); border-radius: 6px; }
    .field-name { font-weight: 500; font-size: 0.875rem; }
    .change-values { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; }
    .old-value { color: #dc2626; text-decoration: line-through; opacity: 0.7; }
    .new-value { color: #16a34a; font-weight: 500; }
    .change-values i { font-size: 0.75rem; color: var(--text-color-secondary); }

    .card-footer { display: flex; align-items: center; gap: 1rem; padding-top: 0.75rem; border-top: 1px dashed var(--surface-border); font-size: 0.75rem; color: var(--text-color-secondary); }
    .user-info, .ip-info { display: flex; align-items: center; gap: 0.35rem; }
    .user-info small { opacity: 0.7; }
    .card-footer code { background: var(--surface-card); padding: 0.15rem 0.35rem; border-radius: 3px; font-size: 0.7rem; }

    .event-detail-content { display: flex; flex-direction: column; gap: 1.5rem; }
    .detail-header { display: flex; align-items: center; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--surface-border); }
    .detail-timestamp { color: var(--text-color-secondary); }
    .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .detail-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .detail-item.full-width { grid-column: span 2; }
    .detail-item .label { font-size: 0.75rem; color: var(--text-color-secondary); text-transform: uppercase; }
    .detail-item code { background: var(--surface-ground); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem; width: fit-content; }
    .detail-item p { margin: 0.25rem 0 0; }

    .changes-detail, .metadata-section { padding: 1rem; background: var(--surface-ground); border-radius: 8px; }
    .changes-detail h5, .metadata-section h5 { margin: 0 0 1rem; font-size: 0.875rem; }
    .changes-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .changes-table th, .changes-table td { padding: 0.5rem; text-align: left; border-bottom: 1px solid var(--surface-border); }
    .changes-table th { background: var(--surface-card); font-weight: 600; }
    .changes-table td.old { color: #dc2626; }
    .changes-table td.new { color: #16a34a; }
    .metadata-section pre { margin: 0; font-size: 0.75rem; overflow-x: auto; background: var(--surface-card); padding: 0.75rem; border-radius: 6px; }

    @media (max-width: 768px) {
      .entity-info-grid { grid-template-columns: repeat(2, 1fr); }
      .entity-stats { flex-wrap: wrap; gap: 1rem; }
      .timeline-legend { display: none; }
      .card-header { flex-direction: column; gap: 0.5rem; }
      .detail-grid { grid-template-columns: 1fr; }
      .detail-item.full-width { grid-column: span 1; }
    }
  `]
})
export class EntityAuditTrailComponent implements OnInit {
    entityType = '';
    entityId = '';
    showDetailsDialog = false;
    selectedEvent: AuditEvent | null = null;

    entityInfo: EntityInfo = {
        type: 'Payment',
        id: 'PAY-2026-0154',
        name: 'Payment - Rahul Sharma',
        status: 'COMPLETED',
        createdAt: new Date('2026-01-15T10:30:00'),
        lastModified: new Date('2026-01-15T10:30:00'),
        additionalInfo: [
            { label: 'Amount', value: '₹12,000' },
            { label: 'Student', value: 'Rahul Sharma (ADM2024001)' },
            { label: 'Payment Mode', value: 'Online' },
            { label: 'Receipt', value: 'RCP-2026-0154' }
        ]
    };

    auditEvents: AuditEvent[] = [];

    constructor(private route: ActivatedRoute) {}

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.entityType = params['type'] || 'Payment';
            this.entityId = params['id'] || 'PAY-2026-0154';
            this.loadEntityInfo();
            this.loadAuditEvents();
        });
    }

    loadEntityInfo(): void {
        // Mock entity info based on type
        if (this.entityType === 'Payment') {
            this.entityInfo = {
                type: 'Payment',
                id: this.entityId,
                name: 'Payment - Rahul Sharma',
                status: 'COMPLETED',
                createdAt: new Date('2026-01-15T10:30:00'),
                lastModified: new Date('2026-01-15T10:30:00'),
                additionalInfo: [
                    { label: 'Amount', value: '₹12,000' },
                    { label: 'Student', value: 'Rahul Sharma (ADM2024001)' },
                    { label: 'Payment Mode', value: 'Online' },
                    { label: 'Receipt', value: 'RCP-2026-0154' }
                ]
            };
        } else if (this.entityType === 'Contract') {
            this.entityInfo = {
                type: 'Contract',
                id: this.entityId,
                name: 'Fee Contract - Class 10A',
                status: 'ACTIVE',
                createdAt: new Date('2025-04-01T09:00:00'),
                lastModified: new Date('2026-01-10T14:20:00'),
                additionalInfo: [
                    { label: 'Total Fee', value: '₹72,000' },
                    { label: 'Student', value: 'Rahul Sharma' },
                    { label: 'Structure', value: 'Annual 2025-26' },
                    { label: 'Installments', value: '4' }
                ]
            };
        } else if (this.entityType === 'Adjustment') {
            this.entityInfo = {
                type: 'Adjustment',
                id: this.entityId,
                name: 'Sibling Discount',
                status: 'APPROVED',
                createdAt: new Date('2026-01-14T11:00:00'),
                lastModified: new Date('2026-01-15T09:45:00'),
                additionalInfo: [
                    { label: 'Type', value: 'Discount' },
                    { label: 'Amount', value: '₹5,000' },
                    { label: 'Student', value: 'Amit Kumar' },
                    { label: 'Reason', value: 'Sibling studying in same school' }
                ]
            };
        }
    }

    loadAuditEvents(): void {
        // Mock audit events for the entity
        this.auditEvents = [
            {
                id: 'EVT-001',
                timestamp: new Date('2026-01-15T10:30:00'),
                action: 'Payment Completed',
                actionType: 'PAYMENT',
                performedBy: 'Ramesh Kumar',
                performedByRole: 'Accountant',
                ipAddress: '192.168.1.45',
                description: 'Payment of ₹12,000 received via Online Banking',
                changes: [
                    { field: 'Status', oldValue: 'PENDING', newValue: 'COMPLETED' },
                    { field: 'Amount', oldValue: null, newValue: '₹12,000' },
                    { field: 'Mode', oldValue: null, newValue: 'Online' },
                    { field: 'Transaction Ref', oldValue: null, newValue: 'TXN789012' }
                ],
                metadata: { gateway: 'Razorpay', bankRef: 'HDFC123456' }
            },
            {
                id: 'EVT-002',
                timestamp: new Date('2026-01-15T10:29:30'),
                action: 'Payment Initiated',
                actionType: 'CREATE',
                performedBy: 'Ramesh Kumar',
                performedByRole: 'Accountant',
                ipAddress: '192.168.1.45',
                description: 'Payment entry created for Tuition Fee - Term 3',
                changes: [
                    { field: 'Payment ID', oldValue: null, newValue: 'PAY-2026-0154' },
                    { field: 'Student', oldValue: null, newValue: 'Rahul Sharma' },
                    { field: 'Fee Head', oldValue: null, newValue: 'Tuition Fee' },
                    { field: 'Status', oldValue: null, newValue: 'PENDING' }
                ]
            },
            {
                id: 'EVT-003',
                timestamp: new Date('2026-01-14T16:00:00'),
                action: 'Contract Updated',
                actionType: 'UPDATE',
                performedBy: 'Admin User',
                performedByRole: 'Admin',
                ipAddress: '192.168.1.10',
                description: 'Fee contract modified - discount applied',
                changes: [
                    { field: 'Total Fee', oldValue: '₹72,000', newValue: '₹67,000' },
                    { field: 'Discount', oldValue: '₹0', newValue: '₹5,000' },
                    { field: 'Remarks', oldValue: null, newValue: 'Sibling discount applied' }
                ]
            },
            {
                id: 'EVT-004',
                timestamp: new Date('2026-01-14T15:45:00'),
                action: 'Discount Approved',
                actionType: 'APPROVAL',
                performedBy: 'Principal',
                performedByRole: 'Principal',
                ipAddress: '192.168.1.20',
                description: 'Sibling discount of ₹5,000 approved',
                changes: [
                    { field: 'Approval Status', oldValue: 'PENDING', newValue: 'APPROVED' },
                    { field: 'Approved By', oldValue: null, newValue: 'Principal' }
                ]
            },
            {
                id: 'EVT-005',
                timestamp: new Date('2026-01-14T14:30:00'),
                action: 'Discount Requested',
                actionType: 'ADJUSTMENT',
                performedBy: 'Admin User',
                performedByRole: 'Admin',
                ipAddress: '192.168.1.10',
                description: 'Sibling discount request created for approval',
                changes: [
                    { field: 'Adjustment Type', oldValue: null, newValue: 'Discount' },
                    { field: 'Amount', oldValue: null, newValue: '₹5,000' },
                    { field: 'Reason', oldValue: null, newValue: 'Sibling in Class 8' }
                ]
            },
            {
                id: 'EVT-006',
                timestamp: new Date('2025-04-01T09:00:00'),
                action: 'Contract Created',
                actionType: 'CREATE',
                performedBy: 'Admin User',
                performedByRole: 'Admin',
                ipAddress: '192.168.1.10',
                description: 'Fee contract generated for academic year 2025-26',
                changes: [
                    { field: 'Contract ID', oldValue: null, newValue: 'CNT-2025-0234' },
                    { field: 'Student', oldValue: null, newValue: 'Rahul Sharma' },
                    { field: 'Structure', oldValue: null, newValue: 'Annual 2025-26' },
                    { field: 'Total Fee', oldValue: null, newValue: '₹72,000' }
                ]
            }
        ];
    }

    getEntityIcon(): string {
        const icons: Record<string, string> = {
            'Payment': 'pi pi-indian-rupee',
            'Contract': 'pi pi-file',
            'Adjustment': 'pi pi-percentage',
            'Receipt': 'pi pi-receipt',
            'Ledger': 'pi pi-book'
        };
        return icons[this.entityInfo.type] || 'pi pi-file';
    }

    getEntityIconClass(): string {
        return this.entityInfo.type.toLowerCase();
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
        const map: Record<string, 'success' | 'info' | 'warn' | 'danger'> = {
            'COMPLETED': 'success',
            'ACTIVE': 'success',
            'APPROVED': 'success',
            'PENDING': 'warn',
            'CANCELLED': 'danger',
            'REJECTED': 'danger'
        };
        return map[status] || 'info';
    }

    getMarkerClass(actionType: string): string {
        return actionType.toLowerCase();
    }

    getCardClass(actionType: string): string {
        return actionType.toLowerCase();
    }

    getActionIcon(actionType: string): string {
        const icons: Record<string, string> = {
            'CREATE': 'pi pi-plus',
            'UPDATE': 'pi pi-pencil',
            'DELETE': 'pi pi-trash',
            'PAYMENT': 'pi pi-indian-rupee',
            'ADJUSTMENT': 'pi pi-percentage',
            'APPROVAL': 'pi pi-check',
            'EXPORT': 'pi pi-download',
            'VIEW': 'pi pi-eye'
        };
        return icons[actionType] || 'pi pi-circle';
    }

    getActionSeverity(action: string): 'success' | 'info' | 'warn' | 'danger' {
        const map: Record<string, 'success' | 'info' | 'warn' | 'danger'> = {
            'CREATE': 'success',
            'UPDATE': 'info',
            'DELETE': 'danger',
            'PAYMENT': 'success',
            'ADJUSTMENT': 'warn',
            'APPROVAL': 'info',
            'EXPORT': 'info',
            'VIEW': 'info'
        };
        return map[action] || 'info';
    }

    formatValue(value: any): string {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    }

    getUpdateCount(): number {
        return this.auditEvents.filter(e => e.actionType === 'UPDATE').length;
    }

    getUniqueUsers(): number {
        const users = new Set(this.auditEvents.map(e => e.performedBy));
        return users.size;
    }

    viewEventDetails(event: AuditEvent): void {
        this.selectedEvent = event;
        this.showDetailsDialog = true;
    }

    exportTrail(): void {
        // Export trail logic
    }
}
