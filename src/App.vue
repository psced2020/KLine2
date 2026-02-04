<template>
  <div class="app">
    <HeaderBar
      status="进行中"
    />

    <div class="settings-panel">
      <div class="input-row">
        <label>股票代码:</label>
        <input v-model="stockCode" placeholder="例如: 600519" />
      </div>
      <div class="input-row">
        <label>开始日期:</label>
        <input type="date" v-model="startDate" />
      </div>
      <button class="load-btn" @click="loadStockData()" :disabled="loading">
        {{ loading ? '加载中...' : '加载数据' }}
      </button>
      <p class="hint">加载开始日期前500根历史数据 + 之后的所有K线</p>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </div>

    <StockData
      v-if="stockData.length > 0"
      :data="currentData"
      :ma10="ma10"
      :ma20="ma20"
      :ma60="ma60"
      :kdj="kdj"
      :volume-ratio="volumeRatio"
      :turnover-rate="turnoverRate"
      :stock-name="stockName"
      :stock-date="formattedCurrentDate"
    />

    <KLineChart
      v-if="stockData.length > 0"
      :data="stockData"
      :current-index="currentIndex"
      @period-change="handlePeriodChange"
    />

    <TradeButtons
      v-if="stockData.length > 0"
      @buy="handleBuy"
      @sell="handleSell"
      @watch="handleWatch"
    />

    <TradeStats
      v-if="stockData.length > 0"
      :stats="tradeStats"
      :elapsed-time="elapsedTime"
      :remaining-bars="remainingBars"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import HeaderBar from './components/HeaderBar.vue'
import StockData from './components/StockData.vue'
import KLineChart from './components/KLineChart.vue'
import TradeButtons from './components/TradeButtons.vue'
import TradeStats from './components/TradeStats.vue'

interface StockDataItem {
  date: string
  open: number
  close: number
  high: number
  low: number
  volume: number
}

// 设置
const stockCode = ref('600519')
const apiToken = ref('2b7204344e061fb9bc01c82fd69620c9cdef75fb84ce41dfd2380b5f')
const stockName = ref('')
const currentDate = ref('')
const currentPeriod = ref('日K')
const trainingDate = ref('')

// 星期数组
const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

// 获取日期的星期几
function getWeekDay(dateStr: string): string {
  // 将 YYYYMMDD 格式转换为 YYYY-MM-DD
  const formattedDate = dateStr.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')
  const date = new Date(formattedDate)
  return weekDays[date.getDay()]
}

// 带星期的日期格式
const formattedCurrentDate = computed(() => {
  if (!currentDate.value) return ''
  return `${currentDate.value} ${getWeekDay(currentDate.value)}`
})

// 本地存储所有周期的数据
const allPeriodData = ref<Record<string, StockDataItem[]>>({})

// 默认开始日期
const today = new Date()
const defaultStart = new Date(today)
defaultStart.setDate(today.getDate() - 150)
const startDate = ref(defaultStart.toISOString().split('T')[0])
const trainingDays = ref(100)
const loading = ref(false)
const errorMessage = ref('')

// 股票数据
const stockData = ref<StockDataItem[]>([])
const currentIndex = ref(0)

const currentData = computed(() => stockData.value[currentIndex.value])

// 指标
const ma10 = ref(0)
const ma20 = ref(0)
const ma60 = ref(0)
const kdj = ref({ K: 0, D: 0, J: 0 })
const volumeRatio = ref(0)
const turnoverRate = ref(0)

// 状态
const elapsedTime = ref('5秒')
const remainingBars = ref(0)

// 交易统计
const tradeStats = ref({
  money: 200000,
  shares: 0,
  buyPrice: 0,
  currentReturn: 0,
  positionReturn: 0
})

// 格式化日期
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 计算均线
function calculateMA(data: StockDataItem[], dayCount: number, index: number): number {
  if (index < dayCount - 1) return 0
  let sum = 0
  for (let i = 0; i < dayCount; i++) {
    sum += data[index - i].close
  }
  return sum / dayCount
}

// 计算KDJ
function calculateKDJ(data: StockDataItem[], index: number) {
  const n = 9
  let high = -Infinity
  let low = Infinity
  const startIndex = Math.max(0, index - n + 1)

  for (let i = startIndex; i <= index; i++) {
    high = Math.max(high, data[i].high)
    low = Math.min(low, data[i].low)
  }

  const RSV = high === low ? 50 : ((data[index].close - low) / (high - low)) * 100

  let K, D
  if (index === 0) {
    K = RSV / 3 + 50
    D = RSV / 3 + 50
  } else {
    const prevKDJ = calculateKDJ(data, index - 1)
    K = RSV / 3 + prevKDJ.K * (2 / 3)
    D = K / 3 + prevKDJ.D * (2 / 3)
  }

  const J = 3 * K - 2 * D

  return { K, D, J }
}

// 更新当前数据指标
function updateIndicators() {
  if (!stockData.value.length || currentIndex.value >= stockData.value.length) return

  const idx = currentIndex.value

  ma10.value = calculateMA(stockData.value, 10, idx)
  ma20.value = calculateMA(stockData.value, 20, idx)
  ma60.value = calculateMA(stockData.value, 60, idx)

  const kdjData = calculateKDJ(stockData.value, idx)
  kdj.value = kdjData

  if (idx > 0) {
    const avgVolume = stockData.value.slice(Math.max(0, idx - 5), idx)
      .reduce((sum, d) => sum + d.volume, 0) / Math.min(5, idx)
    volumeRatio.value = avgVolume > 0 ? stockData.value[idx].volume / avgVolume : 0
    turnoverRate.value = (stockData.value[idx].volume / 1000000000 * 100)
  }
}

// 加载股票数据（使用本地数据源）
async function loadStockData() {
  console.log('loadStockData 被调用，股票代码:', stockCode.value, '开始日期:', startDate.value)

  loading.value = true
  errorMessage.value = ''

  try {
    // 从本地服务器获取数据
    const response = await fetch(`http://localhost:3001/api/stock?code=${stockCode.value}`)

    if (!response.ok) {
      throw new Error('获取数据失败')
    }

    const result = await response.json()

    console.log('本地数据响应:', result)

    if (!result.success || !result.data) {
      throw new Error(result.error || '未获取到股票数据')
    }

    const data: StockDataItem[] = result.data
    console.log('本地数据条数:', data.length)

    if (data.length === 0) {
      throw new Error('未获取到股票数据')
    }

    // 数据已经是按日期排序的
    allPeriodData.value = {
      '日K': data,
      '周K': [],
      '月K': []
    }

    stockData.value = data

    // 将开始日期转换为 YYYYMMDD 格式用于比较
    const startDateFormatted = startDate.value.replace(/-/g, '')

    // 在数据中找到开始日期对应的索引位置
    let startIndex = data.findIndex((item) => item.date === startDateFormatted)
    if (startIndex === -1) {
      for (let i = 0; i < data.length; i++) {
        if (data[i].date >= startDateFormatted) {
          startIndex = i
          break
        }
      }
    }

    console.log('开始日期:', startDate.value, '格式化后:', startDateFormatted, '对应索引:', startIndex)

    // 计算历史数据的结束位置
    const historyEndIndex = Math.min(startIndex, data.length - 1)

    // 初始显示到历史数据的最后位置
    currentIndex.value = historyEndIndex
    console.log('设置初始位置:', historyEndIndex)

    // 更新训练日期
    if (currentIndex.value >= 0 && currentIndex.value < data.length) {
      trainingDate.value = data[currentIndex.value].date
    }

    remainingBars.value = data.length - currentIndex.value - 1

    // 从股票信息中提取股票名称（格式：代码 名称 周期 复权方式）
    if (result.stockName) {
      const parts = result.stockName.split(/\s+/)
      stockName.value = parts.length >= 2 ? parts[1] : stockCode.value
    } else {
      stockName.value = stockCode.value
    }

    // 重置交易统计
    tradeStats.value = {
      money: 200000,
      shares: 0,
      buyPrice: 0,
      currentReturn: 0,
      positionReturn: 0
    }

    // 重置计时
    elapsedTime.value = '5秒'

    console.log('数据加载完成，总条数:', data.length)
  } catch (error: any) {
    console.error('加载失败:', error)
    errorMessage.value = '加载失败: ' + (error.message || '请检查本地服务器是否运行')
  } finally {
    loading.value = false
  }
}

// 加载数据（观望时新增）
function handleWatch() {
  console.log('观望')
  if (currentIndex.value < stockData.value.length - 1) {
    currentIndex.value++
    remainingBars.value = stockData.value.length - currentIndex.value
    trainingDate.value = stockData.value[currentIndex.value].date
    updateIndicators()
  }
}

function handlePeriodChange(period: string) {
  console.log('切换周期:', period, '当前训练日期:', trainingDate.value)
  if (currentPeriod.value !== period) {
    if (period !== '日K') {
      console.log('周K和月K暂未实现')
      return
    }
    currentPeriod.value = period
  }
}

function handleBuy() {
  console.log('买入', currentData.value.close)
  if (tradeStats.value.money > 0 && tradeStats.value.shares === 0 && currentData.value) {
    const pricePerLot = currentData.value.close * 100
    const lots = Math.floor(tradeStats.value.money / pricePerLot)
    const shares = lots * 100
    tradeStats.value.shares = shares
    tradeStats.value.buyPrice = currentData.value.close
    tradeStats.value.money = tradeStats.value.money - shares * currentData.value.close
    console.log(`买入成功: ${shares}股, 价格: ${currentData.value.close}, 花费: ${shares * currentData.value.close}`)
  }
}

function handleSell() {
  console.log('卖出', currentData.value.close)
  if (tradeStats.value.shares > 0 && currentData.value) {
    tradeStats.value.money = tradeStats.value.money + tradeStats.value.shares * currentData.value.close
    tradeStats.value.shares = 0
    tradeStats.value.buyPrice = 0
  }
}

// 计算收益率
function calculateReturns() {
  if (!currentData.value || currentData.value.close <= 0) return

  const totalValue = tradeStats.value.money + tradeStats.value.shares * currentData.value.close
  const initialMoney = 200000
  tradeStats.value.currentReturn = ((totalValue - initialMoney) / initialMoney) * 100

  if (tradeStats.value.shares > 0 && tradeStats.value.buyPrice > 0) {
    tradeStats.value.positionReturn = ((currentData.value.close - tradeStats.value.buyPrice) / tradeStats.value.buyPrice) * 100
  } else {
    tradeStats.value.positionReturn = 0
  }
}

// 监听价格变化，更新收益率
watch(currentData, () => {
  calculateReturns()
  currentDate.value = currentData.value?.date || ''
})

// 监听股票代码变化，清空缓存
watch(stockCode, () => {
  console.log('股票代码变化，清空缓存')
  allPeriodData.value = {}
  trainingDate.value = ''
  stockData.value = []
})

// 时间计时
let timer: number | null = null
onMounted(() => {
  timer = window.setInterval(() => {
    const seconds = parseInt(elapsedTime.value) || 5
    elapsedTime.value = `${seconds + 1}秒`
  }, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.app {
  max-width: 480px;
  margin: 0 auto;
  background: var(--bg-light);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.settings-panel {
  background: #fff;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.input-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 10px;
}

.input-row label {
  width: 90px;
  font-size: 14px;
  color: #666;
}

.input-row input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.load-btn {
  width: 100%;
  padding: 12px;
  background: var(--primary-purple);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.2s;
}

.load-btn:hover:not(:disabled) {
  background: var(--dark-purple);
}

.load-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: #999;
  text-align: center;
}

.error {
  margin: 12px 0 0;
  font-size: 14px;
  color: var(--price-red);
  text-align: center;
}
</style>
