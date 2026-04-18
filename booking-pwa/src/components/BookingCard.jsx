import { Plane, Accessibility, MapPin } from 'lucide-react'
import { formatDate, getUrgency } from '../services/dateUtils'

const STRIPE = {
  red:   'stripe-red',
  amber: 'stripe-amber',
  green: 'stripe-green',
  blue:  'stripe-blue',
  past:  'stripe-past',
}

export default function BookingCard({ booking, onTap }) {
  const urgency = getUrgency(booking.checkIn)

  const remarksList = Array.isArray(booking.remarks)
    ? booking.remarks.filter(Boolean)
    : booking.remarks ? [booking.remarks] : []

  const activeCustomFlags = (booking.customFlags ?? []).filter((f) => f.checked)

  return (
    <button
      onClick={() => onTap?.(booking)}
      className={[
        'relative w-full text-left bg-surface rounded-[14px] border border-line',
        'overflow-hidden transition-transform duration-[120ms] active:scale-[0.985]',
        urgency === 'past' ? 'opacity-50' : '',
      ].join(' ')}
    >
      <span className={`absolute left-0 inset-y-0 w-[3px] ${STRIPE[urgency] ?? STRIPE.blue}`} />

      <div className="pl-4 pr-4 pt-3.5 pb-3">
        {/* Row 1 — name + room */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="font-semibold text-hi text-[15px] leading-snug truncate">
            {booking.guestName}
          </span>
          <span className="badge badge-accent shrink-0">{booking.room}</span>
        </div>

        {/* Row 2 — location · date · nights */}
        <div className="flex items-center gap-1.5 text-[13px] text-lo mb-2">
          <MapPin size={11} className="text-dim shrink-0" strokeWidth={2} />
          <span className="truncate max-w-[120px]">{booking.location}</span>
          <span className="text-dim shrink-0">·</span>
          <span className="shrink-0">{formatDate(booking.checkIn)}</span>
          <span className="text-dim shrink-0">·</span>
          <span className="tabular-nums shrink-0">{booking.nights}n</span>
        </div>

        {/* Row 3 — tags */}
        {(booking.helicopter || booking.assistance || activeCustomFlags.length > 0) && (
          <div className="flex gap-1.5 flex-wrap mb-1.5">
            {booking.helicopter && (
              <span className="tag tag-sky flex items-center gap-1">
                <Plane size={10} strokeWidth={2} />
                Helicopter
              </span>
            )}
            {booking.assistance && (
              <span className="tag tag-violet flex items-center gap-1">
                <Accessibility size={10} strokeWidth={2} />
                Assistance
              </span>
            )}
            {activeCustomFlags.map((f) => (
              <span key={f.id} className="tag tag-custom">{f.label}</span>
            ))}
          </div>
        )}

        {/* Remarks — up to 2 */}
        {remarksList.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {remarksList.slice(0, 2).map((r, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12px] text-dim">
                <span className="shrink-0 mt-[3px] text-[8px]">•</span>
                <span className="truncate">{r}</span>
              </li>
            ))}
            {remarksList.length > 2 && (
              <li className="text-[11px] text-dim opacity-60">
                +{remarksList.length - 2} more
              </li>
            )}
          </ul>
        )}
      </div>
    </button>
  )
}
