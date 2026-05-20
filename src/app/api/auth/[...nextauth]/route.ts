import { NextRequest } from "next/server";
import { handlers } from "@/auth";

export const GET = (req: NextRequest) => {
  return handlers.GET(req);
};

export const POST = (req: NextRequest) => {
  return handlers.POST(req);
};
