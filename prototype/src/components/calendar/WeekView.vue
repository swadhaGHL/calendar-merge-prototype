<script lang="ts" setup>
import { computed } from 'vue'
import type { Appointment } from '../../data/mockAppointments'
import { verticalColors } from '../../composables/useAppSettings'

const props = defineProps<{
  appointments: Appointment[]
  weekStart: Date
  isMultiVertical: boolean
}>()

const hours = Array.from({ length: 14 }, (_, i) => i + 7) // 7AM to 8PM

const days = computed(() => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(props.weekStart)
    d.setDate(d.getDate() + i)
    return d
  })
})

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatHour(h: number): string {
  if (h === 0) return '12AM'
  if (h < 12) return `${h}AM`
  if (h === 12) return '12PM'
  return `${h - 12}PM`
}

// Get appointments for a specific day (non-multi-day only)
function getTimedAppointments(dayIndex: number) {
  const dayDate = days.value[dayIndex]
  return props.appointments.filter(a => {
    const start = new Date(a.startTime)
    const end = new Date(a.endTime)
    const dayStart = new Date(dayDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayDate)
    dayEnd.setHours(23, 59, 59, 999)

    // Multi-day events handled separately
    const durationDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    if (durationDays > 1) return false

    return start >= dayStart && start <= dayEnd
  })
}

// Get multi-day appointments
const multiDayAppointments = computed(() => {
  return props.appointments.filter(a => {
    const start = new Date(a.startTime)
    const end = new Date(a.endTime)
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) > 1
  })
})

function getAppointmentStyle(apt: Appointment) {
  const start = new Date(apt.startTime)
  const end = new Date(apt.endTime)
  const startMinutes = (start.getHours() - 7) * 60 + start.getMinutes()
  const duration = (end.getTime() - start.getTime()) / (1000 * 60)
  const top = (startMinutes / 60) * 64 // 64px per hour
  const height = Math.max((duration / 60) * 64, 24)
  return { top: `${top}px`, height: `${height}px` }
}

function getMultiDayStyle(apt: Appointment) {
  const start = new Date(apt.startTime)
  const end = new Date(apt.endTime)
  const wsTime = props.weekStart.getTime()

  const startDay = Math.max(0, Math.floor((start.getTime() - wsTime) / (1000 * 60 * 60 * 24)))
  const endDay = Math.min(6, Math.floor((end.getTime() - wsTime) / (1000 * 60 * 60 * 24)))
  const span = endDay - startDay + 1

  return {
    gridColumnStart: startDay + 2, // +2 because col 1 is time labels
    gridColumnEnd: startDay + 2 + span,
  }
}

function getBlockColors(vertical: string) {
  const c = verticalColors[vertical as keyof typeof verticalColors]
  if (vertical === 'meetings') return 'bg-blue-500 text-white'
  if (vertical === 'services') return 'bg-emerald-500 text-white'
  if (vertical === 'rentals') return 'bg-purple-500 text-white'
  return 'bg-gray-400 text-white'
}

function getMultiDayColors(vertical: string) {
  if (vertical === 'rentals') return 'bg-purple-400/90 text-white'
  if (vertical === 'services') return 'bg-emerald-400/90 text-white'
  return 'bg-blue-400/90 text-white'
}

function paymentBadgeClass(status?: string) {
  if (status === 'paid') return 'bg-green-400/30 text-green-100'
  if (status === 'unpaid') return 'bg-red-400/30 text-red-100'
  if (status === 'pending') return 'bg-yellow-400/30 text-yellow-100'
  return ''
}
</script>

<template>
  <div class="h-full overflow-auto">
    <!-- Multi-day events bar -->
    <div v-if="multiDayAppointments.length" class="grid border-b border-gray-200 bg-gray-50" :style="{ gridTemplateColumns: '60px repeat(7, 1fr)' }">
      <div class="p-1 text-[10px] text-gray-400 flex items-end pb-2">
        GMT<br>+05:30
      </div>
      <!-- Day headers -->
      <div
        v-for="(day, i) in days"
        :key="'h-' + i"
        class="px-2 pt-2 text-center border-l border-gray-200"
      >
        <div class="text-xs font-medium" :class="day.toDateString() === new Date().toDateString() ? 'text-primary-600' : 'text-gray-500'">
          {{ day.getDate() }} {{ dayLabels[i] }}
        </div>
      </div>

      <!-- Multi-day blocks -->
      <template v-for="apt in multiDayAppointments" :key="apt.id">
        <div
          class="mx-1 my-0.5 px-2 py-1 rounded text-[10px] font-medium truncate"
          :class="getMultiDayColors(apt.vertical)"
          :style="getMultiDayStyle(apt)"
        >
          <span class="mr-1">{{ apt.vertical === 'rentals' ? '🏠' : apt.vertical === 'services' ? '✂️' : '💻' }}</span>
          {{ apt.title }}
          <span class="opacity-80 ml-1">· Guest: {{ apt.contact.name }}</span>
          <span v-if="apt.paymentStatus" class="ml-1 px-1 rounded text-[8px] uppercase font-bold" :class="paymentBadgeClass(apt.paymentStatus)">
            {{ apt.paymentStatus }}
          </span>
        </div>
      </template>
    </div>

    <!-- Time Grid -->
    <div class="grid" :style="{ gridTemplateColumns: '60px repeat(7, 1fr)' }">
      <!-- Day column headers (if no multi-day events) -->
      <template v-if="!multiDayAppointments.length">
        <div class="p-2 text-[10px] text-gray-400 border-b border-gray-200 bg-gray-50">
          GMT<br>+05:30
        </div>
        <div
          v-for="(day, i) in days"
          :key="'hdr-' + i"
          class="px-2 py-2 text-center border-l border-b border-gray-200 bg-gray-50"
        >
          <div class="text-xs font-medium" :class="day.toDateString() === new Date().toDateString() ? 'text-primary-600' : 'text-gray-500'">
            {{ day.getDate() }} {{ dayLabels[i] }}
          </div>
        </div>
      </template>

      <!-- Hour rows -->
      <template v-for="hour in hours" :key="hour">
        <!-- Time label -->
        <div class="h-16 border-b border-gray-100 px-2 text-right pr-3 pt-0">
          <span class="text-[10px] text-gray-400 -mt-2 block">{{ formatHour(hour) }}</span>
        </div>
        <!-- Day cells -->
        <div
          v-for="(day, dayIdx) in days"
          :key="'cell-' + hour + '-' + dayIdx"
          class="h-16 border-b border-l border-gray-100 relative"
          :class="day.toDateString() === new Date().toDateString() ? 'bg-blue-50/30' : ''"
        >
        </div>
      </template>
    </div>

    <!-- Positioned appointment blocks (overlay) -->
    <div class="absolute grid pointer-events-none" :style="{ gridTemplateColumns: '60px repeat(7, 1fr)', top: multiDayAppointments.length ? '66px' : '34px', left: 0, right: 0 }">
      <!-- Spacer for time column -->
      <div></div>
      <!-- Day columns with positioned blocks -->
      <div
        v-for="(day, dayIdx) in days"
        :key="'blocks-' + dayIdx"
        class="relative border-l border-transparent"
      >
        <div
          v-for="apt in getTimedAppointments(dayIdx)"
          :key="apt.id"
          class="absolute left-1 right-1 rounded-lg px-2 py-1.5 overflow-hidden pointer-events-auto cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
          :class="getBlockColors(apt.vertical)"
          :style="getAppointmentStyle(apt)"
        >
          <div class="flex items-center gap-1 text-[10px] font-medium">
            <span>{{ apt.vertical === 'rentals' ? '🏠' : apt.vertical === 'services' ? '✂️' : '💻' }}</span>
            <span class="font-semibold truncate">{{ apt.title }}</span>
          </div>
          <div class="text-[9px] opacity-90 truncate mt-0.5">
            👤 {{ apt.contact.name }}
          </div>
          <div v-if="apt.serviceName" class="text-[9px] opacity-80 truncate">
            ✂️ {{ apt.serviceName }}
          </div>
          <div v-if="apt.location" class="text-[9px] opacity-80 truncate">
            📍 {{ apt.location }}
          </div>
          <span
            v-if="apt.paymentStatus"
            class="text-[8px] uppercase font-bold px-1 rounded mt-0.5 inline-block"
            :class="paymentBadgeClass(apt.paymentStatus)"
          >
            {{ apt.paymentStatus }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
