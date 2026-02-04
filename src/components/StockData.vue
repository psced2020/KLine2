<template>
  <div class="stock-data">
    <div class="data-row">
      <div class="data-item">
        <div class="label">现价</div>
        <div :class="['value', 'price', priceChangeClass]">{{ currentPrice }}</div>
      </div>
      <div v-if="stockName" class="stock-info-inline">
        <div class="stock-name">{{ stockName }}</div>
        <div v-if="stockDate" class="stock-date">{{ stockDate }}</div>
      </div>
      <div class="data-item">
        <div class="label">涨跌</div>
        <div :class="['value', priceChangeClass]">{{ priceChange }} ({{ priceChangePercent }}%)</div>
      </div>
    </div>
    <div class="data-grid">
      <div class="data-item">
        <div class="label">开盘</div>
        <div class="value">{{ openPrice }}</div>
      </div>
      <div class="data-item">
        <div class="label">最高</div>
        <div class="value">{{ highPrice }}</div>
      </div>
      <div class="data-item">
        <div class="label">最低</div>
        <div class="value">{{ lowPrice }}</div>
      </div>
      <div class="data-item">
        <div class="label">量比</div>
        <div class="value">{{ volumeRatioFormatted }}</div>
      </div>
    </div>
    <div class="data-row">
      <div class="data-item">
        <div class="label">MA10</div>
        <div class="value">{{ ma10Formatted }}</div>
      </div>
      <div class="data-item">
        <div class="label">MA20</div>
        <div class="value">{{ ma20Formatted }}</div>
      </div>
      <div class="data-item">
        <div class="label">MA60</div>
        <div class="value">{{ ma60Formatted }}</div>
      </div>
      <div class="data-item">
        <div class="label">换手</div>
        <div class="value">{{ turnoverRateFormatted }}%</div>
      </div>
    </div>
    <div class="data-row indicators">
      <div class="data-item">
        <div class="label">K</div>
        <div class="value kdj-k">{{ kdjFormatted.K }}</div>
      </div>
      <div class="data-item">
        <div class="label">D</div>
        <div class="value kdj-d">{{ kdjFormatted.D }}</div>
      </div>
      <div class="data-item">
        <div class="label">J</div>
        <div class="value kdj-j">{{ kdjFormatted.J }}</div>
      </div>
      <div class="data-item">
        <div class="label">VOL</div>
        <div class="value">{{ volume }}万</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface StockData {
  open: number
  close: number
  high: number
  low: number
  volume: number
}

interface Props {
  data: StockData
  ma10: number
  ma20: number
  ma60: number
  kdj: { K: number; D: number; J: number }
  volumeRatio: number
  turnoverRate: number
  stockName?: string
  stockDate?: string
}

const props = defineProps<Props>()

const currentPrice = computed(() => props.data.close.toFixed(2))
const priceChange = computed(() => (props.data.close - props.data.open).toFixed(2))
const priceChangePercent = computed(() =>
  (((props.data.close - props.data.open) / props.data.open) * 100).toFixed(2)
)
const priceChangeClass = computed(() => {
  const change = props.data.close - props.data.open
  if (change > 0) return 'up'
  if (change < 0) return 'down'
  return 'neutral'
})
const openPrice = computed(() => props.data.open.toFixed(2))
const highPrice = computed(() => props.data.high.toFixed(2))
const lowPrice = computed(() => props.data.low.toFixed(2))
const ma10Formatted = computed(() => props.ma10.toFixed(2))
const ma20Formatted = computed(() => props.ma20.toFixed(2))
const ma60Formatted = computed(() => props.ma60.toFixed(2))
const volumeRatioFormatted = computed(() => props.volumeRatio.toFixed(2))
const turnoverRateFormatted = computed(() => props.turnoverRate.toFixed(2))
const kdjFormatted = computed(() => ({
  K: props.kdj.K.toFixed(2),
  D: props.kdj.D.toFixed(2),
  J: props.kdj.J.toFixed(2)
}))
const volume = computed(() => (props.data.volume / 10000).toFixed(2))
</script>

<style scoped>
.stock-data {
  background: #fff;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}

.stock-info-inline {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 120px;
}

.stock-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.stock-date {
  font-size: 12px;
  color: #999;
}

.data-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 8px;
}

.data-row:last-child {
  margin-bottom: 0;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 12px;
}

.data-item {
  text-align: center;
}

.label {
  font-size: 11px;
  color: #999;
  margin-bottom: 4px;
}

.value {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.price {
  font-size: 20px;
  font-weight: 700;
}

.up {
  color: var(--price-red) !important;
}

.down {
  color: var(--price-green) !important;
}

.neutral {
  color: #666 !important;
}

.indicators .value {
  font-size: 12px;
}

.kdj-k {
  color: var(--price-red);
}

.kdj-d {
  color: #FFC107;
}

.kdj-j {
  color: var(--price-blue);
}
</style>
