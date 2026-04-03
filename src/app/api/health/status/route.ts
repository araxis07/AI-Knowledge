import { NextResponse } from "next/server";

import { getSystemStatusReport } from "@/server/operations/system-status";

export const dynamic = "force-dynamic";

export async function GET() {
  const report = await getSystemStatusReport();

  return NextResponse.json(report, {
    headers: {
      "Cache-Control": "no-store",
    },
    status: report.status === "error" ? 503 : 200,
  });
}
