<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { existingCalendars } from '../../data/mockCalendars'

const router = useRouter()
const activeSubTab = ref<'calendars' | 'preferences' | 'calendar-availability'>('calendars')

// Groups sidebar data
const groups = ref([
  { name: 'Not Grouped', count: 85, key: 'not-grouped' },
  { name: 'Nice', count: 3, key: 'nice' },
  { name: 'Service Cal', count: 0, key: 'service-cal' },
  { name: 'Consultations', count: 1, key: 'consultations' },
  { name: 'Tax Related Meeting', count: 6, key: 'tax-related' },
  { name: 'Exploration', count: 1, key: 'exploration' },
])
const activeGroup = ref<string | null>(null)

// Filters
const statusFilter = ref('all')
const typeFilter = ref('all')
const ownerFilter = ref('anyone')
const searchQuery = ref('')

// Extended mock calendars for the table
interface CalendarRow {
  id: string
  name: string
  calId: string
  group: string
  duration: string
  type: string
  typeLabel: string
  status: 'active' | 'inactive'
  dateUpdated: string
}

const allCalendars: CalendarRow[] = [
  ...existingCalendars.map(c => ({
    id: c.id,
    name: c.name,
    calId: c.slug,
    group: c.groupId || 'Not Grouped',
    duration: `${c.meetingDuration} mins`,
    type: c._oldType || 'event',
    typeLabel: c._oldTypeLabel || 'Event',
    status: 'active' as const,
    dateUpdated: 'Feb 28, 2026',
  })),
  { id: 'cal-7', name: 'Quick Sync', calId: 'quick-sync', group: 'Not Grouped', duration: '15 mins', type: 'personal', typeLabel: 'Personal Booking', status: 'active', dateUpdated: 'Feb 25, 2026' },
  { id: 'cal-8', name: 'Design Review', calId: 'design-review', group: 'Nice', duration: '60 mins', type: 'round_robin', typeLabel: 'Round Robin', status: 'active', dateUpdated: 'Feb 20, 2026' },
  { id: 'cal-9', name: 'Tax Filing Consultation', calId: 'tax-filing', group: 'Tax Related Meeting', duration: '45 mins', type: 'personal', typeLabel: 'Personal Booking', status: 'active', dateUpdated: 'Feb 18, 2026' },
  { id: 'cal-10', name: 'Sprint Planning', calId: 'sprint-plan', group: 'Not Grouped', duration: '90 mins', type: 'collective', typeLabel: 'Collective Booking', status: 'inactive', dateUpdated: 'Feb 15, 2026' },
  { id: 'cal-11', name: 'Career Exploration Call', calId: 'career-explore', group: 'Exploration', duration: '30 mins', type: 'personal', typeLabel: 'Personal Booking', status: 'active', dateUpdated: 'Feb 12, 2026' },
  { id: 'cal-12', name: 'Advanced Tax Seminar', calId: 'tax-seminar', group: 'Tax Related Meeting', duration: '120 mins', type: 'class_booking', typeLabel: 'Class Booking', status: 'active', dateUpdated: 'Feb 10, 2026' },
  { id: 'cal-13', name: 'Investor Demo Day', calId: 'investor-demo', group: 'Not Grouped', duration: '60 mins', type: 'event', typeLabel: 'Event Calendar', status: 'active', dateUpdated: 'Feb 08, 2026' },
  { id: 'cal-14', name: 'Wellness Check-In', calId: 'wellness-check', group: 'Consultations', duration: '20 mins', type: 'personal', typeLabel: 'Personal Booking', status: 'inactive', dateUpdated: 'Feb 05, 2026' },
  { id: 'cal-15', name: 'Quarterly Business Review', calId: 'qbr', group: 'Nice', duration: '60 mins', type: 'collective', typeLabel: 'Collective Booking', status: 'active', dateUpdated: 'Feb 02, 2026' },
  { id: 'cal-16', name: 'Onboarding Session', calId: 'onboarding', group: 'Not Grouped', duration: '30 mins', type: 'round_robin', typeLabel: 'Round Robin', status: 'active', dateUpdated: 'Jan 30, 2026' },
]

const filteredCalendars = computed(() => {
  let result = [...allCalendars]

  if (activeGroup.value) {
    result = result.filter(c => c.group === activeGroup.value)
  }

  if (statusFilter.value !== 'all') {
    result = result.filter(c => c.status === statusFilter.value)
  }
  if (typeFilter.value !== 'all') {
    result = result.filter(c => c.type === typeFilter.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(c => c.name.toLowerCase().includes(q) || c.calId.toLowerCase().includes(q))
  }
  return result
})

const totalCount = computed(() => allCalendars.length)

function getTypeBadgeClass(type: string) {
  switch (type) {
    case 'personal': return 'bg-blue-50 text-blue-700'
    case 'round_robin': return 'bg-amber-50 text-amber-700'
    case 'class_booking': return 'bg-purple-50 text-purple-700'
    case 'collective': return 'bg-teal-50 text-teal-700'
    case 'event': return 'bg-gray-100 text-gray-700'
    case 'service_booking': return 'bg-emerald-50 text-emerald-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

function navigateToNew() {
  router.push('/setup/meetings/new')
}

function navigateToEdit(calId: string) {
  router.push('/setup/meetings/' + calId)
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Sub-tabs -->
    <div class="bg-white border-b border-gray-200 px-6 flex-shrink-0">
      <div class="flex items-center gap-1 -mb-px">
        <button
          class="px-4 py-3 text-xs font-medium border-b-2 transition-colors"
          :class="activeSubTab === 'calendars' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'"
          @click="activeSubTab = 'calendars'"
        >
          Calendars
        </button>
        <button
          class="px-4 py-3 text-xs font-medium border-b-2 transition-colors"
          :class="activeSubTab === 'preferences' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'"
          @click="activeSubTab = 'preferences'"
        >
          Preferences
        </button>
        <button
          class="px-4 py-3 text-xs font-medium border-b-2 transition-colors"
          :class="activeSubTab === 'calendar-availability' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'"
          @click="activeSubTab = 'calendar-availability'"
        >
          Calendar Availability
        </button>
      </div>
    </div>

    <!-- Content -->
    <div v-if="activeSubTab === 'calendars'" class="flex-1 flex overflow-hidden">
      <!-- Groups Sidebar -->
      <div class="w-[200px] bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
        <div class="p-3">
          <button
            class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors mb-0.5"
            :class="!activeGroup ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'"
            @click="activeGroup = null"
          >
            <span>All Calendars</span>
            <span class="text-[10px] text-gray-400 font-normal">{{ totalCount }}</span>
          </button>
          <button
            v-for="g in groups"
            :key="g.key"
            class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors mb-0.5"
            :class="activeGroup === g.name ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'"
            @click="activeGroup = g.name"
          >
            <span class="truncate">{{ g.name }}</span>
            <span class="text-[10px] font-normal ml-1" :class="activeGroup === g.name ? 'text-primary-500' : 'text-gray-400'">{{ String(g.count).padStart(2, '0') }}</span>
          </button>
          <button class="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-primary-600 font-medium hover:bg-primary-50 rounded-lg transition-colors mt-1">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
            New Group
          </button>
        </div>
      </div>

      <!-- Calendar Table -->
      <div class="flex-1 overflow-auto p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-semibold text-gray-900">
            {{ activeGroup || 'All Calendars' }}
            <span class="text-sm font-normal text-gray-500 ml-1">({{ filteredCalendars.length }})</span>
          </h2>
          <button
            class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
            @click="navigateToNew"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
            New Calendar
          </button>
        </div>

        <!-- Filters Row -->
        <div class="flex items-center gap-3 mb-4">
          <div class="flex items-center gap-2">
            <label class="text-xs text-gray-500">Status:</label>
            <select v-model="statusFilter" class="appearance-none bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 pr-7 cursor-pointer">
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-gray-500">Type:</label>
            <select v-model="typeFilter" class="appearance-none bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 pr-7 cursor-pointer">
              <option value="all">All</option>
              <option value="personal">Personal Booking</option>
              <option value="round_robin">Round Robin</option>
              <option value="class_booking">Class Booking</option>
              <option value="collective">Collective Booking</option>
              <option value="event">Event Calendar</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-gray-500">Owned by:</label>
            <select v-model="ownerFilter" class="appearance-none bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 pr-7 cursor-pointer">
              <option value="anyone">Anyone</option>
              <option value="me">Me</option>
            </select>
          </div>
          <div class="flex-1"></div>
          <div class="relative">
            <svg class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search calendars..."
              class="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-700 w-56 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <!-- Table -->
        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200">
                <th class="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Calendar Name</th>
                <th class="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Group</th>
                <th class="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                <th class="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th class="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th class="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Date Updated</th>
                <th class="text-right px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="cal in filteredCalendars"
                :key="cal.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-4 py-3">
                  <div>
                    <p class="text-xs font-medium text-gray-900">{{ cal.name }}</p>
                    <p class="text-[10px] text-gray-400 mt-0.5">{{ cal.calId }}</p>
                  </div>
                </td>
                <td class="px-4 py-3 text-xs text-gray-600">{{ cal.group }}</td>
                <td class="px-4 py-3 text-xs text-gray-600">{{ cal.duration }}</td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                    :class="getTypeBadgeClass(cal.type)"
                  >
                    {{ cal.typeLabel }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                    :class="cal.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                  >
                    <span
                      class="w-1.5 h-1.5 rounded-full mr-1"
                      :class="cal.status === 'active' ? 'bg-green-500' : 'bg-red-500'"
                    ></span>
                    {{ cal.status === 'active' ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-xs text-gray-500">{{ cal.dateUpdated }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-1">
                    <div class="relative group/tip">
                      <button
                        class="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                        aria-label="Edit calendar"
                        @click="navigateToEdit(cal.id)"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <span class="pointer-events-none absolute z-20 -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-medium px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity">Edit</span>
                    </div>
                    <div class="relative group/tip">
                      <button
                        class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        aria-label="Copy share link"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                      </button>
                      <span class="pointer-events-none absolute z-20 -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-medium px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity">Share link</span>
                    </div>
                    <div class="relative group/tip">
                      <button
                        class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        aria-label="Get embed code"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                      </button>
                      <span class="pointer-events-none absolute z-20 -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-medium px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity">Embed code</span>
                    </div>
                    <div class="relative group/tip">
                      <button
                        class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        aria-label="More actions"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                      </button>
                      <span class="pointer-events-none absolute z-20 -top-7 right-0 bg-gray-900 text-white text-[10px] font-medium px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity">More actions</span>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Empty State -->
          <div v-if="filteredCalendars.length === 0" class="py-12 text-center">
            <p class="text-sm text-gray-500">No calendars found matching your filters.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Preferences placeholder -->
    <div v-else-if="activeSubTab === 'preferences'" class="flex-1 p-6">
      <div class="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <svg class="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        <h3 class="text-sm font-medium text-gray-900 mb-1">Meeting Preferences</h3>
        <p class="text-xs text-gray-500">Configure global meeting preferences, notification templates, and booking confirmation settings.</p>
      </div>
    </div>

    <!-- Calendar Availability placeholder -->
    <div v-else class="flex-1 p-6">
      <div class="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <svg class="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <h3 class="text-sm font-medium text-gray-900 mb-1">Calendar Availability</h3>
        <p class="text-xs text-gray-500">Set per-calendar availability overrides and conflict rules.</p>
      </div>
    </div>
  </div>
</template>
