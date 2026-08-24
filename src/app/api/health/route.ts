// Liveness probe for the Docker healthcheck. Deliberately does not touch
// the database: a DB blip should not make the orchestrator restart the app.
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ status: "ok" });
}
