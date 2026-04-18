import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { addDays, format } from 'date-fns'
import appConfig from '../config/app.json'

const today = new Date()
const fmt = (d) => format(d, 'yyyy-MM-dd')

const SEED_BOOKINGS = [
  {
    id: 'seed-1',
    location: 'Shimla',
    room: '101',
    guestName: 'Rajesh Kumar',
    checkIn: fmt(addDays(today, 1)),
    nights: 3,
    checkOut: fmt(addDays(today, 4)),
    helicopter: true,
    assistance: false,
    customFlags: [],
    remarks: ['Needs ground floor room'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-2',
    location: 'Shimla',
    room: '103',
    guestName: 'Priya Sharma',
    checkIn: fmt(addDays(today, 1)),
    nights: 2,
    checkOut: fmt(addDays(today, 3)),
    helicopter: false,
    assistance: true,
    customFlags: [],
    remarks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-3',
    location: 'Manali',
    room: 'A1',
    guestName: 'Vikram Singh',
    checkIn: fmt(today),
    nights: 4,
    checkOut: fmt(addDays(today, 4)),
    helicopter: false,
    assistance: false,
    customFlags: [],
    remarks: ['Anniversary trip'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-4',
    location: 'Manali',
    room: 'B2',
    guestName: 'Anita Mehta',
    checkIn: fmt(addDays(today, 3)),
    nights: 5,
    checkOut: fmt(addDays(today, 8)),
    helicopter: true,
    assistance: false,
    customFlags: [],
    remarks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-5',
    location: 'Shimla',
    room: '105',
    guestName: 'Suresh Patel',
    checkIn: fmt(addDays(today, -2)),
    nights: 3,
    checkOut: fmt(addDays(today, 1)),
    helicopter: false,
    assistance: false,
    customFlags: [],
    remarks: ['Late checkout requested'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export const useStore = create(
  persist(
    (set, get) => ({
      bookings: SEED_BOOKINGS,
      config: appConfig,
      activeLocation: 'all',

      setActiveLocation: (location) => set({ activeLocation: location }),

      addBooking: (booking) =>
        set((state) => ({ bookings: [booking, ...state.bookings] })),

      updateBooking: (id, updates) =>
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
          ),
        })),

      deleteBooking: (id) =>
        set((state) => ({ bookings: state.bookings.filter((b) => b.id !== id) })),

      getBookingsByLocation: (location) => {
        const { bookings } = get()
        if (location === 'all') return bookings
        return bookings.filter((b) => b.location === location)
      },

      getUniqueLocations: () => {
        const { bookings } = get()
        return [...new Set(bookings.map((b) => b.location).filter(Boolean))].sort()
      },

      getTodayStats: () => {
        const { bookings } = get()
        const todayStr = fmt(new Date())
        const arrivingToday = bookings.filter((b) => b.checkIn === todayStr)
        const departingToday = bookings.filter((b) => b.checkOut === todayStr)
        const occupied = bookings.filter(
          (b) => b.checkIn <= todayStr && b.checkOut > todayStr
        )
        return { arrivingToday, departingToday, occupied }
      },
    }),
    {
      name: 'booking-store',
      version: 2,
      migrate: (persistedState, fromVersion) => {
        if (fromVersion === 1) {
          const locationMap = { shimla: 'Shimla', manali: 'Manali' }
          return {
            ...persistedState,
            bookings: (persistedState.bookings ?? []).map((b) => ({
              ...b,
              location: locationMap[b.locationId] ?? b.locationId ?? '',
              remarks:
                typeof b.remarks === 'string'
                  ? b.remarks ? [b.remarks] : []
                  : (b.remarks ?? []),
              customFlags: b.customFlags ?? [],
            })),
          }
        }
        return persistedState
      },
    }
  )
)
