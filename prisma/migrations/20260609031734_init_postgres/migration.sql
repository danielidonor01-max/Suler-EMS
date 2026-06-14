-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "employeeId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "correlationId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionAudit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceId" TEXT,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userId" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "correlationId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "managerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "jobTitle" TEXT NOT NULL,
    "grade" TEXT,
    "branch" TEXT,
    "departmentId" TEXT NOT NULL,
    "nin" TEXT,
    "bvn" TEXT,
    "tin" TEXT,
    "pensionPFA" TEXT,
    "pensionNumber" TEXT,
    "nhfNumber" TEXT,
    "nsitfNumber" TEXT,
    "itfNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowInstance" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "currentState" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "assignedRoleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowAuditEntry" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "fromState" TEXT NOT NULL,
    "toState" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "comment" TEXT,
    "metadata" JSONB,

    CONSTRAINT "WorkflowAuditEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "reason" TEXT,
    "workflowInstanceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'SYSTEM',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resourceId" TEXT,
    "resourceType" TEXT,
    "readAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "workflowAlerts" BOOLEAN NOT NULL DEFAULT true,
    "securityAlerts" BOOLEAN NOT NULL DEFAULT true,
    "systemAlerts" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "source" TEXT NOT NULL,
    "actorId" TEXT,
    "organizationId" TEXT,
    "resourceId" TEXT,
    "resourceType" TEXT,
    "payload" JSONB,
    "correlationId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsSnapshot" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "granularity" TEXT NOT NULL,
    "calculationVersion" TEXT NOT NULL DEFAULT '1.0',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" JSONB NOT NULL,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowMetric" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL,
    "completionDate" TIMESTAMP(3),
    "turnaroundMinutes" INTEGER,
    "stepsCount" INTEGER NOT NULL DEFAULT 0,
    "rejectionsCount" INTEGER NOT NULL DEFAULT 0,
    "isBottleneck" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkforceMetric" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "departmentId" TEXT,
    "headcount" INTEGER NOT NULL,
    "utilizationRate" DOUBLE PRECISION NOT NULL,
    "attritionRate" DOUBLE PRECISION,
    "onboardingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkforceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceMetric" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "complianceRate" DOUBLE PRECISION NOT NULL,
    "lateArrivals" INTEGER NOT NULL,
    "absences" INTEGER NOT NULL,
    "overtimeMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parameters" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "format" TEXT NOT NULL DEFAULT 'CSV',
    "downloadUrl" TEXT,
    "failureCategory" TEXT,
    "error" TEXT,
    "expiresAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "retentionPolicy" TEXT NOT NULL DEFAULT 'STANDARD',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "schemaVersion" TEXT NOT NULL DEFAULT '1.0',
    "generatedByVersion" TEXT NOT NULL DEFAULT '1.0',
    "snapshotMetadata" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastSnapshot" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "granularity" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "calculationVersion" TEXT NOT NULL DEFAULT '1.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForecastSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalAnomaly" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalAnomaly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalRecommendation" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "suggestedAction" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "impactScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskScore" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "scopeId" TEXT,
    "burnoutRisk" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "complianceRisk" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "operationalRisk" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "classification" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "resourceId" TEXT,
    "resourceType" TEXT,
    "retentionPolicy" TEXT NOT NULL DEFAULT 'STANDARD',
    "expiresAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationMember" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "metadata" JSONB,
    "parentId" TEXT,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "editedBy" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "scopeId" TEXT,
    "audience" JSONB,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "authorId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementAcknowledgment" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementAcknowledgment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiometricDevice" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "ipAddress" TEXT,
    "port" INTEGER,
    "location" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ONLINE',
    "trustLevel" TEXT NOT NULL DEFAULT 'TRUSTED',
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastHeartbeat" TIMESTAMP(3),
    "clockDriftSeconds" INTEGER NOT NULL DEFAULT 0,
    "healthMetrics" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BiometricDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawAttendanceLog" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "externalId" TEXT,
    "staffId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'BIOMETRIC',
    "rawPayload" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reconciliationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RawAttendanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceReconciliation" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "originalStatus" TEXT,
    "requestedStatus" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "workflowInstanceId" TEXT,
    "actorId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fiscalYear" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "departmentId" TEXT,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "allocatedAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "spentAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetCategory" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "allocatedAmount" DECIMAL(18,2) NOT NULL,
    "spentAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expenditure" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "categoryId" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "description" TEXT NOT NULL,
    "vendor" TEXT,
    "reference" TEXT,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "disbursedById" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "workflowInstanceId" TEXT,
    "paymentMethod" TEXT,
    "paymentDate" TIMESTAMP(3),
    "metadata" JSONB,
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expenditure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryStructure" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "basicSalary" DECIMAL(18,2) NOT NULL,
    "housingAllowance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "transportAllowance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "otherAllowances" JSONB,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "changedById" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatutoryRate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "jurisdiction" TEXT NOT NULL DEFAULT 'NG',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatutoryRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollRun" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "departmentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalGross" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalNet" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalDeductions" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalEmployerContrib" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "entryCount" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "processedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "rateSnapshot" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollEntry" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "basicSalary" DECIMAL(18,2) NOT NULL,
    "housingAllowance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "transportAllowance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "otherAllowances" JSONB,
    "grossPay" DECIMAL(18,2) NOT NULL,
    "paye" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "pensionEmployee" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "pensionEmployer" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "nhf" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "nhis" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "otherDeductions" JSONB,
    "totalDeductions" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "netPay" DECIMAL(18,2) NOT NULL,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollAdjustment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "entryId" TEXT,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "effectivePeriod" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RoleToPermission" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RoleToPermission_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionAudit_token_key" ON "SessionAudit"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_staffId_key" ON "Employee"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_nin_key" ON "Employee"("nin");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_bvn_key" ON "Employee"("bvn");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_tin_key" ON "Employee"("tin");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_pensionNumber_key" ON "Employee"("pensionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_nhfNumber_key" ON "Employee"("nhfNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_nsitfNumber_key" ON "Employee"("nsitfNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_itfNumber_key" ON "Employee"("itfNumber");

-- CreateIndex
CREATE INDEX "WorkflowInstance_currentState_assignedRoleId_idx" ON "WorkflowInstance"("currentState", "assignedRoleId");

-- CreateIndex
CREATE INDEX "WorkflowInstance_assignedToId_currentState_idx" ON "WorkflowInstance"("assignedToId", "currentState");

-- CreateIndex
CREATE INDEX "WorkflowInstance_workflowId_currentState_idx" ON "WorkflowInstance"("workflowId", "currentState");

-- CreateIndex
CREATE INDEX "WorkflowInstance_resourceId_idx" ON "WorkflowInstance"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveRequest_workflowInstanceId_key" ON "LeaveRequest"("workflowInstanceId");

-- CreateIndex
CREATE INDEX "LeaveRequest_employeeId_status_idx" ON "LeaveRequest"("employeeId", "status");

-- CreateIndex
CREATE INDEX "LeaveRequest_status_createdAt_idx" ON "LeaveRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "LeaveRequest_startDate_endDate_idx" ON "LeaveRequest"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_employeeId_date_key" ON "AttendanceRecord"("employeeId", "date");

-- CreateIndex
CREATE INDEX "Notification_userId_status_idx" ON "Notification"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemEvent_eventId_key" ON "SystemEvent"("eventId");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_type_granularity_timestamp_idx" ON "AnalyticsSnapshot"("type", "granularity", "timestamp");

-- CreateIndex
CREATE INDEX "WorkflowMetric_type_requestDate_idx" ON "WorkflowMetric"("type", "requestDate");

-- CreateIndex
CREATE INDEX "WorkflowMetric_workflowId_idx" ON "WorkflowMetric"("workflowId");

-- CreateIndex
CREATE INDEX "WorkforceMetric_timestamp_departmentId_idx" ON "WorkforceMetric"("timestamp", "departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceMetric_date_key" ON "AttendanceMetric"("date");

-- CreateIndex
CREATE INDEX "ReportJob_userId_status_idx" ON "ReportJob"("userId", "status");

-- CreateIndex
CREATE INDEX "ReportJob_expiresAt_idx" ON "ReportJob"("expiresAt");

-- CreateIndex
CREATE INDEX "ForecastSnapshot_type_targetDate_idx" ON "ForecastSnapshot"("type", "targetDate");

-- CreateIndex
CREATE INDEX "OperationalAnomaly_type_severity_idx" ON "OperationalAnomaly"("type", "severity");

-- CreateIndex
CREATE INDEX "RiskScore_scope_scopeId_idx" ON "RiskScore"("scope", "scopeId");

-- CreateIndex
CREATE INDEX "Conversation_resourceId_resourceType_idx" ON "Conversation"("resourceId", "resourceType");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationMember_conversationId_userId_key" ON "ConversationMember"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Announcement_category_scopeId_idx" ON "Announcement"("category", "scopeId");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementAcknowledgment_announcementId_userId_key" ON "AnnouncementAcknowledgment"("announcementId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "BiometricDevice_serialNumber_key" ON "BiometricDevice"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RawAttendanceLog_idempotencyKey_key" ON "RawAttendanceLog"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceReconciliation_workflowInstanceId_key" ON "AttendanceReconciliation"("workflowInstanceId");

-- CreateIndex
CREATE INDEX "Budget_fiscalYear_status_idx" ON "Budget"("fiscalYear", "status");

-- CreateIndex
CREATE INDEX "Budget_departmentId_idx" ON "Budget"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetCategory_budgetId_name_key" ON "BudgetCategory"("budgetId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Expenditure_workflowInstanceId_key" ON "Expenditure"("workflowInstanceId");

-- CreateIndex
CREATE INDEX "Expenditure_budgetId_status_idx" ON "Expenditure"("budgetId", "status");

-- CreateIndex
CREATE INDEX "Expenditure_requestedById_idx" ON "Expenditure"("requestedById");

-- CreateIndex
CREATE INDEX "Expenditure_status_createdAt_idx" ON "Expenditure"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SalaryStructure_employeeId_isActive_idx" ON "SalaryStructure"("employeeId", "isActive");

-- CreateIndex
CREATE INDEX "SalaryStructure_effectiveDate_idx" ON "SalaryStructure"("effectiveDate");

-- CreateIndex
CREATE INDEX "StatutoryRate_code_isActive_effectiveFrom_idx" ON "StatutoryRate"("code", "isActive", "effectiveFrom");

-- CreateIndex
CREATE INDEX "PayrollRun_status_period_idx" ON "PayrollRun"("status", "period");

-- CreateIndex
CREATE INDEX "PayrollRun_createdAt_idx" ON "PayrollRun"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollRun_period_departmentId_key" ON "PayrollRun"("period", "departmentId");

-- CreateIndex
CREATE INDEX "PayrollEntry_employeeId_idx" ON "PayrollEntry"("employeeId");

-- CreateIndex
CREATE INDEX "PayrollEntry_employeeId_createdAt_idx" ON "PayrollEntry"("employeeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollEntry_runId_employeeId_key" ON "PayrollEntry"("runId", "employeeId");

-- CreateIndex
CREATE INDEX "PayrollAdjustment_employeeId_effectivePeriod_idx" ON "PayrollAdjustment"("employeeId", "effectivePeriod");

-- CreateIndex
CREATE INDEX "PayrollAdjustment_status_effectivePeriod_idx" ON "PayrollAdjustment"("status", "effectivePeriod");

-- CreateIndex
CREATE INDEX "_RoleToPermission_B_index" ON "_RoleToPermission"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginAttempt" ADD CONSTRAINT "LoginAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionAudit" ADD CONSTRAINT "SessionAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowAuditEntry" ADD CONSTRAINT "WorkflowAuditEntry_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "WorkflowInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportJob" ADD CONSTRAINT "ReportJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMember" ADD CONSTRAINT "ConversationMember_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMember" ADD CONSTRAINT "ConversationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementAcknowledgment" ADD CONSTRAINT "AnnouncementAcknowledgment_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementAcknowledgment" ADD CONSTRAINT "AnnouncementAcknowledgment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawAttendanceLog" ADD CONSTRAINT "RawAttendanceLog_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "BiometricDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawAttendanceLog" ADD CONSTRAINT "RawAttendanceLog_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "AttendanceReconciliation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceReconciliation" ADD CONSTRAINT "AttendanceReconciliation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetCategory" ADD CONSTRAINT "BudgetCategory_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expenditure" ADD CONSTRAINT "Expenditure_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expenditure" ADD CONSTRAINT "Expenditure_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BudgetCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expenditure" ADD CONSTRAINT "Expenditure_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructure" ADD CONSTRAINT "SalaryStructure_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRun" ADD CONSTRAINT "PayrollRun_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEntry" ADD CONSTRAINT "PayrollEntry_runId_fkey" FOREIGN KEY ("runId") REFERENCES "PayrollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEntry" ADD CONSTRAINT "PayrollEntry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollAdjustment" ADD CONSTRAINT "PayrollAdjustment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollAdjustment" ADD CONSTRAINT "PayrollAdjustment_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "PayrollEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToPermission" ADD CONSTRAINT "_RoleToPermission_A_fkey" FOREIGN KEY ("A") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToPermission" ADD CONSTRAINT "_RoleToPermission_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
