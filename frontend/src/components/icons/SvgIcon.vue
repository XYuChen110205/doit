<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="['svg-icon', customClass]"
  >
    <component :is="iconComponent" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import * as icons from './index'

interface Props {
  name: string
  size?: number | string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 24,
  class: ''
})

const iconComponent = computed(() => {
  return (icons as Record<string, any>)[props.name + 'Icon'] || null
})

const customClass = computed(() => props.class)
</script>

<style scoped>
.svg-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
