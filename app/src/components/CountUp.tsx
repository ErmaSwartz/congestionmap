import { useEffect, useRef, useState } from 'react';

interface Props {
  to: number;
  durationMs?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  active: boolean; // animate only when in view
  reduceMotion?: boolean;
}

export function CountUp({ to, durationMs = 1200, decimals = 2, suffix = '', prefix = '', active, reduceMotion }: Props) {
  const [val, setVal] = useState(reduceMotion ? to : 0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!active || startedRef.current) return;
    if (reduceMotion) {
      setVal(to);
      startedRef.current = true;
      return;
    }
    startedRef.current = true;
    const start = performance.now();
    let raf: number;
    const tick = (t: number) => {
      const dt = Math.min(1, (t - start) / durationMs);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - dt, 3);
      setVal(to * eased);
      if (dt < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, to, durationMs, reduceMotion]);

  const display = (val >= 0 ? '+' : '') + val.toFixed(decimals);
  return <span className="num">{prefix}{display}{suffix}</span>;
}
