<script lang="ts" setup>
import { computed } from 'vue'
import { type UnifiedCalendarConfig } from '../../data/mockCalendars'

const props = defineProps<{
  config: UnifiedCalendarConfig
}>()

const emit = defineEmits<{
  (e: 'goto', tab: string): void
}>()

// --- Derive the same labels we show in the live indicator ---
const derivedType = computed(() => {
  const staffCount = props.config.teamMembers?.length ?? 0
  const seats = props.config.seatsPerSlot ?? 1
  const strategy = props.config.assignmentStrategy
  const shared = props.config.bookingBehavior === 'shared'

  if (staffCount === 0) return 'Event Calendar'
  if (staffCount > 1) {
    if (strategy === 'collective' || strategy === 'mixed') return 'Collective Booking'
    return 'Round Robin'
  }
  if (staffCount === 1 && shared && seats > 1) return 'Class Booking'
  return 'Personal Booking'
})

// --- Helper getters ---
const hostCount = computed(() => props.config.teamMembers.length)
const isMultiHost = computed(() => hostCount.value > 1)
const isMixed = computed(() => props.config.assignmentStrategy === 'mixed')
const isCollective = computed(() => props.config.assignmentStrategy === 'collective')
const isRotate = computed(() => props.config.assignmentStrategy === 'rotate')
const isShared = computed(() => props.config.bookingBehavior === 'shared' && props.config.seatsPerSlot > 1)
const owner = computed(() => props.config.teamMembers.find(m => m.isPrimary))

const strategyLabel = computed(() => {
  if (!isMultiHost.value) return null
  if (isCollective.value) return 'All members attend'
  if (isMixed.value) return 'Mixed: required + rotating'
  if (isRotate.value) return 'Rotate between members'
  return 'Not yet set'
})

const distributionLabel = computed(() => {
  if (props.config.rotationOptimization === 'equal_distribution') return 'Equal distribution'
  return 'Maximise availability'
})

const durationSummary = computed(() => {
  const opts = props.config.durationOptions ?? []
  if (opts.length === 0) return `${props.config.meetingDuration} ${props.config.meetingDurationUnit}`
  if (opts.length === 1) return `${opts[0].value} ${opts[0].unit}`
  return opts.map(o => `${o.value} ${o.unit}`).join(', ')
})

const bookingWindowSummary = computed(() => {
  const min = props.config.minSchedulingNotice
  const minUnit = props.config.minSchedulingNoticeUnit
  const max = props.config.dateRange ?? 60
  const maxUnit = props.config.dateRangeUnit
  const minPart = min ? `at least ${min} ${minUnit} notice` : 'no minimum notice'
  return `${minPart}, up to ${max} ${maxUnit} ahead`
})

const capacitySummary = computed(() => {
  const seats = props.config.seatsPerSlot
  if (seats <= 1) return '1 booking per slot'
  if (props.config.bookingBehavior === 'shared') return `Group session — up to ${seats} attendees per session`
  return `Up to ${seats} parallel bookings per slot`
})

const recurringSummary = computed(() => {
  if (!props.config.enableRecurring) return null
  return `Recurring: ${props.config.recurringFrequency.toLowerCase()} × ${props.config.recurringCount}`
})

// --- What the booker will experience ---
const bookerExperience = computed(() => {
  const items: string[] = []
  if (isShared.value) items.push('Sees a group session — multiple attendees in one meeting')
  if (props.config.showSeatsToBookers) items.push('Sees how many seats remain')
  if (props.config.enableBookerStaffSelection) items.push('Picks which host they want from a dropdown')
  if (props.config.alwaysBookWithAssignedUser && isMultiHost.value) items.push('Returning contacts auto-route to their assigned user')
  if ((props.config.durationOptions?.length ?? 0) > 1) items.push('Picks a duration from multiple options')
  if (props.config.enablePayments) items.push('Pays at booking time')
  if (props.config.enableGuests) items.push('Can add guests to the booking')
  if (items.length === 0) items.push('Standard booking flow — pick a time and confirm')
  return items
})

const reschedulePrefLabel = computed(() => {
  if (!isMultiHost.value || !isRotate.value) return null
  return props.config.reschedulePreference === 'keep_owner'
    ? 'Reschedules stay with the same appointment owner'
    : 'Reschedules re-route through round robin'
})

function go(tab: string) {
  emit('goto', tab)
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-start justify-between">
      <div>
        <h2 class="text-base font-semibold text-gray-900">Review &amp; summary</h2>
        <p class="text-sm text-gray-500 mt-0.5">Quick overview of how this calendar will work. Click any section to edit.</p>
      </div>
    </div>

    <!-- Hero: derived type -->
    <div class="bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-200 rounded-xl p-5">
      <div class="text-xs uppercase tracking-wider text-primary-700 font-semibold mb-1.5">This calendar will run as</div>
      <div class="flex items-center gap-2 mb-1">
        <svg class="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <h3 class="text-xl font-bold text-gray-900">{{ derivedType }}</h3>
      </div>
      <p class="text-sm text-gray-600">{{ capacitySummary }} · {{ durationSummary }}</p>
    </div>

    <!-- Identity -->
    <button
      type="button"
      class="w-full text-left bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors group"
      @click="go('basic')"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2">
            <h3 class="text-sm font-semibold text-gray-900">Identity</h3>
          </div>
          <dl class="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            <dt class="text-gray-500">Name</dt>
            <dd class="text-gray-900 truncate">{{ config.name || '—' }}</dd>
            <dt class="text-gray-500">URL</dt>
            <dd class="text-gray-900 truncate font-mono text-xs">/widget/bookings/{{ config.slug || '...' }}</dd>
          </dl>
        </div>
        <span class="text-xs text-primary-600 group-hover:text-primary-700 flex-shrink-0">Edit ›</span>
      </div>
    </button>

    <!-- Hosts & assignment -->
    <button
      type="button"
      class="w-full text-left bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors group"
      @click="go('staff')"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2">
            <h3 class="text-sm font-semibold text-gray-900">Hosts &amp; assignment</h3>
          </div>
          <dl class="grid grid-cols-[140px_1fr] gap-x-6 gap-y-1.5 text-sm">
            <dt class="text-gray-500">Hosts</dt>
            <dd class="text-gray-900">
              {{ hostCount === 0 ? 'No hosts (open event)' : hostCount === 1 ? '1 host' : `${hostCount} hosts` }}
              <span v-if="hostCount > 0" class="text-xs text-gray-400">— {{ config.teamMembers.map(m => m.userName).join(', ') }}</span>
            </dd>

            <template v-if="isMultiHost">
              <dt class="text-gray-500">Strategy</dt>
              <dd class="text-gray-900">{{ strategyLabel }}</dd>
            </template>

            <template v-if="(isCollective || isMixed) && owner">
              <dt class="text-gray-500">Primary owner</dt>
              <dd class="text-gray-900">{{ owner.userName }}<span class="text-xs text-gray-400"> — others added as followers</span></dd>
            </template>

            <template v-if="isMultiHost && (isRotate || isMixed)">
              <dt class="text-gray-500">Distribution</dt>
              <dd class="text-gray-900">{{ distributionLabel }}</dd>
            </template>

            <template v-if="config.enableBookerStaffSelection && isMultiHost">
              <dt class="text-gray-500">Staff selection</dt>
              <dd class="text-emerald-700">Booker can pick a host</dd>
            </template>

            <template v-if="reschedulePrefLabel">
              <dt class="text-gray-500">Returning contacts</dt>
              <dd class="text-gray-900">{{ reschedulePrefLabel }}</dd>
            </template>
          </dl>
        </div>
        <span class="text-xs text-primary-600 group-hover:text-primary-700 flex-shrink-0">Edit ›</span>
      </div>
    </button>

    <!-- Capacity & duration -->
    <button
      type="button"
      class="w-full text-left bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors group"
      @click="go('rules')"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2">
            <h3 class="text-sm font-semibold text-gray-900">Capacity &amp; duration</h3>
          </div>
          <dl class="grid grid-cols-[140px_1fr] gap-x-6 gap-y-1.5 text-sm">
            <dt class="text-gray-500">Duration</dt>
            <dd class="text-gray-900">{{ durationSummary }}<span v-if="(config.durationOptions?.length ?? 0) > 1" class="text-xs text-gray-400"> — booker picks</span></dd>

            <dt class="text-gray-500">Capacity</dt>
            <dd class="text-gray-900">{{ capacitySummary }}</dd>

            <template v-if="isShared && config.showSeatsToBookers">
              <dt class="text-gray-500">Seats display</dt>
              <dd class="text-gray-900">Remaining seats shown to bookers</dd>
            </template>

            <dt class="text-gray-500">Booking window</dt>
            <dd class="text-gray-900">{{ bookingWindowSummary }}</dd>

            <template v-if="config.preBufferTime || config.postBufferTime">
              <dt class="text-gray-500">Buffers</dt>
              <dd class="text-gray-900">
                <span v-if="config.preBufferTime">{{ config.preBufferTime }} {{ config.preBufferTimeUnit }} before</span><span v-if="config.preBufferTime && config.postBufferTime"> · </span><span v-if="config.postBufferTime">{{ config.postBufferTime }} {{ config.postBufferTimeUnit }} after</span>
              </dd>
            </template>

            <template v-if="config.maxBookingsPerDay">
              <dt class="text-gray-500">Max per day</dt>
              <dd class="text-gray-900">{{ config.maxBookingsPerDay }} bookings</dd>
            </template>

            <template v-if="config.lookBusy > 0">
              <dt class="text-gray-500">Look busy</dt>
              <dd class="text-gray-900">{{ config.lookBusy }}% of slots hidden</dd>
            </template>

            <template v-if="recurringSummary">
              <dt class="text-gray-500">Recurring</dt>
              <dd class="text-gray-900">{{ recurringSummary }}</dd>
            </template>
          </dl>
        </div>
        <span class="text-xs text-primary-600 group-hover:text-primary-700 flex-shrink-0">Edit ›</span>
      </div>
    </button>

    <!-- Booker experience -->
    <div class="bg-white border border-gray-200 rounded-xl p-5">
      <h3 class="text-sm font-semibold text-gray-900 mb-3">What the booker will experience</h3>
      <ul class="space-y-1.5">
        <li
          v-for="(item, idx) in bookerExperience"
          :key="idx"
          class="flex items-start gap-2 text-sm text-gray-700"
        >
          <svg class="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>{{ item }}</span>
        </li>
      </ul>
    </div>

    <!-- Behind the scenes (admin-only) -->
    <div class="bg-gray-50 border border-gray-200 rounded-xl p-5">
      <h3 class="text-sm font-semibold text-gray-900 mb-3">Behind the scenes</h3>
      <dl class="grid grid-cols-[160px_1fr] gap-x-6 gap-y-1.5 text-sm">
        <template v-if="config.assignContactsToTeamMembers">
          <dt class="text-gray-500">Contact assignment</dt>
          <dd class="text-gray-900">
            New contacts assigned to {{ owner ? owner.userName : 'the host' }}<span v-if="(isCollective || isMixed) && hostCount > 1">; others added as followers</span>
          </dd>
        </template>
        <template v-if="config.enablePayments">
          <dt class="text-gray-500">Payments</dt>
          <dd class="text-gray-900">{{ config.paymentAmount ? `${config.currency || 'USD'} ${config.paymentAmount}` : 'Enabled' }}{{ config.paymentMode === 'test' ? ' (test mode)' : '' }}</dd>
        </template>
        <template v-if="config.allowReschedule">
          <dt class="text-gray-500">Reschedule</dt>
          <dd class="text-gray-900">Allowed</dd>
        </template>
        <template v-if="config.allowCancellation">
          <dt class="text-gray-500">Cancellation</dt>
          <dd class="text-gray-900">Allowed</dd>
        </template>
      </dl>
    </div>
  </div>
</template>
