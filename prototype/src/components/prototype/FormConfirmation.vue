<script lang="ts" setup>
import { type UnifiedCalendarConfig } from '../../data/mockCalendars'

const props = defineProps<{
  config: UnifiedCalendarConfig
}>()

const emit = defineEmits<{
  (e: 'update', config: Partial<UnifiedCalendarConfig>): void
}>()

const formOptions = [
  { label: 'Conditional Logic Form', value: 'conditional_logic' },
  { label: 'Default Form', value: 'default' },
  { label: 'Custom Form', value: 'custom' },
]
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-base font-semibold text-gray-900">Form &amp; confirmation</h2>
      <p class="text-sm text-gray-500 mt-0.5">What bookers fill out, and what they see right after they book.</p>
    </div>

    <!-- Forms & Guests Card -->
    <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
      <!-- Select form -->
      <div>
        <div class="flex items-center gap-1.5 mb-1.5">
          <label class="text-sm font-semibold text-gray-900">Select form</label>
          <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        </div>
        <select
          :value="config.selectedFormId"
          @change="emit('update', { selectedFormId: ($event.target as HTMLSelectElement).value })"
          class="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option v-for="opt in formOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>

        <!-- Send custom form to guests — only when custom form + guests enabled -->
        <transition name="section-slide">
          <label
            v-if="config.enableGuests && config.selectedFormId === 'custom'"
            class="flex items-center gap-2.5 mt-3 cursor-pointer"
          >
            <input
              type="checkbox"
              :checked="config.sendCustomFormToGuests"
              @change="emit('update', { sendCustomFormToGuests: !config.sendCustomFormToGuests })"
              class="w-4 h-4 text-primary-600 border-gray-300 rounded"
            />
            <span class="text-sm text-gray-700">Send this custom form to each guest too</span>
          </label>
        </transition>
      </div>

      <!-- Widget order -->
      <div class="pt-4 border-t border-gray-100">
        <div class="flex items-center gap-1.5 mb-3">
          <label class="text-sm font-semibold text-gray-900">Widget order</label>
          <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        </div>
        <div class="space-y-2 max-w-sm">
          <div
            v-for="(step, index) in config.widgetSteps"
            :key="step"
            class="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
          >
            <span class="text-xs font-medium text-gray-500 w-12">Step {{ index + 1 }}</span>
            <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
            </svg>
            <span class="text-sm text-gray-900">{{ step === 'date_time' ? 'Date & Time Selector' : 'Form' }}</span>
          </div>
        </div>
      </div>

      <p class="text-xs text-gray-400 mt-3">
        Tip: <strong>Add guests</strong> moved to <strong>Booking rules → Capacity</strong> — it changes how seats are counted.
      </p>
    </div>

    <!-- Confirmation Page Card -->
    <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div>
        <h3 class="text-sm font-semibold text-gray-900">Confirmation page</h3>
        <p class="text-xs text-gray-500 mt-0.5">Configure preferences for the final page that appears after a successful booking.</p>
      </div>

      <!-- Default / Redirect -->
      <div class="flex items-center gap-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="confirmation"
            value="default"
            :checked="config.confirmationType === 'default'"
            @change="emit('update', { confirmationType: 'default' })"
            class="w-4 h-4 text-primary-600 border-gray-300"
          />
          <span class="text-sm font-medium text-gray-900">Default</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="confirmation"
            value="redirect"
            :checked="config.confirmationType === 'redirect'"
            @change="emit('update', { confirmationType: 'redirect' })"
            class="w-4 h-4 text-primary-600 border-gray-300"
          />
          <span class="text-sm font-medium text-gray-900">Redirect URL</span>
        </label>
      </div>

      <!-- Thank you message (default) -->
      <div v-if="config.confirmationType === 'default'">
        <label class="text-sm font-medium text-gray-900 block mb-1.5">Thank you message</label>
        <textarea
          :value="config.thankYouMessage"
          @input="emit('update', { thankYouMessage: ($event.target as HTMLTextAreaElement).value })"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary-500"
          rows="3"
        />
      </div>

      <!-- Redirect URL -->
      <div v-if="config.confirmationType === 'redirect'">
        <label class="text-sm font-medium text-gray-900 block mb-1.5">Redirect URL</label>
        <input
          type="url"
          :value="config.redirectUrl"
          @input="emit('update', { redirectUrl: ($event.target as HTMLInputElement).value })"
          placeholder="https://example.com/thank-you"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <!-- Meta pixel -->
      <div>
        <div class="flex items-center gap-1.5 mb-1.5">
          <label class="text-sm font-medium text-gray-900">Meta pixel ID (optional)</label>
          <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        </div>
        <input
          type="text"
          :value="config.metaPixelId"
          @input="emit('update', { metaPixelId: ($event.target as HTMLInputElement).value })"
          placeholder="Pixel ID"
          class="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <!-- Auto-confirm -->
      <div class="pt-3 border-t border-gray-100 flex items-center gap-3">
        <button
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
          :class="config.autoConfirmMeetings ? 'bg-primary-600' : 'bg-gray-200'"
          @click="emit('update', { autoConfirmMeetings: !config.autoConfirmMeetings })"
        >
          <span
            class="inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm"
            :class="config.autoConfirmMeetings ? 'translate-x-6' : 'translate-x-1'"
          />
        </button>
        <div class="flex items-center gap-1.5">
          <span class="text-sm font-medium text-gray-900">Auto-confirm new calendar meetings</span>
          <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section-slide-enter-active,
.section-slide-leave-active {
  transition: all 0.3s ease;
}
.section-slide-enter-from,
.section-slide-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}
.section-slide-enter-to,
.section-slide-leave-from {
  opacity: 1;
  max-height: 600px;
}
</style>
