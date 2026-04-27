<script lang="ts" setup>
import { ref, computed } from 'vue'
import type { Appointment } from '../../data/mockAppointments'
import { verticalColors, verticalLabels } from '../../composables/useAppSettings'

const props = defineProps<{
  appointments: Appointment[]
  isMultiVertical: boolean
}>()

const activeTab = ref('all')
const tabs = ['Upcoming', 'Active', 'Completed', 'Cancelled', 'All']
const searchQuery = ref('')

const filteredList = computed(() => {
  let list = [...props.appointments]
  if (activeTab.value === 'cancelled') list = list.filter(a => a.status === 'cancelled')
  else if (activeTab.value !== 'all') list = list.filter(a => a.status !== 'cancelled')
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(a => a.title.toLowerCase().includes(q) || a.contact.name.toLowerCase().includes(q))
  }
  return list.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
})

function formatTime(d: Date) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' +
    new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function statusClass(s: string) {
  if (s === 'confirmed') return 'bg-green-100 text-green-700'
  if (s === 'pending') return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
}

function paymentClass(s?: string) {
  if (s === 'paid') return 'text-green-600'
  if (s === 'pending') return 'text-orange-500'
  if (s === 'unpaid') return 'text-red-500'
  if (s === 'partial') return 'text-amber-500'
  return 'text-gray-400'
}
</script>

<template>
  <div class="p-6">
    <h2 class="text-xl font-bold text-gray-900 mb-4">Appointments</h2>

    <!-- Tabs -->
    <div class="flex items-center gap-1 mb-4 border-b border-gray-200">
      <button
        v-for="tab in tabs"
        :key="tab"
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px"
        :class="activeTab === tab.toLowerCase() ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'"
        @click="activeTab = tab.toLowerCase()"
      >
        {{ tab }}
      </button>
      <button class="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-600 -mb-px border-b-2 border-transparent">
        + Smart list
      </button>
      <div class="flex-1"></div>
      <button class="text-xs text-gray-400 hover:text-gray-600">⚙ Customize List</button>
    </div>

    <!-- Toolbar -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <button class="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5">
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
          Advanced Filters
        </button>
        <button class="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5">
          ↕ Sort by
        </button>
      </div>
      <div class="flex items-center gap-3">
        <div class="relative">
          <svg class="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by title"
            class="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg w-48"
          />
        </div>
        <button class="text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 flex items-center gap-1">
          ⊞ Manage Columns
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 w-10">#</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500">Title</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500">Contact</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500">Time</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500">Calendar / Service / Listing</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500">Assigned To</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500">Payment</th>
            <th v-if="isMultiVertical" class="text-left px-4 py-3 text-xs font-medium text-gray-500">Type</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 w-20">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(apt, idx) in filteredList"
            :key="apt.id"
            class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <td class="px-4 py-3 text-xs text-gray-400">{{ idx + 1 }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-1.5">
                <span class="text-xs">{{ apt.vertical === 'meetings' ? '💻' : apt.vertical === 'services' ? '✂️' : '🏠' }}</span>
                <span class="text-sm font-medium text-gray-900 truncate max-w-[200px]">{{ apt.title }}</span>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold" :class="apt.contact.color">
                  {{ apt.contact.initials }}
                </div>
                <div>
                  <div class="text-xs font-medium text-gray-900">{{ apt.contact.name }}</div>
                  <div class="text-[10px] text-gray-400">{{ apt.contact.email }}</div>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <span class="px-2 py-0.5 text-[10px] font-medium rounded-full capitalize" :class="statusClass(apt.status)">{{ apt.status }}</span>
            </td>
            <td class="px-4 py-3 text-xs text-gray-600">{{ formatTime(apt.startTime) }}</td>
            <td class="px-4 py-3">
              <div class="text-xs text-gray-900">{{ apt.calendarName || apt.serviceName || apt.listingName }}</div>
              <div class="text-[10px] text-gray-400">{{ apt.calendarName ? 'Calendar' : apt.serviceName ? 'Service' : 'Listing' }}</div>
            </td>
            <td class="px-4 py-3 text-xs text-gray-600">{{ apt.assignedTo }}</td>
            <td class="px-4 py-3">
              <span v-if="apt.paymentStatus" class="text-xs font-medium capitalize" :class="paymentClass(apt.paymentStatus)">{{ apt.paymentStatus }}</span>
              <span v-else class="text-xs text-gray-400">—</span>
            </td>
            <td v-if="isMultiVertical" class="px-4 py-3">
              <div class="flex items-center gap-1.5">
                <div class="w-2 h-2 rounded-full" :class="verticalColors[apt.vertical].dot"></div>
                <span class="text-xs text-gray-600">{{ verticalLabels[apt.vertical] }}</span>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-1">
                <button class="p-1 text-gray-400 hover:text-gray-600 rounded"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z"/></svg></button>
                <button class="p-1 text-gray-400 hover:text-gray-600 rounded"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                <button class="p-1 text-gray-400 hover:text-gray-600 rounded">⋯</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
