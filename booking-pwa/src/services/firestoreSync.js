import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDocs,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

const bookingsCol = collection(db, 'bookings')
const sessionsCol = collection(db, 'sessions')
const authDocRef  = doc(db, 'config', 'auth')

// ─── Bookings ─────────────────────────────────────────────────────────────────

export function subscribeToBookings(callback) {
  let unsub = () => {}
  let cancelled = false

  function attach() {
    unsub = onSnapshot(
      bookingsCol,
      (snapshot) => { callback(snapshot.docs.map((d) => d.data())) },
      (err) => {
        // IndexedDB persistence can fail in multi-frame dev environments.
        // Firestore falls back to network-only automatically; retry the listener.
        if (cancelled) return
        console.warn('[firestore] snapshot error, retrying in 2s…', err.code)
        setTimeout(() => { if (!cancelled) attach() }, 2000)
      }
    )
  }

  attach()
  return () => { cancelled = true; unsub() }
}

export function addBookingToFirestore(booking) {
  return setDoc(doc(db, 'bookings', booking.id), booking)
}

export function updateBookingInFirestore(id, updates) {
  return updateDoc(doc(db, 'bookings', id), {
    ...updates,
    updatedAt: new Date().toISOString(),
  })
}

export function deleteBookingFromFirestore(id) {
  return deleteDoc(doc(db, 'bookings', id))
}

export function batchLinkBookings(roomId, heliId) {
  const ts    = new Date().toISOString()
  const batch = writeBatch(db)
  batch.update(doc(db, 'bookings', roomId), { linkedHelicopterId: heliId, updatedAt: ts })
  batch.update(doc(db, 'bookings', heliId), { linkedRoomId: roomId,       updatedAt: ts })
  return batch.commit()
}

export function batchUnlinkBookings(roomId, heliId) {
  const ts    = new Date().toISOString()
  const batch = writeBatch(db)
  batch.update(doc(db, 'bookings', roomId), { linkedHelicopterId: null, updatedAt: ts })
  batch.update(doc(db, 'bookings', heliId), { linkedRoomId: null,       updatedAt: ts })
  return batch.commit()
}

export async function seedIfEmpty(seedBookings) {
  const snapshot = await getDocs(bookingsCol)
  if (!snapshot.empty) return
  const batch = writeBatch(db)
  seedBookings.forEach((b) => batch.set(doc(db, 'bookings', b.id), b))
  await batch.commit()
}

// ─── Auth config (/config/auth) ───────────────────────────────────────────────

export function subscribeToAuthConfig(callback) {
  let unsub = () => {}
  let cancelled = false

  function attach() {
    unsub = onSnapshot(
      authDocRef,
      (snapshot) => { callback(snapshot.exists() ? snapshot.data() : null) },
      (err) => {
        if (cancelled) return
        console.warn('[firestore] auth config listener error, retrying…', err.code)
        setTimeout(() => { if (!cancelled) attach() }, 2000)
      }
    )
  }

  attach()
  return () => { cancelled = true; unsub() }
}

export async function seedAuthIfMissing({ viewPasscode, editPasscode }) {
  const snap = await getDoc(authDocRef)
  if (snap.exists()) return
  await setDoc(authDocRef, {
    viewPasscode,
    editPasscode,
    accessEnabled: true,
    updatedAt: new Date().toISOString(),
  })
}

export function updateAuthConfig(updates) {
  return updateDoc(authDocRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  })
}

// ─── Sessions (/sessions/{deviceId}) ──────────────────────────────────────────

export function subscribeToSessions(callback) {
  let unsub = () => {}
  let cancelled = false

  function attach() {
    unsub = onSnapshot(
      sessionsCol,
      (snapshot) => { callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))) },
      (err) => {
        if (cancelled) return
        console.warn('[firestore] sessions listener error, retrying…', err.code)
        setTimeout(() => { if (!cancelled) attach() }, 2000)
      }
    )
  }

  attach()
  return () => { cancelled = true; unsub() }
}

// Session writes are non-critical — never let them surface errors that scare
// the user or spam the console. Swallow and log quietly.
export function registerSession(deviceId, payload) {
  return setDoc(doc(db, 'sessions', deviceId), {
    ...payload,
    lastSeenAt: serverTimestamp(),
  }).catch((err) => console.warn('[firestore] session register failed', err.code))
}

export function touchSession(deviceId, extraFields = {}) {
  return updateDoc(doc(db, 'sessions', deviceId), {
    ...extraFields,
    lastSeenAt: serverTimestamp(),
  }).catch(() => { /* doc may not exist yet if unlock race */ })
}

export function endSession(deviceId) {
  return deleteDoc(doc(db, 'sessions', deviceId))
    .catch((err) => console.warn('[firestore] session end failed', err.code))
}
