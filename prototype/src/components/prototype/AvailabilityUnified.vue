<script lang="ts" setup>
import { computed } from 'vue'
import { type UnifiedCalendarConfig } from '../../data/mockCalendars'

const props = defineProps<{
  config: UnifiedCalendarConfig
}>()

const emit = defineEmits<{
  (e: 'update', config: Partial<UnifiedCalendarConfig>): void
}>()

const recurringLocked = computed(() => props.config.teamMembers.length > 1)

const hasNoHost = computed(() => props.config.teamMembers.length === 0)

function toggleRecurring() {
  if (recurringLocked.value) return
  emit('update', { enableRecurring: !props.config.enableRecurring })
}

function toggleDay(idx: number) {
  emit('update', {
    calendarAvailability: props.config.calendarAvailability.map((d, i) =>
      i === idx ? { ...d, enabled: !d.enabled } : d
    ),
  })
}

function setDayTime(idx: number, key: 'start' | 'end', value: string) {
  emit('update', {
    calendarAvailability: props.config.calendarAvailability.map((d, i) =>
      i === idx ? { ...d, [key]: value } : d
    ),
  })
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

function getAvatarColor(userId: string) {
  const colors = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626']
  const idx = parseInt(userId.replace('user-', '')) - 1
  return colors[idx % colors.length]
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-base font-semibold text-gray-900">Availability</h2>
      <p class="text-sm text-gray-500 mt-0.5">
        {{ hasNoHost
          ? 'No host on this calendar — set the schedule directly below.'
          : 'When each host is open to take bookings. Multi-host calendars use the intersection of host schedules.' }}
      </p>
    </div>

    <!-- Availability card. With hosts: list of per-host schedules. Without
         hosts (Event): inline weekly editor — there's no host whose schedule
         we could intersect, so the user sets it directly. -->
    <div class="bg-white border border-gray-200 rounded-xl p-5">
      <label class="text-sm font-medium text-gray-700 block mb-3">
        {{ hasNoHost ? 'Weekly availability' : 'Booking availability' }}
      </label>

      <!-- Per-host schedules -->
      <div v-if="!hasNoHost" class="space-y-2">
        <div
          v-for="member in config.teamMembers"
          :key="member.userId"
          class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer group"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-medium"
              :style="{ backgroundColor: getAvatarColor(member.userId) }"
            >
              {{ getInitials(member.userName) }}
            </div>
            <div>
              <div class="text-sm font-medium text-gray-900">{{ member.userName }}</div>
              <div class="text-xs text-gray-500">Weekdays, 7:00 AM to 5:00 PM</div>
            </div>
          </div>
          <svg class="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      <!-- Calendar-level weekly editor (0 hosts). 7 day rows, each with toggle +
           start/end time. Direct config — no host, no intersection. -->
      <div v-else class="space-y-1.5">
        <div
          v-for="(day, idx) in config.calendarAvailability"
          :key="day.day"
          class="flex items-center gap-3 px-3 py-2 border border-gray-200 rounded-lg"
        >
          <!-- Day toggle -->
          <button
            type="button"
            class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0"
            :class="day.enabled ? 'bg-primary-600' : 'bg-gray-200'"
            @click="toggleDay(idx)"
          >
            <span
              class="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm"
              :class="day.enabled ? 'translate-x-5' : 'translate-x-1'"
            />
          </button>
          <span class="text-sm font-medium w-10 flex-shrink-0" :class="day.enabled ? 'text-gray-900' : 'text-gray-400'">
            {{ day.day }}
          </span>
          <template v-if="day.enabled">
            <input
              type="time"
              :value="day.start"
              @input="setDayTime(idx, 'start', ($event.target as HTMLInputElement).value)"
              class="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white"
            />
            <span class="text-xs text-gray-400">to</span>
            <input
              type="time"
              :value="day.end"
              @input="setDayTime(idx, 'end', ($event.target as HTMLInputElement).value)"
              class="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white"
            />
          </template>
          <span v-else class="text-xs text-gray-400 italic">Closed</span>
        </div>
        <p class="text-xs text-gray-500 mt-2">
          Bookers can register for this event during the days and times you mark above. Time zone is set on the booker's side.
        </p>
      </div>
    </div>

    <!-- Recurring Meeting -->
    <div class="bg-white border border-gray-200 rounded-xl p-5">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <label class="text-sm font-medium text-gray-700 block" :class="{ 'text-gray-400': recurringLocked }">Recurring meeting</label>
          <p v-if="recurringLocked" class="text-xs text-gray-500 mt-1 leading-snug">
            Available with one host only.
            <span class="text-gray-400">Remove additional hosts on the Staff &amp; assignment tab to enable recurring.</span>
          </p>
        </div>
        <button
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
          :class="recurringLocked
            ? 'bg-gray-100 cursor-not-allowed'
            : (config.enableRecurring ? 'bg-primary-600' : 'bg-gray-200')"
          :disabled="recurringLocked"
          :title="recurringLocked ? 'Recurring works with a single host only' : ''"
          @click="toggleRecurring"
        >
          <span
            class="inline-block h-4 w-4 rounded-full transition-transform shadow-sm"
            :class="[
              recurringLocked ? 'bg-gray-300' : 'bg-white',
              config.enableRecurring && !recurringLocked ? 'translate-x-6' : 'translate-x-1',
            ]"
          />
        </button>
      </div>

      <transition name="section-slide">
        <div v-if="config.enableRecurring && !recurringLocked" class="mt-4 pt-4 border-t border-gray-100">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-medium text-gray-600 block mb-1">Repeat frequency</label>
              <select
                :value="config.recurringFrequency"
                @change="emit('update', { recurringFrequency: ($event.target as HTMLSelectElement).value })"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-600 block mb-1">Times to repeat</label>
              <div class="flex items-center gap-2">
                <button
                  class="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50"
                  @click="emit('update', { recurringCount: Math.max(1, config.recurringCount - 1) })"
                >-</button>
                <input
                  type="number"
                  :value="config.recurringCount"
                  @input="emit('update', { recurringCount: parseInt(($event.target as HTMLInputElement).value) || 1 })"
                  class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center"
                  min="1"
                />
                <button
                  class="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50"
                  @click="emit('update', { recurringCount: config.recurringCount + 1 })"
                >+</button>
              </div>
            </div>
          </div>
          <p class="text-xs text-primary-600 mt-2">
            Every {{ config.recurringFrequency === 'DAILY' ? 'Day' : config.recurringFrequency === 'WEEKLY' ? 'Week' : 'Month' }}
            For {{ config.recurringCount }} Time{{ config.recurringCount > 1 ? 's' : '' }}
          </p>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.section-slide-enter-active,
.section-slide-leave-active {
  transition: all 0.3s ease;
}
.section-slide-enter-from,
.section-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
