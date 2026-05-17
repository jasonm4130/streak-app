/**
 * Generic n-button toggle. Selected option highlighted in foam.
 * `value` of `undefined` = nothing selected.
 *
 * @example
 *   <ButtonGroup<SessionStatus>
 *     value={day.session}
 *     options={[
 *       { value: 'done',     label: 'done' },
 *       { value: 'modified', label: 'mod'  },
 *       { value: 'skipped',  label: 'skip' },
 *     ]}
 *     onChange={(v) => patch({ session: v })}
 *   />
 */
import styles from './ButtonGroup.module.css';

interface Option<T> {
  value: T;
  label: string;
}

interface ButtonGroupProps<T extends string> {
  value: T | undefined;
  options: Option<T>[];
  onChange: (v: T) => void;
}

export function ButtonGroup<T extends string>({
  value,
  options,
  onChange,
}: ButtonGroupProps<T>) {
  return (
    <div className={styles.group} role="group">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            data-testid={`bg-${opt.value}`}
            className={`${styles.btn} ${active ? styles.active : ''}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
