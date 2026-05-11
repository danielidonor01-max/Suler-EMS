# Suler EMS - Operational Playbook

This document contains institutional knowledge for managing the Suler EMS production environment.

## 1. Incident Response Workflows

### 1.1 Biometric Ingestion Failure
**Symptoms**: Live feed halts, attendance events not appearing in dashboard.
**Action**:
1. Check ingestion logs: `tail -f logs/ingestion.log`
2. Verify Redis connectivity: `redis-cli ping`
3. Trigger "Degraded Mode" in Governance Console to notify HR.
4. Restart Ingestion worker: `docker-compose restart ingestion-worker`

### 1.2 Security Breach / Anomaly
**Symptoms**: Geo-anomaly alerts, bulk session revocations.
**Action**:
1. Review "Security Audit" in Governance Console.
2. Identify compromised UserIDs.
3. Use `SessionService.revokeAllSessions(userId)` to isolate users.
4. Initiate password reset for affected accounts.

## 2. SLA Definitions

| Metric | Target | Threshold (Breach) |
|--------|--------|-------------------|
| Workflow Approval Latency | < 4 hours | > 24 hours |
| Attendance Ingestion Lag | < 5 seconds | > 60 seconds |
| Notification Delivery | < 2 seconds | > 10 seconds |
| API Availability | 99.9% | < 99.5% |

## 3. Disaster Recovery

### 3.1 Restore from Backup
1. Verify backup checksum: `sha256sum -c backup.sha256`
2. Stop application containers: `docker-compose stop app`
3. Restore database: `scripts/rollback.sh --restore db_backup_latest.sql.gz`
4. Run migration verify: `scripts/verify-migrations.sh`
5. Restart application.

## 4. Environment Governance

### 4.1 Production Safeguards
All destructive scripts (`backup-db.sh`, `rollback.sh`) require `--force-prod` flag when running in an environment where `NODE_ENV=production`.
Failure to provide the flag results in immediate script termination.

## 5. Retention & Compliance
- **Audit Logs**: 7 years retention (Regulatory compliance).
- **Attendance Logs (Raw)**: 1 year retention (Reconciliation window).
- **Analytics Snapshots**: 90 days retention (Trend window).
