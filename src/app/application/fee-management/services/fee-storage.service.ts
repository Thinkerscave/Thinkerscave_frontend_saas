import { Injectable } from '@angular/core';

export interface FeePolicy {
    id: string;
    name: string;
    academicSession: string;
    effectiveFrom: Date;
    effectiveTo: Date | null;
    description: string;
    status: 'ACTIVE' | 'DRAFT' | 'LOCKED';
    lateFeeEnabled: boolean;
    lateFeeType: string;
    lateFeeAmount: number;
    gracePeriodDays: number;
    maxLateFee: number;
    installmentsAllowed: boolean;
    maxInstallments: number;
    minInstallmentAmount: number;
    refundAllowed: boolean;
    refundDeductionPercent: number;
    refundProcessingDays: number;
    refundTerms: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface FeeHead {
    id: string;
    code: string;
    name: string;
    category: string;
    frequency: string;
    description: string;
    defaultAmount: number;
    minAmount: number;
    maxAmount: number | null;
    taxPercent: number;
    isActive: boolean;
    isMandatory: boolean;
    isRefundable: boolean;
    allowPartialPayment: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface FeeGroup {
    id: string;
    code: string;
    name: string;
    description: string;
    isActive: boolean;
    feeHeadIds: string[];
    totalAmount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface FeeStructure {
    id: string;
    name: string;
    academicYear: string;
    classProgram: string;
    feeGroup: string;
    description: string;
    isActive: boolean;
    allowCustomization: boolean;
    feeBreakdown: any[];
    installments: any[];
    totalAmount: number;
    isLocked: boolean;
    createdAt: Date;
    updatedAt: Date;
}

@Injectable({
    providedIn: 'root'
})
export class FeeStorageService {
    private readonly POLICIES_KEY = 'fee_policies';
    private readonly HEADS_KEY = 'fee_heads';
    private readonly GROUPS_KEY = 'fee_groups';
    private readonly STRUCTURES_KEY = 'fee_structures';

    // ============== Fee Policies ==============
    getPolicies(): FeePolicy[] {
        const data = localStorage.getItem(this.POLICIES_KEY);
        return data ? JSON.parse(data) : [];
    }

    getPolicy(id: string): FeePolicy | undefined {
        return this.getPolicies().find(p => p.id === id);
    }

    savePolicy(policy: Partial<FeePolicy>): FeePolicy {
        const policies = this.getPolicies();
        const now = new Date();

        if (policy.id) {
            // Update existing
            const index = policies.findIndex(p => p.id === policy.id);
            if (index !== -1) {
                policies[index] = { ...policies[index], ...policy, updatedAt: now };
                localStorage.setItem(this.POLICIES_KEY, JSON.stringify(policies));
                return policies[index];
            }
        }

        // Create new
        const newPolicy: FeePolicy = {
            id: this.generateId(),
            name: policy.name || '',
            academicSession: policy.academicSession || '',
            effectiveFrom: policy.effectiveFrom || new Date(),
            effectiveTo: policy.effectiveTo || null,
            description: policy.description || '',
            status: 'ACTIVE',
            lateFeeEnabled: policy.lateFeeEnabled || false,
            lateFeeType: policy.lateFeeType || 'FIXED',
            lateFeeAmount: policy.lateFeeAmount || 0,
            gracePeriodDays: policy.gracePeriodDays || 7,
            maxLateFee: policy.maxLateFee || 0,
            installmentsAllowed: policy.installmentsAllowed || false,
            maxInstallments: policy.maxInstallments || 4,
            minInstallmentAmount: policy.minInstallmentAmount || 0,
            refundAllowed: policy.refundAllowed || false,
            refundDeductionPercent: policy.refundDeductionPercent || 0,
            refundProcessingDays: policy.refundProcessingDays || 15,
            refundTerms: policy.refundTerms || '',
            createdAt: now,
            updatedAt: now
        };

        policies.push(newPolicy);
        localStorage.setItem(this.POLICIES_KEY, JSON.stringify(policies));
        return newPolicy;
    }

    deletePolicy(id: string): void {
        const policies = this.getPolicies().filter(p => p.id !== id);
        localStorage.setItem(this.POLICIES_KEY, JSON.stringify(policies));
    }

    // ============== Fee Heads ==============
    getFeeHeads(): FeeHead[] {
        const data = localStorage.getItem(this.HEADS_KEY);
        return data ? JSON.parse(data) : [];
    }

    getFeeHead(id: string): FeeHead | undefined {
        return this.getFeeHeads().find(h => h.id === id);
    }

    saveFeeHead(head: Partial<FeeHead>): FeeHead {
        const heads = this.getFeeHeads();
        const now = new Date();

        if (head.id) {
            const index = heads.findIndex(h => h.id === head.id);
            if (index !== -1) {
                heads[index] = { ...heads[index], ...head, updatedAt: now };
                localStorage.setItem(this.HEADS_KEY, JSON.stringify(heads));
                return heads[index];
            }
        }

        const newHead: FeeHead = {
            id: this.generateId(),
            code: head.code || '',
            name: head.name || '',
            category: head.category || 'ACADEMIC',
            frequency: head.frequency || 'YEARLY',
            description: head.description || '',
            defaultAmount: head.defaultAmount || 0,
            minAmount: head.minAmount || 0,
            maxAmount: head.maxAmount || null,
            taxPercent: head.taxPercent || 0,
            isActive: head.isActive !== undefined ? head.isActive : true,
            isMandatory: head.isMandatory || false,
            isRefundable: head.isRefundable !== undefined ? head.isRefundable : true,
            allowPartialPayment: head.allowPartialPayment !== undefined ? head.allowPartialPayment : true,
            createdAt: now,
            updatedAt: now
        };

        heads.push(newHead);
        localStorage.setItem(this.HEADS_KEY, JSON.stringify(heads));
        return newHead;
    }

    deleteFeeHead(id: string): void {
        const heads = this.getFeeHeads().filter(h => h.id !== id);
        localStorage.setItem(this.HEADS_KEY, JSON.stringify(heads));
    }

    // ============== Fee Groups ==============
    getFeeGroups(): FeeGroup[] {
        const data = localStorage.getItem(this.GROUPS_KEY);
        return data ? JSON.parse(data) : [];
    }

    getFeeGroup(id: string): FeeGroup | undefined {
        return this.getFeeGroups().find(g => g.id === id);
    }

    saveFeeGroup(group: Partial<FeeGroup>): FeeGroup {
        const groups = this.getFeeGroups();
        const now = new Date();

        if (group.id) {
            const index = groups.findIndex(g => g.id === group.id);
            if (index !== -1) {
                groups[index] = { ...groups[index], ...group, updatedAt: now };
                localStorage.setItem(this.GROUPS_KEY, JSON.stringify(groups));
                return groups[index];
            }
        }

        const newGroup: FeeGroup = {
            id: this.generateId(),
            code: group.code || '',
            name: group.name || '',
            description: group.description || '',
            isActive: group.isActive !== undefined ? group.isActive : true,
            feeHeadIds: group.feeHeadIds || [],
            totalAmount: group.totalAmount || 0,
            createdAt: now,
            updatedAt: now
        };

        groups.push(newGroup);
        localStorage.setItem(this.GROUPS_KEY, JSON.stringify(groups));
        return newGroup;
    }

    deleteFeeGroup(id: string): void {
        const groups = this.getFeeGroups().filter(g => g.id !== id);
        localStorage.setItem(this.GROUPS_KEY, JSON.stringify(groups));
    }

    // ============== Fee Structures ==============
    getFeeStructures(): FeeStructure[] {
        const data = localStorage.getItem(this.STRUCTURES_KEY);
        return data ? JSON.parse(data) : [];
    }

    getFeeStructure(id: string): FeeStructure | undefined {
        return this.getFeeStructures().find(s => s.id === id);
    }

    saveFeeStructure(structure: Partial<FeeStructure>): FeeStructure {
        const structures = this.getFeeStructures();
        const now = new Date();

        if (structure.id) {
            const index = structures.findIndex(s => s.id === structure.id);
            if (index !== -1) {
                structures[index] = { ...structures[index], ...structure, updatedAt: now };
                localStorage.setItem(this.STRUCTURES_KEY, JSON.stringify(structures));
                return structures[index];
            }
        }

        const newStructure: FeeStructure = {
            id: this.generateId(),
            name: structure.name || '',
            academicYear: structure.academicYear || '',
            classProgram: structure.classProgram || '',
            feeGroup: structure.feeGroup || '',
            description: structure.description || '',
            isActive: structure.isActive !== undefined ? structure.isActive : true,
            allowCustomization: structure.allowCustomization || false,
            feeBreakdown: structure.feeBreakdown || [],
            installments: structure.installments || [],
            totalAmount: structure.totalAmount || 0,
            isLocked: false,
            createdAt: now,
            updatedAt: now
        };

        structures.push(newStructure);
        localStorage.setItem(this.STRUCTURES_KEY, JSON.stringify(structures));
        return newStructure;
    }

    deleteFeeStructure(id: string): void {
        const structures = this.getFeeStructures().filter(s => s.id !== id);
        localStorage.setItem(this.STRUCTURES_KEY, JSON.stringify(structures));
    }

    // ============== Utility ==============
    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
}
