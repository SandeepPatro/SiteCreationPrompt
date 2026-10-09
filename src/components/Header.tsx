export function Header() {
  return (
    <header className="px-4 pt-6 sm:pt-10">
      <div className="mx-auto flex max-w-[720px] flex-col gap-1">
        <p className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <img src="/favicon.svg" alt="" width="28" height="28" />
          PromptForge
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Turn your project idea into a detailed kickoff prompt for any AI coding agent.
        </p>
      </div>
    </header>
  );
}
