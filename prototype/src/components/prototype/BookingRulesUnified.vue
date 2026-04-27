<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { type UnifiedCalendarConfig } from '../../data/mockCalendars'

const props = defineProps<{
  config: UnifiedCalendarConfig
}>()

const emit = defineEmits<{
  (e: 'update', config: Partial<UnifiedCalendarConfig>): void
  (e: 'navigate', tab: string): void
}>()

const showAdvanced = ref(false)

const hasMultipleSeats = computed(() => props.config.seatsPerSlot > 1)
const isShared = computed(() => props.config.bookingBehavior === 'shared' && hasMultipleSeats.value)
const isMultiHost = computed(() => props.config.teamMembers.length > 1)
const hostCount = computed(() => props.config.teamMembers.length)
const isCollective = computed(() => props.config.assignmentStrategy === 'collective')
const isMixed = computed(() => props.config.assignmentStrategy === 'mixed')
const isRotate = computed(() => props.config.assignmentStrategy === 'rotate')
const isClassShape = computed(() =>
  hasMultipleSeats.value && props.config.bookingBehavior === 'shared'
)
const hasMultipleDurations = computed(() => props.config.durationOptions.length > 1)

// Collective/Mixed can't parallelise (all required hosts attend every booking).
// The Parallel card is disabled in that case. The user explicitly picks Solo
// or Group — no auto-coupling. See locked decision #52.
const behaviorIsForced = computed(() => isMultiHost.value && (isCollective.value || isMixed.value))

// Defensive: if a Collective/Mixed calendar somehow lands with
// bookingBehavior=separate AND seats>1 (e.g. user switched strategy after
// configuring as Parallel), nudge them back to Group.
watch(
  () => [behaviorIsForced.value, props.config.bookingBehavior, props.config.seatsPerSlot] as const,
  () => {
    if (behaviorIsForced.value && props.config.seatsPerSlot > 1 && props.config.bookingBehavior === 'separate') {
      emit('update', { bookingBehavior: 'shared' })
    }
  },
  { immediate: true }
)

const durationOptions = computed(() => props.config.durationOptions ?? [{ value: 30, unit: 'mins' }])

function updateDurationOption(idx: number, patch: Partial<{ value: number; unit: string }>) {
  const next = durationOptions.value.map((d, i) => (i === idx ? { ...d, ...patch } : d))
  emit('update', { durationOptions: next })
}

function addDurationOption() {
  const last = durationOptions.value[durationOptions.value.length - 1]
  const next = [...durationOptions.value, { value: last.value, unit: last.unit }]
  emit('update', { durationOptions: next })
}

function removeDurationOption(idx: number) {
  if (durationOptions.value.length <= 1) return
  const next = durationOptions.value.filter((_, i) => i !== idx)
  emit('update', { durationOptions: next })
}

// Locked decision #52: capacity is picked as one of three outcome cards
// (Solo / Group / Parallel) instead of a behavior radio + number input.
type CapacityKind = 'solo' | 'group' | 'parallel'

const selectedKind = computed<CapacityKind>(() => {
  if (props.config.seatsPerSlot === 1) return 'solo'
  if (props.config.bookingBehavior === 'shared') return 'group'
  return 'parallel'
})

// Parallel is disabled for Collective/Mixed (hosts can't parallelise — they'd
// need to attend two bookings at once). Show the card disabled with a hint.
const parallelDisabled = computed(() => isMultiHost.value && (isCollective.value || isMixed.value))
const parallelDisabledReason = 'Parallel bookings aren\'t possible when all hosts attend every booking. Switch the strategy to "Rotate between members" to enable.'

// Group session is disabled for multi-host rotate (locked decision #58).
// Class with rotating hosts isn't a real-world pattern in any major class
// platform (ClassPass / Mindbody / Vagaro). Studios use separate calendars
// per instructor instead.
const groupDisabled = computed(() => isMultiHost.value && isRotate.value)
const groupDisabledReason = 'Class with rotating hosts isn\'t supported. Either switch the strategy to "All members attend" or reduce to one host on the Staff & assignment tab.'

function pickKind(kind: CapacityKind) {
  if (kind === 'parallel' && parallelDisabled.value) return
  if (kind === 'group' && groupDisabled.value) return
  if (kind === 'solo') {
    emit('update', { bookingBehavior: 'separate', seatsPerSlot: 1 })
    return
  }
  if (kind === 'group') {
    const seats = props.config.seatsPerSlot > 1 ? props.config.seatsPerSlot : 5
    emit('update', { bookingBehavior: 'shared', seatsPerSlot: seats })
    return
  }
  // parallel
  const seats = props.config.seatsPerSlot > 1 ? props.config.seatsPerSlot : 3
  emit('update', { bookingBehavior: 'separate', seatsPerSlot: seats })
}

// Inline fix-it: switch strategy to collective ("All members attend").
function switchToCollective() {
  emit('update', { assignmentStrategy: 'collective' })
}

function setSeats(value: number) {
  const safe = Math.max(2, value || 2) // never go below 2 inside Group/Parallel cards
  emit('update', { seatsPerSlot: safe })
}

// (capacityLabel / capacitySubLabel removed — labels now live inside each
// outcome card instead of morphing one shared input. See locked decision #52.)

// Per-card description copy. Words matter — "Solo" was misleading because
// with multi-host rotate, multiple bookings can fill the same slot (one per
// host). "Single booking" is more accurate per locked decision #54.
const singleBookingDescription = computed(() => {
  if (isMultiHost.value && isRotate.value) {
    return `One booking per host, per slot. Each of your ${hostCount.value} hosts can take one booking at the same time.`
  }
  if (isMultiHost.value) return 'One booking per slot. All hosts attend.'
  return 'One booker per slot. One meeting.'
})

const parallelBookingsDescription = computed(() => {
  if (isMultiHost.value && isRotate.value) {
    return `Multiple separate meetings can happen in the same slot. With ${hostCount.value} rotating hosts, each can take several at once.`
  }
  return 'Multiple independent meetings can happen in the same slot — each its own booking, with its own attendees.'
})

const groupSessionDescription = computed(() => {
  // Multi-host rotate doesn't reach this — Group card is disabled (#58).
  if (isMultiHost.value) return 'Multiple bookers join one shared meeting. All hosts attend together.'
  return 'Multiple bookers join one shared meeting with the host.'
})

// Shape-aware explanation of how guests interact with capacity. Surfaced
// as an info card under the "Allow bookers to add guests" toggle so the
// math is visible — see locked decision #51.
const guestsExplanation = computed(() => {
  // Group session: each guest = a seat from the shared pool. The example
  // scales to keep the math sensible at low capacities.
  if (isClassShape.value) {
    const cap = props.config.seatsPerSlot
    // Pick an example guest count that stays inside the cap.
    const guests = cap >= 5 ? 3 : Math.max(1, cap - 1)
    const filled = guests + 1
    const remaining = cap - filled
    const remainingStr = remaining === 0 ? 'filling the group' : remaining === 1 ? 'leaving 1 seat for another booker' : `leaving ${remaining} for other bookers`
    return `Each guest takes one seat from your group of ${cap}. A booker bringing ${guests} guest${guests === 1 ? '' : 's'} fills ${filled} of those seats — ${remainingStr}.`
  }
  // Parallel: multiple separate meetings per slot, each can have its own guests.
  if (hasMultipleSeats.value) {
    return 'Each parallel booking can include its own guests. Guests are add-ons — they don\'t fill an extra slot. Your capacity counts independent bookings, not total people.'
  }
  // Single booking: guests come along with the one booker. Pure add-on.
  return 'Guests are add-ons — they come along with the booker. They don\'t take a separate slot or affect availability.'
})

const bookerPreviewForGuests = computed(() => {
  if (isClassShape.value) {
    return 'Bookers will see an "Add guests" picker. Each guest reduces seats remaining in this group.'
  }
  if (hasMultipleSeats.value) {
    return 'Bookers will see an "Add guests" picker. Each parallel booking can have its own group of guests; nobody else loses a slot.'
  }
  return 'Bookers will see an "Add guests" picker. Guests are listed on the appointment but don\'t affect slot count.'
})

// Plain English summary of total capacity. Lead with host count for clarity.
// Multi-host rotate + Group is no longer reachable (locked decision #58 disables
// the Group card for that combo) — defensive copy left in place anyway.
const totalCapacitySummary = computed(() => {
  if (!hasMultipleSeats.value || !isMultiHost.value) return null
  const seats = props.config.seatsPerSlot
  const hosts = hostCount.value

  if (props.config.bookingBehavior === 'shared') {
    if (isCollective.value) {
      return `${hosts} hosts in one shared class — up to ${seats} attendees per slot`
    }
    if (isMixed.value) {
      return `${hosts}-host team in one shared class — up to ${seats} attendees per slot`
    }
    // Defensive — multi-host rotate + shared shouldn't be reachable post-#58.
    return `Up to ${seats} attendees per slot`
  }

  return `${hosts} hosts × ${seats} parallel bookings = up to ${seats * hosts} total appointments per slot`
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-base font-semibold text-gray-900">Booking rules</h2>
      <p class="text-sm text-gray-500 mt-0.5">Duration, capacity, buffers, and how far ahead bookers can schedule.</p>
    </div>


    <!-- 1. Duration & Interval -->
    <div class="bg-white border border-gray-200 rounded-xl p-5">
      <h3 class="text-sm font-semibold text-gray-900 mb-3">Duration</h3>

      <!-- Meeting interval (above duration options) -->
      <div class="mb-4">
        <label class="text-xs font-medium text-gray-600 block mb-1.5">Meeting interval</label>
        <p class="text-xs text-gray-400 mb-1.5">How often a slot starts (e.g. every 30 minutes)</p>
        <div class="flex gap-2 max-w-xs">
          <input
            type="number"
            :value="config.meetingInterval"
            @input="emit('update', { meetingInterval: parseInt(($event.target as HTMLInputElement).value) || 30 })"
            class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <select
            :value="config.meetingIntervalUnit"
            @change="emit('update', { meetingIntervalUnit: ($event.target as HTMLSelectElement).value })"
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="mins">Minutes</option>
            <option value="hours">Hours</option>
          </select>
        </div>
      </div>

      <!-- Multi-duration list. When Class shape is active (locked decision
           #56), the list is disabled — only the default duration applies.
           Additional durations are PRESERVED (not deleted) so switching back
           to a non-shared shape brings them back. -->
      <div>
        <label class="text-xs font-medium text-gray-600 block mb-1.5">Meeting duration options</label>
        <p class="text-xs text-gray-400 mb-2">
          {{ isClassShape && hasMultipleDurations
            ? "Class uses one duration. Multiple durations are paused — see notice below."
            : isClassShape
              ? "Class uses one duration. Add more by switching to a non-shared shape first."
              : hasMultipleDurations
                ? "Bookers will pick from these durations. The first is the default."
                : "Add more options if you want bookers to choose their own meeting length." }}
        </p>
        <div class="space-y-2" :class="isClassShape ? 'opacity-60 pointer-events-none' : ''">
          <div
            v-for="(d, idx) in durationOptions"
            :key="idx"
            class="flex items-center gap-2 max-w-md"
          >
            <input
              type="number"
              :value="d.value"
              @input="updateDurationOption(idx, { value: parseInt(($event.target as HTMLInputElement).value) || 30 })"
              :disabled="isClassShape && idx > 0"
              class="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              :class="isClassShape && idx > 0 ? 'bg-gray-50 text-gray-400' : ''"
            />
            <select
              :value="d.unit"
              @change="updateDurationOption(idx, { unit: ($event.target as HTMLSelectElement).value })"
              :disabled="isClassShape && idx > 0"
              class="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              :class="isClassShape && idx > 0 ? 'bg-gray-50 text-gray-400' : ''"
            >
              <option value="mins">Minutes</option>
              <option value="hours">Hours</option>
            </select>
            <span v-if="idx === 0" class="text-[10px] font-medium text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded">Default</span>
            <span v-else-if="isClassShape" class="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Paused</span>
            <button
              v-if="durationOptions.length > 1 && !isClassShape"
              type="button"
              class="text-gray-400 hover:text-gray-600 p-1"
              :title="'Remove this duration option'"
              @click="removeDurationOption(idx)"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <button
            v-if="!isClassShape"
            type="button"
            class="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 mt-1"
            @click="addDurationOption"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add another duration
          </button>
        </div>

        <!-- Class + multi-duration loud notice (locked decision #56). No
             outer <transition> — nested transitions deadlocked when the v-if
             flipped (same Vue bug as the strategy block fix). -->
        <div v-if="isClassShape && hasMultipleDurations" class="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2.5">
          <svg class="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div class="text-xs text-amber-900 leading-relaxed">
            <strong class="font-semibold">Multiple durations paused for Class.</strong>
            Class uses one duration only — your default of <strong>{{ durationOptions[0].value }} {{ durationOptions[0].unit }}</strong> is being used. The other {{ durationOptions.length - 1 }} duration{{ durationOptions.length - 1 === 1 ? ' is' : 's are' }} preserved and will come back if you switch to a non-shared shape (Single booking or Parallel bookings). To offer multiple lengths as Class, create a separate calendar for each.
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Capacity per slot — three outcome cards (Solo / Group / Parallel).
         User picks one; capacity number lives inside the chosen card. -->
    <div class="bg-white border border-gray-200 rounded-xl p-5">
      <div class="flex items-center gap-2 mb-1">
        <h3 class="text-sm font-semibold text-gray-900">Capacity per slot</h3>
        <span class="bg-primary-50 text-primary-700 text-[10px] font-medium px-1.5 py-0.5 rounded">Key Setting</span>
      </div>
      <p class="text-xs text-gray-500 mb-4">What does each available slot allow?</p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <!-- 1. SINGLE BOOKING -->
        <button
          type="button"
          class="text-left p-4 rounded-xl border-2 transition-all hover:shadow-sm"
          :class="selectedKind === 'solo'
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-200 hover:border-gray-300 bg-white'"
          @click="pickKind('solo')"
        >
          <div class="w-9 h-9 rounded-lg flex items-center justify-center mb-2"
            :class="selectedKind === 'solo' ? 'bg-primary-100' : 'bg-gray-100'"
          >
            <svg class="w-5 h-5" :class="selectedKind === 'solo' ? 'text-primary-600' : 'text-gray-500'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div class="text-sm font-medium leading-tight"
            :class="selectedKind === 'solo' ? 'text-primary-700' : 'text-gray-900'"
          >Single booking</div>
          <div class="text-xs mt-0.5 leading-snug"
            :class="selectedKind === 'solo' ? 'text-primary-600' : 'text-gray-500'"
          >{{ singleBookingDescription }}</div>
        </button>

        <!-- 2. PARALLEL BOOKINGS -->
        <button
          type="button"
          class="text-left p-4 rounded-xl border-2 transition-all"
          :class="parallelDisabled
            ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
            : selectedKind === 'parallel'
              ? 'border-primary-500 bg-primary-50 hover:shadow-sm'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'"
          :disabled="parallelDisabled"
          :title="parallelDisabled ? parallelDisabledReason : ''"
          @click="pickKind('parallel')"
        >
          <div class="w-9 h-9 rounded-lg flex items-center justify-center mb-2"
            :class="selectedKind === 'parallel' && !parallelDisabled ? 'bg-primary-100' : 'bg-gray-100'"
          >
            <svg class="w-5 h-5" :class="selectedKind === 'parallel' && !parallelDisabled ? 'text-primary-600' : 'text-gray-500'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div class="text-sm font-medium leading-tight"
            :class="selectedKind === 'parallel' && !parallelDisabled ? 'text-primary-700' : 'text-gray-900'"
          >Parallel bookings</div>
          <div class="text-xs mt-0.5 leading-snug"
            :class="selectedKind === 'parallel' && !parallelDisabled ? 'text-primary-600' : 'text-gray-500'"
          >{{ parallelBookingsDescription }}</div>

          <transition name="section-slide">
            <div v-if="selectedKind === 'parallel' && !parallelDisabled" class="mt-3 pt-3 border-t border-primary-200 space-y-2">
              <label class="text-[11px] font-medium text-primary-700 block">{{ isMultiHost ? 'Separate meetings per host, per slot' : 'Separate meetings per slot' }}</label>
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  class="w-7 h-7 border border-primary-200 rounded bg-white text-gray-500 hover:bg-gray-50 text-sm"
                  @click.stop="setSeats(config.seatsPerSlot - 1)"
                >-</button>
                <input
                  type="number"
                  :value="config.seatsPerSlot"
                  @input.stop="setSeats(parseInt(($event.target as HTMLInputElement).value) || 2)"
                  @click.stop
                  class="w-14 border border-primary-200 rounded px-2 py-1 text-sm text-center bg-white"
                  min="2"
                />
                <button
                  type="button"
                  class="w-7 h-7 border border-primary-200 rounded bg-white text-gray-500 hover:bg-gray-50 text-sm"
                  @click.stop="setSeats(config.seatsPerSlot + 1)"
                >+</button>
                <span class="text-[11px] text-primary-700 ml-1">separate meetings</span>
              </div>
            </div>
          </transition>
          <p v-if="parallelDisabled" class="text-[11px] text-gray-500 italic mt-2 leading-snug">
            Not available with shared-meeting strategies. Switch to "Rotate between members" on Staff & assignment to enable.
          </p>
        </button>

        <!-- 3. GROUP SESSION (locked decision #58: disabled for multi-host rotate) -->
        <button
          type="button"
          class="text-left p-4 rounded-xl border-2 transition-all"
          :class="groupDisabled
            ? 'border-gray-100 bg-gray-50 opacity-80 cursor-not-allowed'
            : selectedKind === 'group'
              ? 'border-primary-500 bg-primary-50 hover:shadow-sm'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'"
          :disabled="groupDisabled"
          :title="groupDisabled ? groupDisabledReason : ''"
          @click="pickKind('group')"
        >
          <div class="w-9 h-9 rounded-lg flex items-center justify-center mb-2"
            :class="selectedKind === 'group' && !groupDisabled ? 'bg-primary-100' : 'bg-gray-100'"
          >
            <svg class="w-5 h-5" :class="selectedKind === 'group' && !groupDisabled ? 'text-primary-600' : 'text-gray-500'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div class="text-sm font-medium leading-tight"
            :class="selectedKind === 'group' && !groupDisabled ? 'text-primary-700' : 'text-gray-900'"
          >Group session</div>
          <div class="text-xs mt-0.5 leading-snug"
            :class="selectedKind === 'group' && !groupDisabled ? 'text-primary-600' : 'text-gray-500'"
          >{{ groupDisabled ? 'Class with rotating hosts isn\'t supported.' : groupSessionDescription }}</div>

          <!-- Disabled-state inline fix-its (no detour to Staff tab needed for the strategy switch). -->
          <div v-if="groupDisabled" class="mt-3 pt-3 border-t border-gray-200 space-y-2">
            <p class="text-[11px] text-gray-600 leading-snug">To enable group sessions:</p>
            <button
              type="button"
              class="w-full text-[11px] font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 px-2 py-1.5 rounded border border-primary-200 cursor-pointer"
              @click.stop="switchToCollective"
            >
              → Switch to "All members attend"
            </button>
            <button
              type="button"
              class="w-full text-[11px] font-medium text-gray-700 hover:bg-gray-100 px-2 py-1.5 rounded border border-gray-200 cursor-pointer"
              @click.stop="emit('navigate', 'staff')"
            >
              Or reduce hosts on Staff & assignment →
            </button>
          </div>

          <!-- Selected-state expanded sub-UI -->
          <transition name="section-slide">
            <div v-if="selectedKind === 'group' && !groupDisabled" class="mt-3 pt-3 border-t border-primary-200 space-y-2">
              <label class="text-[11px] font-medium text-primary-700 block">Attendees per session</label>
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  class="w-7 h-7 border border-primary-200 rounded bg-white text-gray-500 hover:bg-gray-50 text-sm"
                  @click.stop="setSeats(config.seatsPerSlot - 1)"
                >-</button>
                <input
                  type="number"
                  :value="config.seatsPerSlot"
                  @input.stop="setSeats(parseInt(($event.target as HTMLInputElement).value) || 2)"
                  @click.stop
                  class="w-14 border border-primary-200 rounded px-2 py-1 text-sm text-center bg-white"
                  min="2"
                />
                <button
                  type="button"
                  class="w-7 h-7 border border-primary-200 rounded bg-white text-gray-500 hover:bg-gray-50 text-sm"
                  @click.stop="setSeats(config.seatsPerSlot + 1)"
                >+</button>
                <span class="text-[11px] text-primary-700 ml-1">in one shared meeting</span>
              </div>
              <label class="flex items-center gap-2 cursor-pointer pt-1" @click.stop>
                <input
                  type="checkbox"
                  :checked="config.showSeatsToBookers"
                  @change="emit('update', { showSeatsToBookers: !config.showSeatsToBookers })"
                  class="w-3.5 h-3.5 text-primary-600 border-gray-300 rounded"
                />
                <span class="text-xs text-primary-700">Show seats remaining to bookers</span>
              </label>
            </div>
          </transition>
        </button>
      </div>

      <!-- Total capacity summary (multi-host + seats > 1) -->
      <transition name="section-slide">
        <div v-if="totalCapacitySummary" class="mt-4 inline-flex items-center gap-2 bg-primary-50 border border-primary-100 rounded-lg px-3 py-2">
          <svg class="w-3.5 h-3.5 text-primary-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span class="text-xs text-primary-800 font-medium">{{ totalCapacitySummary }}</span>
        </div>
      </transition>
    </div>

    <!-- 2b. Guests — its own card so it can't be missed. -->
    <div class="bg-white border border-gray-200 rounded-xl p-5">
      <div class="flex items-center gap-2 mb-1">
        <h3 class="text-sm font-semibold text-gray-900">Guests</h3>
      </div>
      <p class="text-xs text-gray-500 mb-3">Should bookers be able to bring extras to their appointment?</p>

      <label class="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          :checked="config.enableGuests"
          @change="emit('update', { enableGuests: !config.enableGuests })"
          class="w-4 h-4 text-primary-600 border-gray-300 rounded"
        />
        <span class="text-sm font-medium text-gray-900">Bookers can add guests</span>
      </label>

      <transition name="section-slide">
        <div v-if="config.enableGuests" class="mt-3 ml-6 space-y-3">
          <!-- Shape-aware explanation + booker preview -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1.5">
            <div class="flex items-start gap-2">
              <svg class="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-xs text-blue-900 font-medium leading-relaxed">{{ guestsExplanation }}</span>
            </div>
            <div class="flex items-start gap-2 pl-5">
              <span class="text-[11px] text-blue-700 italic leading-relaxed">{{ bookerPreviewForGuests }}</span>
            </div>
          </div>

          <!-- Name and email / Count only — inline -->
          <div class="flex items-center gap-3 text-sm">
            <span class="text-xs font-medium text-gray-500">Collect:</span>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="guest-info"
                value="name_email"
                :checked="config.guestInfoMode === 'name_email'"
                @change="emit('update', { guestInfoMode: 'name_email' })"
                class="w-3.5 h-3.5 text-primary-600 border-gray-300"
              />
              <span class="text-sm text-gray-700">Name &amp; email</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="guest-info"
                value="count_only"
                :checked="config.guestInfoMode === 'count_only'"
                @change="emit('update', { guestInfoMode: 'count_only' })"
                class="w-3.5 h-3.5 text-primary-600 border-gray-300"
              />
              <span class="text-sm text-gray-700">Count only</span>
            </label>
          </div>

          <!-- Require at least one guest -->
          <label class="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              :checked="config.requireGuestsForBooking"
              @change="emit('update', { requireGuestsForBooking: !config.requireGuestsForBooking })"
              class="w-3.5 h-3.5 text-primary-600 border-gray-300 rounded"
            />
            <span class="text-sm text-gray-700">Require at least one guest</span>
          </label>
        </div>
      </transition>
    </div>

    <!-- 3. Booking window -->
    <div class="bg-white border border-gray-200 rounded-xl p-5">
      <h3 class="text-sm font-semibold text-gray-900 mb-1">Booking window</h3>
      <p class="text-xs text-gray-500 mb-4">When bookers can schedule from and how far ahead.</p>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-xs font-medium text-gray-600 block mb-1.5">How much notice do you need?</label>
          <div class="flex gap-2">
            <input
              type="number"
              :value="config.minSchedulingNotice"
              @input="emit('update', { minSchedulingNotice: parseInt(($event.target as HTMLInputElement).value) || null })"
              class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="0"
            />
            <select class="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="days">Days</option>
              <option value="hours">Hours</option>
              <option value="mins">Minutes</option>
            </select>
          </div>
        </div>
        <div>
          <label class="text-xs font-medium text-gray-600 block mb-1.5">How far ahead can bookers schedule?</label>
          <div class="flex gap-2">
            <input
              type="number"
              :value="config.dateRange"
              @input="emit('update', { dateRange: parseInt(($event.target as HTMLInputElement).value) || null })"
              class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="60"
            />
            <select class="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. Advanced limits & buffers (collapsed) -->
    <div class="bg-white border border-gray-200 rounded-xl p-5">
      <button
        type="button"
        class="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900"
        @click="showAdvanced = !showAdvanced"
      >
        <svg
          class="w-3 h-3 transition-transform duration-200"
          :class="{ 'rotate-90': showAdvanced }"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        Advanced limits & buffers
      </button>

      <transition name="section-slide">
        <div v-if="showAdvanced" class="mt-5 space-y-5">
          <!-- Pre / Post buffer -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-medium text-gray-600 block mb-1.5">Pre-meeting buffer</label>
              <p class="text-xs text-gray-400 mb-1.5">Block time before each meeting{{ isMultiHost ? " (per host)" : "" }}</p>
              <div class="flex gap-2">
                <input
                  type="number"
                  :value="config.preBufferTime"
                  @input="emit('update', { preBufferTime: parseInt(($event.target as HTMLInputElement).value) || null })"
                  class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="0"
                />
                <select class="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="mins">Minutes</option>
                  <option value="hours">Hours</option>
                </select>
              </div>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-600 block mb-1.5">Post-meeting buffer</label>
              <p class="text-xs text-gray-400 mb-1.5">Block time after each meeting{{ isMultiHost ? " (per host)" : "" }}</p>
              <div class="flex gap-2">
                <input
                  type="number"
                  :value="config.postBufferTime"
                  @input="emit('update', { postBufferTime: parseInt(($event.target as HTMLInputElement).value) || null })"
                  class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="0"
                />
                <select class="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="mins">Minutes</option>
                  <option value="hours">Hours</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Max bookings per day -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-medium text-gray-600 block mb-1.5">Max bookings per day</label>
              <p class="text-xs text-gray-400 mb-1.5">Cap the total bookings on this calendar each day</p>
              <div class="flex items-center gap-2">
                <button
                  class="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50"
                  @click="emit('update', { maxBookingsPerDay: Math.max(0, (config.maxBookingsPerDay || 0) - 1) || null })"
                >-</button>
                <input
                  type="number"
                  :value="config.maxBookingsPerDay"
                  @input="emit('update', { maxBookingsPerDay: parseInt(($event.target as HTMLInputElement).value) || null })"
                  class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="No limit"
                />
                <button
                  class="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50"
                  @click="emit('update', { maxBookingsPerDay: (config.maxBookingsPerDay || 0) + 1 })"
                >+</button>
              </div>
            </div>

            <!-- Look busy -->
            <div>
              <label class="text-xs font-medium text-gray-600 block mb-1.5">Look busy</label>
              <p class="text-xs text-gray-400 mb-1.5">Hide a percentage of free slots so the calendar appears more in demand</p>
              <div class="flex items-center gap-2">
                <button
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
                  :class="config.lookBusy > 0 ? 'bg-primary-600' : 'bg-gray-200'"
                  @click="emit('update', { lookBusy: config.lookBusy > 0 ? 0 : 20 })"
                >
                  <span
                    class="inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm"
                    :class="config.lookBusy > 0 ? 'translate-x-6' : 'translate-x-1'"
                  />
                </button>
                <input
                  v-if="config.lookBusy > 0"
                  type="number"
                  :value="config.lookBusy"
                  @input="emit('update', { lookBusy: parseInt(($event.target as HTMLInputElement).value) || 0 })"
                  class="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center"
                  min="0"
                  max="100"
                />
                <span v-if="config.lookBusy > 0" class="text-xs text-gray-500">% hidden</span>
              </div>
            </div>
          </div>
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
