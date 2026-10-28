"use client";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { Analytics } from "@/types";
const tooltip = {
  background: "#101c31",
  border: "1px solid #334661",
  borderRadius: 10,
  color: "#f8fafc",
  fontSize: 12,
};
const colors = [
  "#38bdf8",
  "#8b5cf6",
  "#fb7185",
  "#fbbf24",
  "#34d399",
  "#818cf8",
];
export function ExecutionChart({ data }: { data: Analytics["trend"] }) {
  return (
    <div className="premium-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2}>
          <CartesianGrid
            vertical={false}
            stroke="#23334a"
            strokeDasharray="2 6"
          />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => v.slice(5)}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
            tick={{ fill: "#8395af", fontSize: 11 }}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            width={30}
            tick={{ fill: "#8395af", fontSize: 11 }}
          />
          <Tooltip contentStyle={tooltip} cursor={{ fill: "#7987ff0a" }} />
          <Bar
            name="Succeeded"
            dataKey="succeeded"
            fill="#238ffc"
            radius={[3, 3, 0, 0]}
          />
          <Bar
            name="Failed"
            dataKey="failed"
            fill="#a855f7"
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function StatusChart({ stats }: { stats: Analytics }) {
  const pending = Math.max(0, stats.runs - stats.succeeded - stats.failed);
  const data = [
    { name: "Succeeded", value: stats.succeeded },
    { name: "Failed", value: stats.failed },
    { name: "Other states", value: pending },
  ];
  return (
    <div className="status-chart">
      <div className="donut">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius="73%"
              outerRadius="93%"
              paddingAngle={3}
              stroke="none"
            >
              {data.map((x, i) => (
                <Cell
                  key={x.name}
                  fill={["#3b82f6", "#a855f7", "#f59e0b"][i]}
                />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltip} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center">
          <strong>{stats.success_rate}%</strong>
          <span>success rate</span>
        </div>
      </div>
      <div className="status-key">
        {data.map((d, i) => (
          <div key={d.name}>
            <i style={{ background: ["#3b82f6", "#a855f7", "#f59e0b"][i] }} />
            <span>{d.name}</span>
            <strong>{d.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
export function UsageChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="comparison-chart">
      {data.length ? (
        data.map((d, i) => (
          <div className="comparison-row" key={d.name}>
            <span title={d.name}>{d.name}</span>
            <div>
              <i
                style={{
                  width: `${(d.value / max) * 100}%`,
                  background: `linear-gradient(90deg,${colors[i % colors.length]},#7c3aed)`,
                }}
              />
            </div>
            <strong>{d.value}</strong>
          </div>
        ))
      ) : (
        <p className="chart-empty">
          Usage will appear after your first execution.
        </p>
      )}
    </div>
  );
}
export function Sparkline({ data }: { data: Analytics["trend"] }) {
  return (
    <div
      className="sparkline"
      aria-label="Execution volume over the last 14 days"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <Area
            type="monotone"
            dataKey="runs"
            stroke="currentColor"
            fill="currentColor"
            fillOpacity={0.08}
            strokeWidth={1.6}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
