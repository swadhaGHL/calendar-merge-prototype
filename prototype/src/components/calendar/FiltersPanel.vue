<script lang="ts" setup>
import { ref } from 'vue'
import { useAppSettings } from '../../composables/useAppSettings'

defineEmits<{ (e: 'close'): void }>()
const { isMultiVertical } = useAppSettings()

const viewByType = ref('all')

const filterSections = [
  { key: 'users', label: 'Users', count: 2, items: [
    { label: 'Abhishek Chauhan', checked: true },
    { label: 'Swadha Bhoj', checked: true },
    { label: 'ajay sai397', checked: false },
    { label: 'Hannah Smith', checked: false },
  ]},
  { key: 'calendars', label: 'Calendars', count: 2, items: [
    { label: 'Default Calendar', checked: true },
    { label: 'Team Calendar', checked: true },
    { label: 'Personal', checked: false },
  ]},
  { key: 'groups', label: 'Groups', count: 1, items: [
    { label: 'Sales Team', checked: true },
    { label: 'Engineering', checked: false },
  ]},
  { key: 'staff', label: 'Staff', count: 3, items: [
    { label: 'Hannah Smith', checked: true, color: 'bg-green-500' },
    { label: 'Jane Doe', checked: true, color: 'bg-yellow-500' },
    { label: 'Mathew Jane', checked: true, color: 'bg-amber-500' },
  ]},
  { key: 'services', label: 'Services', count: 6, items: [
    { label: 'Haircut', checked: true },
    { label: 'Gel Polish', checked: true },
    { label: 'Hair Spa', checked: true },
    { label: 'Facial Treatment', checked: true },
    { label: 'Deep Tissue Massage', checked: true },
    { label: 'Manicure', checked: true },
  ]},
  { key: 'categories', label: 'Categories', count: 3, items: [
    { label: 'Hair', checked: true },
    { label: 'Nails', checked: true },
    { label: 'Body & Wellness', checked: true },
  ]},
  { key: 'listings', label: 'Listings', count: 3, items: [
    { label: 'Standard Villa', checked: true },
    { label: 'Whispering Grove Villa', checked: true },
    { label: 'Tesla Model Y', checked: true },
    { label: 'Lake House Cabin', checked: false },
  ]},
  { key: 'status', label: 'Status', count: 2, items: [
    { label: 'Confirmed', checked: true },
    { label: 'Pending', checked: true },
    { label: 'Cancelled', checked: false },
  ]},
  { key: 'payment', label: 'Payment Status', count: 3, items: [
    { label: 'Paid', checked: true },
    { label: 'Pending', checked: true },
    { label: 'Unpaid', checked: true },
  ]},
]

const collapsed = ref<Record<string, boolean>>({})
function toggle(key: string) { collapsed.value[key] = !collapsed.value[key] }
</script>

<template>
  <div class="w-[320px] bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
    <div class="p-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-gray-900">Manage View</h3>
        <button class="text-gray-400 hover:text-gray-600" @click="$emit('close')">✕</button>
      </div>

      <!-- View By Type -->
      <div class="mb-5">
        <div class="text-xs font-medium text-gray-500 mb-2">View By Type</div>
        <div class="space-y-2">
          <label v-for="opt in ['All', 'Appointments', 'Blocked Slots']" :key="opt" class="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="viewType" :value="opt.toLowerCase().replace(' ', '_')" v-model="viewByType" class="w-4 h-4 text-primary-600">
            <span class="text-sm text-gray-700">{{ opt }}</span>
          </label>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex items-center justify-between mb-3">
        <div class="text-xs font-medium text-gray-500">Filters</div>
        <button class="text-xs text-red-500 hover:text-red-600">✕ Clear all</button>
      </div>

      <!-- Search -->
      <div class="relative mb-3">
        <svg class="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input type="text" placeholder="Search filters..." class="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg">
      </div>

      <!-- Filter Sections -->
      <div class="space-y-1">
        <div v-for="section in filterSections" :key="section.key">
          <!-- Section header -->
          <button
            class="w-full flex items-center justify-between py-2 text-xs font-medium text-gray-700 hover:text-gray-900"
            @click="toggle(section.key)"
          >
            <div class="flex items-center gap-1.5">
              <svg class="w-3 h-3 transition-transform" :class="collapsed[section.key] ? '' : 'rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
              {{ section.label }}
              <span class="bg-primary-100 text-primary-700 text-[10px] px-1.5 rounded-full font-bold">{{ section.count }}</span>
            </div>
          </button>

          <!-- Items -->
          <div v-if="!collapsed[section.key]" class="pl-5 pb-2 space-y-1.5">
            <label v-for="item in section.items" :key="item.label" class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" :checked="item.checked" class="w-3.5 h-3.5 text-primary-600 border-gray-300 rounded">
              <div v-if="(item as any).color" class="w-2.5 h-2.5 rounded-full" :class="(item as any).color"></div>
              <span class="text-xs text-gray-700">{{ item.label }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
