import { useEffect, useRef, useState } from 'react';
import { Button } from '../components/Button';
import { CodeBox } from '../components/CodeBox';
import { StepHeading } from '../components/StepHeading';
import { copyText, downloadText, promptFilename } from '../lib/download';

type CopyState = 'idle' | 'copied' | 'failed';

export function Step3({ prompt, projectName }: { prompt: string; projectName: string }) {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const boxRef = useRef<HTMLPreElement>(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function handleCopy() {
    const ok = await copyText(prompt);
    setCopyState(ok ? 'copied' : 'failed');
    if (!ok && boxRef.current) {
      // Select the prompt so a manual Ctrl/Cmd + C copies exactly that.
      window.getSelection()?.selectAllChildren(boxRef.current);
      boxRef.current.focus();
    }
    clearTimeout(timer.current);
    // "Copied ✓" resets after 2s; the failure hint stays until the next attempt.
    if (ok) timer.current = setTimeout(() => setCopyState('idle'), 2000);
  }

  const filename = promptFilename(projectName);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <StepHeading>Your prompt</StepHeading>
        <p className="text-muted">
          Paste this as the first message to your AI coding agent (Claude Code, Cursor, Copilot…).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleCopy} className="min-w-28">
          {copyState === 'copied' ? 'Copied ✓' : 'Copy'}
        </Button>
        <Button variant="secondary" onClick={() => downloadText(filename, prompt)}>
          Download .md
        </Button>
      </div>

      <CodeBox ref={boxRef} text={prompt} label="Generated kickoff prompt" />

      <p aria-live="polite" className="text-muted text-sm">
        {copyState === 'copied' && <span className="sr-only">Prompt copied to clipboard.</span>}
        {copyState === 'failed' &&
          "Couldn't copy automatically — the prompt is selected, press Ctrl/Cmd + C to copy it."}
      </p>
    </div>
  );
}
