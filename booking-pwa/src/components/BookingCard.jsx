import { motion } from 'framer-motion'
import { Plane, Accessibility, MapPin, Link } from 'lucide-react'
import { formatDate, getUrgency } from '../services/dateUtils'

const GLOW = {
  red:   'glow-red',
  amber: 'glow-amber',
  green: 'glow-green',
  blue:  'glow-blue',
  past:  'glow-past',
}

const SPRING = { type: 'spring', stiffness: 400, damping: 38 }

// ─── Room card ────────────────────────────────────────────────────────────────

function RoomCard({ booking, onTap }) {
  const urgency = getUrgency(booking.checkIn)

  const remarksList = Array.isArray(booking.remarks)
    ? booking.remarks.filter(Boolean)
    : booking.remarks ? [booking.remarks] : []

  const activeCustomFlags = (booking.customFlags ?? []).filter((f) => f.checked)

  return (
    <motion.button
      onClick={() => onTap?.(booking)}
      whileTap={{ scale: 0.97 }}
      transition={SPRING}
      className={[
        'glass relative w-full text-left rounded-[16px]',
        GLOW[urgency] ?? GLOW.blue,
        urgency === 'past' ? 'opacity-50' : '',
      ].join(' ')}
    >
      <div className="pl-4 pr-4 pt-3.5 pb-3">
        {/* Row 1 — name + room */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="font-semibold text-hi text-[15px] leading-snug truncate">
            {booking.guestName}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {booking.linkedHelicopterId && (
              <Link size={12} className="text-sky-400" strokeWidth={2} />
            )}
            <span className="badge badge-accent">{booking.room}</span>
          </div>
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

        {/* Row 3 — flags */}
        {(booking.assistance || activeCustomFlags.length > 0) && (
          <div className="flex gap-1.5 flex-wrap mb-1.5">
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
    </motion.button>
  )
}

// ─── Helicopter card ──────────────────────────────────────────────────────────

function HeliCard({ booking, onTap }) {
  const urgency = getUrgency(booking.travelDate)

  const passengerNames = (booking.passengers ?? []).map((p) => p.name).filter(Boolean)

  return (
    <motion.button
      onClick={() => onTap?.(booking)}
      whileTap={{ scale: 0.97 }}
      transition={SPRING}
      className={[
        'glass relative w-full text-left rounded-[16px] border border-sky-400/20',
        urgency === 'past' ? 'opacity-50' : 'glow-blue',
      ].join(' ')}
    >
      <div className="pl-4 pr-4 pt-3.5 pb-3">
        {/* Row 1 — plane icon + name + tickets */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <Plane size={13} className="text-sky-400 shrink-0" strokeWidth={2} />
            <span className="font-semibold text-hi text-[15px] leading-snug truncate">
              {booking.guestName}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {booking.linkedRoomId && (
              <Link size={12} className="text-sky-400" strokeWidth={2} />
            )}
            <span className="tag tag-sky">
              {booking.tickets} {booking.tickets === 1 ? 'ticket' : 'tickets'}
            </span>
          </div>
        </div>

        {/* Row 2 — date · route */}
        <div className="flex items-center gap-1.5 text-[13px] text-lo mb-1.5 flex-wrap">
          <span className="shrink-0">{formatDate(booking.travelDate)}</span>
          {(booking.boardingFrom || booking.landingTo) && (
            <>
              <span className="text-dim shrink-0">·</span>
              <span className="truncate max-w-[90px]">{booking.boardingFrom}</span>
              <span className="text-dim shrink-0">→</span>
              <span className="truncate max-w-[90px]">{booking.landingTo}</span>
            </>
          )}
        </div>

        {/* Passengers */}
        {passengerNames.length > 0 && (
          <p className="text-[12px] text-dim truncate">
            {passengerNames.join(', ')}
          </p>
        )}
      </div>
    </motion.button>
  )
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export default function BookingCard({ booking, onTap }) {
  if (booking.type === 'helicopter') return <HeliCard booking={booking} onTap={onTap} />
  return <RoomCard booking={booking} onTap={onTap} />
}
