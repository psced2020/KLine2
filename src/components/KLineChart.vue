<template>
  <div class="kline-chart">
    <div class="period-tabs">
      <div
        v-for="period in periods"
        :key="period"
        :class="['period-tab', { active: currentPeriod === period }]"
        @click="changePeriod(period)"
      >
        {{ period }}
      </div>
    </div>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'

interface StockData {
  date: string
  open: number
  close: number
  high: number
  low: number
  volume: number
}

interface Props {
  data: StockData[]
  currentIndex?: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  periodChange: [period: string]
}>()

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

const periods = ['日K', '周K', '月K']
const currentPeriod = ref('日K')

// 计算均线
function calculateMA(data: StockData[], dayCount: number): (number | null)[] {
  const ma: (number | null)[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < dayCount - 1) {
      ma.push(null) // 前19天设为null，不绘制
    } else {
      let sum = 0
      for (let j = 0; j < dayCount; j++) {
        sum += data[i - j].close
      }
      ma.push(sum / dayCount)
    }
  }
  return ma
}

// 计算KDJ
function calculateKDJ(data: StockData[]) {
  const K: number[] = []
  const D: number[] = []
  const J: number[] = []
  const n = 9

  for (let i = 0; i < data.length; i++) {
    let high = -Infinity
    let low = Infinity
    const startIndex = Math.max(0, i - n + 1)

    for (let j = startIndex; j <= i; j++) {
      high = Math.max(high, data[j].high)
      low = Math.min(low, data[j].low)
    }

    const RSV = high === low ? 50 : ((data[i].close - low) / (high - low)) * 100

    if (i === 0) {
      K.push(RSV / 3 + 50)
      D.push(RSV / 3 + 50)
    } else {
      K.push(RSV / 3 + K[i - 1] * (2 / 3))
      D.push(K[i] / 3 + D[i - 1] * (2 / 3))
    }
    J.push(3 * K[i] - 2 * D[i])
  }

  return { K, D, J }
}

function initChart() {
  if (!chartRef.value) return

  chart = echarts.init(chartRef.value)
  renderChart()
  window.addEventListener('resize', handleResize)
}

function renderChart() {
  if (!chart || !props.data.length) return

  // 只显示到当前索引的数据
  const displayIndex = props.currentIndex ?? props.data.length - 1
  const displayData = props.data.slice(0, displayIndex + 1)

  const dates = displayData.map((item) => item.date)
  const values = displayData.map((item) => [item.open, item.close, item.low, item.high])
  const volumes = displayData.map((item, index) => [index, item.volume, item.open > item.close ? 1 : -1])

  const { K, D, J } = calculateKDJ(displayData)
  const ma20 = calculateMA(displayData, 20)

  // 计算默认显示最近60根K线，如果数据量少于60则显示全部
  const defaultVisibleCount = 60
  const dataCount = displayData.length
  const zoomStart = dataCount > defaultVisibleCount
    ? Math.round((1 - defaultVisibleCount / dataCount) * 100)
    : 0

  const option: echarts.EChartsOption = {
    grid: [
      { left: '10%', right: '10%', top: '10%', height: '40%' },
      { left: '10%', right: '10%', top: '55%', height: '15%' },
      { left: '10%', right: '10%', top: '75%', height: '18%' }
    ],
    xAxis: [
      {
        type: 'category',
        data: dates,
        gridIndex: 0,
        axisLine: { lineStyle: { color: '#ddd' } },
        axisLabel: { show: false }
      },
      {
        type: 'category',
        data: dates,
        gridIndex: 1,
        axisLine: { lineStyle: { color: '#ddd' } },
        axisLabel: { show: false }
      },
      {
        type: 'category',
        data: dates,
        gridIndex: 2,
        axisLine: { lineStyle: { color: '#ddd' } },
        axisLabel: {
          color: '#666',
          fontSize: 11
        }
      }
    ],
    yAxis: [
      {
        scale: true,
        gridIndex: 0,
        splitNumber: 5,
        axisLine: { lineStyle: { color: '#ddd' } },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: {
          color: '#666',
          formatter: (value: number) => value.toFixed(2)
        }
      },
      {
        scale: true,
        gridIndex: 1,
        splitNumber: 2,
        axisLine: { lineStyle: { color: '#ddd' } },
        splitLine: { show: false },
        axisLabel: { show: false }
      },
      {
        scale: true,
        gridIndex: 2,
        splitNumber: 4,
        min: -20,
        max: 120,
        axisLine: { lineStyle: { color: '#ddd' } },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: {
          color: '#666'
        }
      }
    ],
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: [0, 1, 2],
        start: zoomStart,
        end: 100
      }
    ],
    series: [
      {
        name: 'K线',
        type: 'candlestick',
        data: values,
        itemStyle: {
          color: '#00C853',
          color0: '#FF3D00',
          borderColor: '#00C853',
          borderColor0: '#FF3D00'
        }
      },
      {
        name: 'MA20',
        type: 'line',
        data: ma20,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#2196F3', width: 1.5 }
      },
      {
        name: '成交量',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: volumes,
        itemStyle: {
          color: (params: any) => (params.data[2] === 1 ? '#00C853' : '#FF3D00')
        }
      },
      {
        name: 'K',
        type: 'line',
        xAxisIndex: 2,
        yAxisIndex: 2,
        data: K,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#2196F3', width: 1.5 }
      },
      {
        name: 'D',
        type: 'line',
        xAxisIndex: 2,
        yAxisIndex: 2,
        data: D,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#FFC107', width: 1.5 }
      },
      {
        name: 'J',
        type: 'line',
        xAxisIndex: 2,
        yAxisIndex: 2,
        data: J,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#FF3D00', width: 1.5 }
      }
    ]
  }

  // 使用 notMerge: false 来平滑更新，避免闪烁
  chart.setOption(option, { notMerge: false })
}

function handleResize() {
  chart?.resize()
}

function changePeriod(period: string) {
  currentPeriod.value = period
  emit('periodChange', period)
}

watch(() => props.data, () => {
  renderChart()
}, { deep: true })

watch(() => props.currentIndex, () => {
  renderChart()
})

onMounted(() => {
  initChart()
})

onUnmounted(() => {
  chart?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.kline-chart {
  background: #fff;
}

.period-tabs {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid #eee;
}

.period-tab {
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}

.period-tab.active {
  background: var(--primary-purple);
  color: #fff;
}

.period-tab:hover:not(.active) {
  background: #f0f0f0;
}

.chart-container {
  width: 100%;
  height: 450px;
}
</style>
