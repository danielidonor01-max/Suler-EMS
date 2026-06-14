import { handlers } from "@/auth";
import { NextRequest } from "next/server";

export const GET = (req: NextRequest) => {
  return handlers.GET(req);
};

export const POST = (req: NextRequest) => {
  return handlers.POST(req);
};
