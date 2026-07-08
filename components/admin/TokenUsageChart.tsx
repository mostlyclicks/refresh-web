'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export interface TokenUsageDay {
  date: string // "MMM D" label
  input: number
  output: number
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const input = payload.find((p: any) => p.dataKey === 'input')?.value ?? 0
  const output = payload.find((p: any) => p.dataKey === 'output')?.value ?? 0
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs"
      style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)' }}
    >
      <p className="text-slate-300 font-medium mb-1">{label}</p>
      <p className="text-slate-400">Input: <span className="text-slate-200">{input.toLocaleString('en-US')}</span></p>
      <p className="text-slate-400">Output: <span className="text-slate-200">{output.toLocaleString('en-US')}</span></p>
      <p className="text-slate-400">Total: <span className="text-slate-200">{(input + output).toLocaleString('en-US')}</span></p>
    </div>
  )
}

export default function TokenUsageChart({ data }: { data: TokenUsageDay[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
          tickLine={false}
          interval={4}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Bar dataKey="input" stackId="tokens" fill="#3B82F6" radius={[0, 0, 0, 0]} />
        <Bar dataKey="output" stackId="tokens" fill="#60A5FA" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
