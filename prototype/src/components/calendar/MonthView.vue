<script lang="ts" setup>
import { computed } from 'vue'
import type { Appointment } from '../../data/mockAppointments'

const props = defineProps<{
  appointments: Appointment[]
  currentDate: Date
  isMultiVertical: boolean
}>()

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const today = new Date()
today.setHours(0, 0, 0, 0)

/** All calendar grid days (35 or 42) with metadata */
const calendarDays = computed(() => {
  const year = props.currentDate.getFullYear()
  const month = props.currentDate.getMonth()

  // First and last day of the current month
  const firstOfMonth = new Date(year, month, 1)
  const lastOfMonth = new Date(year, month + 1, 0)

  // Day of week for the first of month (0 = Sun, 1 = Mon, ... 6 = Sat)
  // Convert to Monday-based index: Mon=0, Tue=1, ..., Sun=6
  const firstDow = (firstOfMonth.getDay() + 6) % 7

  // Grid start: go back to the Monday of the week containing the 1st
  const gridStart = new Date(year, month, 1 - firstDow)

  // Day of week for the last of month (Monday-based)
  const lastDow = (lastOfMonth.getDay() + 6) % 7

  // Grid end: go forward to the Sunday of the week containing the last day
  const gridEnd = new Date(
    lastOfMonth.getFullYear(),
    lastOfMonth.getMonth(),
    lastOfMonth.getDate() + (6 - lastDow)
  )

  // Total days in the grid
  const totalDays = Math.round(
    (gridEnd.getTime() - gridStart.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1

  const days: {
    date: Date
    dayOfMonth: number
    isCurrentMonth: boolean
    isToday: boolean
    key: string
  }[] = []

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    d.setHours(0, 0, 0, 0)

    days.push({
      date: d,
      dayOfMonth: d.getDate(),
      isCurrentMonth: d.getMonth() === month && d.getFullYear() === year,
      isToday: d.getTime() === today.getTime(),
      key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
    })
  }

  return days
})

/** Rows of 7 days each */
const weeks = computed(() => {
  const rows: (typeof calendarDays.value)[] = []
  const allDays = calendarDays.value
  for (let i = 0; i < allDays.length; i += 7) {
    rows.push(allDays.slice(i, i + 7))
  }
  return rows
})

/** Map from date key -> appointments on that day */
const appointmentsByDay = computed(() => {
  const map = new Map<string, Appointment[]>()

  for (const apt of props.appointments) {
    const start = new Date(apt.startTime)
    const end = new Date(apt.endTime)

    // Normalize to day boundaries
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())

    // Iterate through each day the appointment spans
    const current = new Date(startDay)
    while (current <= endDay) {
      const key = `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(apt)
      current.setDate(current.getDate() + 1)
    }
  }

  return map
})

function getAppointmentsForDay(day: typeof calendarDays.value[0]): Appointment[] {
  return appointmentsByDay.value.get(day.key) || []
}

function pillClass(vertical: string): string {
  if (vertical === 'meetings') return 'bg-blue-100 text-blue-700'
  if (vertical === 'services') return 'bg-emerald-100 text-emerald-700'
  if (vertical === 'rentals') return 'bg-purple-100 text-purple-700'
  return 'bg-gray-100 text-gray-700'
}
</script>

<template>
  <div class="h-full overflow-auto font-['Inter',sans-serif]">
    <div class="min-w-[700px]">
      <!-- Day-of-week headers -->
      <div class="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        <div
          v-for="label in dayLabels"
          :key="label"
          class="px-2 py-2 text-center text-xs font-medium text-gray-500 border-r border-gray-200 last:border-r-0"
        >
          {{ label }}
        </div>
      </div>

      <!-- Week rows -->
      <div
        v-for="(week, wIdx) in weeks"
        :key="'w-' + wIdx"
        class="grid grid-cols-7 border-b border-gray-200"
      >
        <div
          v-for="day in week"
          :key="day.key"
          class="min-h-[100px] border-r border-gray-200 last:border-r-0 p-1.5 flex flex-col"
          :class="day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'"
        >
          <!-- Day number -->
          <div class="flex items-center justify-start mb-1">
            <span
              v-if="day.isToday"
              class="bg-primary-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-semibold"
            >
              {{ day.dayOfMonth }}
            </span>
            <span
              v-else
              class="text-xs font-medium w-7 h-7 flex items-center justify-center"
              :class="day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'"
            >
              {{ day.dayOfMonth }}
            </span>
          </div>

          <!-- Appointment pills (max 3) -->
          <div class="flex flex-col gap-0.5 flex-1 min-w-0">
            <div
              v-for="apt in getAppointmentsForDay(day).slice(0, 3)"
              :key="apt.id"
              class="w-full px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-pointer hover:opacity-80 transition-opacity"
              :class="pillClass(apt.vertical)"
              :title="apt.title + ' - ' + apt.contact.name"
            >
              {{ apt.title }}
            </div>

            <!-- +N more indicator -->
            <div
              v-if="getAppointmentsForDay(day).length > 3"
              class="text-[10px] text-primary-600 font-medium px-1.5 cursor-pointer hover:underline"
            >
              +{{ getAppointmentsForDay(day).length - 3 }} more
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
