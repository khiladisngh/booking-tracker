/**
 * Notification scheduling service for the booking PWA.
 *
 * Since there is no push server, notifications are scheduled via setTimeout
 * while the app is open. getUpcomingReminders() provides a UI fallback list
 * for when the app is closed or permission is denied.
 */

/** @type {Map<string, ReturnType<typeof setTimeout>>} */
const pendingTimeouts = new Map()

// ---------------------------------------------------------------------------
// Permission
// ---------------------------------------------------------------------------

/**
 * Request browser notification permission.
 * @returns {Promise<'granted'|'denied'|'default'|'unsupported'>}
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.requestPermission()
}

// ---------------------------------------------------------------------------
// Scheduling
// ---------------------------------------------------------------------------

/**
 * Cancel all pending notification timeouts and reschedule based on current bookings.
 * Call on app mount and whenever the bookings array changes.
 *
 * @param {Array<{id: string, locationId: string, room: string, guestName: string, checkIn: string, nights: number, checkOut: string, helicopter?: boolean, assistance?: boolean, remarks?: string}>} bookings
 * @param {{eveningReminderTime: string, morningReminderTime: string, daysBefore: number}} notifConfig
 */
export function scheduleNotifications(bookings, notifConfig) {
  cancelAllNotifications()

  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return
  }

  const { eveningReminderTime, morningReminderTime } = notifConfig
  const now = new Date()
  const today = toDateString(now)
  const tomorrow = toDateString(offsetDays(now, 1))

  // Group bookings arriving tomorrow for a single evening reminder.
  const tomorrowArrivals = bookings.filter((b) => b.checkIn === tomorrow)
  if (tomorrowArrivals.length > 0) {
    const eveningTime = parseTime(today, eveningReminderTime)
    const msUntilEvening = eveningTime.getTime() - now.getTime()
    if (msUntilEvening > 0) {
      const timeoutId = setTimeout(
        () => fireEveningReminder(tomorrowArrivals),
        msUntilEvening,
      )
      pendingTimeouts.set('evening-tomorrow', timeoutId)
    }
  }

  // One morning reminder per booking arriving today.
  const todayArrivals = bookings.filter((b) => b.checkIn === today)
  for (const booking of todayArrivals) {
    const morningTime = parseTime(today, morningReminderTime)
    const msUntilMorning = morningTime.getTime() - now.getTime()
    if (msUntilMorning > 0) {
      const timeoutId = setTimeout(
        () => fireMorningReminder(booking),
        msUntilMorning,
      )
      pendingTimeouts.set(`morning-${booking.id}`, timeoutId)
    }
  }
}

/**
 * Clear all pending notification timeouts.
 */
export function cancelAllNotifications() {
  for (const id of pendingTimeouts.values()) {
    clearTimeout(id)
  }
  pendingTimeouts.clear()
}

// ---------------------------------------------------------------------------
// UI reminder list
// ---------------------------------------------------------------------------

/**
 * Return upcoming notification objects for UI display (pure, no side effects).
 *
 * @param {Array<{id: string, locationId: string, room: string, guestName: string, checkIn: string, nights: number, checkOut: string, helicopter?: boolean, assistance?: boolean, remarks?: string}>} bookings
 * @param {{eveningReminderTime: string, morningReminderTime: string, daysBefore: number}} notifConfig
 * @returns {Array<{id: string, scheduledFor: Date, type: 'evening'|'morning', label: string, bookings: Array}>}
 */
export function getUpcomingReminders(bookings, notifConfig) {
  const { eveningReminderTime, morningReminderTime } = notifConfig
  const now = new Date()
  const today = toDateString(now)
  const tomorrow = toDateString(offsetDays(now, 1))

  const reminders = []

  // Evening reminder: one entry grouping all tomorrow arrivals.
  const tomorrowArrivals = bookings.filter((b) => b.checkIn === tomorrow)
  if (tomorrowArrivals.length > 0) {
    const scheduledFor = parseTime(today, eveningReminderTime)
    if (scheduledFor > now) {
      const names = tomorrowArrivals.map((b) => b.guestName).join(', ')
      reminders.push({
        id: 'evening-tomorrow',
        scheduledFor,
        type: 'evening',
        label: `Tomorrow's arrivals: ${names}`,
        bookings: tomorrowArrivals,
      })
    }
  }

  // Morning reminders: one per booking arriving today.
  for (const booking of bookings.filter((b) => b.checkIn === today)) {
    const scheduledFor = parseTime(today, morningReminderTime)
    if (scheduledFor > now) {
      reminders.push({
        id: `morning-${booking.id}`,
        scheduledFor,
        type: 'morning',
        label: buildMorningLabel(booking),
        bookings: [booking],
      })
    }
  }

  reminders.sort((a, b) => a.scheduledFor - b.scheduledFor)
  return reminders
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Fire an evening reminder grouping all tomorrow arrivals into one notification.
 * @param {Array} arrivals
 */
async function fireEveningReminder(arrivals) {
  const names = arrivals.map((b) => b.guestName).join(', ')
  const title = `Tomorrow's arrivals (${arrivals.length})`
  const body = names

  await showNotification(title, {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'evening-tomorrow',
    renotify: true,
  })
}

/**
 * Fire a morning reminder for a single arriving guest.
 * @param {{id: string, locationId: string, room: string, guestName: string, helicopter?: boolean}} booking
 */
async function fireMorningReminder(booking) {
  const title = 'Arrival today'
  const body = buildMorningLabel(booking)

  await showNotification(title, {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: booking.id,
    renotify: true,
  })
}

/**
 * Build the body text for a morning reminder.
 * @param {{guestName: string, room: string, locationId: string, helicopter?: boolean}} booking
 * @returns {string}
 */
function buildMorningLabel(booking) {
  let label = `${booking.guestName} arriving — Room ${booking.room} (${booking.locationId})`
  if (booking.helicopter) {
    label += '. Helicopter needed.'
  }
  return label
}

/**
 * Show a notification via the service worker registration when available,
 * falling back silently if the SW is not ready.
 * @param {string} title
 * @param {NotificationOptions} options
 */
async function showNotification(title, options) {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(title, options)
    } else {
      // Service worker unavailable — silently skip.
    }
  } catch {
    // Notification failed (e.g. permission revoked after scheduling) — silently skip.
  }
}

/**
 * Parse a date string and time string into a Date object.
 * @param {string} dateStr - Format: 'yyyy-MM-dd'
 * @param {string} timeStr - Format: 'HH:mm'
 * @returns {Date}
 */
function parseTime(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hours, minutes] = timeStr.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

/**
 * Return a 'yyyy-MM-dd' string for the given Date.
 * @param {Date} date
 * @returns {string}
 */
function toDateString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Return a new Date offset by the given number of days.
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
function offsetDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}
