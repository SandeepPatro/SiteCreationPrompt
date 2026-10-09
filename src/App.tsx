import { useEffect, useReducer, useRef } from 'react';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { ProgressBar } from './components/ProgressBar';
import { initialWizardState, progressStep, wizardReducer } from './state/wizardReducer';
import { Step1, STEP1_FORM_ID } from './steps/Step1';
import { Step2, STEP2_FORM_ID } from './steps/Step2';
import { Step3 } from './steps/Step3';

export default function App() {
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);
  const { phase } = state;

  // Move focus to the step heading whenever the phase changes (not on first load).
  const lastPhase = useRef(phase);
  useEffect(() => {
    if (lastPhase.current === phase) return;
    lastPhase.current = phase;
    document.querySelector<HTMLElement>('[data-step-heading]')?.focus();
  }, [phase]);

  // TODO(M5): replace with the real /api/followups request + fallback.
  useEffect(() => {
    if (phase !== 'loading') return;
    const timer = setTimeout(() => dispatch({ type: 'questionsLoaded' }), 800);
    return () => clearTimeout(timer);
  }, [phase]);

  function startOver() {
    // TODO(M7): replace with an accessible confirmation dialog.
    if (window.confirm('Start over? This clears all your answers.'))
      dispatch({ type: 'startOver' });
  }

  const step = progressStep(phase);

  return (
    <div className="flex min-h-dvh flex-col bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header />
      <main className="flex-1 px-4 py-6 sm:py-8">
        <div className="mx-auto w-full max-w-[720px]">
          <Card
            stepKey={phase === 'loading' ? 'step2-loading' : phase}
            progress={<ProgressBar current={step} />}
            footer={
              <>
                {step > 1 ? (
                  <Button variant="secondary" onClick={() => dispatch({ type: 'back' })}>
                    ← Back
                  </Button>
                ) : (
                  <span />
                )}
                {step === 1 && (
                  <Button type="submit" form={STEP1_FORM_ID}>
                    Next →
                  </Button>
                )}
                {step === 2 && (
                  <Button type="submit" form={STEP2_FORM_ID} disabled={phase === 'loading'}>
                    Next →
                  </Button>
                )}
                {step === 3 && (
                  <Button variant="secondary" onClick={startOver}>
                    Start over
                  </Button>
                )}
              </>
            }
          >
            {phase === 'step1' && (
              <Step1
                defaultValues={state.step1Form}
                onSubmit={(form, answers) => dispatch({ type: 'step1Submitted', form, answers })}
              />
            )}
            {(phase === 'loading' || phase === 'step2') && (
              <Step2
                loading={phase === 'loading'}
                onSubmit={() => dispatch({ type: 'step2Submitted' })}
              />
            )}
            {phase === 'step3' && <Step3 />}
          </Card>
        </div>
      </main>
      <Footer />
      <p aria-live="polite" className="sr-only">
        {phase === 'loading' ? 'Thinking about your project…' : ''}
      </p>
    </div>
  );
}
