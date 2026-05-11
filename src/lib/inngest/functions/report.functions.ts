import { inngest } from "../client";
import prisma from "@/lib/prisma";
import { ReportingService } from "@/modules/analytics/services/reporting.service";
import { ExportUtils } from "@/lib/utils/export.utils";
import { StorageService } from "@/lib/storage/storage.service";
import { addDays } from "date-fns";

/**
 * Generate Report Background Task
 * Handles durable execution of report exports.
 */
export const generateReport = inngest.createFunction(
  { 
    id: "generate-report",
    retries: 3, // Refinement 5: Retry Strategy
    triggers: [{ event: "report/generation.requested" }]
  },
  async ({ event, step }) => {
    const { jobId, userId, type, format, parameters } = event.data;

    // 1. Mark job as processing
    await step.run("mark-processing", async () => {
      await prisma.reportJob.update({
        where: { id: jobId },
        data: { status: "PROCESSING", retryCount: { increment: 1 } }
      });
    });

    try {
      // 2. Fetch Data (Snapshot Integrity)
      const data = await step.run("fetch-data", async () => {
        // Refinement 3: Snapshot Integrity
        // We fetch the user's role here or pass it in parameters
        const user = await prisma.user.findUnique({ 
          where: { id: userId },
          include: { role: true }
        });
        
        if (!user) throw new Error("User not found");

        return await ReportingService.getReportData(type, userId, user.role.name);
      });

      if (!data || data.length === 0) {
        throw new Error("No data found for the selected filters");
      }

      // 3. Convert to Format
      const artifact = await step.run("convert-format", async () => {
        if (format === "CSV") {
          return ExportUtils.jsonToCSV(data, type);
        } else {
          return (await ExportUtils.jsonToPDF(data, type)).toString('base64');
        }
      });

      // 4. Save to Storage (Secure Storage Abstraction)
      const downloadUrl = await step.run("save-storage", async () => {
        const content = format === "CSV" ? artifact : Buffer.from(artifact, 'base64');
        return await StorageService.saveReport(content, format.toLowerCase());
      });

      // 5. Complete Job (Lifecycle & Retention)
      await step.run("complete-job", async () => {
        const expiresAt = addDays(new Date(), 7); // Refinement 1: 7-day retention

        await prisma.reportJob.update({
          where: { id: jobId },
          data: { 
            status: "COMPLETED",
            downloadUrl,
            completedAt: new Date(),
            expiresAt,
            // Audit Metadata
            snapshotMetadata: {
              recordCount: data.length,
              generatedAt: new Date().toISOString(),
              schemaVersion: "1.0"
            }
          }
        });
      });

      return { success: true, downloadUrl };

    } catch (err: any) {
      // Refinement 4: Job Failure Taxonomy
      await step.run("handle-failure", async () => {
        let category = "EXPORT_ERROR";
        if (err.message.includes("No data")) category = "VALIDATION_ERROR";
        if (err.message.includes("User not found")) category = "AUTHORIZATION_ERROR";

        await prisma.reportJob.update({
          where: { id: jobId },
          data: { 
            status: "FAILED", 
            error: err.message,
            failureCategory: category
          }
        });
      });
      
      throw err; // Allow Inngest to retry if appropriate
    }
  }
);
