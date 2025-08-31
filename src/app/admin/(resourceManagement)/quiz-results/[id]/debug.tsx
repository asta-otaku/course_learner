// Debug page temporarily disabled due to Supabase removal

export default async function DebugQuizResults({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: attemptId } = await params;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Debug Quiz Results</h1>
      <p>Attempt ID: {attemptId}</p>
      <div style={{ color: "orange" }}>
        <h2>Notice:</h2>
        <p>Debug functionality temporarily disabled during API migration.</p>
      </div>
    </div>
  );
}
