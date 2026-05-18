/**
 * Onboarding screen: two-step capture of body weight then marathon date,
 * shown by `App` when no settings row exists. Writes the initial `Settings`
 * singleton to Dexie on completion.
 */
import { useState } from 'react';
import { db } from '../db';
import { DEFAULT_SETTINGS, DEFAULT_MARATHON_DATE } from '../types';
import { NumberInput } from '../components/NumberInput';
import styles from './Onboarding.module.css';

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
    <div className={styles.page}>
      <h1 className={styles.title}>streak</h1>

      {step === 'weight' && (
        <section>
          <p className={styles.hint}>
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
            className={`${styles.actionButton} ${weight ? styles.ready : ''}`}
          >
            continue →
          </button>
        </section>
      )}

      {step === 'marathon' && (
        <section>
          <p className={styles.hint}>
            Marathon date (default: 2026 Sydney Marathon).
          </p>
          <input
            type="date"
            value={marathon}
            onChange={(e) => setMarathon(e.target.value)}
            className={styles.dateInput}
          />
          <button
            onClick={finish}
            data-testid="onboarding-done"
            className={`${styles.actionButton} ${styles.ready} ${styles.doneButton}`}
          >
            done →
          </button>
        </section>
      )}
    </div>
  );
}
