import { useState } from 'react';
import { db } from '../db';
import { DEFAULT_SETTINGS, DEFAULT_MARATHON_DATE } from '../types';
import { NumberInput } from '../components/NumberInput';

type Step = 'weight' | 'marathon';

export function Onboarding() {
  const [step, setStep] = useState<Step>('weight');
  const [weight, setWeight] = useState<number | undefined>(undefined);
  const [marathon, setMarathon] = useState<string>(DEFAULT_MARATHON_DATE);

  async function finish() {
    if (weight === undefined || weight <= 0) return;
    await db.settings.put({
      ...DEFAULT_SETTINGS,
      bodyWeightKg: weight,
      marathonDate: marathon,
    });
  }

  return (
    <div style={{ padding: 'var(--space-5)', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ font: 'inherit', fontSize: 18, marginBottom: 'var(--space-4)' }}>streak</h1>

      {step === 'weight' && (
        <section>
          <p style={{ color: 'var(--fg-muted)', marginBottom: 'var(--space-3)' }}>
            Body weight in kg — drives the protein target.
          </p>
          <NumberInput
            value={weight}
            onChange={setWeight}
            placeholder="kg"
            step={0.1}
            min={20}
            max={300}
            suffix="kg"
            data-testid="onboarding-weight"
          />
          <button
            disabled={weight === undefined || weight <= 0}
            onClick={() => setStep('marathon')}
            data-testid="onboarding-continue"
            style={{
              marginTop: 'var(--space-4)',
              padding: 'var(--space-3) var(--space-4)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              color: weight ? 'var(--green)' : 'var(--fg-muted)',
            }}
          >
            continue →
          </button>
        </section>
      )}

      {step === 'marathon' && (
        <section>
          <p style={{ color: 'var(--fg-muted)', marginBottom: 'var(--space-3)' }}>
            Marathon date (default: 2026 Sydney Marathon).
          </p>
          <input
            type="date"
            value={marathon}
            onChange={(e) => setMarathon(e.target.value)}
            style={{
              background: 'var(--bg-elev)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              padding: 'var(--space-3)',
              color: 'var(--fg)',
              minHeight: 'var(--tap)',
            }}
          />
          <button
            onClick={finish}
            data-testid="onboarding-done"
            style={{
              marginTop: 'var(--space-4)',
              padding: 'var(--space-3) var(--space-4)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              color: 'var(--green)',
              display: 'block',
            }}
          >
            done →
          </button>
        </section>
      )}
    </div>
  );
}
