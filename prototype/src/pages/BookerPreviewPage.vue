<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCalendarState } from '../composables/useCalendarState'
import BookerWidgetPreview from '../components/prototype/BookerWidgetPreview.vue'
import { calendarTemplates, mockStaff, type CalendarTemplate } from '../data/mockCalendars'

const router = useRouter()
const { calendarConfig, derivedType, derivedSummary, onSelectTemplate, updateConfig } = useCalendarState()

const activeScenarioId = ref<string | null>(null)

// Quick-load scenarios — extend the base templates with a few extras that cover
// the IA edge cases we want to validate. Same template engine the wizard uses.
const scenarios: { id: string; label: string; description: string; tweaks?: Partial<typeof calendarConfig> }[] = [
  { id: 'one-on-one', label: '1:1 Meeting', description: 'Personal Booking — 1 host, separate' },
  { id: 'group-session', label: 'Group Session', description: 'Class Booking — 1 host, shared, 10 seats' },
  { id: 'team-rotation', label: 'Round Robin', description: '3 rotating hosts, allow staff selection on' },
  { id: 'panel', label: 'Panel / Committee', description: 'Collective — 3 hosts, all attend' },
  { id: 'open-event', label: 'Event', description: '0 hosts, public registration' },
  // Extras to cover the IA edge cases
  { id: 'rr-with-staff-selection', label: 'RR + Pick Host', description: 'Round Robin with allow-staff-selection ON' },
  { id: 'multi-location', label: 'Multi-location', description: '1 host, 3 location options for booker to pick' },
  { id: 'ask-booker', label: 'Ask the booker', description: 'Booker types their preferred location' },
  { id: 'paid', label: 'Paid Booking', description: 'Personal + payment enabled' },
  { id: 'class-with-guests', label: 'Class + Guests', description: 'Group session with guest add-on (each takes a seat)' },
  { id: 'collective-shared-zoom', label: 'Collective + Zoom', description: 'Panel with shared Zoom link' },
]

function loadScenario(id: string) {
  activeScenarioId.value = id

  // Find a base template if id matches one
  const base = calendarTemplates.find(t => t.id === id)
  if (base) {
    onSelectTemplate(base)
  }

  // Apply scenario-specific tweaks
  switch (id) {
    case 'one-on-one':
      onSelectTemplate(calendarTemplates.find(t => t.id === 'one-on-one') as CalendarTemplate)
      updateConfig({
        name: '30-minute consultation',
        description: 'Pick a time that works for you — we\'ll send a calendar invite with the meeting link.',
        calendarLocation: { type: 'zoom', sourceUserId: mockStaff[0].userId },
        locationMode: 'single',
      })
      break

    case 'group-session':
      onSelectTemplate(calendarTemplates.find(t => t.id === 'group-session') as CalendarTemplate)
      updateConfig({
        name: 'Yoga Morning Flow',
        description: 'Start your day with a 60-minute yoga session. Mat and props provided.',
        calendarLocation: { type: 'in_person', inPersonType: 'address', customValue: '123 Studio St, Bangalore', displayLabel: 'Yoga Studio' },
        locationMode: 'single',
        showSeatsToBookers: true,
      })
      break

    case 'team-rotation':
      onSelectTemplate(calendarTemplates.find(t => t.id === 'team-rotation') as CalendarTemplate)
      updateConfig({
        name: 'Sales Discovery Call',
        description: 'A 30-minute call to learn about your needs and how we can help.',
      })
      break

    case 'rr-with-staff-selection':
      onSelectTemplate(calendarTemplates.find(t => t.id === 'team-rotation') as CalendarTemplate)
      updateConfig({
        name: 'Sales Discovery Call',
        description: 'Pick the rep you\'d like to chat with.',
        enableBookerStaffSelection: true,
      })
      break

    case 'panel':
      onSelectTemplate(calendarTemplates.find(t => t.id === 'panel') as CalendarTemplate)
      updateConfig({
        name: 'Technical Panel Interview',
        description: 'Panel interview with the engineering leadership team.',
        calendarLocation: { type: 'zoom', sourceUserId: mockStaff[0].userId },
        locationMode: 'single',
      })
      // mark first member as primary owner
      updateConfig({
        teamMembers: calendarConfig.teamMembers.map((m, i) => ({ ...m, isPrimary: i === 0 })),
      })
      break

    case 'open-event':
      onSelectTemplate(calendarTemplates.find(t => t.id === 'open-event') as CalendarTemplate)
      updateConfig({
        name: 'Product Launch Webinar',
        description: 'Join us live for the Q2 product launch — Q&A at the end.',
        calendarLocation: { type: 'in_person', inPersonType: 'custom', customValue: 'https://us02web.zoom.us/j/123', displayLabel: 'Online webinar' },
        locationMode: 'single',
        showSeatsToBookers: true,
      })
      break

    case 'multi-location':
      onSelectTemplate(calendarTemplates.find(t => t.id === 'one-on-one') as CalendarTemplate)
      updateConfig({
        name: 'Tax Counselling Session',
        description: 'Choose between an in-person meeting at our office or a video call.',
        calendarLocation: null,
        locationMode: 'multiple',
        additionalLocationOptions: [
          { type: 'zoom', sourceUserId: mockStaff[0].userId },
          { type: 'in_person', inPersonType: 'address', customValue: '500 Park Ave, NY', displayLabel: 'NY office' },
          { type: 'in_person', inPersonType: 'address', customValue: '12 Studio Rd, Bangalore', displayLabel: 'Bangalore office' },
        ],
      })
      break

    case 'ask-booker':
      onSelectTemplate(calendarTemplates.find(t => t.id === 'one-on-one') as CalendarTemplate)
      updateConfig({
        name: 'Open coffee chat',
        description: 'Pick a time and tell us where you\'d like to meet.',
        calendarLocation: { type: 'ask_booker' },
        locationMode: 'ask_booker',
      })
      break

    case 'paid':
      onSelectTemplate(calendarTemplates.find(t => t.id === 'one-on-one') as CalendarTemplate)
      updateConfig({
        name: 'Tax Counselling Session',
        description: 'Are you feeling overwhelmed by your taxes? Let our experts help.',
        calendarLocation: { type: 'zoom', sourceUserId: mockStaff[0].userId },
        locationMode: 'single',
        enablePayments: true,
        paymentAmount: 100,
        currency: 'USD',
        acceptPartialPayment: true,
      })
      break

    case 'class-with-guests':
      onSelectTemplate(calendarTemplates.find(t => t.id === 'group-session') as CalendarTemplate)
      updateConfig({
        name: 'Yoga Morning Flow',
        description: 'Start your day with a 60-minute yoga session. Bring a friend!',
        calendarLocation: { type: 'in_person', inPersonType: 'address', customValue: '123 Studio St, Bangalore', displayLabel: 'Yoga Studio' },
        locationMode: 'single',
        showSeatsToBookers: true,
        enableGuests: true,
        seatsPerSlot: 8,
      })
      break

    case 'collective-shared-zoom':
      onSelectTemplate(calendarTemplates.find(t => t.id === 'panel') as CalendarTemplate)
      updateConfig({
        name: 'Q4 Strategy Review',
        description: 'Quarterly strategy review with the leadership team.',
        calendarLocation: { type: 'zoom', sourceUserId: mockStaff[0].userId },
        locationMode: 'single',
      })
      updateConfig({
        teamMembers: calendarConfig.teamMembers.map((m, i) => ({ ...m, isPrimary: i === 0 })),
      })
      break
  }

  // Default name fallback
  if (!calendarConfig.name) {
    updateConfig({ name: scenarios.find(s => s.id === id)?.label || 'Test Calendar' })
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 py-8 px-4">
    <div class="max-w-5xl mx-auto">
      <!-- Top bar -->
      <div class="flex items-center justify-between mb-4">
        <button
          class="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
          @click="router.push('/setup/meetings/new')"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to wizard
        </button>
        <div class="flex items-center gap-2 text-xs text-gray-500">
          <span>Live booker preview at full size</span>
          <span class="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-primary-50 text-primary-700 rounded-md">
            {{ derivedType }}
          </span>
          <span v-if="derivedSummary" class="text-xs text-gray-400">· {{ derivedSummary }}</span>
        </div>
      </div>

      <!-- Scenario picker -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h2 class="text-sm font-semibold text-gray-900">Try a scenario</h2>
            <p class="text-xs text-gray-500 mt-0.5">One click to load a pre-configured calendar. Then validate the booker flow below.</p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="scenario in scenarios"
            :key="scenario.id"
            class="px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left border"
            :class="activeScenarioId === scenario.id
              ? 'bg-primary-50 border-primary-300 text-primary-700'
              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'"
            @click="loadScenario(scenario.id)"
          >
            <div class="font-semibold">{{ scenario.label }}</div>
            <div class="text-[10px] text-gray-500 font-normal mt-0.5">{{ scenario.description }}</div>
          </button>
        </div>
      </div>

      <!-- Booker widget -->
      <BookerWidgetPreview :config="calendarConfig" />

      <!-- Footer help -->
      <p class="text-xs text-gray-500 mt-4 text-center">
        Configure further in the
        <button class="underline hover:text-gray-700" @click="router.push('/setup/meetings/new')">wizard</button>
        — both share the same calendar config so changes are live.
      </p>
    </div>
  </div>
</template>
