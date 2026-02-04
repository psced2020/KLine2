<template>
  <div class="trade-stats">
    <div class="stats-row">
      <div class="stat-item">
        <div class="stat-label">钱数</div>
        <div class="stat-value">{{ formatMoney(stats.money) }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">股数</div>
        <div class="stat-value">{{ stats.shares }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">买入价</div>
        <div class="stat-value">{{ stats.buyPrice.toFixed(2) }}</div>
      </div>
    </div>
    <div class="stats-row">
      <div class="stat-item">
        <div class="stat-label">本局收益</div>
        <div :class="['stat-value', stats.currentReturn >= 0 ? 'positive' : 'negative']">
          {{ stats.currentReturn >= 0 ? '+' : '' }}{{ stats.currentReturn.toFixed(2) }}%
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-label">开仓收益</div>
        <div :class="['stat-value', stats.positionReturn >= 0 ? 'positive' : 'negative']">
          {{ stats.positionReturn >= 0 ? '+' : '' }}{{ stats.positionReturn.toFixed(2) }}%
        </div>
      </div>
    </div>
    <div class="stats-row">
      <div class="stat-item">
        <div class="stat-label">用时</div>
        <div class="stat-value">{{ elapsedTime }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">剩余K线</div>
        <div class="stat-value">{{ remainingBars }}根</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TradeStats {
  money: number
  shares: number
  buyPrice: number
  currentReturn: number
  positionReturn: number
}

interface Props {
  stats: TradeStats
  elapsedTime: string
  remainingBars: number
}

const props = defineProps<Props>()

function formatMoney(value: number): string {
  if (value >= 10000) {
    return (value / 10000).toFixed(2) + '万'
  }
  return value.toFixed(2)
}
</script>

<style scoped>
.trade-stats {
  background: var(--primary-purple);
  color: #fff;
  padding: 12px 16px;
}

.stats-row {
  display: flex;
  justify-content: space-around;
  gap: 16px;
  margin-bottom: 12px;
}

.stats-row:last-child {
  margin-bottom: 0;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-label {
  font-size: 11px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 15px;
  font-weight: 600;
}

.positive {
  color: #81C784;
}

.negative {
  color: #FF8A65;
}
</style>
