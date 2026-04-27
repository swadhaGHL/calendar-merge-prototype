import { ref, reactive, computed } from 'vue'
import {
  createDefaultConfig,
  calendarTemplates,
  mockStaff,
  existingCalendars,
  type UnifiedCalendarConfig,
  type CalendarTemplate,
  type MockTeamMember,
  type MeetingLocation,
} from '../data/mockCalendars'

// ─── Types ───

export type FlowStep =
  | 'welcome'
  | 'use-case-select'
  | 'calendar-types-info'
  | 'discover-features'
  | 'name'
  | 'team'
  | 'team-single'
  | 'team-select'
  | 'team-assign-mode'
  | 'location'
  | 'location-sub'
  | 'duration'
  | 'seats'
  | 'availability'
  | 'summary'
  | 'created'

export type UseCase = '1:1' | 'group' | 'team-rotation' | 'panel' | 'event'

export interface WelcomeAction {
  id: string
  icon: string
  label: string
  subtitle?: string
  isPrimary?: boolean
}

export interface ChatMessage {
  id: string
  role: 'ai' | 'user'
  text: string
  chips?: ChatChip[]
  cards?: UseCaseCard[]
  welcomeActions?: WelcomeAction[]
  inlineInput?: boolean
  teamSelect?: boolean
  nameInput?: boolean
  locationInput?: boolean
  availabilityInput?: boolean
  discoverFeatures?: boolean
  integrationStatus?: boolean
  summaryData?: SummaryItem[]
  createdData?: { name: string; link: string }
}

export interface ChatChip {
  label: string
  value: string
  preSelected?: boolean
}

export interface UseCaseCard {
  id: UseCase
  icon: string
  label: string
  subtitle: string
}

export interface SummaryItem {
  label: string
  value: string
}

// ─── Use case → config mapping ───

const useCaseDefaults: Record<UseCase, {
  templateId: string
  suggestedName: string
  defaultDuration: number
  defaultLocation: MeetingLocation['type']
}> = {
  '1:1': {
    templateId: 'one-on-one',
    suggestedName: 'Discovery Call',
    defaultDuration: 30,
    defaultLocation: 'zoom',
  },
  'group': {
    templateId: 'group-session',
    suggestedName: 'Group Session',
    defaultDuration: 60,
    defaultLocation: 'in_person',
  },
  'team-rotation': {
    templateId: 'team-rotation',
    suggestedName: 'Sales Call',
    defaultDuration: 30,
    defaultLocation: 'zoom',
  },
  'panel': {
    templateId: 'panel',
    suggestedName: 'Panel Interview',
    defaultDuration: 45,
    defaultLocation: 'zoom',
  },
  'event': {
    templateId: 'open-event',
    suggestedName: 'Open Event',
    defaultDuration: 120,
    defaultLocation: 'in_person',
  },
}

// ─── Welcome action presets ───

const firstTimeActions: WelcomeAction[] = [
  { id: 'create', icon: '📅', label: 'Create my first booking calendar', subtitle: 'Guided setup — takes 2 minutes', isPrimary: true },
  { id: 'types', icon: '📋', label: 'See calendar types & use cases' },
  { id: 'hours', icon: '⏰', label: 'Set my working hours' },
  { id: 'integrations', icon: '🔗', label: 'Connect Google/Outlook & video apps' },
  { id: 'other', icon: '💬', label: 'Something else\u2026' },
]

const returningActions: WelcomeAction[] = [
  { id: 'create', icon: '➕', label: 'Create a new calendar', subtitle: 'Choose a type and set up in under 2 minutes', isPrimary: true },
  { id: 'discover', icon: '💡', label: 'Discover what calendars can do' },
  { id: 'other', icon: '💬', label: 'Something else\u2026' },
]

// ─── Free-text → use case matching ───

function matchUseCaseFromText(text: string): UseCase {
  const lower = text.toLowerCase()
  if (/rotat|round.?robin|distribut|assign|sales.?team|lead/i.test(lower)) return 'team-rotation'
  if (/group|class|webinar|workshop|multiple.*people|training|yoga|fitness/i.test(lower)) return 'group'
  if (/panel|committee|interview|collective|everyone.*attend|all.*attend/i.test(lower)) return 'panel'
  if (/event|conference|seminar|expo|no.?host|public|registration|rsvp/i.test(lower)) return 'event'
  return '1:1'
}

function extractNameFromText(text: string): string {
  const trimmed = text.trim()
  if (trimmed.length <= 40) return trimmed
  return trimmed.slice(0, 40).replace(/\s+\S*$/, '...')
}

function extractDurationFromText(text: string): number | null {
  const match = text.match(/(\d+)\s*(?:min|minute|hr|hour)/i)
  if (match) {
    const val = parseInt(match[1])
    if (text.match(/hr|hour/i)) return val * 60
    return val
  }
  return null
}

// ─── Composable ───

export function useAISetupFlow() {
  const currentStep = ref<FlowStep>('welcome')
  const messages = ref<ChatMessage[]>([])
  const selectedUseCase = ref<UseCase | null>(null)
  const freeTextInput = ref('')
  const hasExistingCalendars = ref(false)

  const answers = reactive({
    useCase: null as UseCase | null,
    name: '',
    teamMembers: [] as MockTeamMember[],
    assignMode: '' as '' | 'auto-assign' | 'client-chooses',
    location: null as MeetingLocation | null,
    duration: 30,
    seats: 1,
    availability: {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as string[],
      startTime: '9:00 AM',
      endTime: '5:00 PM',
    },
  })

  // Derived preview config that updates progressively
  const previewConfig = computed<UnifiedCalendarConfig>(() => {
    const base = createDefaultConfig()
    base.name = answers.name || 'Calendar Name'
    base.meetingDuration = answers.duration
    base.meetingInterval = answers.duration

    if (answers.teamMembers.length > 0) {
      base.teamMembers = answers.teamMembers
    }

    if (answers.useCase === 'group') {
      base.seatsPerSlot = answers.seats
      base.bookingBehavior = 'shared'
      base.showSeatsToBookers = true
    }
    if (answers.useCase === 'team-rotation') {
      base.assignmentStrategy = 'rotate'
      base.enableBookerStaffSelection = answers.assignMode === 'client-chooses'
    }
    if (answers.useCase === 'panel') {
      base.assignmentStrategy = 'collective'
    }
    if (answers.useCase === 'event') {
      base.teamMembers = []
      base.seatsPerSlot = answers.seats
      base.bookingBehavior = 'shared'
      base.showSeatsToBookers = true
    }

    if (answers.location) {
      base.calendarLocation = answers.location
      if (base.teamMembers.length > 0) {
        base.teamMembers = base.teamMembers.map(m => ({
          ...m,
          meetingLocation: answers.location!,
        }))
      }
    }

    return base
  })

  let msgCounter = 0
  function addMessage(msg: Omit<ChatMessage, 'id'>) {
    messages.value.push({ ...msg, id: `msg-${++msgCounter}` })
  }

  // ─── Flow: Welcome (Step 0) ───

  function initFlow(forceNew?: boolean) {
    // Detect whether calendars already exist
    hasExistingCalendars.value = !forceNew && existingCalendars.length > 0

    if (hasExistingCalendars.value) {
      const count = existingCalendars.length
      addMessage({
        role: 'ai',
        text: `Welcome back, ${mockStaff[0].userName}! You have ${count} calendar${count !== 1 ? 's' : ''} set up. What would you like to do?`,
        welcomeActions: returningActions,
      })
    } else {
      addMessage({
        role: 'ai',
        text: `Hi! I'm your Calendar AI Assistant. What would you like to do?`,
        welcomeActions: firstTimeActions,
      })
    }
    currentStep.value = 'welcome'
  }

  // ─── Welcome action handlers ───

  function handleWelcomeAction(actionId: string) {
    const actions = hasExistingCalendars.value ? returningActions : firstTimeActions
    const action = actions.find(a => a.id === actionId)
    if (action) {
      addMessage({ role: 'user', text: action.label })
    }

    switch (actionId) {
      case 'create':
        goToUseCaseSelectStep()
        break
      case 'types':
        showCalendarTypesInfo()
        break
      case 'hours':
        showAvailabilitySetup()
        break
      case 'integrations':
        showIntegrationStatus()
        break
      case 'discover':
        showDiscoverFeatures()
        break
      case 'other':
        showFreeTextInput()
        break
    }
  }

  // ─── Step 0b: Use-Case Selection ───

  function goToUseCaseSelectStep() {
    currentStep.value = 'use-case-select'
    addMessage({
      role: 'ai',
      text: 'What kind of calendar do you need?',
      inlineInput: true,
      cards: [
        { id: '1:1', icon: '👤', label: '1:1 sessions', subtitle: 'Consultations, coaching, client calls' },
        { id: 'group', icon: '👥', label: 'Group sessions', subtitle: 'Classes, workshops, webinars' },
        { id: 'team-rotation', icon: '🔄', label: 'Distribute across team', subtitle: 'Auto-assign bookings to available members' },
        { id: 'panel', icon: '🎯', label: 'Everyone attends', subtitle: 'Panel interviews, committee reviews' },
        { id: 'event', icon: '📅', label: 'Event registration', subtitle: 'Conferences, open events, no host needed' },
      ],
    })
  }

  // ─── Secondary action: Calendar Types Info ───

  function showCalendarTypesInfo() {
    currentStep.value = 'calendar-types-info'
    addMessage({
      role: 'ai',
      text: `Here's an overview of the calendar types available:\n\n` +
        `👤 1:1 Sessions — One person meets with one booker. Great for consultations, coaching, and client calls.\n\n` +
        `👥 Group Sessions — One host, multiple attendees per slot. Perfect for classes, workshops, and webinars.\n\n` +
        `🔄 Team Rotation — Bookings distributed across team members. Ideal for sales calls and support queues.\n\n` +
        `🎯 Panel / Everyone Attends — All selected team members join every meeting. Best for interviews and committees.\n\n` +
        `📅 Event Registration — No host needed. For conferences, open events, and public registrations.`,
      chips: [
        { label: 'Ready to create one?', value: 'create', preSelected: true },
      ],
    })
  }

  // ─── Secondary action: Working Hours Setup ───

  function showAvailabilitySetup() {
    currentStep.value = 'availability'
    addMessage({
      role: 'ai',
      text: 'Set your available days and hours:',
      availabilityInput: true,
    })
  }

  function handleWelcomeAvailabilityConfirm(days: string[], startTime: string, endTime: string) {
    answers.availability.days = days
    answers.availability.startTime = startTime
    answers.availability.endTime = endTime
    const daysLabel = days.length === 7 ? 'Every day' : days.join(', ')
    addMessage({ role: 'user', text: `${daysLabel}, ${startTime} – ${endTime}` })

    if (hasExistingCalendars.value) {
      addMessage({
        role: 'ai',
        text: `Got it! Your hours are set to ${daysLabel}, ${startTime} – ${endTime}. Anything else I can help with?`,
        chips: [
          { label: 'Create a new calendar', value: 'create', preSelected: true },
          { label: "That's all for now", value: 'done' },
        ],
      })
    } else {
      addMessage({
        role: 'ai',
        text: `Got it! Your hours are set to ${daysLabel}, ${startTime} – ${endTime}. Now let's create your first calendar!`,
        chips: [
          { label: "Let's go!", value: 'create', preSelected: true },
        ],
      })
    }
    currentStep.value = 'welcome' // Back to welcome-level for chip routing
  }

  // ─── Secondary action: Integration Status ───

  function showIntegrationStatus() {
    currentStep.value = 'welcome'
    addMessage({
      role: 'ai',
      text: `Here's your current integration status:`,
      integrationStatus: true,
      chips: hasExistingCalendars.value
        ? [
            { label: 'Create a new calendar', value: 'create', preSelected: true },
            { label: "That's all for now", value: 'done' },
          ]
        : [
            { label: "Let's create a calendar!", value: 'create', preSelected: true },
          ],
    })
  }

  // ─── Secondary action: Discover What Calendars Can Do ───

  const featureAnswers: Record<string, string> = {
    buffers: 'Add prep time before meetings and breaks between back-to-back bookings. Set pre-buffer and post-buffer times independently in your calendar\'s Booking Rules settings.',
    guests: 'Let bookers add additional attendees when scheduling. You can collect guest names and emails, or just a headcount. Enable this in the Form & Confirmation settings.',
    forms: 'Collect specific information from bookers during scheduling \u2014 like phone number, company name, or special requests. Create custom form templates and assign them to any calendar.',
    widget: 'Change the colors, border radius, and layout of your booking widget. Choose between inline embed, popup, or floating button styles. Match it to your brand.',
    'booking-rules': 'Control minimum scheduling notice, max bookings per day, how far ahead people can book, and slot intervals. Fine-tune these in the Booking Rules tab.',
    policies: 'Set whether bookers can reschedule or cancel their appointments, and configure how long those links stay active. Found in Notifications & Policies.',
    embed: 'Add booking widgets directly into your sales funnels and web pages. Use the embed code, WordPress plugin, or direct booking link.',
    payments: 'Charge for sessions via Stripe \u2014 full or partial payments. Set per-session pricing, enable coupon codes, and choose whether to collect per attendee or per booking.',
    workflows: 'Build automated follow-up sequences triggered by bookings, cancellations, or reschedules. Send emails, SMS, or trigger other actions automatically.',
    notifications: 'Send booking confirmations and reminders via email, SMS, WhatsApp, and in-app notifications. Configure per notification type \u2014 booked, cancelled, rescheduled, reminder, follow-up.',
    reports: 'Track bookings, no-shows, cancellations, and revenue across all your calendars. View trends and identify your busiest time slots.',
    sync: 'Connect Google Calendar or Outlook to avoid double-bookings. Sync conflicts automatically and push new bookings to your connected calendar.',
  }

  const featureLabels: Record<string, string> = {
    buffers: 'Set buffer times',
    guests: 'Allow guests',
    forms: 'Custom form fields',
    widget: 'Customize widget',
    'booking-rules': 'Booking rules',
    policies: 'Reschedule & cancellation policies',
    embed: 'Embed in funnels & websites',
    payments: 'Collect payments',
    workflows: 'Create workflows',
    notifications: 'Multi-channel notifications',
    reports: 'View reports',
    sync: 'Sync with Google/Outlook',
  }

  const featureKeywords: Record<string, string[]> = {
    buffers: ['buffer', 'prep time', 'break', 'gap', 'between meetings', 'back to back', 'pre-buffer', 'post-buffer'],
    guests: ['guest', 'additional attendee', 'invite others', 'extra people', 'plus one'],
    forms: ['form', 'custom field', 'collect info', 'intake', 'questionnaire', 'booking form'],
    widget: ['widget', 'color', 'theme', 'brand', 'style', 'appearance', 'customize look'],
    'booking-rules': ['booking rule', 'minimum notice', 'advance', 'max booking', 'slot interval', 'scheduling notice', 'how far ahead'],
    policies: ['reschedule', 'cancel', 'cancellation', 'policy'],
    embed: ['embed', 'website', 'funnel', 'wordpress', 'iframe', 'booking link', 'landing page'],
    payments: ['payment', 'pay', 'charge', 'stripe', 'price', 'pricing', 'coupon', 'money', 'cost', 'fee'],
    workflows: ['workflow', 'automat', 'follow-up', 'follow up', 'trigger', 'sequence'],
    notifications: ['notification', 'reminder', 'sms', 'whatsapp', 'alert', 'notify'],
    reports: ['report', 'analytics', 'track', 'no-show', 'trend', 'stats', 'statistics', 'revenue'],
    sync: ['sync', 'google calendar', 'outlook', 'double booking', 'conflict', 'connect calendar'],
  }

  const discoverPresetChips: { id: string; icon: string; label: string }[] = [
    { id: 'payments', icon: '💳', label: 'Collect payments' },
    { id: 'embed', icon: '🏗️', label: 'Embed in website or funnel' },
    { id: 'notifications', icon: '🔔', label: 'Notifications & reminders' },
    { id: 'workflows', icon: '⚡', label: 'Automate with workflows' },
    { id: 'sync', icon: '🔗', label: 'Sync with Google/Outlook' },
    { id: 'forms', icon: '📋', label: 'Customize booking forms' },
  ]

  function matchFeatureFromText(text: string): string | null {
    const lower = text.toLowerCase()
    let bestMatch: string | null = null
    let bestScore = 0

    for (const [featureId, keywords] of Object.entries(featureKeywords)) {
      let score = 0
      for (const keyword of keywords) {
        if (lower.includes(keyword)) {
          score += keyword.length
        }
      }
      if (score > bestScore) {
        bestScore = score
        bestMatch = featureId
      }
    }

    return bestMatch
  }

  function showDiscoverFeatures() {
    currentStep.value = 'discover-features'
    addMessage({
      role: 'ai',
      text: 'What would you like to know about calendars? Ask me anything, or pick a popular topic below.',
      discoverFeatures: true,
    })
  }

  function handleFeatureClick(featureId: string) {
    addMessage({ role: 'user', text: featureLabels[featureId] || featureId })

    const answer = featureAnswers[featureId] || 'This feature can be configured from your calendar settings.'
    addMessage({
      role: 'ai',
      text: answer,
      chips: [
        { label: 'Create a calendar', value: 'create', preSelected: true },
        { label: 'Explore more', value: 'explore-more' },
      ],
    })
    currentStep.value = 'discover-features'
  }

  function handleDiscoverFreeText(text: string) {
    addMessage({ role: 'user', text })

    const matchedFeature = matchFeatureFromText(text)

    if (matchedFeature) {
      addMessage({
        role: 'ai',
        text: featureAnswers[matchedFeature],
        chips: [
          { label: 'Create a calendar', value: 'create', preSelected: true },
          { label: 'Explore more', value: 'explore-more' },
        ],
      })
    } else {
      addMessage({
        role: 'ai',
        text: 'Great question! Calendars support a wide range of features including payment collection, website embedding, automated workflows, multi-channel notifications, Google/Outlook sync, and customizable booking forms. Would you like to explore one of these, or create a calendar to get started?',
        chips: [
          { label: 'Create a calendar', value: 'create', preSelected: true },
          { label: 'Explore more', value: 'explore-more' },
        ],
      })
    }

    currentStep.value = 'discover-features'
  }

  // ─── Secondary action: Something else (free text) ───

  function showFreeTextInput() {
    currentStep.value = 'use-case-select'
    addMessage({
      role: 'ai',
      text: 'Tell me what you need and I\'ll help you set it up:',
      inlineInput: true,
    })
  }

  // ─── Handle welcome-level chip clicks (post-secondary-action) ───

  function handleWelcomeChip(value: string) {
    if (value === 'create') {
      addMessage({ role: 'user', text: 'Create a calendar' })
      goToUseCaseSelectStep()
    } else if (value === 'explore-more') {
      addMessage({ role: 'user', text: 'Explore more' })
      showDiscoverFeatures()
    } else if (value === 'done') {
      addMessage({ role: 'user', text: "That's all for now" })
      addMessage({
        role: 'ai',
        text: 'Great! You can come back anytime. Happy scheduling! 🎉',
      })
    }
  }

  // ─── Handle use case selection ───

  function selectUseCase(useCase: UseCase) {
    answers.useCase = useCase
    selectedUseCase.value = useCase

    const cardLabel = {
      '1:1': '1:1 sessions',
      'group': 'Group sessions',
      'team-rotation': 'Distribute across team',
      'panel': 'Everyone attends',
      'event': 'Event registration',
    }[useCase]

    addMessage({ role: 'user', text: cardLabel })

    const defaults = useCaseDefaults[useCase]
    answers.duration = defaults.defaultDuration
    answers.seats = useCase === 'group' ? 10 : useCase === 'event' ? 50 : 1
    answers.location = useCase === 'group'
      ? { type: 'in_person', inPersonType: 'custom' }
      : { type: defaults.defaultLocation }

    goToNameStep(defaults.suggestedName)
  }

  function handleFreeText(text: string) {
    addMessage({ role: 'user', text })

    const useCase = matchUseCaseFromText(text)
    answers.useCase = useCase
    selectedUseCase.value = useCase

    const defaults = useCaseDefaults[useCase]

    // Extract duration if mentioned
    const extractedDuration = extractDurationFromText(text)
    answers.duration = extractedDuration || defaults.defaultDuration
    answers.seats = useCase === 'group' ? 10 : useCase === 'event' ? 50 : 1
    answers.location = useCase === 'group'
      ? { type: 'in_person', inPersonType: 'custom' }
      : { type: defaults.defaultLocation }

    // Extract name
    const extractedName = extractNameFromText(text)
    goToNameStep(extractedName || defaults.suggestedName)
  }

  // ─── Step: Name ───

  function goToNameStep(suggestedName: string) {
    answers.name = suggestedName
    currentStep.value = 'name'
    addMessage({
      role: 'ai',
      text: 'What should we call this calendar?',
      chips: [
        { label: suggestedName, value: suggestedName },
        { label: "I'll type a name", value: '_custom' },
      ],
      nameInput: true,
    })
  }

  function confirmName(name: string) {
    answers.name = name
    addMessage({ role: 'user', text: name })

    // Determine next step based on use case
    if (answers.useCase === 'event') {
      // Skip team selection for events
      goToLocationStep()
    } else if (answers.useCase === 'team-rotation' || answers.useCase === 'panel') {
      // Go directly to team multi-select
      goToTeamSelectStep()
    } else {
      // 1:1 or group — ask who handles bookings
      goToTeamStep()
    }
  }

  // ─── Step: Team ───

  function goToTeamStep() {
    currentStep.value = 'team'
    addMessage({
      role: 'ai',
      text: 'Who should receive these bookings?',
      chips: [
        { label: `${mockStaff[0].userName} (you)`, value: 'self' },
        { label: 'Pick a team member', value: 'pick' },
      ],
    })
  }

  function handleTeamChoice(choice: string) {
    if (choice === 'self') {
      addMessage({ role: 'user', text: `${mockStaff[0].userName} (you)` })
      answers.teamMembers = [mockStaff[0]]
      goToLocationStep()
    } else {
      addMessage({ role: 'user', text: 'Pick a team member' })
      goToTeamSingleSelectStep()
    }
  }

  function goToTeamSingleSelectStep() {
    currentStep.value = 'team-single'
    addMessage({
      role: 'ai',
      text: 'Who should host?',
      chips: mockStaff.map(m => ({
        label: m.isPrimary ? `${m.userName} (you)` : m.userName,
        value: m.userId,
      })),
    })
  }

  function handleTeamSingleChoice(userId: string) {
    const member = mockStaff.find(m => m.userId === userId)!
    answers.teamMembers = [member]
    addMessage({ role: 'user', text: member.userName })
    goToLocationStep()
  }

  function goToTeamSelectStep() {
    currentStep.value = 'team-select'
    const prompt = answers.useCase === 'panel'
      ? 'Select the team members who should all be present:'
      : 'Select the team members who should receive bookings:'
    addMessage({
      role: 'ai',
      text: prompt,
      teamSelect: true,
    })
  }

  function confirmTeamSelection(members: MockTeamMember[]) {
    answers.teamMembers = members
    const names = members.map(m => m.userName).join(', ')
    addMessage({ role: 'user', text: names })

    if (answers.useCase === 'panel') {
      addMessage({ role: 'ai', text: `Great! All ${members.length} members will attend every booking.` })
      goToLocationStep()
    } else if (answers.useCase === 'team-rotation') {
      goToAssignModeStep()
    } else {
      goToLocationStep()
    }
  }

  // ─── Step: Assignment mode ───

  function goToAssignModeStep() {
    currentStep.value = 'team-assign-mode'
    addMessage({
      role: 'ai',
      text: 'Should clients pick who they meet, or should we auto-assign?',
      chips: [
        { label: 'Auto-assign based on availability', value: 'auto-assign' },
        { label: 'Let clients choose', value: 'client-chooses' },
      ],
    })
  }

  function handleAssignMode(mode: string) {
    answers.assignMode = mode as 'auto-assign' | 'client-chooses'
    addMessage({ role: 'user', text: mode === 'auto-assign' ? 'Auto-assign based on availability' : 'Let clients choose' })
    goToLocationStep()
  }

  // ─── Step: Location (3 categories) ───

  function goToLocationStep() {
    currentStep.value = 'location'
    const useCase = answers.useCase

    // Group/Class: only Custom location is supported — show text input
    if (useCase === 'group') {
      addMessage({
        role: 'ai',
        text: 'Where will the group session take place?',
        locationInput: true,
        chips: [
          { label: "I'll set this later", value: 'skip' },
        ],
      })
      return
    }

    // Build location category chips based on use case constraints
    const chips: ChatChip[] = []

    // Video Conferencing: available for 1:1, team-rotation, panel (NOT event, NOT group)
    if (useCase !== 'event') {
      chips.push({ label: 'Video Conferencing', value: 'video', preSelected: true })
    }

    // In-Person / Phone / Custom: available for all remaining use cases
    chips.push({
      label: 'In-Person / Phone / Custom',
      value: 'in_person_group',
      preSelected: useCase === 'event',
    })

    // Ask the Booker: only for 1:1 and event
    if (useCase === '1:1' || useCase === 'event') {
      chips.push({ label: 'Ask the Booker', value: 'ask_booker' })
    }

    addMessage({ role: 'ai', text: 'How will you meet?', chips })
  }

  function handleLocationValueInput(value: string) {
    if (answers.location) {
      answers.location.customValue = value
    }
    addMessage({ role: 'user', text: value })
    goToDurationStep()
  }

  function handleLocationValueSkip() {
    addMessage({ role: 'user', text: "I'll set this later" })
    goToDurationStep()
  }

  function handleLocationChoice(choice: string) {
    if (choice === 'video') {
      addMessage({ role: 'user', text: 'Video Conferencing' })
      goToLocationSubStep('video')
    } else if (choice === 'in_person_group') {
      addMessage({ role: 'user', text: 'In-Person / Phone / Custom' })
      goToLocationSubStep('in_person_group')
    } else {
      // Ask the Booker — no sub-options needed
      addMessage({ role: 'user', text: 'Ask the Booker' })
      answers.location = { type: 'ask_booker' }
      goToDurationStep()
    }
  }

  function goToLocationSubStep(category: string) {
    currentStep.value = 'location-sub'
    if (category === 'video') {
      // Show connected integrations (mock: show all 3, pre-select Zoom)
      addMessage({
        role: 'ai',
        text: 'Which video tool?',
        chips: [
          { label: 'Zoom', value: 'zoom', preSelected: true },
          { label: 'Google Meet', value: 'google_meet' },
          { label: 'MS Teams', value: 'ms_teams' },
        ],
      })
    } else {
      // In-person sub-options
      const isEvent = answers.useCase === 'event'
      addMessage({
        role: 'ai',
        text: 'What type?',
        chips: [
          { label: 'Phone', value: 'in_person_phone' },
          { label: 'Full Address', value: 'in_person_address', preSelected: isEvent },
          { label: 'Other / Custom', value: 'in_person_custom' },
        ],
      })
    }
  }

  function handleLocationSubChoice(choice: string) {
    const labelMap: Record<string, string> = {
      zoom: 'Zoom',
      google_meet: 'Google Meet',
      ms_teams: 'MS Teams',
      in_person_phone: 'Phone',
      in_person_address: 'Full Address',
      in_person_custom: 'Other / Custom',
    }
    addMessage({ role: 'user', text: labelMap[choice] || choice })

    // Video tools — set and advance immediately
    if (!choice.startsWith('in_person_')) {
      answers.location = { type: choice as MeetingLocation['type'] }
      goToDurationStep()
      return
    }

    // In-person sub-options — set type, then ask for the value
    if (choice === 'in_person_phone') {
      answers.location = { type: 'in_person', inPersonType: 'phone' }
    } else if (choice === 'in_person_address') {
      answers.location = { type: 'in_person', inPersonType: 'address' }
    } else {
      answers.location = { type: 'in_person', inPersonType: 'custom' }
    }

    const promptMap: Record<string, string> = {
      in_person_phone: "What's the phone number?",
      in_person_address: "What's the address?",
      in_person_custom: 'Enter the location details:',
    }

    addMessage({
      role: 'ai',
      text: promptMap[choice],
      locationInput: true,
      chips: [{ label: "I'll set this later", value: 'skip' }],
    })
  }

  // ─── Step: Duration ───

  function goToDurationStep() {
    currentStep.value = 'duration'
    const defaultDur = answers.duration
    addMessage({
      role: 'ai',
      text: 'How long is each session?',
      chips: [
        { label: '15 min', value: '15', preSelected: defaultDur === 15 },
        { label: '30 min', value: '30', preSelected: defaultDur === 30 },
        { label: '45 min', value: '45', preSelected: defaultDur === 45 },
        { label: '60 min', value: '60', preSelected: defaultDur === 60 },
        { label: '90 min', value: '90', preSelected: defaultDur === 90 },
        { label: '120 min', value: '120', preSelected: defaultDur === 120 },
      ],
    })
  }

  function handleDurationChoice(choice: string) {
    const dur = parseInt(choice)
    answers.duration = dur
    addMessage({ role: 'user', text: `${dur} min` })

    // Group and Event need seats selection
    if (answers.useCase === 'group' || answers.useCase === 'event') {
      goToSeatsStep()
    } else {
      goToAvailabilityStep()
    }
  }

  // ─── Step: Seats (Group / Event only) ───

  function goToSeatsStep() {
    currentStep.value = 'seats'
    const defaultSeats = answers.seats
    addMessage({
      role: 'ai',
      text: 'How many people can attend each session?',
      chips: [
        { label: '5', value: '5', preSelected: defaultSeats === 5 },
        { label: '10', value: '10', preSelected: defaultSeats === 10 },
        { label: '15', value: '15', preSelected: defaultSeats === 15 },
        { label: '20', value: '20', preSelected: defaultSeats === 20 },
        { label: '25', value: '25', preSelected: defaultSeats === 25 },
        { label: '50', value: '50', preSelected: defaultSeats === 50 },
      ],
    })
  }

  function handleSeatsChoice(choice: string) {
    const seats = parseInt(choice)
    answers.seats = seats
    addMessage({ role: 'user', text: `${seats} people` })
    goToAvailabilityStep()
  }

  // ─── Step: Availability ───

  function goToAvailabilityStep() {
    currentStep.value = 'availability'
    const days = answers.availability.days.join(', ')
    addMessage({
      role: 'ai',
      text: `I've set your availability to ${days}, ${answers.availability.startTime} – ${answers.availability.endTime}.`,
      chips: [
        { label: 'Looks good', value: 'confirm' },
        { label: 'Adjust hours', value: 'adjust' },
      ],
    })
  }

  function handleAvailabilityChoice(choice: string) {
    if (choice === 'confirm') {
      addMessage({ role: 'user', text: 'Looks good' })
      goToSummaryStep()
    } else {
      addMessage({ role: 'user', text: 'Adjust hours' })
      addMessage({
        role: 'ai',
        text: 'Set your available days and hours:',
        availabilityInput: true,
      })
    }
  }

  function handleAvailabilityConfirm(days: string[], startTime: string, endTime: string) {
    // Check if we're in the creation flow (has a use case) or welcome flow
    if (!answers.useCase) {
      // From welcome secondary action
      handleWelcomeAvailabilityConfirm(days, startTime, endTime)
      return
    }

    answers.availability.days = days
    answers.availability.startTime = startTime
    answers.availability.endTime = endTime
    const daysLabel = days.length === 7 ? 'Every day' : days.join(', ')
    addMessage({ role: 'user', text: `${daysLabel}, ${startTime} – ${endTime}` })
    goToSummaryStep()
  }

  // ─── Step: Summary ───

  function goToSummaryStep() {
    currentStep.value = 'summary'

    const locType = answers.location?.type || 'zoom'
    const locSubLabel = answers.location?.inPersonType === 'phone' ? ' (Phone)'
      : answers.location?.inPersonType === 'address' ? ' (Address)'
      : answers.location?.inPersonType === 'custom' ? ' (Custom)'
      : ''
    const locationLabel = ({
      zoom: 'Zoom',
      google_meet: 'Google Meet',
      ms_teams: 'MS Teams',
      in_person: 'In-Person' + locSubLabel,
      ask_booker: 'Booker chooses',
    } as Record<string, string>)[locType] || 'Custom'

    const teamLabel = answers.teamMembers.length === 0
      ? 'No host (open event)'
      : answers.teamMembers.map(m => m.userName).join(', ')

    const daysLabel = answers.availability.days.length === 7
      ? 'Every day'
      : answers.availability.days.join(', ')

    const summaryItems: SummaryItem[] = [
      { label: answers.name, value: '' },
      { label: `${answers.duration} min`, value: `via ${locationLabel}` },
    ]
    if (answers.useCase === 'group' || answers.useCase === 'event') {
      summaryItems.push({ label: `${answers.seats} seats`, value: 'per session' })
    }
    summaryItems.push(
      { label: 'Assigned to', value: teamLabel },
      { label: 'Available', value: `${daysLabel}, ${answers.availability.startTime} – ${answers.availability.endTime}` },
    )

    addMessage({
      role: 'ai',
      text: "Here's your calendar:",
      summaryData: summaryItems,
      chips: [
        { label: 'Create Calendar', value: 'create' },
      ],
    })
  }

  function handleCreate() {
    addMessage({ role: 'user', text: 'Create Calendar' })
    currentStep.value = 'created'

    const slug = answers.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    addMessage({
      role: 'ai',
      text: `Your calendar "${answers.name}" is live!`,
      createdData: {
        name: answers.name,
        link: `https://app.ghl.com/widget/bookings/${slug}`,
      },
      chips: [
        { label: 'Book a test appointment', value: 'test', preSelected: true },
        { label: 'Embed on website', value: 'embed' },
        { label: 'Go to calendar', value: 'goto' },
      ],
    })
  }

  return {
    currentStep,
    messages,
    answers,
    previewConfig,
    freeTextInput,
    selectedUseCase,
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
  }
}
