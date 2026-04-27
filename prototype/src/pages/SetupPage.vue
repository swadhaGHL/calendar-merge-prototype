<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useAppSettings } from '../composables/useAppSettings'
import VerticalSidebar from '../components/setup/VerticalSidebar.vue'
import MeetingsVertical from '../components/setup/MeetingsVertical.vue'
import ServicesVertical from '../components/setup/ServicesVertical.vue'
import RentalsVertical from '../components/setup/RentalsVertical.vue'
import ConnectionsCommon from '../components/setup/ConnectionsCommon.vue'
import AvailabilityCommon from '../components/setup/AvailabilityCommon.vue'
import GeneralSettingsCommon from '../components/setup/GeneralSettingsCommon.vue'

const { isSingleVertical, isMultiVertical, enabledVerticals } = useAppSettings()

const activeSection = ref<string>('meetings')

function handleSelect(section: string) {
  activeSection.value = section
}

const singleVertical = computed(() => enabledVerticals.value[0])

const currentComponent = computed(() => {
  switch (activeSection.value) {
    case 'meetings': return MeetingsVertical
    case 'services': return ServicesVertical
    case 'rentals': return RentalsVertical
    case 'connections': return ConnectionsCommon
    case 'availability': return AvailabilityCommon
    case 'general-settings': return GeneralSettingsCommon
    default: return MeetingsVertical
  }
})

const commonTabs = [
  { key: 'connections', label: 'Connections' },
  { key: 'availability', label: 'Availability' },
  { key: 'general-settings', label: 'General Settings' },
]

const singleActiveTab = ref<string>('vertical')
</script>

<template>
  <div class="h-full flex flex-col bg-gray-50">
    <!-- Single Vertical Mode -->
    <div v-if="isSingleVertical" class="h-full flex flex-col">
      <!-- Tabs for switching between vertical content and common sections -->
      <div class="bg-white border-b border-gray-200 px-6 flex-shrink-0">
        <div class="flex items-center gap-1 -mb-px">
          <button
            class="px-4 py-3 text-xs font-medium border-b-2 transition-colors"
            :class="singleActiveTab === 'vertical'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'"
            @click="singleActiveTab = 'vertical'"
          >
            {{ singleVertical === 'meetings' ? 'Calendars' : singleVertical === 'services' ? 'Services' : 'Rentals' }}
          </button>
          <button
            v-for="tab in commonTabs"
            :key="tab.key"
            class="px-4 py-3 text-xs font-medium border-b-2 transition-colors"
            :class="singleActiveTab === tab.key
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'"
            @click="singleActiveTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
      <div class="flex-1 overflow-auto">
        <component
          v-if="singleActiveTab === 'vertical'"
          :is="singleVertical === 'meetings' ? MeetingsVertical : singleVertical === 'services' ? ServicesVertical : RentalsVertical"
        />
        <ConnectionsCommon v-else-if="singleActiveTab === 'connections'" />
        <AvailabilityCommon v-else-if="singleActiveTab === 'availability'" />
        <GeneralSettingsCommon v-else-if="singleActiveTab === 'general-settings'" />
      </div>
    </div>

    <!-- Multi Vertical Mode -->
    <div v-else class="h-full flex">
      <!-- Sidebar -->
      <VerticalSidebar
        :active-section="activeSection"
        @select="handleSelect"
      />
      <!-- Content -->
      <div class="flex-1 overflow-auto">
        <component :is="currentComponent" />
      </div>
    </div>
  </div>
</template>
