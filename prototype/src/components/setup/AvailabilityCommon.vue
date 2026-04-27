<script lang="ts" setup>
import { ref } from 'vue'
import { useAppSettings, verticalLabels } from '../../composables/useAppSettings'

const { enabledVerticals } = useAppSettings()

const activeVerticalTab = ref(enabledVerticals.value[0])
const activeSchedule = ref('default')
const selectedUser = ref('swadha-bhoj')

interface DaySchedule {
  day: string
  short: string
  enabled: boolean
  start: string
  end: string
}

const weeklyHours = ref<DaySchedule[]>([
  { day: 'Sunday', short: 'Sun', enabled: false, start: '09:00 AM', end: '05:00 PM' },
  { day: 'Monday', short: 'Mon', enabled: true, start: '09:00 AM', end: '05:00 PM' },
  { day: 'Tuesday', short: 'Tue', enabled: true, start: '09:00 AM', end: '05:00 PM' },
  { day: 'Wednesday', short: 'Wed', enabled: true, start: '09:00 AM', end: '05:00 PM' },
  { day: 'Thursday', short: 'Thu', enabled: true, start: '09:00 AM', end: '05:00 PM' },
  { day: 'Friday', short: 'Fri', enabled: true, start: '09:00 AM', end: '05:00 PM' },
  { day: 'Saturday', short: 'Sat', enabled: false, start: '09:00 AM', end: '05:00 PM' },
])

const schedules = [
  { key: 'default', label: 'Default' },
  { key: 'evening', label: 'Evening' },
  { key: 'saturdays', label: 'Saturdays' },
]
</script>

<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-base font-semibold text-gray-900">Availability</h2>
      <p class="text-xs text-gray-500 mt-1">Define when you are available for bookings. Set weekly working hours, named schedules, and date-specific overrides.</p>
    </div>

    <!-- Vertical Sub-tabs -->
    <div class="flex items-center gap-1 mb-6 bg-gray-100 rounded-lg p-0.5 w-fit">
      <button
        v-for="v in enabledVerticals"
        :key="v"
        class="px-4 py-1.5 text-xs font-medium rounded-md transition-colors"
        :class="activeVerticalTab === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
        @click="activeVerticalTab = v"
      >
        {{ verticalLabels[v] }}
      </button>
    </div>

    <div class="grid grid-cols-[280px_1fr] gap-6">
      <!-- Left: Schedule Config -->
      <div class="space-y-5">
        <!-- User selector -->
        <div>
          <label class="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Schedule For</label>
          <select
            v-model="selectedUser"
            class="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 pr-8 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="swadha-bhoj">Swadha Bhoj (Me)</option>
            <option value="john-doe">John Doe</option>
            <option value="sarah-chen">Sarah Chen</option>
          </select>
        </div>

        <!-- Named Schedules -->
        <div>
          <label class="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Schedules</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="s in schedules"
              :key="s.key"
              class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors"
              :class="activeSchedule === s.key
                ? 'bg-primary-50 text-primary-700 border-primary-200'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'"
              @click="activeSchedule = s.key"
            >
              {{ s.label }}
            </button>
            <button class="px-3 py-1.5 text-xs font-medium text-primary-600 border border-dashed border-primary-300 rounded-lg hover:bg-primary-50 transition-colors">
              + Create Schedule
            </button>
          </div>
        </div>

        <!-- Active On -->
        <div>
          <label class="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Active On</label>
          <button class="w-full flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
            <span>2 calendars</span>
            <svg class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>

        <!-- Timezone -->
        <div>
          <label class="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Timezone</label>
          <div class="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700">
            GMT+05:30 Asia/Calcutta (IST)
          </div>
        </div>
      </div>

      <!-- Right: Weekly Hours -->
      <div class="bg-white border border-gray-200 rounded-xl">
        <div class="px-5 py-4 border-b border-gray-100">
          <h3 class="text-sm font-semibold text-gray-900">Weekly Working Hours</h3>
          <p class="text-[10px] text-gray-500 mt-0.5">Set your recurring weekly availability. These hours repeat every week.</p>
        </div>
        <div class="divide-y divide-gray-100">
          <div
            v-for="day in weeklyHours"
            :key="day.day"
            class="px-5 py-3 flex items-center gap-4"
          >
            <!-- Checkbox -->
            <label class="flex items-center gap-2.5 w-28 flex-shrink-0 cursor-pointer">
              <input
                type="checkbox"
                v-model="day.enabled"
                class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
              />
              <span class="text-xs font-medium" :class="day.enabled ? 'text-gray-900' : 'text-gray-400'">{{ day.day }}</span>
            </label>

            <!-- Time Range or Unavailable -->
            <div v-if="day.enabled" class="flex items-center gap-2">
              <select
                v-model="day.start"
                class="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 pr-7 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option>09:00 AM</option>
                <option>09:30 AM</option>
                <option>10:00 AM</option>
                <option>10:30 AM</option>
                <option>11:00 AM</option>
                <option>11:30 AM</option>
                <option>12:00 PM</option>
                <option>12:30 PM</option>
                <option>01:00 PM</option>
              </select>
              <span class="text-xs text-gray-400">to</span>
              <select
                v-model="day.end"
                class="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 pr-7 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option>03:00 PM</option>
                <option>03:30 PM</option>
                <option>04:00 PM</option>
                <option>04:30 PM</option>
                <option>05:00 PM</option>
                <option>05:30 PM</option>
                <option>06:00 PM</option>
                <option>06:30 PM</option>
                <option>07:00 PM</option>
                <option>08:00 PM</option>
                <option>09:00 PM</option>
              </select>
              <button class="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors" title="Copy to all days">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </button>
            </div>
            <div v-else class="flex items-center">
              <span class="text-xs text-gray-400 italic">Unavailable</span>
            </div>
          </div>
        </div>

        <!-- Date-Specific Hours -->
        <div class="px-5 py-4 border-t border-gray-100">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h4 class="text-xs font-semibold text-gray-900">Date-Specific Hours</h4>
              <p class="text-[10px] text-gray-500 mt-0.5">Override your availability for specific dates (holidays, special events, etc.)</p>
            </div>
            <button class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
              Add
            </button>
          </div>
          <div class="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">
            No date-specific hours configured
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
