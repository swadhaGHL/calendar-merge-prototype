<script lang="ts" setup>
import { ref, nextTick, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAISetupFlow, type UseCase, type MockTeamMember } from '../composables/useAISetupFlow'
import BookerWidgetPreview from '../components/prototype/BookerWidgetPreview.vue'

const router = useRouter()
const route = useRoute()
const {
  currentStep,
  messages,
  answers,
  previewConfig,
  freeTextInput,
  hasExistingCalendars,
  initFlow,
  handleWelcomeAction,
  handleWelcomeChip,
  goToUseCaseSelectStep,
  selectUseCase,
  handleFreeText,
  confirmName,
  handleTeamChoice,
  handleTeamSingleChoice,
  confirmTeamSelection,
  handleAssignMode,
  handleLocationValueInput,
  handleLocationValueSkip,
  handleLocationChoice,
  handleLocationSubChoice,
  handleDurationChoice,
  handleSeatsChoice,
  handleAvailabilityChoice,
  handleAvailabilityConfirm,
  handleCreate,
  handleFeatureClick,
  handleDiscoverFreeText,
  discoverPresetChips,
  mockStaff,
} = useAISetupFlow()

const chatContainer = ref<HTMLElement | null>(null)
const customNameInput = ref('')
const showCustomNameInput = ref(false)
const customLocationInput = ref('')
const textInput = ref('')
const selectedTeamMembers = ref<Set<string>>(new Set())

// Availability editing
const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const timeOptions = [
  '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
  '9:00 PM', '9:30 PM', '10:00 PM',
]
const availabilityDays = ref<Set<string>>(new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']))
const availabilityStartTime = ref('9:00 AM')
const availabilityEndTime = ref('5:00 PM')

onMounted(() => {
  const forceNew = route.query.new === 'true'
  initFlow(forceNew)
})

// Auto-scroll chat to bottom
watch(messages, async () => {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}, { deep: true })

function handleChipClick(msgId: string, value: string, step: string) {
  switch (step) {
    case 'welcome':
      handleWelcomeChip(value)
      break
    case 'use-case-select':
      selectUseCase(value as UseCase)
      break
    case 'calendar-types-info':
      if (value === 'create') {
        handleWelcomeChip('create')
      }
      break
    case 'discover-features':
      handleWelcomeChip(value)
      break
    case 'name':
      if (value === '_custom') {
        showCustomNameInput.value = true
      } else {
        confirmName(value)
        showCustomNameInput.value = false
      }
      break
    case 'team':
      handleTeamChoice(value)
      break
    case 'team-single':
      handleTeamSingleChoice(value)
      break
    case 'team-assign-mode':
      handleAssignMode(value)
      break
    case 'location':
      if (value === 'skip') {
        handleLocationValueSkip()
      } else {
        handleLocationChoice(value)
      }
      break
    case 'location-sub':
      handleLocationSubChoice(value)
      break
    case 'duration':
      handleDurationChoice(value)
      break
    case 'seats':
      handleSeatsChoice(value)
      break
    case 'availability':
      handleAvailabilityChoice(value)
      break
    case 'summary':
      if (value === 'create') handleCreate()
      break
    case 'created':
      if (value === 'goto') router.push('/calendar-view')
      break
  }
}

function submitCustomName() {
  if (customNameInput.value.trim()) {
    confirmName(customNameInput.value.trim())
    showCustomNameInput.value = false
    customNameInput.value = ''
  }
}

function submitCustomLocation() {
  if (customLocationInput.value.trim()) {
    handleLocationValueInput(customLocationInput.value.trim())
    customLocationInput.value = ''
  }
}

function toggleAvailabilityDay(day: string) {
  if (availabilityDays.value.has(day)) {
    availabilityDays.value.delete(day)
  } else {
    availabilityDays.value.add(day)
  }
}

function submitAvailability() {
  const orderedDays = allDays.filter(d => availabilityDays.value.has(d))
  if (orderedDays.length > 0) {
    handleAvailabilityConfirm(orderedDays, availabilityStartTime.value, availabilityEndTime.value)
  }
}

function submitFreeText() {
  const text = textInput.value.trim()
  if (!text) return
  if (currentStep.value === 'discover-features') {
    handleDiscoverFreeText(text)
  } else if (currentStep.value === 'welcome' || currentStep.value === 'use-case-select') {
    handleFreeText(text)
  }
  textInput.value = ''
}

function toggleTeamMember(userId: string) {
  if (selectedTeamMembers.value.has(userId)) {
    selectedTeamMembers.value.delete(userId)
  } else {
    selectedTeamMembers.value.add(userId)
  }
}

function submitTeamSelection() {
  const members = mockStaff.filter(m => selectedTeamMembers.value.has(m.userId))
  if (members.length > 0) {
    confirmTeamSelection(members)
    selectedTeamMembers.value = new Set()
  }
}

function getStepForMessage(msg: any): string {
  // Determine which step a message belongs to based on its content
  if (msg.welcomeActions) return 'welcome'
  if (msg.cards) return 'use-case-select'
  if (msg.nameInput) return 'name'
  if (msg.teamSelect) return 'team-select'
  if (msg.discoverFeatures) return 'discover-features'
  if (msg.integrationStatus) return 'welcome'
  if (msg.summaryData && msg.chips?.some((c: any) => c.value === 'create')) return 'summary'
  if (msg.createdData) return 'created'
  if (msg.text?.includes('overview of the calendar types')) return 'calendar-types-info'
  if (msg.text?.includes('Who should host?')) return 'team-single'
  if (msg.text?.includes('Who should receive')) return 'team'
  if (msg.text?.includes('pick who they meet')) return 'team-assign-mode'
  if (msg.locationInput) return 'location'
  if (msg.text?.includes('How will you meet')) return 'location'
  if (msg.text?.includes('Which video tool') || msg.text?.includes('What type?')) return 'location-sub'
  if (msg.text?.includes('How long')) return 'duration'
  if (msg.text?.includes('How many people')) return 'seats'
  if (msg.availabilityInput) return 'availability'
  if (msg.text?.includes('availability') || msg.text?.includes('Your hours are set')) return 'availability'
  if (msg.text?.includes('Tell me what you need')) return 'use-case-select'
  // Welcome-level chips (post-secondary-action "Let's go!", "Create a new calendar", "Ask another question", etc.)
  if (msg.chips?.some((c: any) => c.value === 'create' || c.value === 'done' || c.value === 'explore-more')) return 'welcome'
  return currentStep.value
}

function isLastAiMessage(msgId: string): boolean {
  const aiMessages = messages.value.filter(m => m.role === 'ai')
  return aiMessages.length > 0 && aiMessages[aiMessages.length - 1].id === msgId
}
</script>

<template>
  <div class="h-screen flex flex-col bg-white">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-3 border-b border-gray-200 flex-shrink-0">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
          <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h1 class="text-sm font-semibold text-gray-900">Calendar Setup Assistant</h1>
          <p class="text-xs text-gray-500">AI-powered calendar configuration</p>
        </div>
        <span class="px-2 py-0.5 text-[10px] font-medium bg-primary-50 text-primary-700 rounded-full">Beta</span>
      </div>
      <button
        class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        @click="router.push('/setup/meetings/new')"
      >
        Skip setup &rarr;
      </button>
    </div>

    <!-- Main Content -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Chat Panel -->
      <div class="flex-1 flex flex-col min-w-0" style="max-width: 55%;">
        <!-- Messages -->
        <div ref="chatContainer" class="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <template v-for="msg in messages" :key="msg.id">
            <!-- AI Message -->
            <div v-if="msg.role === 'ai'" class="flex items-start gap-3">
              <div class="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg class="w-3.5 h-3.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{{ msg.text }}</p>

                <!-- Welcome Actions (Step 0: Primary CTA + secondary actions) -->
                <div v-if="msg.welcomeActions && isLastAiMessage(msg.id)" class="mt-4 space-y-3">
                  <!-- Primary CTA -->
                  <template v-for="action in msg.welcomeActions" :key="action.id">
                    <button
                      v-if="action.isPrimary"
                      class="w-full flex items-center gap-3 p-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-left transition-all group"
                      @click="handleWelcomeAction(action.id)"
                    >
                      <span class="text-2xl flex-shrink-0">{{ action.icon }}</span>
                      <div>
                        <p class="text-sm font-semibold">{{ action.label }}</p>
                        <p v-if="action.subtitle" class="text-xs text-primary-100 mt-0.5">{{ action.subtitle }}</p>
                      </div>
                      <svg class="w-5 h-5 ml-auto opacity-60 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </button>
                  </template>
                  <!-- Secondary actions -->
                  <div class="space-y-1 pt-1">
                    <template v-for="action in msg.welcomeActions" :key="action.id">
                      <button
                        v-if="!action.isPrimary"
                        class="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-gray-50 transition-colors group"
                        @click="handleWelcomeAction(action.id)"
                      >
                        <span class="text-base flex-shrink-0">{{ action.icon }}</span>
                        <span class="text-sm text-gray-700 group-hover:text-primary-700">{{ action.label }}</span>
                      </button>
                    </template>
                  </div>
                </div>

                <!-- Greyed-out welcome actions (past message) -->
                <div v-if="msg.welcomeActions && !isLastAiMessage(msg.id)" class="mt-4 space-y-3 opacity-40 pointer-events-none">
                  <template v-for="action in msg.welcomeActions" :key="action.id">
                    <div
                      v-if="action.isPrimary"
                      class="w-full flex items-center gap-3 p-4 bg-primary-600 text-white rounded-xl text-left"
                    >
                      <span class="text-2xl flex-shrink-0">{{ action.icon }}</span>
                      <div>
                        <p class="text-sm font-semibold">{{ action.label }}</p>
                        <p v-if="action.subtitle" class="text-xs text-primary-100 mt-0.5">{{ action.subtitle }}</p>
                      </div>
                    </div>
                  </template>
                  <div class="space-y-1 pt-1">
                    <template v-for="action in msg.welcomeActions" :key="action.id">
                      <div
                        v-if="!action.isPrimary"
                        class="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg"
                      >
                        <span class="text-base flex-shrink-0">{{ action.icon }}</span>
                        <span class="text-sm text-gray-500">{{ action.label }}</span>
                      </div>
                    </template>
                  </div>
                </div>

                <!-- Integration Status -->
                <div v-if="msg.integrationStatus && isLastAiMessage(msg.id)" class="mt-3 space-y-2">
                  <div class="flex items-center gap-2.5 p-2.5 border border-green-200 bg-green-50 rounded-lg">
                    <span class="text-green-600 text-sm">✅</span>
                    <span class="text-sm text-gray-900 font-medium">Zoom</span>
                    <span class="text-xs text-green-600 ml-auto">Connected</span>
                  </div>
                  <div class="flex items-center gap-2.5 p-2.5 border border-green-200 bg-green-50 rounded-lg">
                    <span class="text-green-600 text-sm">✅</span>
                    <span class="text-sm text-gray-900 font-medium">Google Calendar</span>
                    <span class="text-xs text-green-600 ml-auto">Connected</span>
                  </div>
                  <div class="flex items-center gap-2.5 p-2.5 border border-gray-200 bg-gray-50 rounded-lg">
                    <span class="text-gray-400 text-sm">⬜</span>
                    <span class="text-sm text-gray-900 font-medium">Microsoft Outlook</span>
                    <span class="text-xs text-gray-400 ml-auto">Not connected</span>
                  </div>
                  <div class="flex items-center gap-2.5 p-2.5 border border-gray-200 bg-gray-50 rounded-lg">
                    <span class="text-gray-400 text-sm">⬜</span>
                    <span class="text-sm text-gray-900 font-medium">Microsoft Teams</span>
                    <span class="text-xs text-gray-400 ml-auto">Not connected</span>
                  </div>
                </div>

                <!-- Discover Features: Combined view (free-text + preset chips) -->
                <div v-if="msg.discoverFeatures && isLastAiMessage(msg.id)" class="mt-3 space-y-3">
                  <!-- Free-text input -->
                  <div class="flex gap-2">
                    <input
                      v-model="textInput"
                      type="text"
                      placeholder="Ask me anything about calendar setup..."
                      class="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      @keydown.enter="submitFreeText"
                    />
                    <button
                      class="px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-40"
                      :disabled="!textInput.trim()"
                      @click="submitFreeText"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </button>
                  </div>
                  <!-- Popular topic chips -->
                  <div>
                    <p class="text-xs text-gray-500 mb-2">Popular topics</p>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="chip in discoverPresetChips"
                        :key="chip.id"
                        class="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-full text-sm text-gray-700 hover:border-primary-300 hover:bg-primary-25 transition-all"
                        @click="handleFeatureClick(chip.id)"
                      >
                        <span class="text-sm">{{ chip.icon }}</span>
                        {{ chip.label }}
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Greyed-out discover features (past message) -->
                <div v-if="msg.discoverFeatures && !isLastAiMessage(msg.id)" class="mt-3 opacity-40 pointer-events-none">
                  <p class="text-xs text-gray-400 mb-2">Popular topics</p>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="chip in discoverPresetChips"
                      :key="chip.id"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-full text-sm text-gray-500"
                    >
                      <span class="text-sm">{{ chip.icon }}</span>
                      {{ chip.label }}
                    </span>
                  </div>
                </div>

                <!-- Inline free-text input (use-case-select step, above cards) -->
                <div v-if="msg.inlineInput && isLastAiMessage(msg.id)" class="mt-3 flex gap-2">
                  <input
                    v-model="textInput"
                    type="text"
                    placeholder="e.g. 30-min sales discovery call rotating between 3 reps"
                    class="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    @keydown.enter="submitFreeText"
                  />
                  <button
                    class="px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-40"
                    :disabled="!textInput.trim()"
                    @click="submitFreeText"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                </div>

                <!-- Use case cards (use-case-select step) -->
                <div v-if="msg.cards && isLastAiMessage(msg.id)" class="mt-3 space-y-2">
                  <button
                    v-for="card in msg.cards"
                    :key="card.id"
                    class="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-xl text-left hover:border-primary-300 hover:bg-primary-25 transition-all group"
                    @click="handleChipClick(msg.id, card.id, 'use-case-select')"
                  >
                    <span class="text-xl flex-shrink-0">{{ card.icon }}</span>
                    <div>
                      <p class="text-sm font-medium text-gray-900 group-hover:text-primary-700">{{ card.label }}</p>
                      <p class="text-xs text-gray-500">{{ card.subtitle }}</p>
                    </div>
                  </button>
                </div>

                <!-- Greyed out use case cards (after selection) -->
                <div v-if="msg.cards && !isLastAiMessage(msg.id)" class="mt-3 space-y-2 opacity-40 pointer-events-none">
                  <div
                    v-for="card in msg.cards"
                    :key="card.id"
                    class="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-xl text-left"
                  >
                    <span class="text-xl flex-shrink-0">{{ card.icon }}</span>
                    <div>
                      <p class="text-sm font-medium text-gray-900">{{ card.label }}</p>
                      <p class="text-xs text-gray-500">{{ card.subtitle }}</p>
                    </div>
                  </div>
                </div>

                <!-- Summary data -->
                <div v-if="msg.summaryData" class="mt-3 space-y-2">
                  <div v-for="(item, i) in msg.summaryData" :key="i" class="flex items-center gap-2 text-sm">
                    <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span class="font-medium text-gray-900">{{ item.label }}</span>
                    <span v-if="item.value" class="text-gray-500">{{ item.value }}</span>
                  </div>
                  <p class="text-xs text-gray-400 mt-2">You can always fine-tune settings later.</p>
                </div>

                <!-- Created: booking link -->
                <div v-if="msg.createdData" class="mt-3">
                  <div class="flex items-center gap-2 mb-3">
                    <span class="text-2xl">🎉</span>
                  </div>
                  <p class="text-xs text-gray-500 mb-1.5">Share your booking link:</p>
                  <div class="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <code class="text-xs text-gray-700 flex-1 truncate">{{ msg.createdData.link }}</code>
                    <button
                      class="text-xs font-medium text-primary-600 hover:text-primary-700 flex-shrink-0"
                      @click="navigator.clipboard?.writeText(msg.createdData.link)"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <!-- Team multi-select -->
                <div v-if="msg.teamSelect && isLastAiMessage(msg.id)" class="mt-3 space-y-2">
                  <button
                    v-for="member in mockStaff"
                    :key="member.userId"
                    class="w-full flex items-center gap-3 p-2.5 border rounded-lg text-left transition-all"
                    :class="selectedTeamMembers.has(member.userId)
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'"
                    @click="toggleTeamMember(member.userId)"
                  >
                    <div
                      class="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                      :class="selectedTeamMembers.has(member.userId)
                        ? 'border-primary-600 bg-primary-600'
                        : 'border-gray-300'"
                    >
                      <svg v-if="selectedTeamMembers.has(member.userId)" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span class="text-sm text-gray-900">{{ member.userName }}</span>
                    <span v-if="member.isPrimary" class="text-[10px] text-gray-400">(you)</span>
                  </button>
                  <button
                    class="mt-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    :disabled="selectedTeamMembers.size === 0"
                    @click="submitTeamSelection"
                  >
                    Continue with {{ selectedTeamMembers.size }} member{{ selectedTeamMembers.size !== 1 ? 's' : '' }}
                  </button>
                </div>

                <!-- Chips -->
                <div v-if="msg.chips && isLastAiMessage(msg.id) && !msg.cards && !msg.summaryData && !msg.createdData && !msg.welcomeActions" class="mt-3 flex flex-wrap gap-2">
                  <button
                    v-for="chip in msg.chips"
                    :key="chip.value"
                    class="px-3.5 py-1.5 border rounded-full text-sm font-medium transition-all"
                    :class="chip.preSelected
                      ? 'border-primary-400 bg-primary-50 text-primary-700 hover:bg-primary-100'
                      : 'border-gray-300 text-gray-700 hover:border-primary-300 hover:bg-gray-50'"
                    @click="handleChipClick(msg.id, chip.value, getStepForMessage(msg))"
                  >
                    {{ chip.label }}
                  </button>
                </div>

                <!-- Created: action chips -->
                <div v-if="msg.createdData && msg.chips" class="mt-3 flex flex-wrap gap-2">
                  <button
                    v-for="chip in msg.chips"
                    :key="chip.value"
                    class="px-3.5 py-1.5 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:border-primary-300 hover:bg-gray-50 transition-all"
                    @click="handleChipClick(msg.id, chip.value, 'created')"
                  >
                    {{ chip.label }}
                  </button>
                </div>

                <!-- Summary: Create button -->
                <div v-if="msg.summaryData && msg.chips && msg.chips.some(c => c.value === 'create') && isLastAiMessage(msg.id)" class="mt-4">
                  <button
                    v-for="chip in msg.chips.filter(c => c.value === 'create')"
                    :key="chip.value"
                    class="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                    @click="handleChipClick(msg.id, chip.value, 'summary')"
                  >
                    {{ chip.label }}
                  </button>
                </div>

                <!-- Greyed out chips for past messages -->
                <div v-if="msg.chips && !isLastAiMessage(msg.id) && !msg.cards && !msg.summaryData && !msg.createdData && !msg.welcomeActions" class="mt-3 flex flex-wrap gap-2 opacity-40 pointer-events-none">
                  <span
                    v-for="chip in msg.chips"
                    :key="chip.value"
                    class="px-3.5 py-1.5 border border-gray-200 rounded-full text-sm text-gray-500"
                  >
                    {{ chip.label }}
                  </span>
                </div>

                <!-- Custom name input -->
                <div v-if="msg.nameInput && showCustomNameInput && isLastAiMessage(msg.id)" class="mt-3 flex gap-2">
                  <input
                    v-model="customNameInput"
                    type="text"
                    placeholder="e.g. Strategy Consultation"
                    class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    @keydown.enter="submitCustomName"
                  />
                  <button
                    class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                    @click="submitCustomName"
                  >
                    Confirm
                  </button>
                </div>

                <!-- Location value input (Group sessions + In-Person sub-options) -->
                <div v-if="msg.locationInput && isLastAiMessage(msg.id)" class="mt-3 flex gap-2">
                  <input
                    v-model="customLocationInput"
                    type="text"
                    :placeholder="answers.location?.inPersonType === 'phone'
                      ? 'e.g. +1 (555) 123-4567'
                      : answers.location?.inPersonType === 'address'
                        ? 'e.g. 123 Main St, Suite 200, City, ST 12345'
                        : 'e.g. Room 204, Conference Center B'"
                    class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    @keydown.enter="submitCustomLocation"
                  />
                  <button
                    class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-40"
                    :disabled="!customLocationInput.trim()"
                    @click="submitCustomLocation"
                  >
                    Confirm
                  </button>
                </div>

                <!-- Availability adjustment input -->
                <div v-if="msg.availabilityInput && isLastAiMessage(msg.id)" class="mt-3 space-y-3">
                  <!-- Day toggles -->
                  <div class="flex flex-wrap gap-1.5">
                    <button
                      v-for="day in allDays"
                      :key="day"
                      class="w-10 h-10 rounded-full text-xs font-medium border-2 transition-all"
                      :class="availabilityDays.has(day)
                        ? 'border-primary-600 bg-primary-600 text-white'
                        : 'border-gray-300 text-gray-500 hover:border-gray-400'"
                      @click="toggleAvailabilityDay(day)"
                    >
                      {{ day }}
                    </button>
                  </div>
                  <!-- Time range -->
                  <div class="flex items-center gap-2">
                    <select
                      v-model="availabilityStartTime"
                      class="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</option>
                    </select>
                    <span class="text-sm text-gray-500">to</span>
                    <select
                      v-model="availabilityEndTime"
                      class="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</option>
                    </select>
                  </div>
                  <!-- Confirm -->
                  <button
                    class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-40"
                    :disabled="availabilityDays.size === 0"
                    @click="submitAvailability"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>

            <!-- User Message -->
            <div v-else class="flex justify-end">
              <div class="bg-primary-600 text-white px-4 py-2 rounded-2xl rounded-br-md text-sm max-w-[70%]">
                {{ msg.text }}
              </div>
            </div>
          </template>
        </div>

        <!-- Input Bar (hidden during welcome since no free text yet) -->
        <div v-if="currentStep !== 'welcome'" class="border-t border-gray-200 px-6 py-3 flex-shrink-0">
          <div class="flex items-center gap-2">
            <input
              type="text"
              placeholder="Use the chips above to respond..."
              class="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              disabled
            />
          </div>
        </div>
      </div>

      <!-- Preview Panel -->
      <div class="w-[45%] border-l border-gray-200 bg-gray-50 overflow-y-auto p-6 flex-shrink-0">
        <BookerWidgetPreview :config="previewConfig" />
      </div>
    </div>
  </div>
</template>
