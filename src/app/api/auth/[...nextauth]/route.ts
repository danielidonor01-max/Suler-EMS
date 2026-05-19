import { handlers } from "@/auth";

export const GET = (req: Request) => {
  return handlers.GET(req);
};

export const POST = (req: Request) => {
  return handlers.POST(req);
};
