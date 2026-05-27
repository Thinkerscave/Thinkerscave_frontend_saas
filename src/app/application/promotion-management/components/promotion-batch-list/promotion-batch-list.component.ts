import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
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
import { PromotionBatch, PromotionBatchStatus, PromotionService } from '../../services/promotion.service';

/**
 * Lists promotion batches with lifecycle KPIs and inline workflow actions:
 * preview a draft, execute a previewed batch, roll back an executed batch, or cancel.
 */
@Component({
    selector: 'app-promotion-batch-list',
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
    templateUrl: './promotion-batch-list.component.html',
    styleUrl: './promotion-batch-list.component.scss'
})
export class PromotionBatchListComponent implements OnInit {
    readonly router = inject(Router);
    private readonly service = inject(PromotionService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    batches = signal<PromotionBatch[]>([]);
    loading = signal(false);

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading.set(true);
        this.service.listBatches().subscribe({
            next: data => { this.batches.set(data); this.loading.set(false); },
            error: () => { this.loading.set(false); }
        });
    }

    countBy(status: PromotionBatchStatus): number {
        return this.batches().filter(b => b.status === status).length;
    }

    preview(b: PromotionBatch): void {
        this.service.preview(b.id).subscribe({
            next: () => { this.toast('Preview generated'); this.load(); }
        });
    }

    execute(b: PromotionBatch): void {
        this.confirmationService.confirm({
            header: 'Execute promotion batch?',
            message: 'This will create enrollments for the next academic year. Continue?',
            icon: 'pi pi-exclamation-triangle',
            accept: () => this.service.execute(b.id).subscribe({
                next: () => { this.toast('Batch executed'); this.load(); }
            })
        });
    }

    rollback(b: PromotionBatch): void {
        this.confirmationService.confirm({
            header: 'Roll back batch?',
            message: 'This will reverse the promotions created by this batch. Continue?',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.service.rollback(b.id).subscribe({
                next: () => { this.toast('Batch rolled back'); this.load(); }
            })
        });
    }

    cancel(b: PromotionBatch): void {
        this.service.cancel(b.id).subscribe({
            next: () => { this.toast('Batch cancelled'); this.load(); }
        });
    }

    private toast(detail: string): void {
        this.messageService.add({ severity: 'success', summary: 'Promotions', detail });
    }
}
