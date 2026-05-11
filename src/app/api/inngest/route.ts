import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { generateReport } from "@/lib/inngest/functions/report.functions";

// Create the Next.js API route for Inngest
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    generateReport,
  ],
});
