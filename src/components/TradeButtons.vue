<template>
  <div class="trade-buttons">
    <button
      :class="['trade-button', 'buy']"
      @click="handleBuy"
    >
      买入
    </button>
    <button class="trade-button watch" @click="handleWatch">
      观望
    </button>
    <button
      :class="['trade-button', 'sell']"
      @click="handleSell"
    >
      卖出
    </button>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  buy: []
  sell: []
  watch: []
}>()

function handleBuy() {
  emit('buy')
}

function handleSell() {
  emit('sell')
}

function handleWatch() {
  emit('watch')
}
</script>

<style scoped>
.trade-buttons {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.trade-button {
  flex: 1;
  padding: 14px 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s;
}

.buy {
  background: linear-gradient(135deg, #FF3D00, #FF5722);
  color: #fff;
}

.buy:hover {
  background: linear-gradient(135deg, #FF5722, #FF7043);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 61, 0, 0.3);
}

.watch {
  background: linear-gradient(135deg, #2196F3, #42A5F5);
  color: #fff;
}

.watch:hover {
  background: linear-gradient(135deg, #42A5F5, #64B5F6);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.sell {
  background: linear-gradient(135deg, #4CAF50, #66BB6A);
  color: #fff;
}

.sell:hover {
  background: linear-gradient(135deg, #66BB6A, #81C784);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}
</style>
