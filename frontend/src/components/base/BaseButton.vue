<template>
  <button
    :class="[
      'base-button',
      `variant-${variant}`,
      `size-${size}`,
      { 'is-loading': loading, 'is-block': block }
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="spinner"></span>
    <slot />
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  block?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  block: false
})

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: none;
  border-radius: var(--radius-lg);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-normal);
  white-space: nowrap;
}

.base-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Sizes */
.size-sm {
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
}

.size-md {
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-base);
}

.size-lg {
  padding: var(--space-4) var(--space-6);
  font-size: var(--font-size-lg);
}

/* Variants */
.variant-primary {
  background: var(--accent-primary);
  color: white;
}

.variant-primary:hover:not(:disabled) {
  background: var(--accent-primary-hover, #0891b2);
}

.variant-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.variant-secondary:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

.variant-danger {
  background: #fee2e2;
  color: #dc2626;
}

.variant-danger:hover:not(:disabled) {
  background: #fecaca;
}

.variant-ghost {
  background: transparent;
  color: var(--text-secondary);
}

.variant-ghost:hover:not(:disabled) {
  background: var(--bg-secondary);
}

/* Block */
.is-block {
  width: 100%;
}

/* Loading spinner */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
