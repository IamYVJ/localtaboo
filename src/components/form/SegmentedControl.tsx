interface Segment<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  segments: Segment<T>[];
  onChange: (value: T) => void;
}

/** A small set of mutually exclusive options rendered as a toggle group. */
export function SegmentedControl<T extends string>({
  label,
  value,
  segments,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="wl-segmented" role="group" aria-label={label}>
      {segments.map((seg) => (
        <button
          key={seg.value}
          type="button"
          className="wl-segmented__item"
          aria-pressed={value === seg.value}
          onClick={() => onChange(seg.value)}
        >
          {seg.label}
        </button>
      ))}
    </div>
  );
}
