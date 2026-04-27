<script lang="ts" setup>
import { computed } from 'vue'
import { type UnifiedCalendarConfig } from '../../data/mockCalendars'

const props = defineProps<{
  config: UnifiedCalendarConfig
  derivedType: string
}>()

defineEmits<{
  (e: 'close'): void
}>()

const cfg = computed(() => props.config)
const hostCount = computed(() => cfg.value.teamMembers.length)
const isMultiHost = computed(() => hostCount.value > 1)
const isCollective = computed(() => cfg.value.assignmentStrategy === 'collective')
const isMixed = computed(() => cfg.value.assignmentStrategy === 'mixed')
const isRotate = computed(() => cfg.value.assignmentStrategy === 'rotate')
const isShared = computed(() => cfg.value.bookingBehavior === 'shared' && cfg.value.seatsPerSlot > 1)
const owner = computed(() => cfg.value.teamMembers.find(m => m.isPrimary))

const strategyLabel = computed(() => {
  if (!isMultiHost.value) return null
  if (isCollective.value) return 'all members attend'
  if (isMixed.value) return 'mixed (required + rotating pool)'
  return 'rotating'
})

const distLabel = computed(() => {
  if (!isMultiHost.value || isCollective.value) return null
  return cfg.value.rotationOptimization === 'equal_distribution' ? 'equal distribution' : 'maximise availability'
})

const capacityLabel = computed(() => {
  const seats = cfg.value.seatsPerSlot
  const hosts = cfg.value.teamMembers.length
  const multi = hosts > 1
  const strategy = cfg.value.assignmentStrategy
  if (seats <= 1) return '1 booking per slot'

  if (cfg.value.bookingBehavior === 'shared') {
    if (multi && (strategy === 'collective' || strategy === 'mixed')) {
      return `${hosts} hosts in one shared class — up to ${seats} attendees per slot`
    }
    return multi
      ? `${hosts} hosts each running a class of ${seats} (up to ${seats * hosts} total attendees per slot)`
      : `group session — up to ${seats} attendees`
  }
  return multi
    ? `${hosts} hosts × ${seats} parallel bookings (up to ${seats * hosts} total per slot)`
    : `up to ${seats} parallel bookings per slot`
})

const durationLabel = computed(() => {
  const opts = cfg.value.durationOptions ?? []
  if (opts.length <= 1) {
    const o = opts[0] ?? { value: cfg.value.meetingDuration, unit: cfg.value.meetingDurationUnit }
    return `${o.value} ${o.unit}`
  }
  return opts.map(o => `${o.value} ${o.unit}`).join(' / ') + ' (booker picks)'
})

// Logic-affecting toggles, only show when ON
const toggles = computed(() => {
  const out: string[] = []
  if (cfg.value.enableBookerStaffSelection) out.push('Booker can pick their host')
  if (cfg.value.alwaysBookWithAssignedUser && isMultiHost.value) out.push('Returning contacts route to assigned user')
  if (cfg.value.reschedulePreference === 'keep_owner' && isRotate.value && isMultiHost.value) out.push('Reschedules keep the same host')
  if (cfg.value.showSeatsToBookers && isShared.value) out.push('Booker sees remaining seats')
  if (cfg.value.enableRecurring) out.push(`Recurring (${cfg.value.recurringFrequency.toLowerCase()} × ${cfg.value.recurringCount})`)
  return out
})
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl shadow-xl w-[380px] overflow-hidden">
    <!-- Header -->
    <div class="bg-gradient-to-br from-primary-50 to-blue-50 border-b border-primary-100 px-4 py-3">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-[10px] uppercase tracking-wider text-primary-700 font-semibold">Runs as</div>
          <div class="text-sm font-bold text-gray-900">{{ derivedType }}</div>
        </div>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-600 p-1 -mr-1"
          @click="$emit('close')"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Logic facts -->
    <div class="p-4 space-y-3">
      <!-- Hosts -->
      <div class="flex items-start gap-2 text-xs">
        <svg class="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
        </svg>
        <div class="text-gray-700">
          <span v-if="hostCount === 0">No hosts (open event)</span>
          <span v-else-if="hostCount === 1">1 host — {{ cfg.teamMembers[0].userName }}</span>
          <span v-else>{{ hostCount }} hosts<span v-if="strategyLabel">, {{ strategyLabel }}</span></span>
          <div v-if="(isCollective || isMixed) && owner" class="text-[10px] text-gray-500 mt-0.5">
            Owner: {{ owner.userName }} · others as followers
          </div>
        </div>
      </div>

      <!-- Distribution -->
      <div v-if="distLabel" class="flex items-start gap-2 text-xs">
        <svg class="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
        <div class="text-gray-700">Distribution: {{ distLabel }}</div>
      </div>

      <!-- Capacity -->
      <div class="flex items-start gap-2 text-xs">
        <svg class="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
        <div class="text-gray-700">{{ capacityLabel }}</div>
      </div>

      <!-- Duration -->
      <div class="flex items-start gap-2 text-xs">
        <svg class="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <div class="text-gray-700">Duration: {{ durationLabel }}</div>
      </div>

      <!-- Active toggles -->
      <div v-if="toggles.length" class="border-t border-gray-100 pt-3 space-y-1.5">
        <div class="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Active rules</div>
        <ul class="space-y-1">
          <li v-for="t in toggles" :key="t" class="flex items-start gap-1.5 text-xs text-gray-700">
            <svg class="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>{{ t }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
