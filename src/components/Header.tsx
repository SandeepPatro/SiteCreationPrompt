export function Header() {
  return (
    <header className="px-4 pt-6 sm:pt-10">
      <div className="mx-auto flex max-w-[720px] flex-col gap-1.5">
        <h1 className="font-display text-ink flex items-center gap-2.5 text-[20px] leading-none font-bold">
          <picture>
            <source srcSet="/logo-mark-dark.svg" media="(prefers-color-scheme: dark)" />
            <img src="/logo-mark.svg" alt="" width="32" height="32" />
          </picture>
          PromptForge
        </h1>
        <p className="text-muted text-sm">
          Turn your project idea into a detailed kickoff prompt for any AI coding agent.
        </p>
      </div>
    </header>
  );
}
