import prisma from '@/lib/prisma';
import { BudgetUtilization } from './types';

export interface CreateBudgetInput {
  name: string;
  fiscalYear: string;
  period: 'ANNUAL' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'MONTHLY';
  departmentId?: string | null;
  totalAmount: number;
  currency?: string;
  description?: string;
  createdById: string;
  categories?: Array<{ name: string; allocatedAmount: number; code?: string }>;
}

export async function createBudget(input: CreateBudgetInput) {
  const allocatedAmount = (input.categories ?? []).reduce((s, c) => s + c.allocatedAmount, 0);
  return prisma.budget.create({
    data: {
      name: input.name,
      fiscalYear: input.fiscalYear,
      period: input.period,
      departmentId: input.departmentId ?? null,
      totalAmount: input.totalAmount,
      allocatedAmount,
      currency: input.currency ?? 'NGN',
      description: input.description,
      createdById: input.createdById,
      status: 'DRAFT',
      categories: input.categories
        ? { create: input.categories.map(c => ({
            name: c.name,
            code: c.code,
            allocatedAmount: c.allocatedAmount,
          })) }
        : undefined,
    },
    include: { categories: true },
  });
}

export async function activateBudget(budgetId: string, approvedById: string) {
  return prisma.budget.update({
    where: { id: budgetId },
    data: { status: 'ACTIVE', approvedById, approvedAt: new Date() },
  });
}

export interface ListBudgetFilter {
  fiscalYear?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  departmentId?: string | null;
  /** When true, includes per-budget utilization summary. */
  includeUtilization?: boolean;
}

export async function listBudgets(filter: ListBudgetFilter = {}) {
  const rows = await prisma.budget.findMany({
    where: {
      ...(filter.fiscalYear ? { fiscalYear: filter.fiscalYear } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.departmentId !== undefined ? { departmentId: filter.departmentId } : {}),
    },
    orderBy: [{ fiscalYear: 'desc' }, { createdAt: 'desc' }],
    include: {
      department: { select: { id: true, name: true, code: true } },
      _count: { select: { categories: true, expenditures: true } },
    },
  });

  if (!filter.includeUtilization) return rows;

  return rows.map(b => {
    const total = Number(b.totalAmount);
    const spent = Number(b.spentAmount);
    return {
      ...b,
      utilization: {
        totalAmount: total,
        allocatedAmount: Number(b.allocatedAmount),
        spentAmount: spent,
        remainingAmount: total - spent,
        utilizationPercent: total === 0 ? 0 : Math.round((spent / total) * 100),
      },
    };
  });
}

export async function getBudget(id: string, opts: { includeCategories?: boolean } = { includeCategories: true }) {
  const budget = await prisma.budget.findUniqueOrThrow({
    where: { id },
    include: {
      department: { select: { id: true, name: true, code: true } },
      ...(opts.includeCategories ? { categories: { orderBy: { name: 'asc' } } } : {}),
      _count: { select: { expenditures: true } },
    },
  });
  const total = Number(budget.totalAmount);
  const spent = Number(budget.spentAmount);
  return {
    ...budget,
    utilization: {
      totalAmount: total,
      allocatedAmount: Number(budget.allocatedAmount),
      spentAmount: spent,
      remainingAmount: total - spent,
      utilizationPercent: total === 0 ? 0 : Math.round((spent / total) * 100),
    },
  };
}

export async function getBudgetUtilization(budgetId: string): Promise<BudgetUtilization> {
  const b = await prisma.budget.findUniqueOrThrow({ where: { id: budgetId } });
  const total = Number(b.totalAmount);
  const allocated = Number(b.allocatedAmount);
  const spent = Number(b.spentAmount);
  return {
    totalAmount: total,
    allocatedAmount: allocated,
    spentAmount: spent,
    remainingAmount: total - spent,
    utilizationPercent: total === 0 ? 0 : Math.round((spent / total) * 100),
  };
}
