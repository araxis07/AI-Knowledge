export function GET() {
  return Response.json({
    status: "ok",
    service: "ai-knowledge-base",
    check: "live",
    timestamp: new Date().toISOString(),
  });
}
