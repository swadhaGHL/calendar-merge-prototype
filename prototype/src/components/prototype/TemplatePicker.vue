<script lang="ts" setup>
import { ref, computed } from 'vue'
import { calendarTemplates, type CalendarTemplate } from '../../data/mockCalendars'

const emit = defineEmits<{
  (e: 'select', template: CalendarTemplate): void
}>()

const showAiInput = ref(false)
const aiPrompt = ref('')

// Templates without "Blank" — blank is elevated to a primary CTA
const quickStartTemplates = computed(() =>
  calendarTemplates.filter(t => t.id !== 'blank')
)

const blankTemplate = computed(() =>
  calendarTemplates.find(t => t.id === 'blank')!
)

// Short taglines for each template (more casual than full descriptions)
const taglines: Record<string, string> = {
  'one-on-one': 'Consults, coaching, 1:1 calls',
  'group-session': 'Classes, webinars, workshops',
  'team-rotation': 'Distribute across your team',
  'panel': 'Everyone attends together',
  'open-event': 'Registrations, RSVPs, no host needed',
}

const iconMap: Record<string, string> = {
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  users: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  people: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
}

// Mock AI: match keywords to closest template
function matchTemplateFromText(text: string): CalendarTemplate {
  const lower = text.toLowerCase()
  if (/rotat|round.?robin|distribut|assign|sales.?team/i.test(lower)) {
    return calendarTemplates.find(t => t.id === 'team-rotation')!
  }
  if (/group|class|webinar|workshop|multiple.*people|training/i.test(lower)) {
    return calendarTemplates.find(t => t.id === 'group-session')!
  }
  if (/panel|committee|interview|collective|everyone.*attend/i.test(lower)) {
    return calendarTemplates.find(t => t.id === 'panel')!
  }
  if (/event|conference|seminar|expo|no.?host|public/i.test(lower)) {
    return calendarTemplates.find(t => t.id === 'open-event')!
  }
  // Default fallback
  return calendarTemplates.find(t => t.id === 'one-on-one')!
}

function extractName(text: string): string {
  // Use first ~50 chars or full text, trimmed
  const trimmed = text.trim()
  if (trimmed.length <= 50) return trimmed
  return trimmed.slice(0, 50).replace(/\s+\S*$/, '...')
}

function onStartBlank() {
  emit('select', blankTemplate.value)
}

function onSelectQuickStart(template: CalendarTemplate) {
  emit('select', template)
}

function onAiCreate() {
  const text = aiPrompt.value.trim()
  if (!text) {
    // Empty prompt → fall back to blank
    emit('select', blankTemplate.value)
    return
  }

  const matched = matchTemplateFromText(text)
  // Create a copy with the user's text as the calendar name
  const customTemplate: CalendarTemplate = {
    ...matched,
    name: extractName(text),
    config: { ...matched.config },
  }
  emit('select', customTemplate)
}
</script>

<template>
  <div class="min-h-[70vh] flex items-start justify-center pt-8 pb-16">
    <div class="max-w-[720px] w-full">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-semibold text-gray-900">Create a new calendar</h1>
      </div>

      <!-- Primary Actions: Blank + AI -->
      <div class="grid grid-cols-2 gap-4 mb-10">
        <!-- Start from blank -->
        <button
          class="bg-white border-2 border-gray-200 rounded-xl p-5 text-left cursor-pointer hover:border-primary-300 hover:shadow-md transition-all duration-200 group"
          @click="onStartBlank"
        >
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-50 transition-colors">
              <svg class="w-5 h-5 text-gray-600 group-hover:text-primary-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 text-sm">Start from blank</h3>
              <p class="text-gray-500 text-xs mt-1 leading-relaxed">Jump straight into the calendar setup wizard</p>
            </div>
          </div>
        </button>

        <!-- Use AI to create -->
        <button
          class="bg-white border-2 rounded-xl p-5 text-left cursor-pointer transition-all duration-200 group"
          :class="showAiInput
            ? 'border-primary-300 shadow-md ring-1 ring-primary-100'
            : 'border-gray-200 hover:border-primary-300 hover:shadow-md'"
          @click="showAiInput = !showAiInput"
        >
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
              :class="showAiInput ? 'bg-primary-50' : 'bg-purple-50 group-hover:bg-purple-100'"
            >
              <svg class="w-5 h-5 transition-colors" :class="showAiInput ? 'text-primary-600' : 'text-purple-600'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 text-sm">Use AI to create</h3>
              <p class="text-gray-500 text-xs mt-1 leading-relaxed">Describe what you need and we'll configure it for you</p>
            </div>
          </div>
        </button>
      </div>

      <!-- AI Input Section (expandable) -->
      <transition name="expand">
        <div v-if="showAiInput" class="mb-10 -mt-6">
          <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <label class="block text-sm font-medium text-gray-700 mb-2">Describe your calendar</label>
            <textarea
              v-model="aiPrompt"
              rows="3"
              class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              placeholder="e.g. 30-min sales discovery call rotating between 3 reps, available Mon–Fri 9am–5pm"
            />
            <div class="flex items-center justify-between mt-3">
              <p class="text-xs text-gray-400">We'll pick the best template and pre-fill your settings</p>
              <button
                class="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center gap-1.5"
                @click="onAiCreate"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Create with AI
              </button>
            </div>
          </div>
        </div>
      </transition>

      <!-- Divider -->
      <div class="flex items-center gap-3 mb-4">
        <div class="h-px bg-gray-200 flex-1"></div>
        <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">Or pick a quick start</span>
        <div class="h-px bg-gray-200 flex-1"></div>
      </div>
      <p class="text-xs text-gray-400 mb-4">These pre-fill smart defaults — everything stays editable.</p>

      <!-- Quick Start Templates (horizontal row) -->
      <div class="grid grid-cols-5 gap-3">
        <button
          v-for="template in quickStartTemplates"
          :key="template.id"
          class="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-primary-300 hover:shadow-md transition-all duration-200 group text-left"
          @click="onSelectQuickStart(template)"
        >
          <div class="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center mb-2.5 group-hover:bg-primary-50 transition-colors">
            <svg class="w-[18px] h-[18px] text-gray-500 group-hover:text-primary-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" :d="iconMap[template.icon]" />
            </svg>
          </div>
          <h3 class="font-semibold text-gray-900 text-xs leading-tight">{{ template.name }}</h3>
          <p class="text-gray-400 text-[10px] mt-1 leading-snug">{{ taglines[template.id] || template.description }}</p>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
}
.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 300px;
}
</style>
