import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

interface AgentActivityChartProps {
  data: Array<{ name: string; value: number }>
  title?: string
}

export default function AgentActivityChart({ data, title = 'Agent 活跃度' }: AgentActivityChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    const chart = echarts.init(chartRef.current)
    chartInstanceRef.current = chart

    return () => {
      chartInstanceRef.current?.dispose()
      chartInstanceRef.current = null
    }
  }, [])

  useEffect(() => {
    const chart = chartInstanceRef.current
    if (!chart || !data.length) return

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0' },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#64748b', width: 1 } },
        axisLabel: { color: '#94a3b8', fontSize: 12 },
        splitLine: { lineStyle: { color: '#334155', type: 'dashed' } },
      },
      yAxis: {
        type: 'category',
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#64748b', width: 1 } },
        axisLabel: { color: '#94a3b8', fontSize: 12 },
        inverse: true,
      },
      series: [
        {
          name: '活跃度',
          type: 'bar',
          data: data.map((item) => ({
            name: item.name,
            value: item.value,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [
                { offset: 0, color: '#10b981' },
                { offset: 1, color: '#3b82f6' },
              ]),
              borderRadius: [0, 4, 4, 0],
            },
          })),
          itemStyle: {
            barBorderRadius: [0, 4, 4, 0],
          },
        },
      ],
      legend: {
        show: false,
      },
    }

    chart.setOption(option)
  }, [data])

  return (
    <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      <div ref={chartRef} style={{ height: '300px', width: '100%' }} />
    </div>
  )
}
