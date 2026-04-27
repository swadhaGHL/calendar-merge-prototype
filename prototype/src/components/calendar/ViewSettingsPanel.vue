<script lang="ts" setup>
import { ref } from 'vue'
import { useAppSettings, verticalLabels } from '../../composables/useAppSettings'

defineEmits<{ (e: 'close'): void }>()
const { enabledVerticals, toggleVertical, isMultiVertical } = useAppSettings()

const timeInterval = ref('30min')
const layout = ref('top')
const workingHoursStart = ref('8 AM')
const workingHoursEnd = ref('9 PM')
</script>

<template>
  <div class="w-[320px] bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
    <div class="p-4">
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-sm font-semibold text-gray-900">View Settings</h3>
        <button class="text-gray-400 hover:text-gray-600" @click="$emit('close')">✕</button>
      </div>

      <!-- Time Interval -->
      <div class="mb-6">
        <div class="flex items-center gap-1.5 mb-2">
          <svg class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          <span class="text-xs font-semibold text-gray-700 uppercase tracking-wide">Time Interval</span>
        </div>
        <div class="flex bg-gray-100 rounded-lg p-0.5">
          <button
            v-for="opt in [{ label: '15 min', value: '15min' }, { label: '30 min', value: '30min' }, { label: '1 hour', value: '1hr' }]"
            :key="opt.value"
            class="flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
            :class="timeInterval === opt.value ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            @click="timeInterval = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Layout -->
      <div class="mb-6">
        <div class="flex items-center gap-1.5 mb-2">
          <svg class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="9" x2="9" y2="21"/></svg>
          <span class="text-xs font-semibold text-gray-700 uppercase tracking-wide">Layout</span>
        </div>
        <div class="space-y-2">
          <label
            class="flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors"
            :class="layout === 'top' ? 'border-primary-300 bg-primary-25' : 'border-gray-200 hover:border-gray-300'"
          >
            <input type="radio" value="top" v-model="layout" class="mt-0.5 w-4 h-4 text-primary-600">
            <div>
              <div class="text-xs font-medium text-gray-900 flex items-center gap-1.5">
                <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="9" x2="9" y2="21"/></svg>
                Resources on Top
              </div>
              <div class="text-[10px] text-gray-500 mt-0.5">Time slots on the left, resources arranged horizontally across columns</div>
            </div>
          </label>
          <label
            class="flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors"
            :class="layout === 'left' ? 'border-primary-300 bg-primary-25' : 'border-gray-200 hover:border-gray-300'"
          >
            <input type="radio" value="left" v-model="layout" class="mt-0.5 w-4 h-4 text-primary-600">
            <div>
              <div class="text-xs font-medium text-gray-900 flex items-center gap-1.5">
                <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="9" y1="9" x2="21" y2="9"/></svg>
                Resources on Left
              </div>
              <div class="text-[10px] text-gray-500 mt-0.5">Resources stacked vertically on the left, time slots run horizontally</div>
            </div>
          </label>
        </div>
      </div>

      <!-- Visible Verticals -->
      <div v-if="isMultiVertical" class="mb-6">
        <div class="flex items-center gap-1.5 mb-2">
          <svg class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          <span class="text-xs font-semibold text-gray-700 uppercase tracking-wide">Visible Verticals</span>
        </div>
        <div class="space-y-3">
          <div v-for="v in (['meetings', 'services', 'rentals'] as const)" :key="v" class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-2.5 h-2.5 rounded-full" :class="v === 'meetings' ? 'bg-blue-500' : v === 'services' ? 'bg-emerald-500' : 'bg-purple-500'"></div>
              <span class="text-sm text-gray-700">{{ verticalLabels[v] }}</span>
            </div>
            <button
              class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
              :class="enabledVerticals.includes(v) ? 'bg-primary-600' : 'bg-gray-200'"
              @click="toggleVertical(v)"
            >
              <span class="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm" :class="enabledVerticals.includes(v) ? 'translate-x-4.5' : 'translate-x-0.5'"/>
            </button>
          </div>
        </div>
      </div>

      <!-- Working Hours -->
      <div>
        <div class="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Working Hours</div>
        <div class="flex items-center gap-2">
          <select v-model="workingHoursStart" class="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5">
            <option v-for="h in ['6 AM','7 AM','8 AM','9 AM','10 AM']" :key="h" :value="h">{{ h }}</option>
          </select>
          <span class="text-xs text-gray-400">to</span>
          <select v-model="workingHoursEnd" class="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5">
            <option v-for="h in ['5 PM','6 PM','7 PM','8 PM','9 PM','10 PM']" :key="h" :value="h">{{ h }}</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>
