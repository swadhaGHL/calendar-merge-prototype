<script lang="ts" setup>
import { type UnifiedCalendarConfig } from '../../data/mockCalendars'

defineProps<{
  config: UnifiedCalendarConfig
}>()

defineEmits<{
  (e: 'update', config: Partial<UnifiedCalendarConfig>): void
}>()

const channels = [
  { name: 'Direct booking link', description: 'Share this link directly with clients', icon: 'link', enabled: true },
  { name: 'Website embed', description: 'Embed the booking widget on your website', icon: 'code', enabled: true },
  { name: 'WordPress plugin', description: 'Add to your WordPress site via plugin', icon: 'wordpress', enabled: false },
  { name: 'Google Business Profile', description: 'Accept bookings from Google search and maps', icon: 'google', enabled: false },
]
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-base font-semibold text-gray-900">Booking channels</h2>
      <p class="text-sm text-gray-500 mt-0.5">Where this calendar gets shared — direct link, embeds, integrations.</p>
    </div>

    <div class="bg-white border border-gray-200 rounded-xl p-5">
      <div class="divide-y divide-gray-100">
        <div
          v-for="channel in channels"
          :key="channel.name"
          class="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
        >
          <!-- Icon placeholder -->
          <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <svg v-if="channel.icon === 'link'" class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <svg v-else-if="channel.icon === 'code'" class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <svg v-else class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>

          <!-- Info -->
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-900">{{ channel.name }}</div>
            <div class="text-xs text-gray-500">{{ channel.description }}</div>
          </div>

          <!-- Status -->
          <span
            class="text-xs font-medium px-2 py-0.5 rounded-full"
            :class="channel.enabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'"
          >
            {{ channel.enabled ? 'Active' : 'Not configured' }}
          </span>

          <!-- Configure button -->
          <button class="text-sm text-primary-600 hover:underline flex-shrink-0">Configure</button>
        </div>
      </div>
    </div>
  </div>
</template>
