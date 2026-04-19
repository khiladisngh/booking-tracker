import { useState } from 'react'

const SESSION_KEY = 'booking_edit_mode'

export default function useEditMode() {
  const [isEditMode, setIsEditMode] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === 'true'
  )

  function unlock(passcode) {
    if (passcode === String(import.meta.env.VITE_ADMIN_PASSCODE)) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      setIsEditMode(true)
      return true
    }
    return false
  }

  function lock() {
    sessionStorage.removeItem(SESSION_KEY)
    setIsEditMode(false)
  }

  return { isEditMode, unlock, lock }
}
