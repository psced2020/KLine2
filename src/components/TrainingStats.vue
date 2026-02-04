<template>
  <div class="training-stats">
    <div class="stats-row">
      <div class="stat-item">
        <div class="stat-label">爆竹数</div>
        <div class="stat-value">{{ stats.candleCount }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">仓位</div>
        <div class="stat-value">{{ stats.position }}/{{ stats.maxPosition }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">最大回撤</div>
        <div class="stat-value">{{ stats.maxDrawdown }}%</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">盈亏比</div>
        <div class="stat-value">{{ stats.winLossRatio }}%</div>
      </div>
    </div>
    <div class="stats-row">
      <div class="stat-item">
        <div class="stat-label">本局收益</div>
        <div :class="['stat-value', stats.currentReturn >= 0 ? 'positive' : 'negative']">
          {{ stats.currentReturn }}%
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-label">开仓收益</div>
        <div :class="['stat-value', stats.positionReturn >= 0 ? 'positive' : 'negative']">
          {{ stats.positionReturn }}%
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TrainingStats {
  candleCount: number
  position: number
  maxPosition: number
  maxDrawdown: number
  winLossRatio: number
  currentReturn: number
  positionReturn: number
}

interface Props {
  stats: TrainingStats
}

defineProps<Props>()
</script>

<style scoped>
.training-stats {
  background: var(--primary-purple);
  color: #fff;
  padding: 16px;
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
  font-size: 14px;
  font-weight: 600;
}

.positive {
  color: #81C784;
}

.negative {
  color: #FF8A65;
}
</style>
