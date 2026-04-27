<script lang="ts" setup>
defineProps<{
  message: string
  type?: 'info' | 'warning' | 'success'
}>()
</script>

<template>
  <transition name="tip-fade">
    <div
      class="flex flex-row items-start gap-2 rounded-lg py-2.5 px-3 mt-2 mb-2 text-sm"
      :class="{
        'bg-blue-50 text-blue-700': type === 'info' || !type,
        'bg-amber-50 text-amber-700': type === 'warning',
        'bg-green-50 text-green-700': type === 'success',
      }"
    >
      <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          v-if="type === 'warning'"
          stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
        <path
          v-else
          stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{{ message }}</span>
    </div>
  </transition>
</template>

<style scoped>
.tip-fade-enter-active,
.tip-fade-leave-active {
  transition: all 0.3s ease;
}
.tip-fade-enter-from,
.tip-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
