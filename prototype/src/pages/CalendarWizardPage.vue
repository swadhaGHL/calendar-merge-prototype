<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCalendarState } from '../composables/useCalendarState'
import { existingCalendars, calendarTemplates } from '../data/mockCalendars'
import TemplatePicker from '../components/prototype/TemplatePicker.vue'
import BasicDetailsUnified from '../components/prototype/BasicDetailsUnified.vue'
import StaffAssignment from '../components/prototype/StaffAssignment.vue'
import AvailabilityUnified from '../components/prototype/AvailabilityUnified.vue'
import BookingRulesUnified from '../components/prototype/BookingRulesUnified.vue'
import FormConfirmation from '../components/prototype/FormConfirmation.vue'
import PaymentsSettings from '../components/prototype/PaymentsSettings.vue'
import NotificationsPolicies from '../components/prototype/NotificationsPolicies.vue'
import WidgetAppearance from '../components/prototype/WidgetAppearance.vue'
import BookingChannels from '../components/prototype/BookingChannels.vue'
import BookerWidgetPreview from '../components/prototype/BookerWidgetPreview.vue'
import CalendarSummaryPopover from '../components/prototype/CalendarSummaryPopover.vue'

const props = defineProps<{
  mode?: string
  calendarId?: string
}>()

const router = useRouter()
const route = useRoute()
const {
  calendarConfig, activeTab, isCreating, showAdvanced, showWidgetPreview,
  sidebarItems, advancedItems, derivedType, derivedSummary, tabCompleteness, canSave,
  onSelectTemplate, onEditExisting, updateConfig, saveCalendar
} = useCalendarState()

const showTemplatePicker = ref(true)
const showSummaryPopover = ref(false)

onMounted(() => {
  const id = props.calendarId || (route.params.id as string)
  if (props.mode === 'edit' && id) {
    const calendar = existingCalendars.find(c => c.id === id)
    if (calendar) {
      onEditExisting(calendar)
      showTemplatePicker.value = false
    }
  } else {
    showTemplatePicker.value = true
  }
})

function handleSelectTemplate(template: any) {
  onSelectTemplate(template)
  showTemplatePicker.value = false
}

function goBack() {
  if (showTemplatePicker.value) {
    router.push('/setup')
  } else {
    showTemplatePicker.value = true
  }
}
</script>

<template>
  <div class="h-full bg-gray-50">
    <!-- Template Picker -->
    <div v-if="showTemplatePicker && mode !== 'edit'" class="max-w-[900px] mx-auto py-8 px-6">
      <div class="flex items-center gap-3 mb-6">
        <button class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700" @click="router.push('/setup')">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Back to Setup
        </button>
      </div>
      <TemplatePicker @select="handleSelectTemplate" />
    </div>

    <!-- Wizard -->
    <div v-else>
      <!-- Header -->
      <div class="bg-white border-b border-gray-200 px-6 py-3">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <button class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700" @click="goBack">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Back
            </button>
            <span class="text-sm font-semibold text-gray-900 truncate">
              {{ isCreating ? 'Create' : 'Edit' }} - {{ calendarConfig.name || 'New Calendar' }}
            </span>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            <a
              href="/booker-preview"
              target="_blank"
              rel="noopener"
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Opens the booker widget at full size in a new tab. Configures live with this wizard."
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              Open booker widget
            </a>
            <button
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              @click="showWidgetPreview = !showWidgetPreview"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              {{ showWidgetPreview ? 'Hide side preview' : 'Show side preview' }}
            </button>
            <button
              class="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              :class="canSave
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'"
              :disabled="!canSave"
              :title="canSave ? 'Save your changes' : 'Add a calendar name to save'"
              @click="saveCalendar"
            >
              Save changes
            </button>
          </div>
        </div>

        <!-- Live Shape Indicator (clickable, opens summary popover) -->
        <div class="flex items-center gap-2 ml-7 mt-2 relative">
          <span class="text-xs text-gray-500">Currently configured as</span>
          <button
            type="button"
            class="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-primary-50 text-primary-700 rounded-md transition-colors hover:bg-primary-100"
            :title="'Click to view full summary'"
            @click="showSummaryPopover = !showSummaryPopover"
          >
            <svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            {{ derivedType }}
            <svg class="w-3 h-3 ml-1 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>
          <span v-if="derivedSummary" class="text-xs text-gray-400">·  {{ derivedSummary }}</span>

          <!-- Summary popover -->
          <div v-if="showSummaryPopover" class="absolute top-full left-[140px] mt-2 z-40">
            <CalendarSummaryPopover
              :config="calendarConfig"
              :derived-type="derivedType"
              @close="showSummaryPopover = false"
            />
          </div>
          <!-- Click-away backdrop -->
          <div
            v-if="showSummaryPopover"
            class="fixed inset-0 z-30"
            @click="showSummaryPopover = false"
          />
        </div>
      </div>

      <!-- Content — full viewport width to match the header. -->
      <div class="px-6 py-6 transition-all duration-300">
        <div class="flex gap-6">
          <!-- Sidebar -->
          <div class="w-[220px] flex-shrink-0">
            <nav class="space-y-0.5">
              <button
                v-for="item in sidebarItems"
                :key="item.key"
                class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between gap-2"
                :class="activeTab === item.key ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'"
                @click="activeTab = item.key"
              >
                <span class="truncate">{{ item.label }}</span>
                <svg
                  v-if="tabCompleteness[item.key]"
                  class="w-3.5 h-3.5 text-emerald-500 flex-shrink-0"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"
                  :title="`${item.label} is set up`"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span
                  v-else
                  class="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"
                  title="Needs your attention"
                ></span>
              </button>
              <button
                class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 flex items-center justify-between"
                @click="showAdvanced = !showAdvanced"
              >
                <span>More settings</span>
                <svg class="w-3.5 h-3.5 transition-transform" :class="showAdvanced ? 'rotate-90' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg>
              </button>
              <div v-if="showAdvanced" class="pl-3 space-y-0.5">
                <button
                  v-for="item in advancedItems"
                  :key="item.key"
                  class="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between gap-2"
                  :class="activeTab === item.key ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:bg-gray-100'"
                  @click="activeTab = item.key"
                >
                  <span class="truncate">{{ item.label }}</span>
                  <svg
                    v-if="tabCompleteness[item.key]"
                    class="w-3 h-3 text-emerald-500 flex-shrink-0"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            </nav>
          </div>

          <!-- Main Content -->
          <div class="flex-1 min-w-[400px] overflow-hidden" :class="showWidgetPreview ? 'max-w-[540px]' : ''">
            <BasicDetailsUnified v-if="activeTab === 'basic'" :config="calendarConfig" @update="updateConfig" />
            <StaffAssignment v-else-if="activeTab === 'staff'" :config="calendarConfig" @update="updateConfig" />
            <AvailabilityUnified v-else-if="activeTab === 'availability'" :config="calendarConfig" @update="updateConfig" />
            <BookingRulesUnified v-else-if="activeTab === 'rules'" :config="calendarConfig" @update="updateConfig" @navigate="(t) => activeTab = t" />
            <FormConfirmation v-else-if="activeTab === 'form'" :config="calendarConfig" @update="updateConfig" />
            <PaymentsSettings v-else-if="activeTab === 'payments'" :config="calendarConfig" @update="updateConfig" />
            <NotificationsPolicies v-else-if="activeTab === 'notifications'" :config="calendarConfig" @update="updateConfig" />
            <WidgetAppearance v-else-if="activeTab === 'widget'" :config="calendarConfig" @update="updateConfig" />
            <BookingChannels v-else-if="activeTab === 'channels'" :config="calendarConfig" @update="updateConfig" />
          </div>

          <!-- Widget Preview — compact (single-column) layout to fit the
               380px side pane. The full side-by-side layout lives at
               /booker-preview (the "Open booker widget" header link). -->
          <transition name="panel-slide">
            <div v-if="showWidgetPreview" class="w-[380px] flex-shrink-0">
              <div class="sticky top-4">
                <BookerWidgetPreview :config="calendarConfig" :compact="true" />
              </div>
            </div>
          </transition>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.panel-slide-enter-active, .panel-slide-leave-active { transition: all 0.3s ease; }
.panel-slide-enter-from, .panel-slide-leave-to { opacity: 0; transform: translateX(20px); }
</style>
