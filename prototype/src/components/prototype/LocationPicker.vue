<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import {
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

// --- Shape detection (drives which form variant we render) ---
const hostCount = computed(() => props.config.teamMembers.length)
const isMultiHost = computed(() => hostCount.value > 1)
const isCollective = computed(() => props.config.assignmentStrategy === 'collective')
const isMixed = computed(() => props.config.assignmentStrategy === 'mixed')
const isShared = computed(() => isCollective.value || isMixed.value)

// Per-host editor: only when multi-host AND not shared (i.e. RR / Class with rotation).
const isPerHost = computed(() => isMultiHost.value && !isShared.value)

// Multi-location ("+ Add another option") available for: 0/1 host AND
// Collective/Mixed. Hidden for multi-host RR / non-shared Class because the
// host's location is the location (handled inline in StaffAssignment).
const canAddMultipleOptions = computed(() => hostCount.value <= 1 || isShared.value)

// Ask-the-booker available for: 0 host (Event), 1 host, Collective, Mixed.
// NOT for multi-host RR / Class — rotation hides who hosts, can't promise a venue
// that the assigned host can actually deliver.
const canShowAskBooker = computed(() => !isPerHost.value)

const isMulti = computed(
  () => props.config.locationMode === 'multiple' && canAddMultipleOptions.value
)

// --- Heading / wording ---
const heading = computed(() => {
  if (hostCount.value === 0) return 'Where does this event happen?'
  if (isPerHost.value) return 'Where does each host meet?'
  if (isShared.value) return 'Where does the team meet?'
  return 'Where do you meet?'
})

// --- Build the dropdown option list for the main (non-per-host) selector ---
// Show-all-options principle: every dropdown lists the full 7-option menu
// (Zoom / Google Meet / MS Teams / Phone / Full address / Custom / Ask the
// booker), with each entry independently enabled or disabled based on what's
// actually achievable for the current shape.
type DropOpt = { key: string; label: string; loc: MeetingLocation; disabled?: boolean; title?: string }

function videoToolLabel(tool: string): string {
  if (tool === 'zoom') return 'Zoom'
  if (tool === 'google_meet') return 'Google Meet'
  if (tool === 'ms_teams') return 'MS Teams'
  return tool
}

// For Mixed, the link host should be a *required* attendee — rotating-pool
// members aren't a stable account to host the meeting (they change per booking).
function eligibleSourcesForTool(tool: string): MockTeamMember[] {
  const pool = isMixed.value
    ? props.config.teamMembers.filter(m => props.config.requiredAttendeeIds.includes(m.userId))
    : props.config.teamMembers
  return pool.filter(m => m.connectedTools.includes(tool))
}

// Default link host when a video tool is picked: prefer the owner if they
// have it, otherwise the first eligible member. Used both on first selection
// and when the prior source becomes invalid (e.g. host removed).
function defaultSourceFor(tool: string): string | undefined {
  const eligible = eligibleSourcesForTool(tool)
  if (eligible.length === 0) return undefined
  const owner = eligible.find(m => m.isPrimary)
  return (owner ?? eligible[0]).userId
}

const dropdownOptions = computed<DropOpt[]>(() => {
  const opts: DropOpt[] = []
  const allVideoTools = ['zoom', 'google_meet', 'ms_teams'] as const

  for (const tool of allVideoTools) {
    const label = videoToolLabel(tool)
    if (hostCount.value === 0) {
      // Event: no host = nothing to host the link with. Disabled with explanation.
      opts.push({
        key: `vid:${tool}`,
        label: `${label} (no team member to host the link)`,
        loc: { type: tool as MeetingLocation['type'] },
        disabled: true,
        title: `${label} needs a team member's connected account to host the link. Add a team member on the Staff tab to enable.`,
      })
    } else if (isShared.value) {
      // Collective / Mixed: enabled when at least one eligible member has it
      // connected (eligible = required attendees only for Mixed). The "Hosted
      // by" indicator below shows which member's account hosts the link.
      const eligible = eligibleSourcesForTool(tool)
      if (eligible.length > 0) {
        opts.push({
          key: `vid:${tool}`,
          label,
          loc: { type: tool as MeetingLocation['type'], sourceUserId: defaultSourceFor(tool) },
        })
      } else {
        const reason = isMixed.value
          ? `No required attendee has ${label} connected. Mark a member with ${label} as Required, or have someone connect it in Integrations.`
          : `No team member has ${label} connected. Add it in Integrations to enable.`
        opts.push({
          key: `vid:${tool}`,
          label: `${label} (not available)`,
          loc: { type: tool as MeetingLocation['type'] },
          disabled: true,
          title: reason,
        })
      }
    } else {
      // 1 host: enabled if the lone host has it connected.
      const m = props.config.teamMembers[0]
      const connected = m.connectedTools.includes(tool)
      opts.push({
        key: `vid:${tool}`,
        label: connected ? label : `${label} (not connected)`,
        loc: { type: tool as MeetingLocation['type'], sourceUserId: m.userId },
        disabled: !connected,
        title: connected ? '' : `${m.userName.split(' ')[0]} hasn't connected ${label} — add it in Integrations to enable.`,
      })
    }
  }

  // Phone / Full address / Custom — always enabled (no integration needed).
  opts.push({ key: 'in_person:phone', label: 'Phone', loc: { type: 'in_person', inPersonType: 'phone', customValue: '' } })
  opts.push({ key: 'in_person:address', label: 'Full address', loc: { type: 'in_person', inPersonType: 'address', customValue: '' } })
  opts.push({ key: 'in_person:custom', label: 'Custom location', loc: { type: 'in_person', inPersonType: 'custom', customValue: '' } })

  // Ask the booker — always shown; disabled state explains when not supported.
  if (canShowAskBooker.value) {
    opts.push({ key: 'ask_booker', label: 'Ask the booker', loc: { type: 'ask_booker' } })
  } else {
    opts.push({
      key: 'ask_booker',
      label: 'Ask the booker (not supported with multiple rotating hosts)',
      loc: { type: 'ask_booker' },
      disabled: true,
      title: '"Ask the booker" needs a determined host or a shared meeting (Collective/Mixed) so the booker\'s pick reaches everyone. Reduce to one host or switch the strategy to "All members attend" to enable.',
    })
  }

  return opts
})

function locKey(loc: MeetingLocation | null | undefined): string {
  if (!loc) return ''
  if (loc.type === 'in_person') return `in_person:${loc.inPersonType || 'custom'}`
  if (loc.type === 'ask_booker') return 'ask_booker'
  return `vid:${loc.type}`
}

// Sub-picker eligibility for the *currently-selected* video tool on the main
// (non-multi) location. Only renders when 2+ eligible members exist for that
// tool (1 = no decision to make; 0 = the option wouldn't be in the dropdown).
function sourceCandidatesForLoc(loc: MeetingLocation | null | undefined): MockTeamMember[] {
  if (!loc) return []
  if (loc.type === 'in_person' || loc.type === 'ask_booker') return []
  return eligibleSourcesForTool(loc.type)
}

// Sub-picker is now ALWAYS shown for shared shapes when a video tool is
// selected — as a static label when there's only one eligible source, as a
// dropdown when there are 2+. This makes the link-host visible at all times
// instead of silently using the default.
const showMainSourceIndicator = computed(() =>
  isShared.value && sourceCandidatesForLoc(props.config.calendarLocation).length >= 1
)
const showMainSourcePicker = computed(() =>
  isShared.value && sourceCandidatesForLoc(props.config.calendarLocation).length > 1
)

function setMainSource(userId: string) {
  if (!props.config.calendarLocation) return
  emit('update', {
    calendarLocation: { ...props.config.calendarLocation, sourceUserId: userId },
  })
}

function setOptionSource(idx: number, userId: string) {
  emit('update', {
    additionalLocationOptions: props.config.additionalLocationOptions.map((l, i) =>
      i === idx ? { ...l, sourceUserId: userId } : l
    ),
  })
}

const selectedKey = computed(() => locKey(props.config.calendarLocation))

function setMainLocation(key: string) {
  const opt = dropdownOptions.value.find(o => o.key === key)
  if (!opt) return
  emit('update', {
    calendarLocation: { ...opt.loc },
    locationMode: 'single',
  })
}

function setMainInPersonValue(value: string) {
  if (!props.config.calendarLocation) return
  emit('update', {
    calendarLocation: { ...props.config.calendarLocation, customValue: value },
  })
}

function setMainDisplayLabel(label: string) {
  if (!props.config.calendarLocation) return
  emit('update', {
    calendarLocation: { ...props.config.calendarLocation, displayLabel: label },
  })
}

function setOptionDisplayLabel(idx: number, label: string) {
  emit('update', {
    additionalLocationOptions: props.config.additionalLocationOptions.map((l, i) =>
      i === idx ? { ...l, displayLabel: label } : l
    ),
  })
}

// Toggle "Add display label" inline reveal state per location entry.
const showLabelEditor = ref<Record<string, boolean>>({})
function toggleLabelEditor(key: string) {
  showLabelEditor.value = { ...showLabelEditor.value, [key]: !showLabelEditor.value[key] }
}

// --- Multi-location editor ---
function addOption() {
  const blank: MeetingLocation = { type: 'in_person', inPersonType: 'custom', customValue: '' }
  if (props.config.locationMode !== 'multiple') {
    // Convert single → multiple. Seed the list with the existing single
    // location (whatever it is, including ask_booker — bookers can pick
    // "let me decide" as one of several offered options), then add a blank.
    const seed: MeetingLocation[] = []
    const current = props.config.calendarLocation
    if (current) seed.push({ ...current })
    seed.push(blank)
    emit('update', {
      locationMode: 'multiple',
      additionalLocationOptions: seed,
      calendarLocation: null,
    })
  } else {
    emit('update', {
      additionalLocationOptions: [...props.config.additionalLocationOptions, blank],
    })
  }
}

function removeOption(idx: number) {
  const remaining = props.config.additionalLocationOptions.filter((_, i) => i !== idx)
  if (remaining.length === 0) {
    // Back to empty single-mode — let the user repick.
    emit('update', {
      locationMode: 'single',
      additionalLocationOptions: [],
      calendarLocation: null,
    })
  } else if (remaining.length === 1) {
    // Auto-collapse to single with the surviving option.
    emit('update', {
      locationMode: 'single',
      additionalLocationOptions: [],
      calendarLocation: { ...remaining[0] },
    })
  } else {
    emit('update', { additionalLocationOptions: remaining })
  }
}

function setOptionType(idx: number, key: string) {
  const opt = dropdownOptions.value.find(o => o.key === key)
  if (!opt) return
  emit('update', {
    additionalLocationOptions: props.config.additionalLocationOptions.map((l, i) =>
      i === idx ? { ...opt.loc } : l
    ),
  })
}

function setOptionValue(idx: number, value: string) {
  emit('update', {
    additionalLocationOptions: props.config.additionalLocationOptions.map((l, i) =>
      i === idx ? { ...l, customValue: value } : l
    ),
  })
}

// --- Per-host editor (multi-host non-shared) ---
function memberDropdownOptions(member: MockTeamMember): { key: string; label: string }[] {
  const opts: { key: string; label: string }[] = []
  for (const tool of member.connectedTools) {
    opts.push({ key: `vid:${tool}`, label: videoToolLabel(tool) })
  }
  opts.push({ key: 'in_person:custom', label: 'Custom location' })
  opts.push({ key: 'in_person:phone', label: 'Phone' })
  opts.push({ key: 'in_person:address', label: 'Address' })
  return opts
}

function memberLocationKey(member: MockTeamMember): string {
  const loc = member.meetingLocation
  if (loc.type === 'in_person') return `in_person:${loc.inPersonType || 'custom'}`
  return `vid:${loc.type}`
}

function setMemberLocation(userId: string, key: string) {
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

function setMemberInPersonValue(userId: string, value: string) {
  emit('update', {
    teamMembers: props.config.teamMembers.map(m =>
      m.userId === userId
        ? { ...m, meetingLocation: { ...m.meetingLocation, customValue: value } }
        : m
    ),
  })
}

function memberInPersonPlaceholder(member: MockTeamMember): string {
  const t = member.meetingLocation.inPersonType
  if (t === 'phone') return 'Phone number'
  if (t === 'address') return 'Address'
  return 'Room, link, or notes'
}

// --- Validation ---
function isLocationValid(loc: MeetingLocation | null | undefined): boolean {
  if (!loc) return false
  if (loc.type === 'ask_booker') return true
  if (loc.type === 'in_person') return !!(loc.customValue && loc.customValue.trim())
  return true
}

const isComplete = computed(() => {
  if (isPerHost.value) {
    return props.config.teamMembers.every(m => isLocationValid(m.meetingLocation))
  }
  if (isMulti.value) {
    return (
      props.config.additionalLocationOptions.length > 0 &&
      props.config.additionalLocationOptions.every(isLocationValid)
    )
  }
  return isLocationValid(props.config.calendarLocation)
})

// --- Live preview chip ---
const previewText = computed<string | null>(() => {
  if (isPerHost.value) {
    return "Bookers see the assigned host's location after a host is picked."
  }
  if (isMulti.value) {
    const n = props.config.additionalLocationOptions.length
    return `Bookers will see ${n} location option${n === 1 ? '' : 's'} to choose from.`
  }
  const loc = props.config.calendarLocation
  if (!loc) return null
  if (loc.type === 'ask_booker') {
    return 'Bookers will see a "Where would you like to meet?" field at booking time.'
  }
  if (loc.type === 'in_person') {
    if (!loc.customValue) return null
    if (loc.inPersonType === 'phone') return `Bookers will see the phone number: ${loc.customValue}`
    if (loc.inPersonType === 'address') return `Bookers will see the address: ${loc.customValue}`
    return `Bookers will see: ${loc.customValue}`
  }
  // Video tool
  const toolName = videoToolLabel(loc.type)
  let host = ''
  if (loc.sourceUserId) {
    const m = props.config.teamMembers.find(mm => mm.userId === loc.sourceUserId)
    if (m) host = ` with ${m.userName.split(' ')[0]}'s account`
  } else if (hostCount.value === 1) {
    host = ` with ${props.config.teamMembers[0].userName.split(' ')[0]}'s account`
  }
  return `Bookers will see: ${toolName} link auto-generated${host}.`
})

// --- Inline hint when a feature is hidden by current shape ---
// Multi-host RR / non-shared Class never reach this card (per-host inline);
// Collective/Mixed now support multi-location too. No gated cases left here.
const hiddenFeatureHint = computed<string | null>(() => null)

// --- Auto-correct: if calendarLocation references a tool whose currently
// chosen sourceUserId is no longer eligible (host removed, demoted from required
// in Mixed, or disconnected the tool), repick a default source. Same idea for
// the case where the whole tool option vanishes — fall back to first dropdown
// option. ---
watch(
  [
    () => props.config.teamMembers.map(m => `${m.userId}:${m.connectedTools.join(',')}:${m.isPrimary}`).join('|'),
    () => props.config.requiredAttendeeIds.join(','),
    () => props.config.assignmentStrategy,
  ],
  () => {
    if (isPerHost.value) return
    const cur = props.config.calendarLocation
    if (!cur) return
    if (cur.type === 'ask_booker' || cur.type === 'in_person') return
    // Video tool selected — verify source is still eligible.
    if (isShared.value) {
      const eligible = eligibleSourcesForTool(cur.type)
      if (eligible.length === 0) {
        // Tool no longer offered at all — fall back to first available option.
        const fallback = dropdownOptions.value[0]
        emit('update', { calendarLocation: fallback ? { ...fallback.loc } : null })
        return
      }
      const stillValid = cur.sourceUserId && eligible.some(m => m.userId === cur.sourceUserId)
      if (!stillValid) {
        emit('update', { calendarLocation: { ...cur, sourceUserId: defaultSourceFor(cur.type) } })
      }
    }
  },
  { immediate: false }
)

watch(
  [() => props.config.teamMembers.length, () => props.config.assignmentStrategy],
  () => {
    if (isPerHost.value || isMulti.value) return
    const cur = props.config.calendarLocation
    if (!cur) return
    if (cur.type === 'ask_booker' || cur.type === 'in_person') return
    const stillValid = dropdownOptions.value.some(o => o.key === locKey(cur))
    if (!stillValid && dropdownOptions.value.length > 0) {
      emit('update', { calendarLocation: { ...dropdownOptions.value[0].loc } })
    }
  },
  { immediate: false }
)
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
    <div>
      <label class="text-sm font-semibold text-gray-700 block">{{ heading }}</label>
      <p v-if="!isComplete" class="text-xs text-amber-600 mt-1">
        Add a location so bookers know where to meet — most calendars use this.
      </p>
    </div>

    <!-- Per-host editor (multi-host RR / Class) -->
    <template v-if="isPerHost">
      <div class="space-y-1.5">
        <div
          v-for="member in config.teamMembers"
          :key="member.userId"
          class="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-50 border border-gray-200"
        >
          <span class="text-sm text-gray-700 flex-1 min-w-0 truncate">{{ member.userName }}</span>
          <select
            :value="memberLocationKey(member)"
            @change="setMemberLocation(member.userId, ($event.target as HTMLSelectElement).value)"
            class="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
          >
            <option v-for="opt in memberDropdownOptions(member)" :key="opt.key" :value="opt.key">
              {{ opt.label }}
            </option>
          </select>
          <input
            v-if="member.meetingLocation.type === 'in_person'"
            type="text"
            :value="member.meetingLocation.customValue || ''"
            @input="setMemberInPersonValue(member.userId, ($event.target as HTMLInputElement).value)"
            :placeholder="memberInPersonPlaceholder(member)"
            class="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500 w-44"
          />
        </div>
      </div>
    </template>

    <!-- Single dropdown / Multi-location list (everything else) -->
    <template v-else>
      <!-- Multi-location: list editor -->
      <div v-if="isMulti" class="space-y-2">
        <div
          v-for="(loc, idx) in config.additionalLocationOptions"
          :key="idx"
          class="px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 space-y-1.5"
        >
          <div class="flex items-center gap-2">
            <select
              :value="locKey(loc)"
              @change="setOptionType(idx, ($event.target as HTMLSelectElement).value)"
              class="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
            >
              <option
                v-for="opt in dropdownOptions"
                :key="opt.key"
                :value="opt.key"
                :disabled="opt.disabled"
                :title="opt.title"
              >
                {{ opt.label }}
              </option>
            </select>
            <input
              v-if="loc.type === 'in_person'"
              type="text"
              :value="loc.customValue || ''"
              @input="setOptionValue(idx, ($event.target as HTMLInputElement).value)"
              :placeholder="loc.inPersonType === 'phone' ? 'Phone number' : loc.inPersonType === 'address' ? 'Address' : 'Room, link, or notes'"
              class="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500 flex-1"
            />
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-auto"
              @click="removeOption(idx)"
              :title="'Remove this option'"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <!-- Display label affordance (in_person only). Locked decision #59:
               bookers see this label pre-booking; the actual customValue is
               revealed in the booking confirmation. -->
          <div v-if="loc.type === 'in_person'" class="pl-1">
            <button
              v-if="!showLabelEditor[`opt-${idx}`] && !loc.displayLabel"
              type="button"
              class="text-[11px] font-medium text-primary-600 hover:text-primary-700"
              @click="toggleLabelEditor(`opt-${idx}`)"
            >
              + Add display label
            </button>
            <div v-else class="flex items-center gap-2">
              <span class="text-[11px] text-gray-500 flex-shrink-0">Display label:</span>
              <input
                type="text"
                :value="loc.displayLabel || ''"
                @input="setOptionDisplayLabel(idx, ($event.target as HTMLInputElement).value)"
                placeholder="e.g. Office address"
                class="text-[11px] border border-gray-200 rounded-md px-2 py-0.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500 flex-1"
              />
              <span class="text-[10px] text-gray-400">Shown to bookers pre-confirmation</span>
            </div>
          </div>
          <!-- Hosted by indicator (Collective/Mixed only). Always rendered when
               a video tool is selected — static label when only 1 eligible member,
               picker when 2+. Single-eligibility case explains *why* it's fixed. -->
          <div
            v-if="isShared && sourceCandidatesForLoc(loc).length === 1"
            class="text-[11px] text-gray-500 pl-1"
          >
            Hosted by {{ sourceCandidatesForLoc(loc)[0].userName }}{{ sourceCandidatesForLoc(loc)[0].isPrimary ? ' (owner)' : '' }} — only {{ isMixed ? 'required member' : 'team member' }} with {{ videoToolLabel(loc.type) }}.
          </div>
          <div
            v-if="isShared && sourceCandidatesForLoc(loc).length > 1"
            class="flex items-center gap-2 pl-1"
          >
            <span class="text-[11px] text-gray-500">Hosted by</span>
            <select
              :value="loc.sourceUserId || ''"
              @change="setOptionSource(idx, ($event.target as HTMLSelectElement).value)"
              class="text-[11px] border border-gray-200 rounded-md px-1.5 py-0.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
            >
              <option v-for="m in sourceCandidatesForLoc(loc)" :key="m.userId" :value="m.userId">
                {{ m.userName }}{{ m.isPrimary ? ' (owner)' : '' }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Single-location dropdown -->
      <div v-else class="space-y-2">
        <div class="flex items-center gap-2">
          <select
            :value="selectedKey"
            @change="setMainLocation(($event.target as HTMLSelectElement).value)"
            class="text-sm border border-gray-200 rounded-md px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            :class="config.calendarLocation?.type === 'in_person' ? '' : 'flex-1'"
          >
            <option value="" disabled>Choose a location</option>
            <option
              v-for="opt in dropdownOptions"
              :key="opt.key"
              :value="opt.key"
              :disabled="opt.disabled"
              :title="opt.title"
            >
              {{ opt.label }}
            </option>
          </select>
          <input
            v-if="config.calendarLocation?.type === 'in_person'"
            type="text"
            :value="config.calendarLocation.customValue || ''"
            @input="setMainInPersonValue(($event.target as HTMLInputElement).value)"
            :placeholder="config.calendarLocation.inPersonType === 'phone' ? 'Phone number' : config.calendarLocation.inPersonType === 'address' ? 'Address' : 'Room, link, or notes'"
            class="text-sm border border-gray-200 rounded-md px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 flex-1"
          />
        </div>
        <!-- Display label affordance (in_person only). Locked decision #59. -->
        <div v-if="config.calendarLocation?.type === 'in_person'" class="pl-1">
          <button
            v-if="!showLabelEditor['main'] && !config.calendarLocation.displayLabel"
            type="button"
            class="text-xs font-medium text-primary-600 hover:text-primary-700"
            @click="toggleLabelEditor('main')"
          >
            + Add display label
          </button>
          <div v-else class="flex items-center gap-2">
            <span class="text-xs text-gray-500 flex-shrink-0">Display label:</span>
            <input
              type="text"
              :value="config.calendarLocation.displayLabel || ''"
              @input="setMainDisplayLabel(($event.target as HTMLInputElement).value)"
              placeholder="e.g. Office address"
              class="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500 flex-1"
            />
            <span class="text-[10px] text-gray-400 flex-shrink-0">Shown to bookers pre-confirmation</span>
          </div>
        </div>
        <!-- Hosted by indicator (Collective/Mixed). Always rendered when a
             video tool is selected — static label when only 1 eligible member,
             picker when 2+. The single-eligibility case explains *why*
             that's the only option. -->
        <div
          v-if="showMainSourceIndicator && !showMainSourcePicker && config.calendarLocation"
          class="text-xs text-gray-500 pl-1"
        >
          Hosted by {{ sourceCandidatesForLoc(config.calendarLocation)[0].userName }}{{ sourceCandidatesForLoc(config.calendarLocation)[0].isPrimary ? ' (owner)' : '' }} — only {{ isMixed ? 'required member' : 'team member' }} with {{ videoToolLabel(config.calendarLocation.type) }}.
        </div>
        <div v-if="showMainSourcePicker" class="flex items-center gap-2 pl-1">
          <span class="text-xs text-gray-500">Hosted by</span>
          <select
            :value="config.calendarLocation?.sourceUserId || ''"
            @change="setMainSource(($event.target as HTMLSelectElement).value)"
            class="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
          >
            <option v-for="m in sourceCandidatesForLoc(config.calendarLocation)" :key="m.userId" :value="m.userId">
              {{ m.userName }}{{ m.isPrimary ? ' (owner)' : '' }}
            </option>
          </select>
        </div>
      </div>

      <!-- Add another option (only 0/1 host) -->
      <button
        v-if="canAddMultipleOptions"
        type="button"
        class="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700"
        @click="addOption"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        {{ isMulti ? 'Add another option' : 'Let bookers pick from multiple options' }}
      </button>
    </template>

    <!-- Live preview chip -->
    <p
      v-if="previewText"
      class="text-xs text-gray-500 italic flex items-start gap-1.5 pt-1"
    >
      <svg class="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      <span>{{ previewText }}</span>
    </p>

    <!-- Inline hint pointing power users to the gate they'd flip to unlock more -->
    <p
      v-if="hiddenFeatureHint"
      class="text-xs text-gray-400 border-t border-gray-100 pt-3 leading-relaxed"
    >
      {{ hiddenFeatureHint }}
    </p>
  </div>
</template>
