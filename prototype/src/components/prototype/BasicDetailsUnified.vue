<script lang="ts" setup>
import { ref } from 'vue'
import { type UnifiedCalendarConfig } from '../../data/mockCalendars'

const props = defineProps<{
  config: UnifiedCalendarConfig
}>()

const emit = defineEmits<{
  (e: 'update', config: Partial<UnifiedCalendarConfig>): void
}>()

const showMore = ref(false)

const colors = [
  '#DC2626', '#EC4899', '#F97316', '#EAB308', '#84CC16',
  '#22C55E', '#039855', '#2563EB', '#6366F1', '#8B5CF6',
  '#A855F7', '#6B7280',
]
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-base font-semibold text-gray-900">Basic details</h2>
      <p class="text-sm text-gray-500 mt-0.5">Name, URL, and branding — what bookers see at the top of the booking page.</p>
    </div>

    <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
      <!-- Calendar Name -->
      <div>
        <label class="text-sm font-medium text-gray-700 block mb-1.5">Calendar name</label>
        <input
          type="text"
          :value="config.name"
          @input="emit('update', { name: ($event.target as HTMLInputElement).value })"
          placeholder="e.g. Sales Discovery Call"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <!-- Description -->
      <div>
        <label class="text-sm font-medium text-gray-700 block mb-1.5">Description</label>
        <textarea
          :value="config.description"
          @input="emit('update', { description: ($event.target as HTMLTextAreaElement).value })"
          placeholder="Write description"
          rows="3"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
        />
      </div>

      <!-- Booking URL -->
      <div>
        <label class="text-sm font-medium text-gray-700 block mb-1.5">Booking URL</label>
        <div class="flex">
          <span class="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg">
            /widget/bookings/
          </span>
          <input
            type="text"
            :value="config.slug"
            @input="emit('update', { slug: ($event.target as HTMLInputElement).value })"
            placeholder="my-calendar"
            class="flex-1 border border-gray-300 rounded-r-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <p class="text-xs text-gray-400 mt-1">This is the link bookers will use to schedule with you.</p>
      </div>

      <!-- More options expander -->
      <button
        type="button"
        class="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700"
        @click="showMore = !showMore"
      >
        <svg class="w-3.5 h-3.5 transition-transform" :class="showMore ? 'rotate-90' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg>
        {{ showMore ? 'Hide more options' : 'More options (logo, group, color)' }}
      </button>

      <div v-if="showMore" class="space-y-5 pt-1 border-t border-gray-100">
        <!-- Calendar Logo -->
        <div class="pt-4">
          <label class="text-sm font-medium text-gray-700 block mb-2">Calendar logo</label>
          <div class="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-gray-300 transition-colors cursor-pointer">
            <svg class="w-7 h-7 text-gray-400 mx-auto mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p class="text-sm text-primary-600 font-medium">Click to upload</p>
            <p class="text-xs text-gray-400 mt-1">PNG, JPEG, JPG or GIF (max. 180x180px)</p>
          </div>
        </div>

        <!-- Group + Meeting Invite Title -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium text-gray-700 block mb-1.5">Group</label>
            <select class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Select group</option>
              <option value="consultations">Consultations</option>
              <option value="sales">Sales</option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 block mb-1.5">Meeting invite title</label>
            <input
              type="text"
              value="{{contact.name}}"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <!-- Meeting Color -->
        <div>
          <label class="text-sm font-medium text-gray-700 block mb-1.5">Meeting color</label>
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="color in colors"
              :key="color"
              class="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
              :class="config.eventColor === color ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-300' : 'border-transparent'"
              :style="{ backgroundColor: color }"
              @click="emit('update', { eventColor: color })"
            >
              <svg v-if="config.eventColor === color" class="w-4 h-4 text-white mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
