"use client"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface MonthlyTrendChartProps {
  data: { month: string; income: number; expense: number }[]
}

export default function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} stroke="#71717a" />
        <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} stroke="#71717a" />
        <Tooltip
          cursor={{ fill: "#18181b" }}
          contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "6px", color: "#f4f4f5", fontSize: "12px" }}
          itemStyle={{ color: "#f4f4f5" }}
        />
        <Bar dataKey="income" fill="#ffffff" radius={[2, 2, 0, 0]} />
        <Bar dataKey="expense" fill="#52525b" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
