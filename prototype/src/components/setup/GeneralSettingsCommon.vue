<script lang="ts" setup>
import { ref } from 'vue'

const settingsScope = ref<'widget' | 'in-app' | 'both'>('both')
const defaultTimezone = ref('America/New_York')
const dateFormat = ref('MM/DD/YYYY')
const weekStartsOn = ref('sunday')
const timeFormat = ref('12h')
const activeBottomTab = ref<'widget' | 'in-app'>('widget')
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-base font-semibold text-gray-900">General Settings</h2>
      <p class="text-xs text-gray-500 mt-1">Configure global display and formatting defaults that apply across your calendar system.</p>
    </div>

    <!-- Settings Scope -->
    <div class="bg-white border border-gray-200 rounded-xl">
      <div class="px-5 py-4 border-b border-gray-100">
        <h3 class="text-sm font-semibold text-gray-900">Settings Scope</h3>
        <p class="text-[10px] text-gray-500 mt-0.5">Choose where these settings apply.</p>
      </div>
      <div class="p-5 grid grid-cols-3 gap-3">
        <!-- Booking Widget Only -->
        <label
          class="relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-colors text-center"
          :class="settingsScope === 'widget' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300 bg-white'"
        >
          <input
            type="radio"
            name="scope"
            value="widget"
            v-model="settingsScope"
            class="sr-only"
          />
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
            :class="settingsScope === 'widget' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
          </div>
          <p class="text-xs font-medium" :class="settingsScope === 'widget' ? 'text-primary-700' : 'text-gray-700'">Booking Widget Only</p>
          <p class="text-[10px] text-gray-500 mt-0.5">External-facing booking pages</p>
          <div
            v-if="settingsScope === 'widget'"
            class="absolute top-2 right-2 w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center"
          >
            <svg class="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
        </label>

        <!-- In-App Calendar Only -->
        <label
          class="relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-colors text-center"
          :class="settingsScope === 'in-app' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300 bg-white'"
        >
          <input
            type="radio"
            name="scope"
            value="in-app"
            v-model="settingsScope"
            class="sr-only"
          />
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
            :class="settingsScope === 'in-app' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <p class="text-xs font-medium" :class="settingsScope === 'in-app' ? 'text-primary-700' : 'text-gray-700'">In-App Calendar Only</p>
          <p class="text-[10px] text-gray-500 mt-0.5">Internal calendar view</p>
          <div
            v-if="settingsScope === 'in-app'"
            class="absolute top-2 right-2 w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center"
          >
            <svg class="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
        </label>

        <!-- Both -->
        <label
          class="relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-colors text-center"
          :class="settingsScope === 'both' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300 bg-white'"
        >
          <input
            type="radio"
            name="scope"
            value="both"
            v-model="settingsScope"
            class="sr-only"
          />
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
            :class="settingsScope === 'both' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
          </div>
          <p class="text-xs font-medium" :class="settingsScope === 'both' ? 'text-primary-700' : 'text-gray-700'">Both (Widget + In-App)</p>
          <p class="text-[10px] text-gray-500 mt-0.5">Apply everywhere</p>
          <div
            v-if="settingsScope === 'both'"
            class="absolute top-2 right-2 w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center"
          >
            <svg class="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
        </label>
      </div>
    </div>

    <!-- Display & Format Defaults -->
    <div class="bg-white border border-gray-200 rounded-xl">
      <div class="px-5 py-4 border-b border-gray-100">
        <h3 class="text-sm font-semibold text-gray-900">Display & Format Defaults</h3>
        <p class="text-[10px] text-gray-500 mt-0.5">Set default formatting options for dates, times, and calendar display.</p>
      </div>
      <div class="p-5 grid grid-cols-2 gap-5">
        <!-- Default Timezone -->
        <div>
          <label class="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Default Timezone</label>
          <select
            v-model="defaultTimezone"
            class="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 pr-8 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="America/Chicago">America/Chicago (CST)</option>
            <option value="America/Denver">America/Denver (MST)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
            <option value="Europe/Berlin">Europe/Berlin (CET)</option>
            <option value="Asia/Calcutta">Asia/Calcutta (IST)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
          </select>
        </div>

        <!-- Date Format -->
        <div>
          <label class="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date Format</label>
          <select
            v-model="dateFormat"
            class="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 pr-8 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            <option value="MMM DD, YYYY">MMM DD, YYYY</option>
          </select>
        </div>

        <!-- Week Starts On -->
        <div>
          <label class="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Week Starts On</label>
          <select
            v-model="weekStartsOn"
            class="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 pr-8 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="sunday">Sunday</option>
            <option value="monday">Monday</option>
            <option value="saturday">Saturday</option>
          </select>
        </div>

        <!-- Time Format -->
        <div>
          <label class="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Time Format</label>
          <select
            v-model="timeFormat"
            class="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 pr-8 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="12h">12-hour (1:00 PM)</option>
            <option value="24h">24-hour (13:00)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Bottom Tabs: Booking Widget / In-App Calendar -->
    <div class="bg-white border border-gray-200 rounded-xl">
      <div class="border-b border-gray-200">
        <div class="flex">
          <button
            class="flex-1 px-4 py-3 text-xs font-medium border-b-2 transition-colors"
            :class="activeBottomTab === 'widget'
              ? 'border-primary-600 text-primary-700 bg-primary-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-700'"
            @click="activeBottomTab = 'widget'"
          >
            <div class="flex items-center justify-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
              Booking Widget
            </div>
          </button>
          <button
            class="flex-1 px-4 py-3 text-xs font-medium border-b-2 transition-colors"
            :class="activeBottomTab === 'in-app'
              ? 'border-primary-600 text-primary-700 bg-primary-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-700'"
            @click="activeBottomTab = 'in-app'"
          >
            <div class="flex items-center justify-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              In-App Calendar
            </div>
          </button>
        </div>
      </div>

      <div class="p-5">
        <!-- Widget Settings -->
        <div v-if="activeBottomTab === 'widget'" class="space-y-4">
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p class="text-xs font-medium text-gray-900">Show timezone selector</p>
              <p class="text-[10px] text-gray-500">Allow bookers to change their timezone on the widget</p>
            </div>
            <button class="relative inline-flex h-5 w-9 items-center rounded-full bg-primary-600 transition-colors">
              <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform translate-x-4"></span>
            </button>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p class="text-xs font-medium text-gray-900">Show remaining spots</p>
              <p class="text-[10px] text-gray-500">Display available seats for group sessions</p>
            </div>
            <button class="relative inline-flex h-5 w-9 items-center rounded-full bg-gray-300 transition-colors">
              <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform translate-x-0.5"></span>
            </button>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p class="text-xs font-medium text-gray-900">Enable dark mode</p>
              <p class="text-[10px] text-gray-500">Offer a dark theme option on the booking widget</p>
            </div>
            <button class="relative inline-flex h-5 w-9 items-center rounded-full bg-gray-300 transition-colors">
              <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform translate-x-0.5"></span>
            </button>
          </div>
        </div>

        <!-- In-App Settings -->
        <div v-else class="space-y-4">
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p class="text-xs font-medium text-gray-900">Default calendar view</p>
              <p class="text-[10px] text-gray-500">The view shown when opening the calendar</p>
            </div>
            <select class="appearance-none bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 pr-7 cursor-pointer">
              <option>Week</option>
              <option>Day</option>
              <option>Month</option>
              <option>List</option>
            </select>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p class="text-xs font-medium text-gray-900">Show weekends</p>
              <p class="text-[10px] text-gray-500">Display Saturday and Sunday columns in calendar view</p>
            </div>
            <button class="relative inline-flex h-5 w-9 items-center rounded-full bg-primary-600 transition-colors">
              <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform translate-x-4"></span>
            </button>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p class="text-xs font-medium text-gray-900">Color-code by vertical</p>
              <p class="text-[10px] text-gray-500">Use different colors for meetings, services, and rentals</p>
            </div>
            <button class="relative inline-flex h-5 w-9 items-center rounded-full bg-primary-600 transition-colors">
              <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform translate-x-4"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
