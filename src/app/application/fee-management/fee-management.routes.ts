import { Routes } from '@angular/router';
import { FeeRole } from './enums';
import {
    canAccessFeeDashboard,
    canConfigureFees,
    canCollectPayment,
    canMakeOnlinePayment,
    canCreateAdjustment,
    canApproveAdjustment,
    canViewReports,
    canViewAuditLogs,
    canViewLedger,
    canGenerateContracts,
    feeRoleGuard
} from './guards';

/**
 * Fee Management Routes
 * 
 * Navigation Order (Lifecycle-Driven):
 * 1. Dashboard (read-only snapshot)
 * 2. Academic & Fee Setup
 * 3. Student Fee Management (contracts + ledgers)
 * 4. Payments & Receipts
 * 5. Adjustments & Exceptions
 * 6. Controls & Automation
 * 7. Reports & Analytics
 * 8. Audit & Logs
 */
export const FEE_MANAGEMENT_ROUTES: Routes = [
    // ============================================
    // 1. FEE DASHBOARD
    // ============================================
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./components/fee-dashboard/fee-dashboard.component').then(m => m.FeeDashboardComponent),
        canActivate: [canAccessFeeDashboard],
        data: {
            breadcrumb: 'Fee Dashboard',
            lifecycle: 'DASHBOARD'
        }
    },

    // ============================================
    // 2. ACADEMIC & FEE SETUP (Configuration)
    // ============================================
    {
        path: 'setup',
        canActivate: [canConfigureFees],
        children: [
            {
                path: '',
                redirectTo: 'overview',
                pathMatch: 'full'
            },
            {
                path: 'overview',
                loadComponent: () =>
                    import('./components/setup/fee-setup-overview/fee-setup-overview.component').then(m => m.FeeSetupOverviewComponent),
                data: { breadcrumb: 'Fee Setup' }
            },
            {
                path: 'policy',
                loadComponent: () =>
                    import('./components/setup/fee-policy/fee-policy-list.component').then(m => m.FeePolicyListComponent),
                data: { breadcrumb: 'Fee Policy' }
            },
            {
                path: 'policy/create',
                loadComponent: () =>
                    import('./components/setup/fee-policy/fee-policy-form.component').then(m => m.FeePolicyFormComponent),
                data: { breadcrumb: 'Create Policy' }
            },
            {
                path: 'policy/edit/:id',
                loadComponent: () =>
                    import('./components/setup/fee-policy/fee-policy-form.component').then(m => m.FeePolicyFormComponent),
                data: { breadcrumb: 'Edit Policy' }
            },
            {
                path: 'heads',
                loadComponent: () =>
                    import('./components/setup/fee-heads/fee-head-list.component').then(m => m.FeeHeadListComponent),
                data: { breadcrumb: 'Fee Heads' }
            },
            {
                path: 'heads/create',
                loadComponent: () =>
                    import('./components/setup/fee-heads/fee-head-form.component').then(m => m.FeeHeadFormComponent),
                data: { breadcrumb: 'Create Fee Head' }
            },
            {
                path: 'heads/edit/:id',
                loadComponent: () =>
                    import('./components/setup/fee-heads/fee-head-form.component').then(m => m.FeeHeadFormComponent),
                data: { breadcrumb: 'Edit Fee Head' }
            },
            {
                path: 'groups',
                loadComponent: () =>
                    import('./components/setup/fee-groups/fee-group-list.component').then(m => m.FeeGroupListComponent),
                data: { breadcrumb: 'Fee Groups' }
            },
            {
                path: 'groups/create',
                loadComponent: () =>
                    import('./components/setup/fee-groups/fee-group-form.component').then(m => m.FeeGroupFormComponent),
                data: { breadcrumb: 'Create Fee Group' }
            },
            {
                path: 'groups/edit/:id',
                loadComponent: () =>
                    import('./components/setup/fee-groups/fee-group-form.component').then(m => m.FeeGroupFormComponent),
                data: { breadcrumb: 'Edit Fee Group' }
            },
            {
                path: 'structure',
                loadComponent: () =>
                    import('./components/setup/fee-structure/fee-structure-list.component').then(m => m.FeeStructureListComponent),
                data: { breadcrumb: 'Fee Structure' }
            },
            {
                path: 'structure/create',
                loadComponent: () =>
                    import('./components/setup/fee-structure/fee-structure-form.component').then(m => m.FeeStructureFormComponent),
                data: { breadcrumb: 'Create Fee Structure' }
            },
            {
                path: 'structure/edit/:id',
                loadComponent: () =>
                    import('./components/setup/fee-structure/fee-structure-form.component').then(m => m.FeeStructureFormComponent),
                data: { breadcrumb: 'Edit Fee Structure' }
            },
            {
                path: 'structure/view/:id',
                loadComponent: () =>
                    import('./components/setup/fee-structure/fee-structure-view.component').then(m => m.FeeStructureViewComponent),
                data: { breadcrumb: 'View Fee Structure' }
            }
        ]
    },

    // ============================================
    // 3. STUDENT FEE MANAGEMENT (Contracts & Ledgers)
    // ============================================
    {
        path: 'contracts',
        children: [
            {
                path: '',
                loadComponent: () =>
                    import('./components/contracts/fee-contract-list/fee-contract-list.component').then(m => m.FeeContractListComponent),
                canActivate: [canGenerateContracts],
                data: { breadcrumb: 'Fee Contracts' }
            },
            {
                path: 'generate',
                loadComponent: () =>
                    import('./components/contracts/contract-generator/contract-generator.component').then(m => m.ContractGeneratorComponent),
                canActivate: [canGenerateContracts],
                data: { breadcrumb: 'Generate Contracts' }
            },
            {
                path: 'view/:id',
                loadComponent: () =>
                    import('./components/contracts/fee-contract-view/fee-contract-view.component').then(m => m.FeeContractViewComponent),
                canActivate: [canViewLedger],
                data: { breadcrumb: 'View Contract' }
            }
        ]
    },
    {
        path: 'ledger',
        children: [
            {
                path: '',
                loadComponent: () =>
                    import('./components/ledger/ledger-list/ledger-list.component').then(m => m.LedgerListComponent),
                canActivate: [canViewLedger],
                data: { breadcrumb: 'Fee Ledger' }
            },
            {
                path: 'student/:studentId',
                loadComponent: () =>
                    import('./components/ledger/student-ledger/student-ledger.component').then(m => m.StudentLedgerComponent),
                canActivate: [canViewLedger],
                data: { breadcrumb: 'Student Ledger' }
            },
            {
                path: 'statement/:contractId',
                loadComponent: () =>
                    import('./components/ledger/ledger-statement/ledger-statement.component').then(m => m.LedgerStatementComponent),
                canActivate: [canViewLedger],
                data: { breadcrumb: 'Ledger Statement' }
            }
        ]
    },

    // ============================================
    // 4. PAYMENTS & RECEIPTS
    // ============================================
    {
        path: 'payments',
        children: [
            {
                path: '',
                loadComponent: () =>
                    import('./components/payments/payment-collection/payment-collection.component').then(m => m.PaymentCollectionComponent),
                canActivate: [canCollectPayment],
                data: { breadcrumb: 'Collect Payment' }
            },
            {
                path: 'history',
                loadComponent: () =>
                    import('./components/payments/payment-history/payment-history.component').then(m => m.PaymentHistoryComponent),
                canActivate: [canCollectPayment],
                data: { breadcrumb: 'Payment History' }
            },
            {
                path: 'online',
                loadComponent: () =>
                    import('./components/payments/online-payment/online-payment.component').then(m => m.OnlinePaymentComponent),
                canActivate: [canMakeOnlinePayment],
                data: { breadcrumb: 'Online Payment' }
            }
        ]
    },
    {
        path: 'receipts',
        children: [
            {
                path: '',
                loadComponent: () =>
                    import('./components/receipts/receipt-list/receipt-list.component').then(m => m.ReceiptListComponent),
                canActivate: [canCollectPayment],
                data: { breadcrumb: 'Receipts' }
            },
            {
                path: 'view/:id',
                loadComponent: () =>
                    import('./components/receipts/receipt-view/receipt-view.component').then(m => m.ReceiptViewComponent),
                canActivate: [canViewLedger],
                data: { breadcrumb: 'View Receipt' }
            }
        ]
    },

    // ============================================
    // 5. ADJUSTMENTS & EXCEPTIONS
    // ============================================
    {
        path: 'adjustments',
        children: [
            {
                path: '',
                loadComponent: () =>
                    import('./components/adjustments/adjustment-list/adjustment-list.component').then(m => m.AdjustmentListComponent),
                canActivate: [canCreateAdjustment],
                data: { breadcrumb: 'Adjustments' }
            },
            {
                path: 'create',
                loadComponent: () =>
                    import('./components/adjustments/adjustment-form/adjustment-form.component').then(m => m.AdjustmentFormComponent),
                canActivate: [canCreateAdjustment],
                data: { breadcrumb: 'Create Adjustment' }
            },
            {
                path: 'pending',
                loadComponent: () =>
                    import('./components/adjustments/pending-approvals/pending-approvals.component').then(m => m.PendingApprovalsComponent),
                canActivate: [canApproveAdjustment],
                data: { breadcrumb: 'Pending Approvals' }
            },
            {
                path: 'concessions',
                loadComponent: () =>
                    import('./components/adjustments/concession-list/concession-list.component').then(m => m.ConcessionListComponent),
                canActivate: [canConfigureFees],
                data: { breadcrumb: 'Concession Master' }
            }
        ]
    },

    // ============================================
    // 6. CONTROLS & AUTOMATION
    // ============================================
    {
        path: 'controls',
        canActivate: [canConfigureFees],
        children: [
            {
                path: '',
                loadComponent: () =>
                    import('./components/controls/restriction-dashboard/restriction-dashboard.component').then(m => m.RestrictionDashboardComponent),
                data: { breadcrumb: 'Academic Controls' }
            },
            {
                path: 'rules',
                loadComponent: () =>
                    import('./components/controls/restriction-rules/restriction-rules.component').then(m => m.RestrictionRulesComponent),
                data: { breadcrumb: 'Restriction Rules' }
            },
            {
                path: 'late-fee',
                loadComponent: () =>
                    import('./components/controls/late-fee-config/late-fee-config.component').then(m => m.LateFeeConfigComponent),
                data: { breadcrumb: 'Late Fee Configuration' }
            },
            {
                path: 'overrides',
                loadComponent: () =>
                    import('./components/controls/restriction-overrides/restriction-overrides.component').then(m => m.RestrictionOverridesComponent),
                data: { breadcrumb: 'Restriction Overrides' }
            }
        ]
    },

    // ============================================
    // 7. REPORTS & ANALYTICS
    // ============================================
    {
        path: 'reports',
        canActivate: [canViewReports],
        children: [
            {
                path: '',
                loadComponent: () =>
                    import('./components/reports/reports-dashboard/reports-dashboard.component').then(m => m.ReportsDashboardComponent),
                data: { breadcrumb: 'Fee Reports' }
            },
            {
                path: 'collection',
                loadComponent: () =>
                    import('./components/reports/collection-report/collection-report.component').then(m => m.CollectionReportComponent),
                data: { breadcrumb: 'Collection Report' }
            },
            {
                path: 'outstanding',
                loadComponent: () =>
                    import('./components/reports/outstanding-report/outstanding-report.component').then(m => m.OutstandingReportComponent),
                data: { breadcrumb: 'Outstanding Report' }
            },
            {
                path: 'daily',
                loadComponent: () =>
                    import('./components/reports/daily-collection/daily-collection.component').then(m => m.DailyCollectionComponent),
                data: { breadcrumb: 'Daily Collection' }
            },
            {
                path: 'defaulters',
                loadComponent: () =>
                    import('./components/reports/defaulters-report/defaulters-report.component').then(m => m.DefaultersReportComponent),
                data: { breadcrumb: 'Defaulters List' }
            }
        ]
    },

    // ============================================
    // 8. AUDIT & LOGS
    // ============================================
    {
        path: 'audit',
        canActivate: [canViewAuditLogs],
        children: [
            {
                path: '',
                loadComponent: () =>
                    import('./components/audit/audit-log-viewer/audit-log-viewer.component').then(m => m.AuditLogViewerComponent),
                data: { breadcrumb: 'Audit Logs' }
            },
            {
                path: 'trail/:entityType/:entityId',
                loadComponent: () =>
                    import('./components/audit/entity-audit-trail/entity-audit-trail.component').then(m => m.EntityAuditTrailComponent),
                data: { breadcrumb: 'Audit Trail' }
            }
        ]
    },

    // ============================================
    // PARENT/STUDENT PORTAL - Limited Access Views
    // ============================================
    {
        path: 'my-fees',
        canActivate: [feeRoleGuard([FeeRole.PARENT, FeeRole.GUARDIAN, FeeRole.STUDENT])],
        children: [
            {
                path: '',
                loadComponent: () =>
                    import('./components/portal/my-fees-dashboard/my-fees-dashboard.component').then(m => m.MyFeesDashboardComponent),
                data: { breadcrumb: 'My Fees' }
            },
            {
                path: 'pay',
                loadComponent: () =>
                    import('./components/portal/pay-online/pay-online.component').then(m => m.PayOnlineComponent),
                canActivate: [canMakeOnlinePayment],
                data: { breadcrumb: 'Pay Online' }
            },
            {
                path: 'history',
                loadComponent: () =>
                    import('./components/portal/payment-history/payment-history.component').then(m => m.PortalPaymentHistoryComponent),
                data: { breadcrumb: 'Payment History' }
            },
            {
                path: 'receipts',
                loadComponent: () =>
                    import('./components/portal/my-receipts/my-receipts.component').then(m => m.MyReceiptsComponent),
                data: { breadcrumb: 'My Receipts' }
            }
        ]
    }
];
