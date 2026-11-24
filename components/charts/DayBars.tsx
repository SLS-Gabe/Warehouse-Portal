import type { MetabaseRow } from "@/lib/metabase";

// A dependency-free single-series "by day" bar chart, rendered as inline SVG so
// it works in a server component. Expects rows shaped [day (ISO or YYYY-MM-DD),
// count]. Pass the column indexes if they differ.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function dayLabel(day: string) {
  const [, m, d] = day.split("-");
  return `${MONTHS[Number(m) - 1]} ${Number(d)}`;
}

function niceStep(raw: number): number {
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return Math.max(1, nice * pow);
}

function niceTicks(max: number, count: number): number[] {
  const step = niceStep(max / count);
  const ticks: number[] = [];
  for (let t = step; t <= max; t += step) ticks.push(t);
  return ticks;
}

export default function DayBars({
  rows,
  color = "#2e7d52",
  height = 180,
  dayIndex = 0,
  valueIndex = 1,
  unit = "",
}: {
  rows: MetabaseRow[];
  color?: string;
  height?: number;
  dayIndex?: number;
  valueIndex?: number;
  unit?: string;
}) {
  const data: { day: string; value: number }[] = [];
  for (const r of rows) {
    const day = String(r[dayIndex] ?? "").slice(0, 10);
    if (!day) continue;
    data.push({ day, value: Number(r[valueIndex] ?? 0) });
  }
  data.sort((a, b) => a.day.localeCompare(b.day));

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
  const barGap = 3;
  const n = data.length;
  const barW = Math.max(6, Math.min(26, Math.floor((640 - barGap * n) / n)));
  const chartW = n * (barW + barGap);
  const everyNth = Math.ceil(n / 7);

  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-card">
      <div className="flex">
        {/* Y axis */}
        <div
          className="relative mr-2 w-8 shrink-0 text-right text-[10px] text-text-light"
          style={{ height: H }}
        >
          {yTicks.map((t) => (
            <div
              key={t}
              className="absolute right-0 -translate-y-1/2 leading-none"
              style={{ top: H - (t / max) * H }}
            >
              {t.toLocaleString()}
            </div>
          ))}
        </div>

        {/* Plot */}
        <div className="min-w-0 flex-1 overflow-x-auto">
          <svg
            width={chartW}
            height={H + 26}
            viewBox={`0 0 ${chartW} ${H + 26}`}
            className="block"
            role="img"
            aria-label="Count by day"
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
              const x = i * (barW + barGap);
              return (
                <g key={d.day}>
                  <rect x={x} y={H - h} width={barW} height={h} rx={1.5} fill={color}>
                    <title>{`${dayLabel(d.day)}: ${d.value.toLocaleString()}${unit ? " " + unit : ""}`}</title>
                  </rect>
                  {i % everyNth === 0 && (
                    <text
                      x={x + barW / 2}
                      y={H + 16}
                      textAnchor="middle"
                      fontSize={9}
                      fill="#8a8a85"
                    >
                      {dayLabel(d.day)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
