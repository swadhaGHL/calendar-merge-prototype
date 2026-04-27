<script lang="ts" setup>
import { computed } from 'vue'
import type { Appointment } from '../../data/mockAppointments'
import { mockResources } from '../../data/mockAppointments'
import { useAppSettings, verticalColors } from '../../composables/useAppSettings'

const props = defineProps<{
  appointments: Appointment[]
  currentDate: Date
  isMultiVertical: boolean
}>()

const { enabledVerticals } = useAppSettings()

const hours = Array.from({ length: 14 }, (_, i) => i + 7) // 7AM to 8PM
const HOUR_HEIGHT = 64 // px per hour

function formatHour(h: number): string {
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

// Determine which resource sections to show
const showStaff = computed(() => {
  if (props.isMultiVertical) return true
  const v = enabledVerticals.value
  return v.includes('meetings') || v.includes('services')
})

const showListings = computed(() => {
  if (props.isMultiVertical) return true
  const v = enabledVerticals.value
  return v.includes('rentals')
})

const staffResources = computed(() => (showStaff.value ? mockResources.staff : []))
const listingResources = computed(() => (showListings.value ? mockResources.listings : []))

// All visible resource columns in order
const allColumns = computed(() => {
  const cols: { name: string; initials: string; color: string; type: 'staff' | 'listing' }[] = []
  for (const s of staffResources.value) {
    cols.push({ ...s, type: 'staff' })
  }
  for (const l of listingResources.value) {
    cols.push({ ...l, type: 'listing' })
  }
  return cols
})

// Index where listings start (for separator rendering)
const listingsStartIndex = computed(() => staffResources.value.length)

// Get the start of the day for matching
const dayStart = computed(() => {
  const d = new Date(props.currentDate)
  d.setHours(0, 0, 0, 0)
  return d
})

const dayEnd = computed(() => {
  const d = new Date(props.currentDate)
  d.setHours(23, 59, 59, 999)
  return d
})

// Format the current day header
const dayLabel = computed(() => {
  const d = new Date(props.currentDate)
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
})

// Filter appointments that fall on the current day
const dayAppointments = computed(() => {
  return props.appointments.filter(a => {
    const start = new Date(a.startTime)
    const end = new Date(a.endTime)
    // Appointment overlaps with this day at all
    return start <= dayEnd.value && end >= dayStart.value
  })
})

// Get appointments for a specific resource column
function getColumnAppointments(resourceName: string): Appointment[] {
  return dayAppointments.value.filter(a => a.assignedTo === resourceName)
}

// Calculate position and height for an appointment block
function getAppointmentStyle(apt: Appointment) {
  const start = new Date(apt.startTime)
  const end = new Date(apt.endTime)

  // Clamp to the visible day range (7AM - 9PM)
  const visibleStart = new Date(props.currentDate)
  visibleStart.setHours(7, 0, 0, 0)
  const visibleEnd = new Date(props.currentDate)
  visibleEnd.setHours(21, 0, 0, 0)

  const effectiveStart = start < visibleStart ? visibleStart : start
  const effectiveEnd = end > visibleEnd ? visibleEnd : end

  const startHour = effectiveStart.getHours()
  const startMinute = effectiveStart.getMinutes()
  const endHour = effectiveEnd.getHours()
  const endMinute = effectiveEnd.getMinutes()

  const top = (startHour - 7) * HOUR_HEIGHT + (startMinute / 60) * HOUR_HEIGHT
  const durationHours = (endHour - startHour) + (endMinute - startMinute) / 60
  const height = Math.max(durationHours * HOUR_HEIGHT, 24)

  return {
    top: `${top}px`,
    height: `${height}px`,
  }
}

// Color classes per vertical type
function getBlockClasses(vertical: string) {
  if (vertical === 'meetings') return 'bg-blue-100 border-l-[3px] border-blue-400 text-blue-800'
  if (vertical === 'services') return 'bg-emerald-100 border-l-[3px] border-emerald-400 text-emerald-800'
  if (vertical === 'rentals') return 'bg-purple-100 border-l-[3px] border-purple-400 text-purple-800'
  return 'bg-gray-100 border-l-[3px] border-gray-400 text-gray-800'
}

function paymentBadgeClass(status?: string) {
  if (status === 'paid') return 'bg-green-100 text-green-700'
  if (status === 'unpaid') return 'bg-red-100 text-red-700'
  if (status === 'pending') return 'bg-yellow-100 text-yellow-700'
  if (status === 'partial') return 'bg-amber-100 text-amber-700'
  return ''
}

function formatTimeRange(apt: Appointment) {
  const start = new Date(apt.startTime)
  const end = new Date(apt.endTime)
  const fmt = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${fmt(start)} - ${fmt(end)}`
}

// Check if current day is today
const isToday = computed(() => {
  const today = new Date()
  const d = new Date(props.currentDate)
  return (
    today.getFullYear() === d.getFullYear() &&
    today.getMonth() === d.getMonth() &&
    today.getDate() === d.getDate()
  )
})

// Current time indicator position (only shown if viewing today)
const currentTimeTop = computed(() => {
  if (!isToday.value) return null
  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes()
  if (h < 7 || h > 20) return null
  return (h - 7) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT
})

// Grid template columns CSS
const gridTemplateColumns = computed(() => {
  const timeLabelWidth = '60px'
  const colDefs: string[] = [timeLabelWidth]

  if (props.isMultiVertical && showStaff.value && showListings.value) {
    // Staff columns
    for (let i = 0; i < staffResources.value.length; i++) {
      colDefs.push('1fr')
    }
    // Separator column
    colDefs.push('1px')
    // Listings columns
    for (let i = 0; i < listingResources.value.length; i++) {
      colDefs.push('1fr')
    }
  } else {
    // Single vertical mode or only one section visible
    for (let i = 0; i < allColumns.value.length; i++) {
      colDefs.push('1fr')
    }
  }

  return colDefs.join(' ')
})

// Total content height for the time grid
const gridHeight = computed(() => hours.length * HOUR_HEIGHT)
</script>

<template>
  <div class="h-full flex flex-col font-['Inter',sans-serif]">
    <!-- Day header label -->
    <div class="bg-white border-b border-gray-200 px-4 py-2 flex-shrink-0">
      <div class="text-sm font-semibold text-gray-900" :class="{ 'text-blue-600': isToday }">
        {{ dayLabel }}
      </div>
    </div>

    <!-- Scrollable container -->
    <div class="flex-1 overflow-auto">
      <!-- Resource column headers -->
      <div
        class="sticky top-0 z-20 bg-white border-b border-gray-200"
        :style="{ display: 'grid', gridTemplateColumns }"
      >
        <!-- Time label corner -->
        <div class="px-2 py-3 text-[10px] text-gray-400 border-r border-gray-200 flex items-end justify-end pr-3">
          GMT<br>+05:30
        </div>

        <template v-if="isMultiVertical && showStaff && showListings">
          <!-- Staff section header group -->
          <div
            v-for="(resource, idx) in staffResources"
            :key="'staff-hdr-' + idx"
            class="px-3 py-2 border-r border-gray-100 text-center"
          >
            <div v-if="idx === 0" class="text-[9px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Staff</div>
            <div v-else class="text-[9px] mb-1">&nbsp;</div>
            <div class="flex items-center justify-center gap-2">
              <div
                class="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                :class="resource.color"
              >
                {{ resource.initials }}
              </div>
              <span class="text-xs font-medium text-gray-700 truncate">{{ resource.name }}</span>
            </div>
          </div>

          <!-- Separator -->
          <div class="bg-gray-300"></div>

          <!-- Listings section header group -->
          <div
            v-for="(resource, idx) in listingResources"
            :key="'listing-hdr-' + idx"
            class="px-3 py-2 border-r border-gray-100 text-center"
          >
            <div v-if="idx === 0" class="text-[9px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Listings</div>
            <div v-else class="text-[9px] mb-1">&nbsp;</div>
            <div class="flex items-center justify-center gap-2">
              <div
                class="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                :class="resource.color"
              >
                {{ resource.initials }}
              </div>
              <span class="text-xs font-medium text-gray-700 truncate">{{ resource.name }}</span>
            </div>
          </div>
        </template>

        <template v-else>
          <!-- Single vertical mode: no separator -->
          <div
            v-for="(resource, idx) in allColumns"
            :key="'col-hdr-' + idx"
            class="px-3 py-2 border-r border-gray-100 text-center"
          >
            <div class="flex items-center justify-center gap-2">
              <div
                class="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                :class="resource.color"
              >
                {{ resource.initials }}
              </div>
              <span class="text-xs font-medium text-gray-700 truncate">{{ resource.name }}</span>
            </div>
          </div>
        </template>
      </div>

      <!-- Time grid body -->
      <div class="relative" :style="{ minHeight: gridHeight + 'px' }">
        <!-- Hour row lines and labels -->
        <div
          :style="{ display: 'grid', gridTemplateColumns }"
          class="absolute inset-0"
        >
          <template v-for="hour in hours" :key="'row-' + hour">
            <!-- Time label -->
            <div
              class="border-b border-gray-100 text-right pr-3 border-r border-gray-200"
              :style="{ height: HOUR_HEIGHT + 'px', gridColumn: '1' }"
            >
              <span class="text-[10px] text-gray-400 leading-none relative -top-[6px]">{{ formatHour(hour) }}</span>
            </div>

            <template v-if="isMultiVertical && showStaff && showListings">
              <!-- Staff column cells -->
              <div
                v-for="(_, sIdx) in staffResources"
                :key="'cell-staff-' + hour + '-' + sIdx"
                class="border-b border-gray-100 border-r border-gray-50"
                :style="{ height: HOUR_HEIGHT + 'px' }"
              ></div>
              <!-- Separator cell -->
              <div
                class="bg-gray-200"
                :style="{ height: HOUR_HEIGHT + 'px' }"
              ></div>
              <!-- Listings column cells -->
              <div
                v-for="(_, lIdx) in listingResources"
                :key="'cell-listing-' + hour + '-' + lIdx"
                class="border-b border-gray-100 border-r border-gray-50"
                :style="{ height: HOUR_HEIGHT + 'px' }"
              ></div>
            </template>

            <template v-else>
              <div
                v-for="(_, cIdx) in allColumns"
                :key="'cell-' + hour + '-' + cIdx"
                class="border-b border-gray-100 border-r border-gray-50"
                :style="{ height: HOUR_HEIGHT + 'px' }"
              ></div>
            </template>
          </template>
        </div>

        <!-- Current time indicator -->
        <div
          v-if="currentTimeTop !== null"
          class="absolute z-10 pointer-events-none"
          :style="{ top: currentTimeTop + 'px', left: '60px', right: 0 }"
        >
          <div class="flex items-center">
            <div class="w-2.5 h-2.5 rounded-full bg-red-500 -ml-[5px]"></div>
            <div class="flex-1 h-[2px] bg-red-500"></div>
          </div>
        </div>

        <!-- Appointment blocks overlay -->
        <div
          class="absolute pointer-events-none"
          :style="{ display: 'grid', gridTemplateColumns, top: 0, left: 0, right: 0, bottom: 0 }"
        >
          <!-- Skip time label column -->
          <div></div>

          <template v-if="isMultiVertical && showStaff && showListings">
            <!-- Staff resource columns -->
            <div
              v-for="(resource, sIdx) in staffResources"
              :key="'blocks-staff-' + sIdx"
              class="relative"
            >
              <div
                v-for="apt in getColumnAppointments(resource.name)"
                :key="apt.id"
                class="absolute left-1 right-1 rounded-md px-2 py-1.5 overflow-hidden pointer-events-auto cursor-pointer hover:shadow-md transition-shadow"
                :class="getBlockClasses(apt.vertical)"
                :style="getAppointmentStyle(apt)"
              >
                <div class="text-[11px] font-semibold truncate leading-tight">{{ apt.title }}</div>
                <div class="text-[10px] opacity-80 truncate mt-0.5">{{ apt.contact.name }}</div>
                <div class="text-[9px] opacity-70 truncate">{{ formatTimeRange(apt) }}</div>
                <span
                  v-if="apt.paymentStatus"
                  class="text-[8px] uppercase font-bold px-1.5 py-0.5 rounded mt-1 inline-block"
                  :class="paymentBadgeClass(apt.paymentStatus)"
                >
                  {{ apt.paymentStatus }}
                </span>
              </div>
            </div>

            <!-- Separator -->
            <div></div>

            <!-- Listing resource columns -->
            <div
              v-for="(resource, lIdx) in listingResources"
              :key="'blocks-listing-' + lIdx"
              class="relative"
            >
              <div
                v-for="apt in getColumnAppointments(resource.name)"
                :key="apt.id"
                class="absolute left-1 right-1 rounded-md px-2 py-1.5 overflow-hidden pointer-events-auto cursor-pointer hover:shadow-md transition-shadow"
                :class="getBlockClasses(apt.vertical)"
                :style="getAppointmentStyle(apt)"
              >
                <div class="text-[11px] font-semibold truncate leading-tight">{{ apt.title }}</div>
                <div class="text-[10px] opacity-80 truncate mt-0.5">{{ apt.contact.name }}</div>
                <div class="text-[9px] opacity-70 truncate">{{ formatTimeRange(apt) }}</div>
                <span
                  v-if="apt.paymentStatus"
                  class="text-[8px] uppercase font-bold px-1.5 py-0.5 rounded mt-1 inline-block"
                  :class="paymentBadgeClass(apt.paymentStatus)"
                >
                  {{ apt.paymentStatus }}
                </span>
              </div>
            </div>
          </template>

          <template v-else>
            <!-- Single vertical mode columns -->
            <div
              v-for="(resource, cIdx) in allColumns"
              :key="'blocks-' + cIdx"
              class="relative"
            >
              <div
                v-for="apt in getColumnAppointments(resource.name)"
                :key="apt.id"
                class="absolute left-1 right-1 rounded-md px-2 py-1.5 overflow-hidden pointer-events-auto cursor-pointer hover:shadow-md transition-shadow"
                :class="getBlockClasses(apt.vertical)"
                :style="getAppointmentStyle(apt)"
              >
                <div class="text-[11px] font-semibold truncate leading-tight">{{ apt.title }}</div>
                <div class="text-[10px] opacity-80 truncate mt-0.5">{{ apt.contact.name }}</div>
                <div class="text-[9px] opacity-70 truncate">{{ formatTimeRange(apt) }}</div>
                <span
                  v-if="apt.paymentStatus"
                  class="text-[8px] uppercase font-bold px-1.5 py-0.5 rounded mt-1 inline-block"
                  :class="paymentBadgeClass(apt.paymentStatus)"
                >
                  {{ apt.paymentStatus }}
                </span>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
