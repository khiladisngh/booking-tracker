function escapeICS(str) {
  return (str ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

export function generateICS(bookings) {
  const dtstamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'

  // Only room bookings have checkIn/checkOut; skip helicopter bookings.
  const events = bookings.filter((b) => b.type !== 'helicopter').map((b) => {
    const dtStart   = b.checkIn.replace(/-/g, '')
    const dtEnd     = b.checkOut.replace(/-/g, '')
    const summary   = escapeICS(`${b.guestName} — Room ${b.room}`)
    const location  = escapeICS(b.location)
    const descParts = [
      b.linkedHelicopterId && 'Helicopter booked',
      b.assistance && 'Assistance required',
      ...(b.customFlags?.filter((f) => f.checked).map((f) => f.label) ?? []),
      ...(b.remarks ?? []),
    ].filter(Boolean)

    const lines = [
      'BEGIN:VEVENT',
      `UID:${b.id}@booking-tracker`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${summary}`,
      `LOCATION:${location}`,
      `DTSTAMP:${dtstamp}`,
    ]
    if (descParts.length) lines.push(`DESCRIPTION:${escapeICS(descParts.join('\n'))}`)
    lines.push('END:VEVENT')
    return lines.join('\r\n')
  })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BookingTracker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadICS(bookings) {
  const content = generateICS(bookings)
  const blob    = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url     = URL.createObjectURL(blob)
  const a       = document.createElement('a')
  a.href        = url
  a.download    = `bookings-${new Date().toISOString().slice(0, 10)}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
