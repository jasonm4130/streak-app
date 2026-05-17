/**
 * Free-text multi-line note input. Uses sans (Geist) — the only prose
 * surface in the app. Auto-grows to fit content; commits on blur.
 *
 * @example
 *   <NoteInput value={day.sessionNote} onChange={(v) => patch({ sessionNote: v })}
 *              placeholder="distance / pace / feel" />
 */
import { useEffect, useRef, useState } from 'react';
import styles from './NoteInput.module.css';

interface NoteInputProps {
  value: string | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function NoteInput({ value, onChange, placeholder }: NoteInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState<string>(value ?? '');

  useEffect(() => {
    setText(value ?? '');
  }, [value]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  return (
    <textarea
      ref={ref}
      rows={1}
      className={styles.input}
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onChange(text)}
    />
  );
}
