import { Inngest } from "inngest";
import { ReportType } from "@/modules/analytics/domain/analytics.model";

// Define the event types for the Suler EMS Inngest client
export type Events = {
  "report/generation.requested": {
    data: {
      jobId: string;
      userId: string;
      type: ReportType;
      format: "CSV" | "PDF";
      parameters?: any;
    };
  };
};

// Create the Inngest client
export const inngest = new Inngest({ 
  id: "suler-ems-reporting",
  schemas: {
    "report/generation.requested": {
      data: {
        jobId: "string",
        userId: "string",
        type: "string",
        format: "string",
        parameters: "object"
      }
    }
  }
});
