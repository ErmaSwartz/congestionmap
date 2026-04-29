import type { Act } from '../types';

const ITEMS: { id: Act; label: string }[] = [
  { id: 'hero', label: 'The switch' },
  { id: 'pickup', label: 'Where pickups grew' },
  { id: 'rings', label: 'The ripple' },
  { id: 'gwr', label: 'Local effects' },
  { id: 'bridges', label: 'Bridges' },
  { id: 'coda', label: 'Takeaways' },
];

interface Props {
  active: Act;
  onJump: (id: Act) => void;
}

export function ProgressRail({ active, onJump }: Props) {
  return (
    <nav className="progress-rail" aria-label="Section navigation">
      {ITEMS.map((item, i) => (
        <button
          key={item.id}
          className={item.id === active ? 'active' : ''}
          onClick={() => onJump(item.id)}
          aria-current={item.id === active ? 'true' : undefined}
        >
          0{i} · {item.label}
        </button>
      ))}
    </nav>
  );
}
