<script lang="ts" setup>
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Connected Calendars -->
    <div class="bg-white border border-gray-200 rounded-xl">
      <div class="px-5 py-4 border-b border-gray-100">
        <h3 class="text-sm font-semibold text-gray-900">Connected Calendars</h3>
        <p class="text-xs text-gray-500 mt-0.5">Sync your external calendars to check for conflicts and push new bookings.</p>
      </div>
      <div class="divide-y divide-gray-100">
        <!-- Google Calendar -->
        <div class="px-5 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" fill="#4285F4"/>
                <rect x="6" y="6" width="5" height="5" rx="0.5" fill="#EA4335"/>
                <rect x="13" y="6" width="5" height="5" rx="0.5" fill="#FBBC04"/>
                <rect x="6" y="13" width="5" height="5" rx="0.5" fill="#34A853"/>
                <rect x="13" y="13" width="5" height="5" rx="0.5" fill="#4285F4"/>
              </svg>
            </div>
            <div>
              <p class="text-xs font-medium text-gray-900">Google Calendar</p>
              <p class="text-[10px] text-gray-500 mt-0.5">swadha.bhoj@example.com</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-medium">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
              Connected
            </span>
            <button class="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50 transition-colors">
              Manage
            </button>
          </div>
        </div>

        <!-- Outlook Calendar -->
        <div class="px-5 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" fill="#0078D4"/>
                <path d="M7 8h10M7 12h10M7 16h6" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <div>
              <p class="text-xs font-medium text-gray-900">Outlook Calendar</p>
              <p class="text-[10px] text-gray-500 mt-0.5">swadha.bhoj@outlook.com</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-medium">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
              Connected
            </span>
            <button class="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50 transition-colors">
              Manage
            </button>
          </div>
        </div>
      </div>

      <!-- Add More -->
      <div class="px-5 py-3 border-t border-gray-100">
        <button class="inline-flex items-center gap-1.5 text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
          Connect Another Calendar
        </button>
      </div>
    </div>

    <!-- Video Conferencing -->
    <div class="bg-white border border-gray-200 rounded-xl">
      <div class="px-5 py-4 border-b border-gray-100">
        <h3 class="text-sm font-semibold text-gray-900">Video Conferencing</h3>
        <p class="text-xs text-gray-500 mt-0.5">Connect Zoom, Google Meet, or Teams for automatic meeting links.</p>
      </div>
      <div class="divide-y divide-gray-100">
        <!-- Zoom -->
        <div class="px-5 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M4 5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-3l4 3V8l-4 3V7a2 2 0 00-2-2H4z"/></svg>
            </div>
            <div>
              <p class="text-xs font-medium text-gray-900">Zoom</p>
              <p class="text-[10px] text-gray-500 mt-0.5">Auto-generate Zoom meeting links</p>
            </div>
          </div>
          <button class="px-3 py-1.5 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors">
            Connect
          </button>
        </div>

        <!-- Google Meet -->
        <div class="px-5 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-green-50 border border-green-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor"><path d="M4 5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-3l4 3V8l-4 3V7a2 2 0 00-2-2H4z"/></svg>
            </div>
            <div>
              <p class="text-xs font-medium text-gray-900">Google Meet</p>
              <p class="text-[10px] text-gray-500 mt-0.5">Auto-generate Google Meet links</p>
            </div>
          </div>
          <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-medium">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
            Connected
          </span>
        </div>

        <!-- Microsoft Teams -->
        <div class="px-5 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="currentColor"><path d="M4 5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-3l4 3V8l-4 3V7a2 2 0 00-2-2H4z"/></svg>
            </div>
            <div>
              <p class="text-xs font-medium text-gray-900">Microsoft Teams</p>
              <p class="text-[10px] text-gray-500 mt-0.5">Auto-generate Teams meeting links</p>
            </div>
          </div>
          <button class="px-3 py-1.5 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors">
            Connect
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
