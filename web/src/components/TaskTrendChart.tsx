import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

interface TaskTrendChartProps {
  data: Array<{ date: string; count: number }>
  title?: string
}

export default function TaskTrendChart({ data, title = '任务趋势' }: TaskTrendChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // 初始化图表
    const chart = echarts.init(chartRef.current)
    chartInstanceRef.current = chart

    // 清理函数
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
        confine: true,
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
        type: 'category',
        boundaryGap: false,
        data: data.map(item => item.date),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#64748b', width: 1 } },
        axisLabel: { color: '#94a3b8', fontSize: 12 },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#334155', type: 'dashed' } },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#64748b', width: 1 } },
        axisLabel: { color: '#94a3b8', fontSize: 12 },
      },
      series: [
        {
          name: '任务数',
          type: 'line',
          smooth: true,
          data: data.map(item => item.count),
          itemStyle: { color: '#6366f1' },
          lineStyle: { width: 3, color: '#6366f1' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(99, 102, 241, 0.3)' },
              { offset: 1, color: 'rgba(99, 102, 241, 0)' },
            ]),
          },
          smoothMonotone: 'x',
        },
      ],
      legend: {
        show: true,
        textStyle: { color: '#94a3b8' },
        top: 'top',
        left: 'center',
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
