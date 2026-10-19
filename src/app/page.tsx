export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background font-sans">
      <h1 className="op-wordmark text-4xl sm:text-5xl">Once-Pay</h1>
      <p className="mt-4 max-w-sm text-center text-lg text-zinc-600 dark:text-zinc-400">
        Pay once, done.
      </p>
      <p className="mt-8 font-mono text-sm text-brand-primary">
        Next 16 · React 19 · Tailwind v4 · Albert Sans
      </p>
    </div>
  );
}