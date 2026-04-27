<script lang="ts" setup>
import { existingCalendars, type UnifiedCalendarConfig } from '../../data/mockCalendars'

const emit = defineEmits<{
  (e: 'edit', calendar: UnifiedCalendarConfig): void
}>()

const typeColors: Record<string, string> = {
  personal: 'bg-blue-100 text-blue-700',
  round_robin: 'bg-purple-100 text-purple-700',
  class_booking: 'bg-green-100 text-green-700',
  collective: 'bg-orange-100 text-orange-700',
  event: 'bg-gray-100 text-gray-700',
  service_booking: 'bg-teal-100 text-teal-700',
}

function getDerivedConfig(cal: UnifiedCalendarConfig) {
  const parts: string[] = []
  const staff = cal.teamMembers.length
  if (staff === 0) parts.push('No host')
  else if (staff === 1) parts.push('1 member')
  else parts.push(`${staff} members`)

  if (cal.assignmentStrategy === 'rotate') parts.push('Rotation')
  else if (cal.assignmentStrategy === 'collective') parts.push('All attend')

  if (cal.seatsPerSlot > 1) parts.push(`${cal.seatsPerSlot} seats`)
  if (cal.bookingBehavior === 'shared' && cal.seatsPerSlot > 1) parts.push('Shared')

  return parts.join(' / ')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <div class="max-w-[900px] mx-auto">
      <div class="mb-8">
        <h1 class="text-2xl font-semibold text-gray-900">Edit existing calendars</h1>
        <p class="text-gray-500 mt-2">
          These calendars were created with the old type system. Click any to open in the new unified editor.
          All settings are now freely modifiable.
        </p>
      </div>

      <!-- Migration explanation -->
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div class="text-sm font-medium text-blue-900">Auto-migration</div>
            <div class="text-sm text-blue-700 mt-0.5">
              Old calendar types are automatically mapped to the new composable model.
              The type label is preserved for reference, but all settings are now unlocked.
            </div>
          </div>
        </div>
      </div>

      <!-- Calendar list -->
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50">
              <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Name</th>
              <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Old Type</th>
              <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">New Config</th>
              <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Duration</th>
              <th class="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="cal in existingCalendars"
              :key="cal.id"
              class="hover:bg-gray-50 cursor-pointer transition-colors"
              @click="emit('edit', cal)"
            >
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    :style="{ backgroundColor: cal.eventColor }"
                  >
                    {{ cal.name[0] }}
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900">{{ cal.name }}</div>
                    <div class="text-xs text-gray-500">{{ cal.slug }}</div>
                  </div>
                </div>
              </td>
              <td class="px-5 py-3.5">
                <span
                  class="text-xs font-medium px-2 py-1 rounded-full"
                  :class="typeColors[cal._oldType || 'personal']"
                >
                  {{ cal._oldTypeLabel }}
                </span>
              </td>
              <td class="px-5 py-3.5">
                <span class="text-xs text-gray-600">{{ getDerivedConfig(cal) }}</span>
              </td>
              <td class="px-5 py-3.5">
                <span class="text-sm text-gray-600">{{ cal.meetingDuration }} min</span>
              </td>
              <td class="px-5 py-3.5 text-right">
                <button class="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  Edit
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
