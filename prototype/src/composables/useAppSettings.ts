import { ref, computed } from 'vue'

export type Vertical = 'meetings' | 'services' | 'rentals'

const enabledVerticals = ref<Vertical[]>(['meetings', 'services', 'rentals'])

export function useAppSettings() {
  const isSingleVertical = computed(() => enabledVerticals.value.length === 1)
  const isMultiVertical = computed(() => enabledVerticals.value.length > 1)
  const activeVerticals = computed(() => enabledVerticals.value)

  function toggleVertical(v: Vertical) {
    const idx = enabledVerticals.value.indexOf(v)
    if (idx >= 0 && enabledVerticals.value.length > 1) {
      enabledVerticals.value = enabledVerticals.value.filter(x => x !== v)
    } else if (idx < 0) {
      enabledVerticals.value = [...enabledVerticals.value, v]
    }
  }

  function setVerticals(vs: Vertical[]) {
    if (vs.length > 0) enabledVerticals.value = [...vs]
  }

  function setSingleMode(v: Vertical) {
    enabledVerticals.value = [v]
  }

  function setMultiMode() {
    enabledVerticals.value = ['meetings', 'services', 'rentals']
  }

  return {
    enabledVerticals: activeVerticals,
    isSingleVertical,
    isMultiVertical,
    toggleVertical,
    setVerticals,
    setSingleMode,
    setMultiMode,
  }
}

export const verticalColors = {
  meetings: { bg: 'bg-blue-500', bgLight: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  services: { bg: 'bg-emerald-500', bgLight: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  rentals: { bg: 'bg-purple-500', bgLight: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
} as const

export const verticalLabels = {
  meetings: 'Meetings',
  services: 'Services',
  rentals: 'Rentals',
} as const

export const verticalIcons = {
  meetings: '💻',
  services: '✂️',
  rentals: '🏠',
} as const
