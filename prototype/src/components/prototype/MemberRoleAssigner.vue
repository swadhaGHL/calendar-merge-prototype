<script lang="ts" setup>
import { computed } from 'vue'
import SmartTip from './SmartTip.vue'
import type { MockTeamMember } from '../../data/mockCalendars'

const props = defineProps<{
  teamMembers: MockTeamMember[]
  requiredAttendeeIds: string[]
  currentOwnerId: string | null
}>()

const emit = defineEmits<{
  (e: 'updateRoles', requiredIds: string[]): void
  (e: 'setOwner', userId: string): void
}>()

function toggleRole(userId: string) {
  const isCurrentlyRequired = props.requiredAttendeeIds.includes(userId)
  if (isCurrentlyRequired) {
    // Block demoting the last required member — Mixed needs at least one
    // required for the shared-location semantics to make sense (decision #42).
    if (props.requiredAttendeeIds.length === 1) return
    emit('updateRoles', props.requiredAttendeeIds.filter(id => id !== userId))
  } else {
    emit('updateRoles', [...props.requiredAttendeeIds, userId])
  }
}

function isRequired(userId: string) {
  return props.requiredAttendeeIds.includes(userId)
}

function isLastRequired(userId: string) {
  return props.requiredAttendeeIds.length === 1 && props.requiredAttendeeIds[0] === userId
}

const allRequired = computed(() =>
  props.teamMembers.length > 0 && props.requiredAttendeeIds.length === props.teamMembers.length
)

const allRotating = computed(() =>
  props.teamMembers.length > 0 && props.requiredAttendeeIds.length === 0
)

const singleRotating = computed(() => {
  const rotatingCount = props.teamMembers.length - props.requiredAttendeeIds.length
  return rotatingCount === 1 && props.requiredAttendeeIds.length > 0
})

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

function getAvatarColor(userId: string) {
  const colors = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED']
  const idx = parseInt(userId.replace('user-', '')) - 1
  return colors[idx % colors.length]
}
</script>

<template>
  <div class="mt-3 space-y-2">
    <div class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Assign member roles</div>

    <div
      v-for="member in teamMembers"
      :key="member.userId"
      class="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100"
    >
      <div
        class="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0"
        :style="{ backgroundColor: getAvatarColor(member.userId) }"
      >
        {{ getInitials(member.userName) }}
      </div>
      <span class="text-sm text-gray-700 flex-1">{{ member.userName }}</span>

      <!-- Inline owner star — only available on required members (rotating
           pool members aren't owner-eligible per locked decision #15). -->
      <button
        v-if="isRequired(member.userId)"
        type="button"
        class="flex-shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded transition-colors"
        :class="currentOwnerId === member.userId
          ? 'bg-primary-100 text-primary-700'
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'"
        :title="currentOwnerId === member.userId
          ? 'This member is the owner. Bookings get assigned to them; others are added as followers.'
          : 'Make this member the owner.'"
        @click="emit('setOwner', member.userId)"
      >
        <svg class="w-3 h-3" :fill="currentOwnerId === member.userId ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        <span v-if="currentOwnerId === member.userId">Owner</span>
      </button>

      <!-- Segmented toggle. The Rotating side is disabled on the last required
           member (Mixed needs ≥1 required — see locked decision #42). -->
      <div class="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
        <button
          class="px-3 py-1.5 font-medium transition-colors"
          :class="isRequired(member.userId)
            ? 'bg-primary-600 text-white'
            : 'bg-white text-gray-500 hover:bg-gray-50'"
          @click="!isRequired(member.userId) && toggleRole(member.userId)"
        >
          Required
        </button>
        <button
          class="px-3 py-1.5 font-medium transition-colors border-l border-gray-200"
          :class="[
            !isRequired(member.userId)
              ? 'bg-amber-500 text-white'
              : 'bg-white text-gray-500 hover:bg-gray-50',
            isLastRequired(member.userId) ? 'opacity-50 cursor-not-allowed' : ''
          ]"
          :disabled="isLastRequired(member.userId)"
          :title="isLastRequired(member.userId)
            ? 'At least one member must be required for Mixed — switch the strategy if you want everyone to rotate.'
            : ''"
          @click="isRequired(member.userId) && !isLastRequired(member.userId) && toggleRole(member.userId)"
        >
          Rotating
        </button>
      </div>
    </div>

    <!-- Validation tips -->
    <SmartTip
      v-if="allRequired"
      message="All members are required — this saves as Collective Booking."
      type="info"
    />
    <SmartTip
      v-if="allRotating"
      message="All members are rotating — this saves as Round Robin."
      type="info"
    />
    <SmartTip
      v-if="singleRotating"
      message="Only one rotating member — they'll attend every booking alongside required members."
      type="info"
    />
  </div>
</template>
