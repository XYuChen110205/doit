<template>
  <div
    :class="[
      'base-card',
      { 'is-hoverable': hoverable, 'is-compact': compact }
    ]"
    :style="customStyles"
  >
    <div v-if="$slots.header || title" class="card-header">
      <slot name="header">
        <h3 class="card-title">{{ title }}</h3>
        <p v-if="subtitle" class="card-subtitle">{{ subtitle }}</p>
      </slot>
    </div>
    <div class="card-body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title?: string
  subtitle?: string
  hoverable?: boolean
  compact?: boolean
  borderColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  hoverable: false,
  compact: false
})

const customStyles = computed(() => {
  if (props.borderColor) {
    return { borderLeft: `4px solid ${props.borderColor}` }
  }
  return {}
})
</script>

<style scoped>
.base-card {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card);
  transition: var(--transition-normal);
}

.base-card.is-hoverable:hover {
  box-shadow: var(--shadow-hover);
}

.card-header {
  padding: var(--space-4) var(--space-4) 0;
}

.card-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.card-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: var(--space-1) 0 0;
}

.card-body {
  padding: var(--space-4);
}

.is-compact .card-body {
  padding: var(--space-3);
}

.card-footer {
  padding: 0 var(--space-4) var(--space-4);
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
}
</style>
