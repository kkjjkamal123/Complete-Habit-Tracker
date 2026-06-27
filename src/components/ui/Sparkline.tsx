import type { AccentKey } from '../../lib/types';

/** Tiny inline trend line with a soft area fill. */
export default function Sparkline({
  data,
  color = 'accent',
  width = 132,
  height = 36,
}: {
  data: number[];
  color?: AccentKey;
  width?: number;
  height?: number;
}) {
  const max = Math.max(1, ...data);
  const n = data.length;
  const pts = data.map((v, i) => {
    const x = n > 1 ? (i / (n - 1)) * width : width;
    const y = height - (v / max) * (height - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `0,${height} ${line} ${width},${height}`;

  return (
    <svg
      className="spark"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ color: `var(--c-${color})` }}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <polygon points={area} fill="currentColor" opacity={0.14} />
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
