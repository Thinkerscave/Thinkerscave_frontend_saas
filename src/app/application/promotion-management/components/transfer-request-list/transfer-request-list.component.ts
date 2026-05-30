import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal , ChangeDetectionStrategy} from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { WorkspaceHeaderComponent } from '../../../../shared/components/workspace-header/workspace-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { KpiCardComponent } from '../../../../shared/components/kpi-card/kpi-card.component';
import { TransferRequest, TransferRequestService, TransferStatus } from '../../services/promotion.service';

/**
 * Lists transfer requests with workflow KPIs. Inline actions move a request
 * forward (approve, reject, issue certificate) with confirmation for destructive steps.
 */
@Component({
    selector: 'app-transfer-request-list',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        TableModule,
        TooltipModule,
        ConfirmDialogModule,
        WorkspaceHeaderComponent,
        StatusBadgeComponent,
        EmptyStateComponent,
        SkeletonComponent,
        KpiCardComponent
    ],
    providers: [ConfirmationService],
    templateUrl: './transfer-request-list.component.html',
    styleUrl: './transfer-request-list.component.scss'
})
export class TransferRequestListComponent implements OnInit {
    readonly router = inject(Router);
    private readonly service = inject(TransferRequestService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    requests = signal<TransferRequest[]>([]);
    loading = signal(false);

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading.set(true);
        this.service.list().subscribe({
            next: data => { this.requests.set(data); this.loading.set(false); },
            error: () => { this.loading.set(false); }
        });
    }

    countBy(status: TransferStatus): number {
        return this.requests().filter(r => r.status === status).length;
    }

    approve(r: TransferRequest): void {
        this.transition(r, 'APPROVED', 'Transfer approved');
    }

    reject(r: TransferRequest): void {
        this.confirmationService.confirm({
            header: 'Reject transfer request?',
            message: 'This action will mark the request as rejected.',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.transition(r, 'REJECTED', 'Transfer rejected')
        });
    }

    issue(r: TransferRequest): void {
        this.transition(r, 'CERTIFICATE_ISSUED', 'Certificate issued');
    }

    private transition(r: TransferRequest, status: TransferStatus, message: string): void {
        this.service.transition(r.id, status).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Transfers', detail: message });
                this.load();
            }
        });
    }
}
