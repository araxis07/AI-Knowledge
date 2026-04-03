import { NextResponse } from "next/server";

import { getReadinessReport } from "@/server/operations/system-status";

export const dynamic = "force-dynamic";

export async function GET() {
  const report = await getReadinessReport();

  return NextResponse.json(
    {
      check: "ready",
      ...report,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
      status: report.status === "error" ? 503 : 200,
    },
  );
}
