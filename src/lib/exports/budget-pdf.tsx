/**
 * Budget Report PDF — React-PDF document.
 *
 * Single page (typically) showing one budget's allocation vs utilization,
 * category breakdown with utilization bars, and recent disbursements.
 * Caller pre-formats currency strings; layout assumes A4 portrait.
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export interface BudgetReportData {
  organization: { name: string; address?: string };
  budget: {
    name: string;
    fiscalYear: string;
    period: string;
    department?: string;
    status: string;
    description?: string;
  };
  totals: {
    total: string;
    allocated: string;
    spent: string;
    remaining: string;
    utilizationPercent: number;
  };
  categories: Array<{
    name: string;
    code?: string;
    allocated: string;
    spent: string;
    remaining: string;
    pct: number;
  }>;
  recentExpenditures: Array<{
    date: string;
    description: string;
    vendor: string;
    category: string;
    amount: string;
    status: string;
  }>;
  generatedAt: string;
}

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica', color: '#0F172A' },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  orgName: { fontSize: 14, fontWeight: 'bold' },
  orgAddress: { fontSize: 9, color: '#64748B', marginTop: 2 },
  badge: {
    padding: '4 8',
    backgroundColor: '#0F172A',
    color: '#FFF',
    fontSize: 8,
    letterSpacing: 1.4,
    fontWeight: 'bold',
  },
  budgetTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 18 },
  budgetMeta: { fontSize: 9, color: '#64748B', marginTop: 4 },
  summary: {
    marginTop: 18,
    padding: 14,
    borderRadius: 6,
    backgroundColor: '#0F172A',
    color: '#FFF',
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  summaryLabel: { fontSize: 8, letterSpacing: 1.2, opacity: 0.65 },
  summaryAmount: { fontSize: 11, fontWeight: 'bold' },
  remainingLabel: { fontSize: 9, letterSpacing: 1.4, color: '#A7F3D0' },
  remainingAmount: { fontSize: 16, fontWeight: 'bold', color: '#A7F3D0' },
  sectionTitle: {
    fontSize: 9,
    letterSpacing: 1.4,
    fontWeight: 'bold',
    marginTop: 22,
    marginBottom: 8,
    color: '#475569',
  },
  card: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 4 },
  tableHeader: {
    flexDirection: 'row',
    padding: '6 10',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableHeaderCell: { fontSize: 8, color: '#64748B', letterSpacing: 1, fontWeight: 'bold' },
  row: {
    flexDirection: 'row',
    padding: '6 10',
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  rowCell: { fontSize: 9 },
  utilBarTrack: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  utilBarFill: { height: 4, borderRadius: 2 },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#94A3B8',
  },
});

function utilColor(pct: number): string {
  if (pct >= 90) return '#DC2626'; // rose-600
  if (pct >= 70) return '#D97706'; // amber-600
  return '#059669'; // emerald-600
}

export function BudgetReportDocument(data: BudgetReportData) {
  return (
    <Document
      title={`Budget Report — ${data.budget.name}`}
      author={data.organization.name}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.orgName}>{data.organization.name}</Text>
            {data.organization.address && <Text style={styles.orgAddress}>{data.organization.address}</Text>}
          </View>
          <Text style={styles.badge}>BUDGET REPORT</Text>
        </View>

        <Text style={styles.budgetTitle}>{data.budget.name}</Text>
        <Text style={styles.budgetMeta}>
          {data.budget.fiscalYear} · {data.budget.period}
          {data.budget.department ? ` · ${data.budget.department}` : ' · Organization-wide'}
          {` · ${data.budget.status}`}
        </Text>
        {data.budget.description && (
          <Text style={[styles.budgetMeta, { marginTop: 2 }]}>{data.budget.description}</Text>
        )}

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>TOTAL ALLOCATION</Text>
            <Text style={styles.summaryAmount}>{data.totals.total}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>SPENT</Text>
            <Text style={styles.summaryAmount}>− {data.totals.spent}</Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: '#334155' }]}>
            <Text style={styles.remainingLabel}>REMAINING</Text>
            <Text style={styles.remainingAmount}>{data.totals.remaining}</Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: 4 }]}>
            <Text style={styles.summaryLabel}>UTILIZATION</Text>
            <Text style={[styles.summaryAmount, { fontSize: 9, opacity: 0.75 }]}>
              {data.totals.utilizationPercent}%
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>CATEGORY BREAKDOWN</Text>
        <View style={styles.card}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 3 }]}>CATEGORY</Text>
            <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>ALLOCATED</Text>
            <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>SPENT</Text>
            <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>REMAINING</Text>
          </View>
          {data.categories.map((c, i) => (
            <View key={i} style={styles.row}>
              <View style={{ flex: 3 }}>
                <Text style={styles.rowCell}>{c.name}{c.code ? ` (${c.code})` : ''}</Text>
                <View style={styles.utilBarTrack}>
                  <View style={[styles.utilBarFill, { width: `${Math.min(100, c.pct)}%`, backgroundColor: utilColor(c.pct) }]} />
                </View>
              </View>
              <Text style={[styles.rowCell, { flex: 2, textAlign: 'right' }]}>{c.allocated}</Text>
              <Text style={[styles.rowCell, { flex: 2, textAlign: 'right' }]}>{c.spent}</Text>
              <Text style={[styles.rowCell, { flex: 2, textAlign: 'right' }]}>{c.remaining}</Text>
            </View>
          ))}
        </View>

        {data.recentExpenditures.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>RECENT EXPENDITURES (LAST 10)</Text>
            <View style={styles.card}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>DATE</Text>
                <Text style={[styles.tableHeaderCell, { flex: 5 }]}>DESCRIPTION</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>STATUS</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>AMOUNT</Text>
              </View>
              {data.recentExpenditures.map((e, i) => (
                <View key={i} style={styles.row}>
                  <Text style={[styles.rowCell, { flex: 2 }]}>{e.date}</Text>
                  <View style={{ flex: 5 }}>
                    <Text style={styles.rowCell}>{e.description}</Text>
                    <Text style={[styles.rowCell, { color: '#94A3B8', fontSize: 8 }]}>
                      {e.vendor}{e.category ? ` · ${e.category}` : ''}
                    </Text>
                  </View>
                  <Text style={[styles.rowCell, { flex: 2, fontSize: 8, letterSpacing: 1 }]}>{e.status}</Text>
                  <Text style={[styles.rowCell, { flex: 2, textAlign: 'right', fontWeight: 'bold' }]}>{e.amount}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.footer} fixed>
          <Text>Generated {data.generatedAt}</Text>
          <Text>Reflects the latest committed state from the audit registry.</Text>
        </View>
      </Page>
    </Document>
  );
}
