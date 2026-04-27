<script lang="ts" setup>
import { computed, ref } from 'vue'
import {
  type UnifiedCalendarConfig,
  type MeetingLocation,
} from '../../data/mockCalendars'

const props = withDefaults(defineProps<{
  config: UnifiedCalendarConfig
  // When true, render as a single-column compact widget that fits in narrow
  // containers (used for the in-wizard side preview pane). Default false uses
  // the side-by-side production layout.
  compact?: boolean
}>(), {
  compact: false,
})

// --- Booker journey state ---
const currentStep = ref<1 | 2>(1)
const selectedDate = ref<number | null>(null)
const selectedSlot = ref<string | null>(null)
const selectedStaff = ref<string>('')
const guestCount = ref(0)
const askBookerLocation = ref('')
const pickedMultiLocationIdx = ref(0)
const consentChecked = ref(false)

// Form fields (Page 2)
const firstName = ref('')
const lastName = ref('')
const phone = ref('')
const email = ref('')
const additionalInfo = ref('')

// --- Calendar / month state for the date picker ---
// Hardcode to April 2026 for now (current prototype context). Real widget
// would compute from today's date.
const monthLabel = 'April 2026'
const monthNumDays = 30
const monthFirstWeekday = 3 // Apr 1 2026 is a Wednesday (Sun=0)
const today26th = 26
const dayLetters = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Mock available time slots
const slotsList = [
  '12:00 AM', '12:30 AM', '01:00 AM', '01:30 AM', '02:00 AM', '02:30 AM',
  '03:00 AM', '03:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '06:00 PM', '06:30 PM',
]

// --- Shape classifications (drives which booker affordances show) ---
const isCollective = computed(() => props.config.assignmentStrategy === 'collective')
const isMixed = computed(() => props.config.assignmentStrategy === 'mixed')
const isRotate = computed(() => props.config.assignmentStrategy === 'rotate')
const isMultiHost = computed(() => props.config.teamMembers.length > 1)
const isShared = computed(() => isCollective.value || isMixed.value)
const isPerHost = computed(() => isMultiHost.value && !isShared.value)
const hasNoHost = computed(() => props.config.teamMembers.length === 0)
const isClassShape = computed(() => props.config.bookingBehavior === 'shared' && props.config.seatsPerSlot > 1)

const showStaffSelector = computed(
  () => props.config.enableBookerStaffSelection && props.config.teamMembers.length > 1
)

const requiredMembers = computed(() =>
  props.config.teamMembers.filter(m => props.config.requiredAttendeeIds.includes(m.userId))
)
const rotatingMembers = computed(() =>
  props.config.teamMembers.filter(m => !props.config.requiredAttendeeIds.includes(m.userId))
)

// --- Multi-location / Ask-booker ---
const isMultiLocation = computed(
  () => props.config.locationMode === 'multiple' && props.config.additionalLocationOptions.length > 0
)
const isAskBooker = computed(() => props.config.calendarLocation?.type === 'ask_booker')

// --- Location display (prefer displayLabel pre-confirmation) ---
function getLocationDisplayText(loc: MeetingLocation | null | undefined): string {
  if (!loc) return ''
  switch (loc.type) {
    case 'in_person':
      if (loc.displayLabel) return loc.displayLabel
      if (loc.inPersonType === 'phone') return 'Phone call'
      if (loc.inPersonType === 'address') return 'In-person'
      return 'Custom location'
    case 'zoom':
      return loc.sourceUserId
        ? `${props.config.teamMembers.find(m => m.userId === loc.sourceUserId)?.userName.split(' ')[0] || ''}'s Zoom`
        : 'Zoom'
    case 'google_meet':
      return loc.sourceUserId
        ? `${props.config.teamMembers.find(m => m.userId === loc.sourceUserId)?.userName.split(' ')[0] || ''}'s Google Meet`
        : 'Google Meet'
    case 'ms_teams':
      return loc.sourceUserId
        ? `${props.config.teamMembers.find(m => m.userId === loc.sourceUserId)?.userName.split(' ')[0] || ''}'s MS Teams`
        : 'MS Teams'
    case 'ask_booker':
      return 'Bookers pick the location'
    default:
      return ''
  }
}

const headerLocationText = computed(() => {
  if (isMultiLocation.value) return `${props.config.additionalLocationOptions.length} location options`
  if (isPerHost.value) return 'Confirmed once a host is assigned'
  return getLocationDisplayText(props.config.calendarLocation)
})

// --- Avatar helpers ---
function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}
function getAvatarColor(userId: string) {
  const colors = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626']
  const idx = parseInt(userId.replace('user-', '')) - 1
  return colors[idx % colors.length]
}

// --- Display "host" line on the left panel ---
const hostDisplayName = computed(() => {
  if (hasNoHost.value) return null
  if (isShared.value) {
    if (props.config.teamMembers.length === 1) return props.config.teamMembers[0].userName
    return `${props.config.teamMembers.length} hosts`
  }
  if (isPerHost.value) {
    // Multi-host rotate — host TBD until rotation assigns
    if (selectedStaff.value) {
      return props.config.teamMembers.find(m => m.userId === selectedStaff.value)?.userName ?? null
    }
    return 'A host will be assigned'
  }
  // 1-host
  return props.config.teamMembers[0].userName
})

// --- Time zone (mock, would come from booker's browser) ---
const timeZoneLabel = 'Asia/Calcutta (GMT+5:30)'

// --- Date helpers for the calendar grid ---
const calendarCells = computed(() => {
  const cells: { day: number | null; available: boolean; selected: boolean; today: boolean }[] = []
  // Empty cells before the 1st
  for (let i = 0; i < monthFirstWeekday; i++) cells.push({ day: null, available: false, selected: false, today: false })
  for (let d = 1; d <= monthNumDays; d++) {
    cells.push({
      day: d,
      available: d >= today26th && d <= 30, // mock — only 26-30 are bookable
      selected: selectedDate.value === d,
      today: d === today26th,
    })
  }
  return cells
})

function pickDate(d: number) {
  selectedDate.value = d
  selectedSlot.value = null
}

function pickSlot(slot: string) {
  selectedSlot.value = slot
}

function continueToForm() {
  if (!selectedDate.value || !selectedSlot.value) return
  currentStep.value = 2
}

function backToDate() {
  currentStep.value = 1
}

const formattedSelectedDate = computed(() => {
  if (!selectedDate.value) return null
  const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][(monthFirstWeekday + selectedDate.value - 1) % 7]
  return `${dayOfWeek}, Apr ${selectedDate.value}, 2026`
})

// --- Brand color (user-configurable, defaults to green) ---
const brandColor = computed(() => props.config.eventColor || '#2563EB')

// Slight tint of the brand color for backgrounds
function tintColor(hex: string, alpha: number): string {
  // Simple rgb() conversion with alpha
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
    <!-- Two-column on wide containers; single-column when compact (in-wizard
         side pane). The widget collapses cleanly so it works at 380px wide. -->
    <div :class="compact ? 'flex flex-col' : 'flex divide-x divide-gray-200'">
      <!-- LEFT IDENTITY PANEL — becomes top strip in compact mode -->
      <div :class="compact
        ? 'border-b border-gray-200 p-4 space-y-2'
        : 'w-[300px] flex-shrink-0 p-6 space-y-3'"
      >
        <!-- Back arrow on Page 2 -->
        <button
          v-if="currentStep === 2"
          type="button"
          class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600"
          @click="backToDate"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <!-- Logo (smaller in compact mode) -->
        <div
          class="rounded-lg flex items-center justify-center text-white font-bold"
          :class="compact ? 'w-10 h-10 text-base' : 'w-16 h-16 text-xl'"
          :style="{ backgroundColor: brandColor }"
        >
          {{ (config.name || 'C')[0]?.toUpperCase() }}
        </div>

        <!-- Group / Tag -->
        <div v-if="config.groupId" class="text-xs font-medium text-gray-500">
          {{ config.groupId }}
        </div>

        <!-- Title -->
        <h2 class="text-lg font-bold text-gray-900 leading-tight">
          {{ config.name || 'Calendar Name' }}
        </h2>

        <!-- Page 2: Selected host -->
        <div v-if="currentStep === 2 && hostDisplayName" class="flex items-center gap-2 text-sm text-gray-700">
          <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {{ hostDisplayName }}
        </div>

        <!-- Duration -->
        <div class="flex items-center gap-2 text-sm text-gray-700">
          <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ config.meetingDuration }} {{ config.meetingDurationUnit || 'min' }}
        </div>

        <!-- Page 1: Date placeholder. Page 2: Selected date+time -->
        <div v-if="currentStep === 1" class="flex items-center gap-2 text-sm text-gray-500">
          <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {{ formattedSelectedDate || 'Select a date and time →' }}
        </div>
        <div v-else-if="currentStep === 2 && selectedDate && selectedSlot" class="flex items-center gap-2 text-sm text-gray-700">
          <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {{ selectedSlot }}, {{ formattedSelectedDate }}
        </div>

        <!-- Page 2: Time zone -->
        <div v-if="currentStep === 2" class="flex items-center gap-2 text-sm text-gray-500">
          <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ timeZoneLabel }}
        </div>

        <!-- Location chip — shown pre-confirmation only when a label IS the
             label (displayLabel set on in_person, or category for video tools).
             If raw customValue would leak, we suppress it (production pattern). -->
        <div v-if="headerLocationText" class="flex items-center gap-2 text-sm text-gray-700">
          <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {{ headerLocationText }}
        </div>

        <!-- Payment summary -->
        <div v-if="config.enablePayments && config.paymentAmount" class="pt-2 border-t border-gray-100 space-y-1">
          <div class="flex items-center justify-between text-sm">
            <span class="flex items-center gap-2 text-gray-700">
              <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Total Amount
            </span>
            <span class="font-semibold text-gray-900">{{ config.currency === 'USD' ? '$' : config.currency }} {{ config.paymentAmount }}</span>
          </div>
          <div v-if="config.acceptPartialPayment" class="flex items-center justify-between text-sm pl-6">
            <span class="text-gray-500">Pay Now</span>
            <span class="font-medium text-gray-700">{{ config.currency === 'USD' ? '$' : config.currency }} 20</span>
          </div>
        </div>

        <!-- Description (Page 1 only) -->
        <p v-if="currentStep === 1 && config.description" class="text-xs text-gray-600 leading-relaxed pt-2 border-t border-gray-100">
          {{ config.description }}
        </p>

        <!-- Collective hosts avatar stack -->
        <div v-if="currentStep === 1 && isCollective && config.teamMembers.length > 1" class="pt-2 border-t border-gray-100">
          <p class="text-[11px] text-gray-500 mb-1.5">Hosted together by:</p>
          <div class="flex -space-x-1.5">
            <div
              v-for="m in config.teamMembers"
              :key="m.userId"
              class="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-medium border-2 border-white"
              :style="{ backgroundColor: getAvatarColor(m.userId) }"
              :title="m.userName"
            >
              {{ getInitials(m.userName) }}
            </div>
          </div>
        </div>

        <!-- Mixed: required + 1 rotating info -->
        <div v-if="currentStep === 1 && isMixed && requiredMembers.length > 0" class="pt-2 border-t border-gray-100">
          <p class="text-[11px] text-gray-500 mb-1.5">Always attending:</p>
          <div class="flex -space-x-1.5 mb-1">
            <div
              v-for="m in requiredMembers"
              :key="m.userId"
              class="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-medium border-2 border-white"
              :style="{ backgroundColor: getAvatarColor(m.userId) }"
              :title="m.userName"
            >
              {{ getInitials(m.userName) }}
            </div>
          </div>
          <p v-if="rotatingMembers.length > 0" class="text-[11px] text-gray-500">
            + 1 rotating host from {{ rotatingMembers.length }}
          </p>
        </div>
      </div>

      <!-- RIGHT CONTENT PANEL — full width on compact, flex in wide mode -->
      <div :class="compact ? 'p-4' : 'flex-1 p-6'">
        <!-- ===== PAGE 1: DATE + SLOT PICKER ===== -->
        <template v-if="currentStep === 1">
          <h3 class="text-base font-bold text-gray-900 mb-4">Select Date & Time</h3>

          <!-- Multi-host rotate: optional host filter -->
          <div v-if="showStaffSelector && !isCollective" class="mb-4">
            <label class="text-xs font-medium text-gray-600 block mb-1.5">
              {{ isMixed ? 'Choose your rotating host' : 'Choose your host' }}
            </label>
            <select
              v-model="selectedStaff"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Any available team member</option>
              <option
                v-for="member in (isMixed ? rotatingMembers : config.teamMembers)"
                :key="member.userId"
                :value="member.userId"
              >
                {{ member.userName }}
              </option>
            </select>
          </div>

          <!-- Calendar + Slots — side-by-side on wide, stacked on compact -->
          <div :class="compact ? 'space-y-4' : 'flex gap-6'">
            <!-- Mini Calendar -->
            <div class="flex-1">
              <div class="flex items-center justify-between mb-3">
                <button class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span class="text-sm font-semibold text-gray-900">{{ monthLabel }}</span>
                <button class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100" :style="{ color: brandColor }">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div class="grid grid-cols-7 gap-1 text-center">
                <div
                  v-for="day in dayLetters"
                  :key="day"
                  class="text-[11px] text-gray-500 py-1.5 font-medium"
                >{{ day }}</div>
                <div
                  v-for="(cell, idx) in calendarCells"
                  :key="idx"
                  class="aspect-square flex items-center justify-center text-sm transition-colors"
                  :class="cell.day === null ? '' : (cell.available ? 'cursor-pointer rounded-full' : 'text-gray-300 cursor-not-allowed')"
                  :style="cell.selected
                    ? { backgroundColor: brandColor, color: 'white', borderRadius: '9999px', fontWeight: 600 }
                    : cell.available
                      ? { backgroundColor: tintColor(brandColor, 0.1), color: brandColor, borderRadius: '9999px' }
                      : {}"
                  @click="cell.available && cell.day && pickDate(cell.day)"
                >
                  {{ cell.day }}
                </div>
              </div>

              <!-- Time zone -->
              <div class="mt-4">
                <label class="text-[11px] font-medium text-gray-600 block mb-1">Time zone</label>
                <div class="flex items-center gap-2 text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2">
                  <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ timeZoneLabel }}
                </div>
              </div>
            </div>

            <!-- Time Slots -->
            <div :class="compact ? 'w-full' : 'w-32 flex-shrink-0'">
              <div v-if="!selectedDate" class="text-xs text-gray-400 italic py-2">
                Pick a date first
              </div>
              <div v-else
                :class="compact
                  ? 'grid grid-cols-3 gap-1.5 max-h-[180px] overflow-y-auto pr-1'
                  : 'space-y-2 max-h-[400px] overflow-y-auto pr-1'"
              >
                <button
                  v-for="slot in slotsList"
                  :key="slot"
                  type="button"
                  class="text-center px-1.5 py-1.5 rounded-lg font-medium transition-all border"
                  :class="[
                    compact ? 'text-xs' : 'w-full text-sm',
                    selectedSlot === slot ? 'text-white' : 'hover:opacity-80'
                  ]"
                  :style="selectedSlot === slot
                    ? { backgroundColor: brandColor, borderColor: brandColor, color: 'white' }
                    : { borderColor: brandColor, color: brandColor }"
                  @click="pickSlot(slot)"
                >
                  {{ slot }}
                </button>
              </div>
            </div>
          </div>

          <!-- Continue button shows once both date and slot are picked -->
          <div v-if="selectedDate && selectedSlot" class="mt-6 flex justify-end">
            <button
              type="button"
              class="px-6 py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90"
              :style="{ backgroundColor: brandColor }"
              @click="continueToForm"
            >
              Confirm date and time
            </button>
          </div>
        </template>

        <!-- ===== PAGE 2: ENTER DETAILS ===== -->
        <template v-else>
          <h3 class="text-base font-bold text-gray-900 mb-4">Enter Details</h3>

          <!-- Multi-location radio -->
          <div v-if="isMultiLocation" class="mb-4 pb-4 border-b border-gray-100">
            <label class="text-xs font-medium text-gray-700 block mb-2">Where would you like to meet?</label>
            <div class="space-y-1.5">
              <label
                v-for="(loc, idx) in config.additionalLocationOptions"
                :key="idx"
                class="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm"
                :class="pickedMultiLocationIdx === idx ? '' : 'border-gray-200 hover:bg-gray-50'"
                :style="pickedMultiLocationIdx === idx ? { borderColor: brandColor, backgroundColor: tintColor(brandColor, 0.08) } : {}"
              >
                <input
                  type="radio"
                  name="multi-location-picker"
                  :value="idx"
                  v-model="pickedMultiLocationIdx"
                  class="w-3.5 h-3.5 border-gray-300"
                />
                <span class="text-gray-700">{{ getLocationDisplayText(loc) || `Option ${idx + 1}` }}</span>
              </label>
            </div>
          </div>

          <!-- Ask-the-booker text input -->
          <div v-if="isAskBooker" class="mb-4 pb-4 border-b border-gray-100">
            <label class="text-xs font-medium text-gray-700 block mb-1.5">Where would you like to meet?</label>
            <input
              type="text"
              v-model="askBookerLocation"
              placeholder="Office, café, video call, etc."
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            />
          </div>

          <!-- Form: First Name + Last Name -->
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="text-xs font-medium text-gray-700 block mb-1">First Name <span class="text-red-500">*</span></label>
              <input type="text" v-model="firstName" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label class="text-xs font-medium text-gray-700 block mb-1">Last Name <span class="text-red-500">*</span></label>
              <input type="text" v-model="lastName" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <!-- Form: Phone + Email -->
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="text-xs font-medium text-gray-700 block mb-1">Phone <span class="text-red-500">*</span></label>
              <div class="flex border border-gray-300 rounded-lg overflow-hidden">
                <span class="flex items-center justify-center px-2 bg-gray-50 border-r border-gray-300 text-sm">🇮🇳</span>
                <input type="tel" v-model="phone" placeholder="081234 56789" class="flex-1 px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-700 block mb-1">Email <span class="text-red-500">*</span></label>
              <div class="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <span class="flex items-center justify-center px-2 text-gray-400">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                </span>
                <input type="email" v-model="email" class="flex-1 px-3 py-2 text-sm" />
              </div>
            </div>
          </div>

          <!-- Additional Information -->
          <div class="mb-3">
            <label class="text-xs font-medium text-gray-700 block mb-1">Additional Information</label>
            <textarea
              v-model="additionalInfo"
              placeholder="Is there anything you would like us to know before your appointment?"
              rows="3"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            ></textarea>
          </div>

          <!-- Consent -->
          <label class="flex items-start gap-2 cursor-pointer mb-4">
            <input type="checkbox" v-model="consentChecked" class="mt-0.5 w-4 h-4 text-primary-600 border-gray-300 rounded" />
            <span class="text-xs text-gray-600 leading-relaxed">
              I confirm that I want to receive content from this company using any contact information I provide.
            </span>
          </label>

          <!-- Add Guest section -->
          <div v-if="config.enableGuests" class="mb-4">
            <button
              type="button"
              class="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
              :style="{ color: brandColor, borderColor: brandColor }"
              @click="guestCount = guestCount + 1"
            >
              + Add Guest
            </button>
            <div v-if="guestCount > 0" class="mt-2 text-xs text-gray-500">
              {{ guestCount }} guest{{ guestCount === 1 ? '' : 's' }} added
              <span v-if="isClassShape" class="text-amber-700"> — fills {{ guestCount + 1 }} of your group seats</span>
              <span v-else class="text-gray-500"> — guests come along, no separate slot</span>
              <button class="ml-2 text-gray-500 underline" @click="guestCount = 0">Reset</button>
            </div>
          </div>

          <!-- Payment information section -->
          <div v-if="config.enablePayments && config.paymentAmount" class="mb-4 pt-4 border-t border-gray-200">
            <h4 class="text-sm font-bold text-gray-900 mb-2">Payment information</h4>
            <p class="text-xs text-gray-500">Stripe / payment fields would render here in production.</p>
          </div>

          <!-- Schedule Meeting CTA -->
          <div class="pt-4 flex justify-end">
            <button
              type="button"
              class="px-6 py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90"
              :style="{ backgroundColor: brandColor }"
            >
              Schedule Meeting
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
