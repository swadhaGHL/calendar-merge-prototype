<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppSettings, verticalLabels } from '../composables/useAppSettings'

const route = useRoute()
const router = useRouter()
const { enabledVerticals, isSingleVertical, isMultiVertical, setSingleMode, setMultiMode } = useAppSettings()

const isCalendarView = computed(() => route.path.startsWith('/calendar-view'))
const isSetup = computed(() => route.path.startsWith('/setup'))

const leftNavItems = [
  { icon: '🚀', label: 'Launchpad' },
  { icon: '📊', label: 'Dashboard' },
  { icon: '💬', label: 'Conversations' },
  { icon: '📅', label: 'Calendars', active: true, path: '/calendar-view' },
  { icon: '👥', label: 'Contacts' },
  { icon: '💰', label: 'Opportunities' },
  { icon: '💳', label: 'Payments' },
  { icon: '🤖', label: 'AI Agents' },
  { icon: '📢', label: 'Marketing' },
  { icon: '🌐', label: 'Sites' },
  { icon: '🎫', label: 'Memberships' },
  { icon: '⚙️', label: 'Settings' },
]
</script>

<template>
  <div class="flex h-screen bg-gray-50">
    <!-- GHL Left Sidebar -->
    <div class="w-[72px] bg-[#1b2559] flex flex-col items-center py-3 flex-shrink-0">
      <!-- Logo -->
      <div class="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center mb-4">
        <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>

      <!-- User avatar -->
      <div class="w-8 h-8 bg-indigo-400 rounded-full flex items-center justify-center text-white text-[10px] font-bold mb-1">
        SB
      </div>
      <div class="text-[9px] text-gray-300 text-center mb-4 leading-tight px-1">
        Swadha Bhoj<br/>
        <span class="text-gray-500">New York, NY</span>
      </div>

      <!-- Search -->
      <button class="w-10 h-8 flex items-center justify-center text-gray-400 hover:text-white mb-2 rounded-lg hover:bg-white/10">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
      </button>

      <!-- Nav items -->
      <nav class="flex-1 flex flex-col items-center gap-0.5 overflow-y-auto w-full">
        <button
          v-for="item in leftNavItems"
          :key="item.label"
          class="w-full flex flex-col items-center py-2 px-1 text-[9px] leading-tight rounded-lg transition-colors"
          :class="item.active ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'"
          @click="item.path && router.push(item.path)"
        >
          <span class="text-base mb-0.5">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </button>
      </nav>
    </div>

    <!-- Main Area -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Top Header -->
      <header class="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
        <div class="flex items-center gap-6">
          <h1 class="text-lg font-bold text-gray-900">Calendars</h1>
          <nav class="flex gap-1">
            <button
              class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
              :class="isCalendarView ? 'text-primary-700 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'"
              @click="router.push('/calendar-view')"
            >
              Calendar View
            </button>
            <button
              class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
              :class="isSetup ? 'text-primary-700 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'"
              @click="router.push('/setup')"
            >
              Setup &amp; Manage
            </button>
          </nav>
        </div>

        <div class="flex items-center gap-3">
          <!-- Demo Mode Toggle -->
          <div class="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 text-xs">
            <span class="text-gray-500 font-medium">Demo:</span>
            <button
              class="px-2 py-0.5 rounded text-xs font-medium transition-colors"
              :class="isSingleVertical ? 'bg-primary-600 text-white' : 'text-gray-500 hover:text-gray-700'"
              @click="setSingleMode('meetings')"
            >
              Single
            </button>
            <button
              class="px-2 py-0.5 rounded text-xs font-medium transition-colors"
              :class="isMultiVertical ? 'bg-primary-600 text-white' : 'text-gray-500 hover:text-gray-700'"
              @click="setMultiMode()"
            >
              Multi
            </button>
          </div>

        </div>
      </header>

      <!-- Content Area -->
      <main class="flex-1 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
