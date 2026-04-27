<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useAppSettings, verticalColors, verticalLabels } from '../composables/useAppSettings'
import type { Vertical } from '../composables/useAppSettings'
import { mockAppointments, mockResources, type Appointment } from '../data/mockAppointments'
import WeekView from '../components/calendar/WeekView.vue'
import DayView from '../components/calendar/DayView.vue'
import MonthView from '../components/calendar/MonthView.vue'
import ListView from '../components/calendar/ListView.vue'
import FiltersPanel from '../components/calendar/FiltersPanel.vue'
import ViewSettingsPanel from '../components/calendar/ViewSettingsPanel.vue'

const { enabledVerticals, isSingleVertical, isMultiVertical } = useAppSettings()

const viewMode = ref<'calendar' | 'list'>('calendar')
const calendarMode = ref<'day' | 'week' | 'month'>('week')
const selectedVertical = ref<Vertical | 'all'>('all')
const showFilters = ref(false)
const showViewSettings = ref(false)

// Date navigation
const currentDate = ref(new Date())
const weekStart = computed(() => {
  const d = new Date(currentDate.value)
  d.setDate(d.getDate() - d.getDay() + 1)
  return d
})
const weekEnd = computed(() => {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() + 6)
  return d
})
const dateRangeLabel = computed(() => {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  const s = weekStart.value.toLocaleDateString('en-US', opts)
  const e = weekEnd.value.toLocaleDateString('en-US', { ...opts, year: 'numeric' })
  return `${s} – ${e}`
})

function prevWeek() {
  const d = new Date(currentDate.value)
  d.setDate(d.getDate() - 7)
  currentDate.value = d
}
function nextWeek() {
  const d = new Date(currentDate.value)
  d.setDate(d.getDate() + 7)
  currentDate.value = d
}
function goToday() {
  currentDate.value = new Date()
}

// Filtered appointments
const filteredAppointments = computed(() => {
  let apts = mockAppointments.filter(a => enabledVerticals.value.includes(a.vertical))
  if (selectedVertical.value !== 'all') {
    apts = apts.filter(a => a.vertical === selectedVertical.value)
  }
  return apts
})

const activeFilterCount = computed(() => {
  let count = 0
  if (enabledVerticals.value.length < 3) count += 3 - enabledVerticals.value.length
  return count || 25 // mock filter count
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Toolbar — matches GHL ToolBar.vue pattern -->
    <nav class="flex justify-between px-4 py-3 items-center bg-white border-b border-gray-200 flex-shrink-0">
      <div class="flex items-center gap-4">
        <!-- Calendar / List toggle — GHL segment tab style -->
        <div class="flex bg-gray-100 rounded-lg p-0.5">
          <button
            class="px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1.5 transition-colors"
            :class="viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            @click="viewMode = 'calendar'"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Calendar
          </button>
          <button
            class="px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1.5 transition-colors"
            :class="viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            @click="viewMode = 'list'"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            List
          </button>
        </div>

        <!-- Date Navigation — GHL inline-flex border group -->
        <template v-if="viewMode === 'calendar'">
          <div class="inline-flex border border-gray-300 rounded-md">
            <button class="p-2 border-r border-gray-200 hover:bg-gray-50 transition-colors" @click="prevWeek">
              <svg class="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button class="p-2 hover:bg-gray-50 transition-colors" @click="nextWeek">
              <svg class="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
          <button class="px-4 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" @click="goToday">Today</button>
          <p class="text-lg font-semibold text-gray-800">{{ dateRangeLabel }}</p>
        </template>
      </div>

      <div class="flex items-center gap-3">
        <!-- Verticals Dropdown (multi-vertical only) -->
        <div v-if="isMultiVertical && viewMode === 'calendar'" class="relative">
          <select
            v-model="selectedVertical"
            class="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
          >
            <option value="all">📅 All Verticals</option>
            <option v-for="v in enabledVerticals" :key="v" :value="v">
              {{ v === 'meetings' ? '💻' : v === 'services' ? '✂️' : '🏠' }} {{ verticalLabels[v] }}
            </option>
          </select>
        </div>

        <!-- Day / Week / Month — GHL UITabs segment style -->
        <div v-if="viewMode === 'calendar'" class="flex bg-gray-100 rounded-lg p-0.5">
          <button
            v-for="mode in ([{ key: 'day', label: 'Day' }, { key: 'week', label: 'Week' }, { key: 'month', label: 'Month' }] as const)"
            :key="mode.key"
            class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
            :class="calendarMode === mode.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            @click="calendarMode = mode.key"
          >
            {{ mode.label }}
          </button>
        </div>

        <!-- Filters -->
        <button
          class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors"
          :class="showFilters ? 'bg-primary-600 text-white border-primary-600' : 'text-gray-700 border-gray-300 hover:bg-gray-50'"
          @click="showFilters = !showFilters; showViewSettings = false"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
          Filters
          <span class="bg-primary-100 text-primary-700 text-[10px] px-1.5 rounded-full font-bold">{{ activeFilterCount }}</span>
        </button>

        <!-- View Settings -->
        <button
          v-if="viewMode === 'calendar'"
          class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors"
          :class="showViewSettings ? 'bg-primary-600 text-white border-primary-600' : 'text-gray-700 border-gray-300 hover:bg-gray-50'"
          @click="showViewSettings = !showViewSettings; showFilters = false"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          View Settings
        </button>
      </div>
    </nav>

    <!-- Main Content Area -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Calendar/List Content -->
      <div class="flex-1 overflow-auto">
        <template v-if="viewMode === 'calendar'">
          <WeekView
            v-if="calendarMode === 'week'"
            :appointments="filteredAppointments"
            :week-start="weekStart"
            :is-multi-vertical="isMultiVertical"
          />
          <DayView
            v-else-if="calendarMode === 'day'"
            :appointments="filteredAppointments"
            :current-date="currentDate"
            :is-multi-vertical="isMultiVertical"
          />
          <MonthView
            v-else
            :appointments="filteredAppointments"
            :current-date="currentDate"
            :is-multi-vertical="isMultiVertical"
          />
        </template>
        <ListView v-else :appointments="filteredAppointments" :is-multi-vertical="isMultiVertical" />
      </div>

      <!-- Right Panels (Filters / View Settings) -->
      <transition name="panel-slide">
        <FiltersPanel v-if="showFilters" @close="showFilters = false" />
      </transition>
      <transition name="panel-slide">
        <ViewSettingsPanel v-if="showViewSettings" @close="showViewSettings = false" />
      </transition>
    </div>
  </div>
</template>

<style scoped>
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: all 0.2s ease;
}
.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
