/**
 * Right-aligned mono numeric input. Optional suffix (h, kg, g) shown muted.
 * Empty input → calls onChange(undefined) so the consumer can distinguish
 * "not logged" from "logged as 0".
 *
 * @example
 *   <NumberInput value={day.sleepHours} onChange={(n) => patch({ sleepHours: n })}
 *                step={0.25} min={0} max={16} suffix="h" />
 */
import { useState } from 'react';
import styles from './NumberInput.module.css';

interface NumberInputProps {
  value: number | undefined;
  onChange: (n: number | undefined) => void;
  placeholder?: string;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  'data-testid'?: string;
}

export function NumberInput({
  value,
  onChange,
  placeholder,
  step = 1,
  min,
  max,
  suffix,
  ...rest
}: NumberInputProps) {
  // Keep a local string so users can type things like "7." without snapping to 7.
  // Mirror `value` into local state during render (React's recommended
  // "adjusting state on prop change" pattern) — avoids the cascading-render
  // hazard of doing this in useEffect.
  const [text, setText] = useState<string>(value === undefined ? '' : String(value));
  const [lastValue, setLastValue] = useState<number | undefined>(value);
  if (value !== lastValue) {
    setLastValue(value);
    setText(value === undefined ? '' : String(value));
  }

  function commit(raw: string) {
    if (raw.trim() === '') {
      onChange(undefined);
      return;
    }
    const n = Number(raw);
    if (Number.isNaN(n)) return;
    onChange(n);
  }

  return (
    <span className={styles.wrap}>
      <input
        className={styles.input}
        type="number"
        inputMode="decimal"
        value={text}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        data-testid={rest['data-testid']}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
      />
      {suffix && <span className={styles.suffix}>{suffix}</span>}
    </span>
  );
}
