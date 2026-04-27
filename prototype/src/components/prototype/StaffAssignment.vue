<script lang="ts" setup>
import { computed, ref } from 'vue'
import SmartTip from './SmartTip.vue'
import LocationPicker from './LocationPicker.vue'
import MemberRoleAssigner from './MemberRoleAssigner.vue'
import {
  mockStaff,
  type UnifiedCalendarConfig,
  type MeetingLocation,
  type MockTeamMember,
} from '../../data/mockCalendars'

const props = defineProps<{
  config: UnifiedCalendarConfig
}>()

const emit = defineEmits<{
  (e: 'update', config: Partial<UnifiedCalendarConfig>): void
}>()

const showMoreOptions = ref(false)

const hasMultipleStaff = computed(() => props.config.teamMembers.length >= 2)
const hasNoStaff = computed(() => props.config.teamMembers.length === 0)
const isMixed = computed(() => props.config.assignmentStrategy === 'mixed')
const isCollective = computed(() => props.config.assignmentStrategy === 'collective')

const availableStaff = computed(() => {
  const selectedIds = props.config.teamMembers.map(m => m.userId)
  return mockStaff.filter(s => !selectedIds.includes(s.userId))
})

// Booker-side host picker only makes sense for Rotate. Collective: everyone attends.
// Mixed: required attendees always attend; the rotating pool is auto-routed and the
// booker doesn't get a choice there either.
const showBookerStaffSelection = computed(() =>
  hasMultipleStaff.value && props.config.assignmentStrategy === 'rotate'
)

const requiredMembers = computed(() =>
  props.config.teamMembers.filter(m => props.config.requiredAttendeeIds.includes(m.userId))
)

// Per-host inline location editor — only used when location is genuinely a
// per-host concern (multi-host RR / multi-host non-shared Class). For 1-host,
// Collective, Mixed, and Event the unified Meeting Location card handles it.
const showInlinePerHostLocation = computed(() =>
  hasMultipleStaff.value &&
  props.config.assignmentStrategy !== 'collective' &&
  props.config.assignmentStrategy !== 'mixed'
)

// Full menu of every possible location, with each option enabled/disabled by
// what's actually achievable for that host & shape. Matches today's prod
// pattern: never silently omit — show, then explain via disabled state.
function memberInlineOptions(member: MockTeamMember) {
  const videoTools: { tool: 'zoom' | 'google_meet' | 'ms_teams'; label: string }[] = [
    { tool: 'zoom', label: 'Zoom' },
    { tool: 'google_meet', label: 'Google Meet' },
    { tool: 'ms_teams', label: 'MS Teams' },
  ]
  const opts: { key: string; label: string; disabled: boolean; title: string }[] = []
  for (const { tool, label } of videoTools) {
    const connected = member.connectedTools.includes(tool)
    opts.push({
      key: `vid:${tool}`,
      label: connected ? label : `${label} (not connected)`,
      disabled: !connected,
      title: connected ? '' : `${member.userName.split(' ')[0]} hasn't connected ${label} — add it in Integrations to enable.`,
    })
  }
  opts.push({ key: 'in_person:phone', label: 'Phone', disabled: false, title: '' })
  opts.push({ key: 'in_person:address', label: 'Full address', disabled: false, title: '' })
  opts.push({ key: 'in_person:custom', label: 'Custom location', disabled: false, title: '' })
  // Ask the booker — disabled here because rotation hides who hosts in
  // advance, so we can't promise the booker's chosen venue will work.
  opts.push({
    key: 'ask_booker',
    label: 'Ask the booker (not supported with multiple hosts)',
    disabled: true,
    title: '"Ask the booker" isn\'t supported with multiple rotating hosts — the booker\'s pick may not work for whichever host is assigned. Reduce to one host or switch the strategy to "All members attend" to enable.',
  })
  return opts
}

function memberInlineSelectedKey(member: MockTeamMember): string {
  const loc = member.meetingLocation
  if (loc.type === 'in_person') return `in_person:${loc.inPersonType || 'custom'}`
  return `vid:${loc.type}`
}

function setMemberInlineLocation(userId: string, key: string) {
  let newLoc: MeetingLocation
  if (key.startsWith('in_person:')) {
    const sub = key.split(':')[1] as 'phone' | 'address' | 'custom'
    newLoc = { type: 'in_person', inPersonType: sub, customValue: '' }
  } else if (key.startsWith('vid:')) {
    const tool = key.slice(4)
    newLoc = { type: tool as MeetingLocation['type'] }
  } else {
    return
  }
  emit('update', {
    teamMembers: props.config.teamMembers.map(m =>
      m.userId === userId ? { ...m, meetingLocation: newLoc } : m
    ),
  })
}

function setMemberInlineValue(userId: string, value: string) {
  emit('update', {
    teamMembers: props.config.teamMembers.map(m =>
      m.userId === userId
        ? { ...m, meetingLocation: { ...m.meetingLocation, customValue: value } }
        : m
    ),
  })
}

function setMemberDisplayLabel(userId: string, label: string) {
  emit('update', {
    teamMembers: props.config.teamMembers.map(m =>
      m.userId === userId
        ? { ...m, meetingLocation: { ...m.meetingLocation, displayLabel: label } }
        : m
    ),
  })
}

// Per-host display-label-editor inline reveal state, keyed by userId.
const showHostLabelEditor = ref<Record<string, boolean>>({})
function toggleHostLabelEditor(userId: string) {
  showHostLabelEditor.value = { ...showHostLabelEditor.value, [userId]: !showHostLabelEditor.value[userId] }
}

function memberInlinePlaceholder(member: MockTeamMember): string {
  const t = member.meetingLocation.inPersonType
  if (t === 'phone') return 'Phone number'
  if (t === 'address') return 'Address'
  return 'Room, link, or notes'
}

// Pending host add — held while the recurring-confirm modal is open.
const pendingHostAdd = ref<string | null>(null)
const showRecurringConfirm = computed(() => pendingHostAdd.value !== null)

// Auto-default location from connected tools.
// First host added also seeds the calendar-level location so the user never lands
// on an empty Location field (the #1 support-ticket source).
function addStaffMember(userId: string) {
  // Pre-warn before going multi-host while recurring is on (locked decision #46).
  // Modal asks the user to confirm before we disable recurring + add the host.
  const willHaveMultipleStaff = props.config.teamMembers.length + 1 > 1
  if (willHaveMultipleStaff && props.config.enableRecurring) {
    pendingHostAdd.value = userId
    return
  }
  performStaffMemberAdd(userId)
}

function performStaffMemberAdd(userId: string) {
  const member = mockStaff.find(s => s.userId === userId)
  if (!member) return
  const autoLocation: MeetingLocation = member.connectedTools.length > 0
    ? { type: member.connectedTools[0] as MeetingLocation['type'], sourceUserId: member.userId }
    : { type: 'in_person', inPersonType: 'custom', customValue: '' }
  const updates: Partial<UnifiedCalendarConfig> = {
    teamMembers: [...props.config.teamMembers, { ...member, meetingLocation: autoLocation }],
  }
  // First host: also seed the calendar-level location.
  if (props.config.teamMembers.length === 0 && !props.config.calendarLocation) {
    updates.calendarLocation = { ...autoLocation }
    updates.locationMode = 'single'
  }
  const willHaveMultipleStaff = props.config.teamMembers.length + 1 > 1
  // Auto-default strategy to rotate when going multi-host (most common case)
  if (willHaveMultipleStaff && !props.config.assignmentStrategy) {
    updates.assignmentStrategy = 'rotate'
  }
  // If we got here while recurring was on, the user has already confirmed via
  // the modal — disable recurring quietly.
  if (willHaveMultipleStaff && props.config.enableRecurring) {
    updates.enableRecurring = false
  }
  emit('update', updates)
}

function confirmRecurringAndAdd() {
  const userId = pendingHostAdd.value
  pendingHostAdd.value = null
  if (userId) performStaffMemberAdd(userId)
}

function cancelRecurringConfirm() {
  pendingHostAdd.value = null
}

function removeStaffMember(userId: string) {
  let updatedMembers = props.config.teamMembers.filter(m => m.userId !== userId)
  const updates: Partial<UnifiedCalendarConfig> = {}

  let updatedRequired = props.config.requiredAttendeeIds
  if (props.config.requiredAttendeeIds.includes(userId)) {
    updatedRequired = props.config.requiredAttendeeIds.filter(id => id !== userId)
    updates.requiredAttendeeIds = updatedRequired
  }

  // Owner auto-promotion: if the removed member was the primary owner,
  // promote the next eligible member (required-only for mixed, any for collective).
  const removedWasOwner = props.config.teamMembers.find(m => m.userId === userId)?.isPrimary
  if (removedWasOwner && updatedMembers.length > 0) {
    const eligible = isMixed.value
      ? updatedMembers.filter(m => updatedRequired.includes(m.userId))
      : updatedMembers
    const nextOwner = eligible[0] ?? updatedMembers[0]
    updatedMembers = updatedMembers.map(m => ({ ...m, isPrimary: m.userId === nextOwner.userId }))
  }
  updates.teamMembers = updatedMembers

  // Reset strategy when host count drops below 2 — strategy is meaningless
  // with 1 or 0 hosts. See locked decision #45.
  if (updatedMembers.length < 2 && props.config.assignmentStrategy) {
    updates.assignmentStrategy = null
    updates.requiredAttendeeIds = []
  }
  emit('update', updates)
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

function getAvatarColor(userId: string) {
  const colors = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED']
  const idx = parseInt(userId.replace('user-', '')) - 1
  return colors[idx % colors.length]
}

function onUpdateRoles(requiredIds: string[]) {
  const updates: Partial<UnifiedCalendarConfig> = { requiredAttendeeIds: requiredIds }
  // If the current owner is no longer in the required set (mixed mode),
  // auto-promote the first required member as owner.
  if (isMixed.value) {
    const owner = props.config.teamMembers.find(m => m.isPrimary)
    if (owner && !requiredIds.includes(owner.userId) && requiredIds.length > 0) {
      updates.teamMembers = props.config.teamMembers.map(m => ({
        ...m,
        isPrimary: m.userId === requiredIds[0],
      }))
    }
  }
  emit('update', updates)
}

function updateMemberPriority(userId: string, priority: 'high' | 'medium' | 'low') {
  emit('update', {
    teamMembers: props.config.teamMembers.map(m =>
      m.userId === userId ? { ...m, hostPriority: priority } : m
    ),
  })
}

// In rotate, priority applies to all members. In mixed, only the rotating pool has a priority decision.
const priorityEligibleMembers = computed(() => {
  if (isMixed.value) {
    return props.config.teamMembers.filter(m => !props.config.requiredAttendeeIds.includes(m.userId))
  }
  return props.config.teamMembers
})

// Routing controls are only meaningful when there's actually a routing decision —
// i.e. more than one host could be picked. For Mixed with a single rotating host,
// the routing pool is determined, so we hide both the picker and the priority list.
const showDistributionAlgorithm = computed(() =>
  hasMultipleStaff.value &&
  (props.config.assignmentStrategy === 'rotate' || isMixed.value) &&
  priorityEligibleMembers.value.length > 1
)

const showHostPriority = computed(() =>
  showDistributionAlgorithm.value &&
  props.config.rotationOptimization === 'availability'
)

// True when the unified Advanced expander has anything to show
const showAdvancedExpander = computed(() =>
  showDistributionAlgorithm.value ||
  (hasMultipleStaff.value && props.config.assignmentStrategy === 'rotate')
)

const showContactRouting = computed(() =>
  hasMultipleStaff.value && props.config.assignmentStrategy === 'rotate'
)

// Owner pick is now inline on team-member rows (Collective) or on required
// rows inside MemberRoleAssigner (Mixed). The standalone "Primary owner"
// card is gone — see locked decision #41.
function setOwner(userId: string) {
  emit('update', {
    teamMembers: props.config.teamMembers.map(m => ({
      ...m,
      isPrimary: m.userId === userId,
    })),
  })
}

function priorityBadgeClass(p?: string) {
  if (p === 'high') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (p === 'low') return 'bg-gray-50 text-gray-500 border-gray-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

function selectStrategy(value: string) {
  const updates: Partial<UnifiedCalendarConfig> = {
    assignmentStrategy: value as any,
  }
  let nextRequiredIds = props.config.requiredAttendeeIds
  if (value !== 'mixed') {
    nextRequiredIds = []
    updates.requiredAttendeeIds = []
  } else if (props.config.requiredAttendeeIds.length === 0 && props.config.teamMembers.length > 0) {
    // Mixed default: auto-mark the first team member as required, rest rotating
    nextRequiredIds = [props.config.teamMembers[0].userId]
    updates.requiredAttendeeIds = nextRequiredIds
  }
  // Auto-promote owner if the current owner is no longer eligible for the new
  // strategy. For Mixed the owner must be required; for Collective any member
  // is eligible (so existing owner stays). Mirrors the auto-promotion in
  // onUpdateRoles / removeStaffMember (decision #19).
  if (value === 'mixed') {
    const owner = props.config.teamMembers.find(m => m.isPrimary)
    if (owner && !nextRequiredIds.includes(owner.userId) && nextRequiredIds.length > 0) {
      updates.teamMembers = props.config.teamMembers.map(m => ({
        ...m,
        isPrimary: m.userId === nextRequiredIds[0],
      }))
    }
  }
  emit('update', updates)
}

const strategyCards = [
  {
    value: 'rotate',
    label: 'Rotate between members',
    description: 'Distributes bookings among team members in a rotating order',
    icon: 'rotate',
    derivedHint: 'Sets type to Round Robin',
  },
  {
    value: 'collective',
    label: 'All members attend',
    description: 'All team members are required to attend every booking',
    icon: 'collective',
    derivedHint: 'Sets type to Collective Booking',
  },
  {
    value: 'mixed',
    label: 'Mixed: some required + others rotate',
    description: 'Define required attendees and a rotating pool for the rest',
    icon: 'mixed',
    derivedHint: 'Sets type to Collective Booking',
  },
]
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-base font-semibold text-gray-900">Staff & assignment</h2>
      <p class="text-sm text-gray-500 mt-0.5">Pick who hosts each booking and how they get distributed.</p>
    </div>

    <!-- Recurring confirm modal — shown before adding a 2nd host while
         recurring is enabled. Locked decision #46. -->
    <div
      v-if="showRecurringConfirm"
      class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      @click.self="cancelRecurringConfirm"
    >
      <div class="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-3">
        <div class="flex items-start gap-3">
          <div class="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-sm font-semibold text-gray-900">Turn off recurring meetings?</h3>
            <p class="text-xs text-gray-500 mt-1 leading-relaxed">
              Recurring meetings only work with one host today. Adding a second host will turn off recurring on this calendar — you can re-enable it from Availability if you go back to one host.
            </p>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
            @click="cancelRecurringConfirm"
          >Cancel</button>
          <button
            type="button"
            class="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
            @click="confirmRecurringAndAdd"
          >Continue</button>
        </div>
      </div>
    </div>

    <!-- Unified Card -->
    <div class="bg-white border border-gray-200 rounded-xl p-5">
      <label class="text-sm font-medium text-gray-700 block mb-3">Team members</label>

      <!-- Member rows. For multi-host RR / non-shared Class, the per-host location
           dropdown sits inline next to the host name. For 1-host / Collective / Mixed /
           Event, the unified Meeting Location card below handles location instead. -->
      <div class="space-y-1.5 mb-3" v-if="config.teamMembers.length > 0">
        <div v-for="member in config.teamMembers" :key="member.userId">
          <div class="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <div
              class="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-medium flex-shrink-0"
              :style="{ backgroundColor: getAvatarColor(member.userId) }"
            >
              {{ getInitials(member.userName) }}
            </div>
            <span class="text-sm text-gray-700 flex-1 min-w-0 truncate">{{ member.userName }}</span>

            <!-- Inline owner star — Collective only. (Mixed shows it inside
                 MemberRoleAssigner so it sits next to Required/Rotating.) -->
            <button
              v-if="isCollective"
              type="button"
              class="flex-shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded transition-colors"
              :class="member.isPrimary
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'"
              :title="member.isPrimary
                ? 'This member is the owner. Bookings get assigned to them; others are added as followers.'
                : 'Make this member the owner.'"
              @click="setOwner(member.userId)"
            >
              <svg class="w-3 h-3" :fill="member.isPrimary ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <span v-if="member.isPrimary">Owner</span>
            </button>

            <!-- Inline location dropdown — multi-host RR / non-shared Class only. -->
            <template v-if="showInlinePerHostLocation">
              <select
                :value="memberInlineSelectedKey(member)"
                @change="setMemberInlineLocation(member.userId, ($event.target as HTMLSelectElement).value)"
                class="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer flex-shrink-0"
              >
                <option
                  v-for="opt in memberInlineOptions(member)"
                  :key="opt.key"
                  :value="opt.key"
                  :disabled="opt.disabled"
                  :title="opt.title"
                >
                  {{ opt.label }}
                </option>
              </select>
              <input
                v-if="member.meetingLocation.type === 'in_person'"
                type="text"
                :value="member.meetingLocation.customValue || ''"
                @input="setMemberInlineValue(member.userId, ($event.target as HTMLInputElement).value)"
                :placeholder="memberInlinePlaceholder(member)"
                class="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500 w-44 flex-shrink-0"
              />
            </template>

            <button
              class="text-gray-400 hover:text-gray-600 flex-shrink-0"
              @click="removeStaffMember(member.userId)"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <!-- Display label sub-row — appears below the team-member row when
               the host has an in_person location set (multi-host RR / Class).
               Locked decision #59. -->
          <div
            v-if="showInlinePerHostLocation && member.meetingLocation.type === 'in_person'"
            class="ml-10 mt-1 mb-2"
          >
            <button
              v-if="!showHostLabelEditor[member.userId] && !member.meetingLocation.displayLabel"
              type="button"
              class="text-[11px] font-medium text-primary-600 hover:text-primary-700"
              @click="toggleHostLabelEditor(member.userId)"
            >
              + Add display label for {{ member.userName.split(' ')[0] }}'s location
            </button>
            <div v-else class="flex items-center gap-2">
              <span class="text-[11px] text-gray-500 flex-shrink-0">Display label:</span>
              <input
                type="text"
                :value="member.meetingLocation.displayLabel || ''"
                @input="setMemberDisplayLabel(member.userId, ($event.target as HTMLInputElement).value)"
                placeholder="e.g. Office address"
                class="text-[11px] border border-gray-200 rounded-md px-2 py-0.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500 w-48"
              />
              <span class="text-[10px] text-gray-400">Shown to bookers pre-confirmation</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Multi-host RR / Class footer hint: the rotation-only restrictions
           on multi-location and ask-booker that the unified card used to surface. -->
      <p v-if="showInlinePerHostLocation" class="text-xs text-gray-400 mt-3 leading-relaxed">
        Each booking uses the assigned host's location. Looking for "Ask the booker" or multiple options? They're available with one host or fewer, or by switching the strategy to "All members attend".
      </p>

      <!-- Add member dropdown -->
      <div v-if="availableStaff.length > 0">
        <select
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          @change="(e) => { addStaffMember((e.target as HTMLSelectElement).value); (e.target as HTMLSelectElement).value = '' }"
        >
          <option value="" disabled selected>+ Add team member</option>
          <option v-for="staff in availableStaff" :key="staff.userId" :value="staff.userId">
            {{ staff.userName }}
          </option>
        </select>
      </div>

      <!-- No staff hint (inline text, not SmartTip) -->
      <p v-if="hasNoStaff" class="text-xs text-gray-400 mt-2">
        No team members assigned — this calendar will function as an open event with no host.
      </p>

      <!-- Strategy Cards (when 2+ members). No outer transition — nested
           transitions inside (MemberRoleAssigner, owner star, advanced expander)
           created leave-deadlocks when host count dropped to 1. Instant hide
           is fine here; the strategy section is a major IA pivot, not a
           micro-animation. -->
      <div v-if="hasMultipleStaff" class="mt-5 pt-5 border-t border-gray-100">
          <label class="text-sm font-medium text-gray-700 block mb-3">
            How should a host be assigned?
          </label>

          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="card in strategyCards"
              :key="card.value"
              class="text-left p-3 rounded-xl border-2 transition-all hover:shadow-sm min-w-0"
              :class="config.assignmentStrategy === card.value
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'"
              @click="selectStrategy(card.value)"
            >
              <div
                class="w-9 h-9 rounded-lg flex items-center justify-center mb-2"
                :class="config.assignmentStrategy === card.value ? 'bg-primary-100' : 'bg-gray-100'"
              >
                <!-- Rotate: refresh arrows -->
                <svg v-if="card.icon === 'rotate'" class="w-5 h-5" :class="config.assignmentStrategy === card.value ? 'text-primary-600' : 'text-gray-500'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <!-- Collective: user group -->
                <svg v-else-if="card.icon === 'collective'" class="w-5 h-5" :class="config.assignmentStrategy === card.value ? 'text-primary-600' : 'text-gray-500'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <!-- Mixed: two user groups -->
                <svg v-else-if="card.icon === 'mixed'" class="w-5 h-5" :class="config.assignmentStrategy === card.value ? 'text-primary-600' : 'text-gray-500'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div class="text-sm font-medium leading-tight" :class="config.assignmentStrategy === card.value ? 'text-primary-700' : 'text-gray-900'">
                {{ card.label }}
              </div>
              <div class="text-xs mt-0.5 leading-tight" :class="config.assignmentStrategy === card.value ? 'text-primary-500' : 'text-gray-400'">
                {{ card.description }}
              </div>
            </button>
          </div>

          <!-- MemberRoleAssigner for mixed mode — owns required-vs-rotating
               AND the inline owner star (only available on required rows). -->
          <transition name="section-slide">
            <MemberRoleAssigner
              v-if="isMixed"
              :teamMembers="config.teamMembers"
              :requiredAttendeeIds="config.requiredAttendeeIds"
              :currentOwnerId="config.teamMembers.find(m => m.isPrimary)?.userId ?? null"
              @updateRoles="onUpdateRoles"
              @setOwner="setOwner"
            />
          </transition>

          <!-- Advanced routing rules — single expander for all the power knobs -->
          <transition name="section-slide">
            <div v-if="showAdvancedExpander" class="mt-5 pt-5 border-t border-gray-100">
              <button
                class="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                @click="showMoreOptions = !showMoreOptions"
                type="button"
              >
                <svg
                  class="w-3 h-3 transition-transform duration-200"
                  :class="{ 'rotate-90': showMoreOptions }"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                Advanced routing rules
              </button>

              <transition name="section-slide">
                <div v-if="showMoreOptions" class="mt-4 space-y-6">
                  <!-- 1. How to pick a host -->
                  <div v-if="showDistributionAlgorithm">
                    <div class="text-sm font-medium text-gray-700 mb-1">How to pick a host</div>
                    <p class="text-xs text-gray-500 mb-2">
                      {{ isMixed ? 'Applies to the rotating pool. Required members always attend.' : 'When several hosts are available for the same slot.' }}
                    </p>
                    <div class="space-y-1.5">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="dist-alg" value="availability"
                          :checked="config.rotationOptimization === 'availability'"
                          @change="emit('update', { rotationOptimization: 'availability' })"
                          class="w-3.5 h-3.5 text-primary-600 border-gray-300"
                        />
                        <span class="text-sm text-gray-700">Maximise availability <span class="text-xs text-gray-400">— assign to whoever is most free</span></span>
                      </label>
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="dist-alg" value="equal_distribution"
                          :checked="config.rotationOptimization === 'equal_distribution'"
                          @change="emit('update', { rotationOptimization: 'equal_distribution' })"
                          class="w-3.5 h-3.5 text-primary-600 border-gray-300"
                        />
                        <span class="text-sm text-gray-700">Equal distribution <span class="text-xs text-gray-400">— spread bookings evenly</span></span>
                      </label>
                    </div>
                  </div>

                  <!-- 2. Per-host priority (only when availability) -->
                  <div v-if="showHostPriority && priorityEligibleMembers.length > 0">
                    <div class="text-sm font-medium text-gray-700 mb-1">Host priority</div>
                    <p class="text-xs text-gray-500 mb-2">Higher-priority hosts get bookings first when several are available.</p>
                    <div class="space-y-1">
                      <div v-for="m in priorityEligibleMembers" :key="m.userId" class="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-gray-50">
                        <div class="flex items-center gap-2">
                          <div class="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-medium" :style="{ backgroundColor: getAvatarColor(m.userId) }">
                            {{ getInitials(m.userName) }}
                          </div>
                          <span class="text-sm text-gray-700">{{ m.userName }}</span>
                        </div>
                        <select
                          :value="m.hostPriority || 'medium'"
                          @change="updateMemberPriority(m.userId, ($event.target as HTMLSelectElement).value as any)"
                          class="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <!-- 3. What happens for returning contacts (rotate only) -->
                  <div v-if="showContactRouting">
                    <div class="text-sm font-medium text-gray-700 mb-1">What happens for returning contacts</div>
                    <p class="text-xs text-gray-500 mb-3">If a contact already has an assigned user on this account.</p>

                    <!-- Sub-section A: reschedule of an existing booking -->
                    <div class="space-y-1.5 mb-4">
                      <div class="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">When they reschedule an existing booking</div>
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="reschedule-pref" value="reassign"
                          :checked="config.reschedulePreference === 'reassign'"
                          @change="emit('update', { reschedulePreference: 'reassign' })"
                          class="w-3.5 h-3.5 text-primary-600 border-gray-300"
                        />
                        <span class="text-sm text-gray-700">Reassign through round robin</span>
                      </label>
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="reschedule-pref" value="keep_owner"
                          :checked="config.reschedulePreference === 'keep_owner'"
                          @change="emit('update', { reschedulePreference: 'keep_owner' })"
                          class="w-3.5 h-3.5 text-primary-600 border-gray-300"
                        />
                        <span class="text-sm text-gray-700">Keep the same appointment owner</span>
                      </label>
                    </div>

                    <!-- Sub-section B: brand-new booking -->
                    <div class="pt-3 border-t border-gray-100">
                      <div class="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">When they book a new appointment</div>
                      <label class="flex items-start gap-2.5 cursor-pointer">
                        <input type="checkbox"
                          :checked="config.alwaysBookWithAssignedUser"
                          @change="emit('update', { alwaysBookWithAssignedUser: !config.alwaysBookWithAssignedUser })"
                          class="mt-0.5 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <div>
                          <div class="text-sm text-gray-900">Always book with the contact's assigned user</div>
                          <div class="text-xs text-gray-500 mt-0.5">Route new appointments to a returning contact's assigned user instead of the default assignment.</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <!-- 4. Let the booker choose their host -->
                  <label v-if="showBookerStaffSelection" class="flex items-start gap-2.5 cursor-pointer pt-3 border-t border-gray-100">
                    <input type="checkbox"
                      :checked="config.enableBookerStaffSelection"
                      @change="emit('update', { enableBookerStaffSelection: !config.enableBookerStaffSelection })"
                      class="mt-0.5 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <div>
                      <div class="text-sm text-gray-900">Let the booker choose their host</div>
                      <div class="text-xs text-gray-500 mt-0.5">
                        {{ isMixed ? 'Bookers choose from the rotating pool. Required members always attend.' : 'Show a staff selector on the booking page.' }}
                      </div>
                    </div>
                  </label>

                  <SmartTip
                    v-if="config.assignmentStrategy === 'rotate' && config.seatsPerSlot > 1"
                    message="Each rotating member will host up to {{ config.seatsPerSlot }} guests per slot."
                    type="info"
                  />
                </div>
              </transition>
            </div>
          </transition>
        </div>
    </div>

    <!-- Unified Meeting Location card — handles 0/1-host, Collective, and Mixed.
         Multi-host RR / non-shared Class use the inline per-host dropdowns above
         (location is genuinely a per-host concern there). -->
    <LocationPicker
      v-if="!showInlinePerHostLocation"
      :config="config"
      @update="emit('update', $event)"
    />
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
