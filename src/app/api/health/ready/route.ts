export function GET() {
  return Response.json({
    status: "ok",
    service: "ai-knowledge-base",
    check: "ready",
    timestamp: new Date().toISOString(),
  });
}
