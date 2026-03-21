import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

interface TaskDistributionChartProps {
  data: Array<{ name: string; value: number }>
  title?: string
}

export default function TaskDistributionChart({ data, title = '任务分布' }: TaskDistributionChartProps) {
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
        trigger: 'item',
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0' },
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'center',
        itemWidth: 12,
        itemHeight: 12,
        textStyle: { color: '#94a3b8', fontSize: 12 },
      },
      series: [
        {
          name: '任务类型',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#0f172a',
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
              color: '#e2e8f0',
            },
          },
          labelLine: {
            show: false,
          },
          data: data.map((item, index) => ({
            name: item.name,
            value: item.value,
            itemStyle: {
              color: getChartColor(index),
            },
          })),
        },
      ],
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

function getChartColor(index: number): string {
  const colors = [
    '#6366f1', // indigo
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ec4899', // pink
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#14b8a6', // teal
    '#f97316', // orange
  ]
  return colors[index % colors.length]
}
