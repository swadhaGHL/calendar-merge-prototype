<script lang="ts" setup>
import { computed } from 'vue'
import { type UnifiedCalendarConfig, type NotificationConfig } from '../../data/mockCalendars'

const props = defineProps<{
  config: UnifiedCalendarConfig
}>()

const emit = defineEmits<{
  (e: 'update', config: Partial<UnifiedCalendarConfig>): void
}>()

type ChannelKey = 'email' | 'inApp' | 'sms' | 'whatsapp'

const channelLabels: { key: ChannelKey; label: string }[] = [
  { key: 'email', label: 'Email' },
  { key: 'inApp', label: 'In-app' },
  { key: 'sms', label: 'SMS' },
  { key: 'whatsapp', label: 'WhatsApp' },
]

function getChannelColor(key: ChannelKey, active: boolean): string {
  if (!active) return 'bg-white text-gray-500 border-gray-200'
  if (key === 'email' || key === 'inApp') return 'bg-blue-50 text-blue-700 border-blue-200'
  if (key === 'sms') return 'bg-green-50 text-green-700 border-green-200'
  return 'bg-green-50 text-green-700 border-green-200'
}

function toggleChannel(notifIndex: number, channelKey: ChannelKey) {
  const updated = [...props.config.notifications]
  updated[notifIndex] = {
    ...updated[notifIndex],
    channels: {
      ...updated[notifIndex].channels,
      [channelKey]: !updated[notifIndex].channels[channelKey],
    },
  }
  emit('update', { notifications: updated })
}

const hasAnyEnabled = computed(() =>
  props.config.notifications.some(n =>
    n.channels.email || n.channels.inApp || n.channels.sms || n.channels.whatsapp
  )
)

const hasHosts = computed(() => props.config.teamMembers.length > 0)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-base font-semibold text-gray-900">Notifications &amp; policies</h2>
      <p class="text-sm text-gray-500 mt-0.5">Email, SMS, WhatsApp, and in-app alerts plus reschedule / cancellation rules.</p>
    </div>

    <!-- Notifications Card -->
    <div class="bg-white border border-gray-200 rounded-xl p-5">
      <div class="divide-y divide-gray-100">
        <div
          v-for="(notif, index) in config.notifications"
          :key="notif.type"
          class="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
        >
          <!-- Bell icon -->
          <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>

          <!-- Label -->
          <span class="text-sm text-gray-900 flex-1 min-w-0">{{ notif.label }}</span>

          <!-- Channel badges -->
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <button
              v-for="ch in channelLabels"
              :key="ch.key"
              class="px-2 py-0.5 text-xs font-medium rounded border transition-colors cursor-pointer"
              :class="getChannelColor(ch.key, notif.channels[ch.key])"
              @click="toggleChannel(index, ch.key)"
            >
              {{ ch.label }}
            </button>
          </div>

          <!-- Edit icon -->
          <button class="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Status labels -->
      <div class="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
        <span class="text-sm text-gray-500">Status labels:</span>
        <span class="text-sm font-medium text-green-600">Enabled</span>
        <span class="text-sm font-medium text-gray-400">Disabled</span>
      </div>
    </div>

    <!-- Additional Settings Card — only meaningful when there's a host to assign to -->
    <div v-if="hasHosts" class="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
      <h3 class="text-sm font-semibold text-gray-900">Additional settings</h3>
      <p class="text-xs text-gray-500 -mt-3">Configure additional settings for your calendar.</p>

      <!-- Assign contacts -->
      <div class="flex items-start gap-3">
        <button
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 mt-0.5"
          :class="config.assignContactsToTeamMembers ? 'bg-primary-600' : 'bg-gray-200'"
          @click="emit('update', { assignContactsToTeamMembers: !config.assignContactsToTeamMembers })"
        >
          <span
            class="inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm"
            :class="config.assignContactsToTeamMembers ? 'translate-x-6' : 'translate-x-1'"
          />
        </button>
        <div>
          <span class="text-sm font-medium text-gray-900">Assign contacts to their respective calendar team members each time an appointment is booked.</span>
          <p class="text-xs text-gray-500 mt-0.5">When enabled, Contact's assigned user will match the owner of the appointment with the most recent change — whether it's been booked, rescheduled, or reassigned.</p>
        </div>
      </div>

      <!-- Skip assigning -->
      <div class="flex items-start gap-3">
        <button
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 mt-0.5"
          :class="config.skipAssigningIfAlreadyAssigned ? 'bg-primary-600' : 'bg-gray-200'"
          @click="emit('update', { skipAssigningIfAlreadyAssigned: !config.skipAssigningIfAlreadyAssigned })"
        >
          <span
            class="inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm"
            :class="config.skipAssigningIfAlreadyAssigned ? 'translate-x-6' : 'translate-x-1'"
          />
        </button>
        <div>
          <span class="text-sm font-medium text-gray-900">Skip assigning Contact if the Contact has already an assigned user.</span>
          <p class="text-xs text-gray-500 mt-0.5">When enabled, a Contact's assigned user will remain the same, even if the appointment owner is different.</p>
        </div>
      </div>
    </div>

    <!-- Cancellation and Reschedule Policy Card -->
    <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
      <h3 class="text-sm font-semibold text-gray-900">Cancellation and reschedule policy:</h3>

      <!-- Allow rescheduling -->
      <div>
        <div class="flex items-center gap-3">
          <button
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
            :class="config.allowReschedule ? 'bg-primary-600' : 'bg-gray-200'"
            @click="emit('update', { allowReschedule: !config.allowReschedule })"
          >
            <span
              class="inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm"
              :class="config.allowReschedule ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
          <div class="flex items-center gap-1.5">
            <span class="text-sm font-medium text-gray-900">Allow rescheduling of meeting</span>
            <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </div>
        </div>
        <transition name="section-slide">
          <div v-if="config.allowReschedule" class="mt-3 ml-14 flex items-center gap-2">
            <span class="text-sm text-gray-600">Rescheduling link will expire</span>
            <input
              type="number"
              :value="config.rescheduleLinkExpiry"
              @input="emit('update', { rescheduleLinkExpiry: parseInt(($event.target as HTMLInputElement).value) || null })"
              class="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder=""
            />
            <select
              :value="config.rescheduleLinkExpiryUnit"
              @change="emit('update', { rescheduleLinkExpiryUnit: ($event.target as HTMLSelectElement).value })"
              class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="Minutes">Minutes</option>
              <option value="Hours">Hours</option>
              <option value="Days">Days</option>
            </select>
            <span class="text-sm text-gray-600">before the meeting</span>
          </div>
        </transition>
      </div>

      <!-- Allow cancellation -->
      <div class="pt-3 border-t border-gray-100">
        <div class="flex items-center gap-3">
          <button
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
            :class="config.allowCancellation ? 'bg-primary-600' : 'bg-gray-200'"
            @click="emit('update', { allowCancellation: !config.allowCancellation })"
          >
            <span
              class="inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm"
              :class="config.allowCancellation ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
          <div class="flex items-center gap-1.5">
            <span class="text-sm font-medium text-gray-900">Allow cancellation of meeting</span>
            <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </div>
        </div>
        <transition name="section-slide">
          <div v-if="config.allowCancellation" class="mt-3 ml-14 flex items-center gap-2">
            <span class="text-sm text-gray-600">Cancellation link will expire</span>
            <input
              type="number"
              :value="config.cancellationLinkExpiry"
              @input="emit('update', { cancellationLinkExpiry: parseInt(($event.target as HTMLInputElement).value) || null })"
              class="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder=""
            />
            <select
              :value="config.cancellationLinkExpiryUnit"
              @change="emit('update', { cancellationLinkExpiryUnit: ($event.target as HTMLSelectElement).value })"
              class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="Minutes">Minutes</option>
              <option value="Hours">Hours</option>
              <option value="Days">Days</option>
            </select>
            <span class="text-sm text-gray-600">before the meeting</span>
          </div>
        </transition>
      </div>
    </div>

    <!-- Third-party Calendar Settings Card -->
    <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
      <h3 class="text-sm font-semibold text-gray-900">Third-party calendar settings</h3>
      <p class="text-xs text-gray-500 -mt-3">Set up your preferences for third-party calendars.</p>

      <!-- Allow invitations -->
      <div class="flex items-start gap-3">
        <button
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 mt-0.5"
          :class="config.allowThirdPartyCalendarInvites ? 'bg-primary-600' : 'bg-gray-200'"
          @click="emit('update', { allowThirdPartyCalendarInvites: !config.allowThirdPartyCalendarInvites })"
        >
          <span
            class="inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm"
            :class="config.allowThirdPartyCalendarInvites ? 'translate-x-6' : 'translate-x-1'"
          />
        </button>
        <span class="text-sm text-gray-700">Allow Google / Outlook / iCloud calendar to send invitation & update emails to attendees.</span>
      </div>

      <!-- Meeting invite notes -->
      <div>
        <div class="flex items-center gap-1.5 mb-1.5">
          <label class="text-sm font-medium text-gray-900">Meeting invite notes</label>
          <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        </div>
        <textarea
          :value="config.meetingInviteNotes"
          @input="emit('update', { meetingInviteNotes: ($event.target as HTMLTextAreaElement).value })"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary-500"
          rows="3"
        />
      </div>
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
  max-height: 600px;
}
</style>
