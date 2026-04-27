<script lang="ts" setup>
import { computed } from 'vue'
import { type UnifiedCalendarConfig } from '../../data/mockCalendars'

const props = defineProps<{
  config: UnifiedCalendarConfig
}>()

const emit = defineEmits<{
  (e: 'update', config: Partial<UnifiedCalendarConfig>): void
}>()

const descriptionLength = computed(() => (props.config.paymentDescription || '').length)

const currencyOptions = [
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
  { label: 'GBP', value: 'GBP' },
  { label: 'INR', value: 'INR' },
  { label: 'CAD', value: 'CAD' },
  { label: 'AUD', value: 'AUD' },
]
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-base font-semibold text-gray-900">Payments</h2>
      <p class="text-sm text-gray-500 mt-0.5">Charge bookers at the time of booking and configure refund rules.</p>
    </div>

    <!-- Payments Card -->
    <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
      <!-- Accept payments toggle -->
      <div class="flex items-center gap-3">
        <button
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
          :class="config.enablePayments ? 'bg-primary-600' : 'bg-gray-200'"
          @click="emit('update', { enablePayments: !config.enablePayments })"
        >
          <span
            class="inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm"
            :class="config.enablePayments ? 'translate-x-6' : 'translate-x-1'"
          />
        </button>
        <div class="flex items-center gap-1.5">
          <span class="text-sm font-semibold text-gray-900">Accept payments</span>
          <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        </div>
      </div>

      <transition name="section-slide">
        <div v-if="config.enablePayments" class="space-y-5">
          <!-- Payment mode -->
          <div class="pt-4 border-t border-gray-100">
            <label class="text-sm font-medium text-gray-900 block mb-2">Payment mode</label>
            <div class="flex items-center gap-3">
              <button
                class="px-3 py-1.5 text-sm rounded-lg border transition-colors"
                :class="config.paymentMode === 'test' ? 'bg-gray-100 border-gray-300 font-medium text-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-300'"
                @click="emit('update', { paymentMode: 'test' })"
              >
                Test
              </button>
              <button
                class="px-3 py-1.5 text-sm rounded-lg border transition-colors"
                :class="config.paymentMode === 'live' ? 'bg-primary-50 border-primary-300 font-medium text-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'"
                @click="emit('update', { paymentMode: 'live' })"
              >
                Live
              </button>
              <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </div>

            <!-- Test mode warning -->
            <div v-if="config.paymentMode === 'test'" class="flex items-center gap-2 mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <svg class="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span class="text-sm text-amber-700">Test mode active – no real transactions will be processed.</span>
            </div>
          </div>

          <!-- Total amount -->
          <div>
            <div class="flex items-center gap-1.5 mb-1.5">
              <label class="text-sm font-medium text-gray-900">Total amount</label>
              <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </div>
            <div class="flex gap-2">
              <input
                type="number"
                :value="config.paymentAmount || 0"
                @input="emit('update', { paymentAmount: parseFloat(($event.target as HTMLInputElement).value) || null })"
                class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="0"
                step="0.01"
              />
              <select
                :value="config.currency"
                @change="emit('update', { currency: ($event.target as HTMLSelectElement).value })"
                class="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option v-for="cur in currencyOptions" :key="cur.value" :value="cur.value">{{ cur.label }}</option>
              </select>
            </div>
          </div>

          <!-- Stripe provider -->
          <div class="flex items-center justify-between py-3 border-t border-gray-100">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center">
                <span class="text-white text-xs font-bold">S</span>
              </div>
              <span class="text-sm font-medium text-primary-600">Default</span>
            </div>
            <div class="flex items-center gap-1.5">
              <a href="#" class="text-sm text-primary-600 hover:underline">Manage payment providers</a>
              <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </div>
          </div>

          <!-- Toggle options -->
          <div class="space-y-4 pt-3 border-t border-gray-100">
            <!-- Accept partial payment -->
            <div class="flex items-center gap-3">
              <button
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
                :class="config.acceptPartialPayment ? 'bg-primary-600' : 'bg-gray-200'"
                @click="emit('update', { acceptPartialPayment: !config.acceptPartialPayment })"
              >
                <span
                  class="inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm"
                  :class="config.acceptPartialPayment ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
              <div class="flex items-center gap-1.5">
                <span class="text-sm text-gray-700">Accept partial payment</span>
                <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              </div>
            </div>

            <!-- Collect payment for all attendees -->
            <div class="flex items-center gap-3">
              <button
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
                :class="config.collectPaymentForAllAttendees ? 'bg-primary-600' : 'bg-gray-200'"
                @click="emit('update', { collectPaymentForAllAttendees: !config.collectPaymentForAllAttendees })"
              >
                <span
                  class="inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm"
                  :class="config.collectPaymentForAllAttendees ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
              <div class="flex items-center gap-1.5">
                <span class="text-sm text-gray-700">Collect payment for all attendees, including guests</span>
                <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              </div>
            </div>

            <!-- Enable coupon codes -->
            <div class="flex items-center gap-3">
              <button
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
                :class="config.enableCouponCodes ? 'bg-primary-600' : 'bg-gray-200'"
                @click="emit('update', { enableCouponCodes: !config.enableCouponCodes })"
              >
                <span
                  class="inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm"
                  :class="config.enableCouponCodes ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
              <span class="text-sm text-gray-700">Enable coupon codes</span>
            </div>
          </div>

          <!-- Payment description -->
          <div class="pt-3 border-t border-gray-100">
            <div class="flex items-center gap-1.5 mb-1.5">
              <label class="text-sm font-medium text-gray-900">Payment description</label>
              <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </div>
            <div class="relative">
              <textarea
                :value="config.paymentDescription"
                @input="emit('update', { paymentDescription: ($event.target as HTMLTextAreaElement).value })"
                placeholder="Optionally include any helpful details about the payment."
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary-500"
                maxlength="1000"
                rows="3"
              />
              <span class="absolute bottom-2 right-3 text-xs text-gray-400">{{ descriptionLength }} / 1000</span>
            </div>
          </div>
        </div>
      </transition>
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
  max-height: 2000px;
}
</style>
