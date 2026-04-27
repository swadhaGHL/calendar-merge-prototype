<script lang="ts" setup>
import { ref, computed } from 'vue'
import { type UnifiedCalendarConfig } from '../../data/mockCalendars'

const props = defineProps<{
  config: UnifiedCalendarConfig
}>()

const emit = defineEmits<{
  (e: 'update', config: Partial<UnifiedCalendarConfig>): void
}>()

const widgetStyle = ref<'neo' | 'classic'>('neo')
const bgColor = ref('#ffffff')
const buttonText = ref('Schedule Meeting')
const showCalendarTitle = ref(true)
const showCalendarDescription = ref(true)
const showCalendarDetails = ref(true)
const customCode = ref('')

const isNeo = computed(() => widgetStyle.value === 'neo')
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-base font-semibold text-gray-900">Widget appearance</h2>
      <p class="text-sm text-gray-500 mt-0.5">Theme, branding, and the widget bookers see on your booking page.</p>
    </div>

    <!-- Group view image upload -->
    <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <div>
        <label class="text-sm font-medium text-gray-700 block">Group view image</label>
        <p class="text-xs text-gray-500 mt-0.5">Visible inside the Group View for the Neo template. Won't appear on the individual calendar link.</p>
      </div>
      <div class="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-gray-300 transition-colors cursor-pointer">
        <svg class="w-7 h-7 text-gray-400 mx-auto mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        <p class="text-sm text-primary-600 font-medium">Click to upload <span class="text-gray-500 font-normal">or drag and drop</span></p>
        <p class="text-xs text-gray-400 mt-1">PNG, JPEG, JPG or GIF (max. 180×180px)</p>
      </div>
    </div>

    <!-- Calendar widget style: Neo / Classic -->
    <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <div>
        <label class="text-sm font-medium text-gray-700 block">Calendar widget style</label>
        <p class="text-xs text-gray-500 mt-0.5">Choose between our classic or the sleek Neo widget.</p>
      </div>
      <div class="flex items-center gap-6">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="radio" name="widget-style" value="neo" v-model="widgetStyle" class="w-4 h-4 text-primary-600 border-gray-300" />
          <span class="text-sm text-gray-700">Neo</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="radio" name="widget-style" value="classic" v-model="widgetStyle" class="w-4 h-4 text-primary-600 border-gray-300" />
          <span class="text-sm text-gray-700">Classic</span>
        </label>
      </div>
    </div>

    <!-- Customize calendar widget -->
    <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
      <div class="flex items-start gap-4 bg-gray-50 rounded-xl p-4">
        <div class="w-16 h-16 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
          <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-sm font-semibold text-gray-900">Customize calendar widget</h3>
          <span v-if="!isNeo" class="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Only works with Neo widget</span>
          <span v-else class="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary-50 text-primary-700">Customizable on Neo widget</span>
          <p class="text-xs text-gray-500 mt-1.5">Customize widget appearance: primary color, background color, and button text.
            <a class="text-primary-600 hover:underline" href="#">Learn more</a>
          </p>
        </div>
      </div>

      <!-- Primary settings -->
      <div :class="{ 'opacity-50 pointer-events-none': !isNeo }">
        <h4 class="text-sm font-semibold text-gray-900 mb-4">Primary settings</h4>

        <div class="space-y-4">
          <!-- Primary color -->
          <div>
            <label class="text-xs font-medium text-gray-600 block mb-1.5">Primary color</label>
            <div class="flex items-center border border-gray-300 rounded-lg pl-2 pr-3 py-1.5 gap-2">
              <div class="w-6 h-6 rounded border border-gray-200" :style="{ backgroundColor: config.eventColor }"></div>
              <input
                type="text"
                :value="config.eventColor"
                @input="emit('update', { eventColor: ($event.target as HTMLInputElement).value })"
                class="flex-1 bg-transparent text-sm text-gray-700 focus:outline-none"
              />
            </div>
          </div>

          <!-- Background color -->
          <div>
            <label class="text-xs font-medium text-gray-600 block mb-1.5">Background color</label>
            <div class="flex items-center border border-gray-300 rounded-lg pl-2 pr-3 py-1.5 gap-2">
              <div class="w-6 h-6 rounded border border-gray-200" :style="{ backgroundColor: bgColor }"></div>
              <input
                type="text"
                v-model="bgColor"
                class="flex-1 bg-transparent text-sm text-gray-700 focus:outline-none"
              />
            </div>
          </div>

          <!-- Button text -->
          <div>
            <label class="text-xs font-medium text-gray-600 block mb-1.5">Button text</label>
            <input
              type="text"
              v-model="buttonText"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <!-- Toggles -->
          <div class="space-y-2 pt-1">
            <label class="flex items-center gap-2.5 cursor-pointer">
              <button
                type="button"
                class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0"
                :class="showCalendarTitle ? 'bg-primary-600' : 'bg-gray-200'"
                @click="showCalendarTitle = !showCalendarTitle"
              >
                <span
                  class="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm"
                  :class="showCalendarTitle ? 'translate-x-5' : 'translate-x-1'"
                />
              </button>
              <span class="text-sm text-gray-700">Calendar title</span>
            </label>
            <label class="flex items-center gap-2.5 cursor-pointer">
              <button
                type="button"
                class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0"
                :class="showCalendarDescription ? 'bg-primary-600' : 'bg-gray-200'"
                @click="showCalendarDescription = !showCalendarDescription"
              >
                <span
                  class="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm"
                  :class="showCalendarDescription ? 'translate-x-5' : 'translate-x-1'"
                />
              </button>
              <span class="text-sm text-gray-700">Calendar description</span>
            </label>
            <label class="flex items-center gap-2.5 cursor-pointer">
              <button
                type="button"
                class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0"
                :class="showCalendarDetails ? 'bg-primary-600' : 'bg-gray-200'"
                @click="showCalendarDetails = !showCalendarDetails"
              >
                <span
                  class="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm"
                  :class="showCalendarDetails ? 'translate-x-5' : 'translate-x-1'"
                />
              </button>
              <span class="text-sm text-gray-700">Calendar details</span>
            </label>
          </div>
        </div>

        <!-- Reset / preview footer -->
        <div class="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
          <button class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 rounded-lg hover:bg-gray-50">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
            Reset to default
          </button>
          <button class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            Preview widget
          </button>
        </div>
      </div>
    </div>

    <!-- Insert custom code -->
    <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <div>
        <label class="text-sm font-medium text-gray-700 block">Insert custom code</label>
        <p class="text-xs text-gray-500 mt-0.5">Custom CSS or JS injected into the booking widget.</p>
      </div>
      <textarea
        v-model="customCode"
        rows="4"
        placeholder="Please input custom code here"
        class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-y"
      />
    </div>
  </div>
</template>
