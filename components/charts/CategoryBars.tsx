// Dependency-free categorical bar chart (inline SVG, server component). For
// hour-of-day, day-of-week, or weekly series where the x axis is labels rather
// than parseable dates. Pass data already shaped as {label, value}.

function niceStep(raw: number): number {
  const pow = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const n = (raw || 1) / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return Math.max(1, nice * pow);
}

function niceTicks(max: number, count: number): number[] {
  const step = niceStep(max / count);
  const ticks: number[] = [];
  for (let t = step; t <= max; t += step) ticks.push(t);
  return ticks;
}

export default function CategoryBars({
  data,
  color = "#2e7d52",
  height = 170,
  format = (n: number) => n.toLocaleString(),
  yAxisWidth = 32,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  format?: (n: number) => string;
  yAxisWidth?: number;
}) {
  if (data.length === 0) {
    return (
      <div className="rounded-card border border-border bg-surface p-6 text-center text-[12.5px] text-text-light shadow-card">
        No data for this range.
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const yTicks = niceTicks(max, 3);

  const H = height;
  const n = data.length;
  const slot = Math.max(18, Math.min(64, Math.floor(620 / n)));
  const barW = Math.round(slot * 0.62);
  const chartW = n * slot;

  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-card">
      <div className="flex">
        <div
          className="relative mr-2 shrink-0 text-right text-[10px] text-text-light"
          style={{ height: H, width: yAxisWidth }}
        >
          {yTicks.map((t) => (
            <div
              key={t}
              className="absolute right-0 -translate-y-1/2 leading-none"
              style={{ top: H - (t / max) * H }}
            >
              {format(t)}
            </div>
          ))}
        </div>

        <div className="min-w-0 flex-1 overflow-x-auto">
          <svg
            width={chartW}
            height={H + 24}
            viewBox={`0 0 ${chartW} ${H + 24}`}
            className="block"
            role="img"
            aria-label="Bar chart"
          >
            {yTicks.map((t) => (
              <line
                key={t}
                x1={0}
                x2={chartW}
                y1={H - (t / max) * H}
                y2={H - (t / max) * H}
                stroke="#e4e4e0"
                strokeWidth={1}
              />
            ))}
            {data.map((d, i) => {
              const h = (d.value / max) * H;
              const x = i * slot + (slot - barW) / 2;
              return (
                <g key={`${d.label}-${i}`}>
                  <rect x={x} y={H - h} width={barW} height={h} rx={2} fill={color}>
                    <title>{`${d.label}: ${format(d.value)}`}</title>
                  </rect>
                  <text
                    x={i * slot + slot / 2}
                    y={H + 15}
                    textAnchor="middle"
                    fontSize={9.5}
                    fill="#8a8a85"
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
