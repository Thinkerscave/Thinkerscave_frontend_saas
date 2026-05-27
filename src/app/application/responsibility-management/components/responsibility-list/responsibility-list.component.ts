import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { WorkspaceHeaderComponent } from '../../../../shared/components/workspace-header/workspace-header.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { KpiCardComponent } from '../../../../shared/components/kpi-card/kpi-card.component';
import { Responsibility, ResponsibilityService } from '../../services/responsibility.service';

/**
 * Lists responsibilities with privilege-mapping KPIs.
 * Supports inline edit navigation and confirmed delete.
 */
@Component({
    selector: 'app-responsibility-list',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        TableModule,
        TooltipModule,
        TagModule,
        ConfirmDialogModule,
        WorkspaceHeaderComponent,
        EmptyStateComponent,
        SkeletonComponent,
        KpiCardComponent
    ],
    providers: [ConfirmationService],
    templateUrl: './responsibility-list.component.html',
    styleUrl: './responsibility-list.component.scss'
})
export class ResponsibilityListComponent implements OnInit {
    readonly router = inject(Router);
    private readonly service = inject(ResponsibilityService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    responsibilities = signal<Responsibility[]>([]);
    loading = signal(false);

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading.set(true);
        this.service.list().subscribe({
            next: data => { this.responsibilities.set(data); this.loading.set(false); },
            error: () => { this.loading.set(false); }
        });
    }

    totalPrivileges(): number {
        return this.responsibilities().reduce((sum, r) => sum + (r.privilegeIds?.length || 0), 0);
    }

    confirmDelete(r: Responsibility): void {
        this.confirmationService.confirm({
            header: 'Delete responsibility?',
            message: `Delete "${r.name}"? This cannot be undone.`,
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.service.delete(r.id).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Deleted',
                        detail: `${r.name} removed.`
                    });
                    this.load();
                }
            })
        });
    }
}
