/**
 * Payslip PDF — React-PDF document.
 *
 * Single-page A4 layout: header (employer + employee + period), earnings
 * table, deductions table, summary panel, footer (generated-at timestamp +
 * disclaimer). Renders server-side via `@react-pdf/renderer`'s
 * `renderToStream` (or `renderToBuffer` in route handlers).
 *
 * All money values are pre-formatted strings here. Caller (the route handler)
 * is responsible for converting Prisma Decimal → number and applying NGN
 * locale formatting.
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export interface PayslipData {
  organization: { name: string; address?: string };
  employee: {
    staffId: string;
    fullName: string;
    jobTitle?: string;
    branch?: string;
    department?: string;
  };
  period: { label: string; processedAt: string }; // e.g. "May 2026"
  earnings: Array<{ label: string; amount: string }>;
  deductions: Array<{ label: string; amount: string }>;
  totals: {
    gross: string;
    deductions: string;
    net: string;
    employerPension?: string;
  };
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
  meta: { flexDirection: 'row', marginTop: 18, marginBottom: 18 },
  metaCol: { flex: 1 },
  metaLabel: { fontSize: 7, color: '#94A3B8', letterSpacing: 1, fontWeight: 'bold', marginBottom: 2 },
  metaValue: { fontSize: 10, color: '#0F172A', fontWeight: 'bold' },
  tablesRow: { flexDirection: 'row', gap: 12 },
  tableCard: { flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 4 },
  tableTitle: {
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: 'bold',
    padding: '6 10',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: '5 10',
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
  },
  rowLabel: { fontSize: 9 },
  rowAmount: { fontSize: 9, fontWeight: 'bold' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: '7 10',
    backgroundColor: '#F8FAFC',
    fontWeight: 'bold',
  },
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
  netLabel: { fontSize: 9, letterSpacing: 1.4, color: '#A7F3D0' },
  netAmount: { fontSize: 18, fontWeight: 'bold', color: '#A7F3D0' },
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

export function PayslipDocument(data: PayslipData) {
  return (
    <Document
      title={`Payslip — ${data.employee.fullName} — ${data.period.label}`}
      author={data.organization.name}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.orgName}>{data.organization.name}</Text>
            {data.organization.address && <Text style={styles.orgAddress}>{data.organization.address}</Text>}
          </View>
          <Text style={styles.badge}>PAYSLIP</Text>
        </View>

        <View style={styles.meta}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>EMPLOYEE</Text>
            <Text style={styles.metaValue}>{data.employee.fullName}</Text>
            <Text style={styles.orgAddress}>
              {data.employee.staffId}
              {data.employee.jobTitle ? ` · ${data.employee.jobTitle}` : ''}
            </Text>
            {(data.employee.branch || data.employee.department) && (
              <Text style={styles.orgAddress}>
                {[data.employee.department, data.employee.branch].filter(Boolean).join(' · ')}
              </Text>
            )}
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>PERIOD</Text>
            <Text style={styles.metaValue}>{data.period.label}</Text>
            <Text style={styles.orgAddress}>Processed {data.period.processedAt}</Text>
          </View>
        </View>

        <View style={styles.tablesRow}>
          <View style={styles.tableCard}>
            <Text style={styles.tableTitle}>EARNINGS</Text>
            {data.earnings.map((e, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.rowLabel}>{e.label}</Text>
                <Text style={styles.rowAmount}>{e.amount}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.rowLabel}>Gross Pay</Text>
              <Text style={styles.rowAmount}>{data.totals.gross}</Text>
            </View>
          </View>

          <View style={styles.tableCard}>
            <Text style={styles.tableTitle}>DEDUCTIONS</Text>
            {data.deductions.map((d, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.rowLabel}>{d.label}</Text>
                <Text style={styles.rowAmount}>{d.amount}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.rowLabel}>Total Deductions</Text>
              <Text style={styles.rowAmount}>{data.totals.deductions}</Text>
            </View>
          </View>
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GROSS PAY</Text>
            <Text style={styles.summaryAmount}>{data.totals.gross}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>DEDUCTIONS</Text>
            <Text style={styles.summaryAmount}>− {data.totals.deductions}</Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: '#334155' }]}>
            <Text style={styles.netLabel}>NET PAY</Text>
            <Text style={styles.netAmount}>{data.totals.net}</Text>
          </View>
          {data.totals.employerPension && (
            <View style={[styles.summaryRow, { marginTop: 4 }]}>
              <Text style={styles.summaryLabel}>Employer Pension (Borne by Employer)</Text>
              <Text style={[styles.summaryAmount, { fontSize: 9, opacity: 0.65 }]}>{data.totals.employerPension}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text>Generated {data.generatedAt}</Text>
          <Text>This document is system-generated. Retain for tax records.</Text>
        </View>
      </Page>
    </Document>
  );
}
