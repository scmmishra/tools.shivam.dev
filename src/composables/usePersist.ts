import { watch } from 'vue'
import type { Ref } from 'vue'

export function usePersist<T>(key: string | undefined, value: Ref<T>) {
  if (!key) return

  // Load initial value from localStorage
  const stored = localStorage.getItem(key)
  if (stored) {
    try {
      value.value = JSON.parse(stored)
    } catch (e) {
      console.error(`Error parsing stored value for ${key}:`, e)
    }
  }

  // Watch for changes and update localStorage
  watch(
    value,
    (newValue) => {
      if (newValue === undefined || newValue === '') {
        localStorage.removeItem(key)
      } else {
        localStorage.setItem(key, JSON.stringify(newValue))
      }
    },
    { deep: true }
  )
}
