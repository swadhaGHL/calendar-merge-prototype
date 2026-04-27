import { ref, reactive, computed } from 'vue'
import {
  createDefaultConfig,
  type CalendarTemplate,
  type MeetingLocation,
  type UnifiedCalendarConfig,
} from '../data/mockCalendars'

// Mirrors LocationPicker.vue's isComplete logic. Used by the sidebar dot
// and Save gate. Source of #1 support-ticket: users skipping location and
// then meeting links never generate.
function isLocationValid(loc: MeetingLocation | null | undefined): boolean {
  if (!loc) return false
  if (loc.type === 'ask_booker') return true
  if (loc.type === 'in_person') return !!(loc.customValue && loc.customValue.trim())
  return true
}

function isStaffLocationConfigured(c: UnifiedCalendarConfig): boolean {
  const hostCount = c.teamMembers.length
  const isShared = c.assignmentStrategy === 'collective' || c.assignmentStrategy === 'mixed'
  const isPerHost = hostCount > 1 && !isShared
  if (isPerHost) {
    return c.teamMembers.every(m => isLocationValid(m.meetingLocation))
  }
  if (c.locationMode === 'multiple' && hostCount <= 1) {
    return c.additionalLocationOptions.length > 0 &&
      c.additionalLocationOptions.every(isLocationValid)
  }
  return isLocationValid(c.calendarLocation)
}

const calendarConfig = reactive<UnifiedCalendarConfig>(createDefaultConfig())
const activeTab = ref('basic')
const isCreating = ref(true)
const showAdvanced = ref(false)
const showWidgetPreview = ref(false)

export function useCalendarState() {
  const sidebarItems = [
    { key: 'basic', label: 'Basic details', subtitle: 'Name, URL, branding' },
    { key: 'staff', label: 'Staff & assignment', subtitle: 'Hosts and routing' },
    { key: 'availability', label: 'Availability', subtitle: 'When bookings can land' },
    { key: 'rules', label: 'Booking rules', subtitle: 'Duration, capacity, buffers' },
  ]

  const advancedItems = [
    { key: 'form', label: 'Form & confirmation', subtitle: 'What bookers fill out' },
    { key: 'payments', label: 'Payments', subtitle: 'Charge bookers' },
    { key: 'notifications', label: 'Notifications & policies', subtitle: 'Email / SMS / WhatsApp' },
    { key: 'widget', label: 'Widget appearance', subtitle: 'Theme and widget choice' },
    { key: 'channels', label: 'Booking channels', subtitle: 'Where it gets shared' },
  ]

  // Per-tab "complete enough" indicator — used as a green check next to each sidebar item.
  // The minimums are the smallest requirements that mean the user has actually addressed
  // the section (vs. left it on raw defaults).
  const tabCompleteness = computed<Record<string, boolean>>(() => {
    const c = calendarConfig
    const strategyOK = c.teamMembers.length <= 1 || !!c.assignmentStrategy
    const staffOK = strategyOK && isStaffLocationConfigured(c)
    return {
      basic: c.name.trim().length > 0,
      staff: staffOK,
      availability: true,
      rules: c.meetingDuration > 0,
      form: !!c.selectedFormId,
      payments: true,
      notifications: true,
      widget: true,
      channels: true,
    }
  })

  // Save is gated only on calendar name. Location is recommended (sidebar
  // amber dot + soft inline note) but not required — bookings still happen
  // without it. See locked decision #37 (revised).
  const canSave = computed(() => calendarConfig.name.trim().length > 0)

  const derivedType = computed(() => {
    const staffCount = calendarConfig.teamMembers?.length ?? 0
    const seats = calendarConfig.seatsPerSlot ?? 1
    const strategy = calendarConfig.assignmentStrategy
    const shared = calendarConfig.bookingBehavior === 'shared' && seats > 1

    // 0 hosts always wins → Event Calendar (no host = no class to host).
    // See locked decision #44.
    if (staffCount === 0) return 'Event Calendar'
    // Shared + capacity > 1 with at least one host = Class Booking
    // (any strategy, any host count ≥ 1).
    if (shared) return 'Class Booking'
    if (staffCount > 1) {
      if (strategy === 'collective' || strategy === 'mixed') return 'Collective Booking'
      return 'Round Robin'
    }
    return 'Personal Booking'
  })

  const derivedSummary = computed(() => {
    const staffCount = calendarConfig.teamMembers?.length ?? 0
    const seats = calendarConfig.seatsPerSlot ?? 1
    const strategy = calendarConfig.assignmentStrategy

    const bits: string[] = []
    if (staffCount === 0) bits.push('no host required')
    else if (staffCount === 1) bits.push('1 host')
    else if (staffCount > 1) {
      if (strategy === 'rotate') bits.push(`${staffCount} rotating hosts`)
      else if (strategy === 'collective') bits.push(`${staffCount} hosts, all required`)
      else if (strategy === 'mixed') bits.push(`${staffCount} hosts, mixed`)
      else bits.push(`${staffCount} hosts`)
    }
    if (seats > 1) bits.push(`up to ${seats} attendees per slot`)
    return bits.join(' • ')
  })

  function onSelectTemplate(template: CalendarTemplate) {
    Object.assign(calendarConfig, createDefaultConfig(), template.config)
    // Tile is a starter, not a label — let the user name their calendar.
    calendarConfig.name = ''
    isCreating.value = true
    activeTab.value = 'basic'
  }

  function onEditExisting(calendar: UnifiedCalendarConfig) {
    Object.assign(calendarConfig, calendar)
    isCreating.value = false
    activeTab.value = 'basic'
  }

  function updateConfig(partial: Partial<UnifiedCalendarConfig>) {
    Object.assign(calendarConfig, partial)
  }

  // Save-time normalization. Right now the prototype doesn't actually persist
  // anything — this just runs the same canonicalization the backend would.
  // Locked decision #47 (revised): Mixed normalizes to Collective or Round
  // Robin depending on which endpoint of the spectrum it's reached.
  function saveCalendar() {
    if (
      calendarConfig.assignmentStrategy === 'mixed' &&
      calendarConfig.teamMembers.length > 1
    ) {
      const reqCount = calendarConfig.requiredAttendeeIds.length
      const totalCount = calendarConfig.teamMembers.length
      if (reqCount === totalCount) {
        // All required → Collective
        calendarConfig.assignmentStrategy = 'collective'
        calendarConfig.requiredAttendeeIds = []
      } else if (reqCount === 0) {
        // All rotating → Round Robin
        calendarConfig.assignmentStrategy = 'rotate'
        calendarConfig.requiredAttendeeIds = []
      }
      // else: actually mixed — leave as-is.
    }
  }

  return {
    calendarConfig,
    activeTab,
    isCreating,
    showAdvanced,
    showWidgetPreview,
    sidebarItems,
    advancedItems,
    derivedType,
    derivedSummary,
    tabCompleteness,
    canSave,
    onSelectTemplate,
    onEditExisting,
    updateConfig,
    saveCalendar,
  }
}
