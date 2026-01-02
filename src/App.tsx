export default function App() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Job Genie – Dev Preview</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This preview exists only to satisfy the web build. Extension code lives in
          <code className="mx-1 rounded bg-muted px-1 py-0.5">ats-tailor-extension2.0/</code>
          and <code className="mx-1 rounded bg-muted px-1 py-0.5">chrome-extension/</code>.
        </p>
      </div>
    </main>
  );
}
