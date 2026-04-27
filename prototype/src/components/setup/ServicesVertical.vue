<script lang="ts" setup>
import { ref, computed } from 'vue'
import { mockServices, serviceCategories, type Service } from '../../data/mockServices'

const activeSubTab = ref<'services' | 'staff' | 'locations' | 'resources' | 'global-settings'>('services')
const activeCategory = ref<string | null>(null)
const searchQuery = ref('')

const filteredServices = computed(() => {
  let result = [...mockServices]
  if (activeCategory.value) {
    result = result.filter(s => s.category === activeCategory.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(s => s.name.toLowerCase().includes(q))
  }
  return result
})

const totalServices = computed(() => mockServices.length)
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Sub-tabs -->
    <div class="bg-white border-b border-gray-200 px-6 flex-shrink-0">
      <div class="flex items-center gap-1 -mb-px">
        <button
          v-for="tab in [
            { key: 'services', label: 'Services' },
            { key: 'staff', label: 'Staff' },
            { key: 'locations', label: 'Locations' },
            { key: 'resources', label: 'Resources' },
            { key: 'global-settings', label: 'Global Settings' },
          ]"
          :key="tab.key"
          class="px-4 py-3 text-xs font-medium border-b-2 transition-colors"
          :class="activeSubTab === tab.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'"
          @click="activeSubTab = tab.key as any"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Services Content -->
    <div v-if="activeSubTab === 'services'" class="flex-1 flex overflow-hidden">
      <!-- Categories Sidebar -->
      <div class="w-[200px] bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
        <div class="p-3">
          <button
            class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors mb-0.5"
            :class="!activeCategory ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'"
            @click="activeCategory = null"
          >
            <span>All Services</span>
            <span class="text-[10px] font-normal" :class="!activeCategory ? 'text-primary-500' : 'text-gray-400'">{{ totalServices }}</span>
          </button>
          <button
            v-for="cat in serviceCategories"
            :key="cat.name"
            class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors mb-0.5"
            :class="activeCategory === cat.name ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'"
            @click="activeCategory = cat.name"
          >
            <span class="truncate">{{ cat.name }}</span>
            <span class="text-[10px] font-normal ml-1" :class="activeCategory === cat.name ? 'text-primary-500' : 'text-gray-400'">{{ cat.count }}</span>
          </button>
          <button class="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-primary-600 font-medium hover:bg-primary-50 rounded-lg transition-colors mt-1">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
            New Category
          </button>
        </div>
      </div>

      <!-- Services Table -->
      <div class="flex-1 overflow-auto p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-semibold text-gray-900">
            {{ activeCategory || 'All Services' }}
            <span class="text-sm font-normal text-gray-500 ml-1">({{ filteredServices.length }})</span>
          </h2>
          <button class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
            New Service
          </button>
        </div>

        <!-- Filters -->
        <div class="flex items-center gap-3 mb-4">
          <div class="relative flex-1 max-w-xs">
            <svg class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search services..."
              class="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-700 w-full placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <!-- Table -->
        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200">
                <th class="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider w-10">#</th>
                <th class="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th class="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                <th class="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                <th class="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Staff</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="(svc, idx) in filteredServices"
                :key="svc.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-4 py-3 text-xs text-gray-400">{{ idx + 1 }}</td>
                <td class="px-4 py-3">
                  <p class="text-xs font-medium text-gray-900">{{ svc.name }}</p>
                  <p class="text-[10px] text-gray-400 mt-0.5">{{ svc.category }}</p>
                </td>
                <td class="px-4 py-3 text-xs text-gray-600">{{ svc.duration }}</td>
                <td class="px-4 py-3 text-xs text-gray-600">{{ svc.price }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-1">
                    <template v-if="svc.staff.length > 0">
                      <span
                        v-for="member in svc.staff"
                        :key="member.name"
                        class="inline-flex items-center justify-center w-6 h-6 rounded-full text-[9px] font-medium text-white"
                        :class="member.color"
                        :title="member.name"
                      >
                        {{ member.initials }}
                      </span>
                    </template>
                    <span v-else class="text-[10px] text-gray-400">--</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="filteredServices.length === 0" class="py-12 text-center">
            <p class="text-sm text-gray-500">No services found.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Staff placeholder -->
    <div v-else-if="activeSubTab === 'staff'" class="flex-1 p-6">
      <div class="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <svg class="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        <h3 class="text-sm font-medium text-gray-900 mb-1">Staff Management</h3>
        <p class="text-xs text-gray-500">Manage staff members, their services, and working hours.</p>
      </div>
    </div>

    <!-- Locations placeholder -->
    <div v-else-if="activeSubTab === 'locations'" class="flex-1 p-6">
      <div class="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <svg class="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        <h3 class="text-sm font-medium text-gray-900 mb-1">Locations</h3>
        <p class="text-xs text-gray-500">Add and manage your service locations and addresses.</p>
      </div>
    </div>

    <!-- Resources placeholder -->
    <div v-else-if="activeSubTab === 'resources'" class="flex-1 p-6">
      <div class="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <svg class="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        <h3 class="text-sm font-medium text-gray-900 mb-1">Resources</h3>
        <p class="text-xs text-gray-500">Manage rooms, equipment, and other resources required for services.</p>
      </div>
    </div>

    <!-- Global Settings placeholder -->
    <div v-else class="flex-1 p-6">
      <div class="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <svg class="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        <h3 class="text-sm font-medium text-gray-900 mb-1">Services Global Settings</h3>
        <p class="text-xs text-gray-500">Configure global defaults for all services including cancellation policies and booking rules.</p>
      </div>
    </div>
  </div>
</template>
