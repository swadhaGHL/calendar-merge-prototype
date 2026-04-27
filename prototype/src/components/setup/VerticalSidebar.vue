<script lang="ts" setup>
import { useAppSettings, verticalLabels, verticalIcons } from '../../composables/useAppSettings'
import type { Vertical } from '../../composables/useAppSettings'

const props = defineProps<{
  activeSection: string
}>()

const emit = defineEmits<{
  select: [section: string]
}>()

const { enabledVerticals } = useAppSettings()

const allVerticals: Vertical[] = ['meetings', 'services', 'rentals']

const verticalIconSvg: Record<string, string> = {
  meetings: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  services: 'M14.121 14.121A3 3 0 109.879 9.879a3 3 0 004.242 4.242zm0 0L21 21M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v4',
  rentals: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
}

const commonItems = [
  {
    key: 'connections',
    label: 'Connections',
    icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
  },
  {
    key: 'availability',
    label: 'Availability',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    key: 'general-settings',
    label: 'General Settings',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
]

function isEnabled(v: Vertical) {
  return enabledVerticals.value.includes(v)
}
</script>

<template>
  <div class="w-[220px] bg-white border-r border-gray-200 flex flex-col flex-shrink-0 h-full">
    <!-- Verticals Section -->
    <div class="px-3 pt-4 pb-2">
      <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Verticals</p>
      <div class="space-y-0.5">
        <button
          v-for="v in allVerticals"
          :key="v"
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors relative"
          :class="[
            isEnabled(v) && activeSection === v
              ? 'bg-primary-50 text-primary-700 border-l-[3px] border-primary-600 pl-[9px]'
              : isEnabled(v)
                ? 'text-gray-700 hover:bg-gray-50'
                : 'text-gray-300 cursor-not-allowed'
          ]"
          :disabled="!isEnabled(v)"
          @click="isEnabled(v) && emit('select', v)"
        >
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" :d="verticalIconSvg[v]" />
          </svg>
          <span>{{ verticalLabels[v] }}</span>
          <span
            v-if="!isEnabled(v)"
            class="ml-auto text-[9px] text-gray-300 font-normal"
          >
            Coming Soon
          </span>
        </button>
      </div>
    </div>

    <!-- Divider -->
    <div class="mx-3 my-2 border-t border-gray-100"></div>

    <!-- Common Section -->
    <div class="px-3 pb-4">
      <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Common</p>
      <div class="space-y-0.5">
        <button
          v-for="item in commonItems"
          :key="item.key"
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          :class="activeSection === item.key
            ? 'bg-primary-50 text-primary-700 border-l-[3px] border-primary-600 pl-[9px]'
            : 'text-gray-700 hover:bg-gray-50'"
          @click="emit('select', item.key)"
        >
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
          </svg>
          <span>{{ item.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
