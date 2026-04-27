import type { Vertical } from '../composables/useAppSettings'

export interface Appointment {
  id: string
  title: string
  vertical: Vertical
  contact: { name: string; email: string; initials: string; color: string }
  startTime: Date
  endTime: Date
  assignedTo: string
  status: 'confirmed' | 'pending' | 'cancelled'
  paymentStatus?: 'paid' | 'pending' | 'unpaid' | 'partial'
  calendarName?: string
  serviceName?: string
  listingName?: string
  location?: string
}

// Helper to create dates relative to current week
function weekDate(dayOffset: number, hour: number, minute = 0): Date {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - now.getDay() + 1) // Monday of current week
  monday.setHours(hour, minute, 0, 0)
  monday.setDate(monday.getDate() + dayOffset)
  return monday
}

export const mockAppointments: Appointment[] = [
  // MEETINGS (blue)
  {
    id: 'apt-1',
    title: 'Team Standup',
    vertical: 'meetings',
    contact: { name: 'Abhishek Chauhan', initials: 'AC', color: 'bg-blue-500' },
    startTime: weekDate(0, 9, 0),
    endTime: weekDate(0, 9, 45),
    assignedTo: 'Hannah Smith',
    status: 'confirmed',
    calendarName: 'Team Calendar',
    location: 'Zoom',
  },
  {
    id: 'apt-2',
    title: '1:1 with Sarah',
    vertical: 'meetings',
    contact: { name: 'Sarah Johnson', initials: 'SJ', color: 'bg-pink-500' },
    startTime: weekDate(2, 8, 0),
    endTime: weekDate(2, 9, 0),
    assignedTo: 'Hannah Smith',
    status: 'confirmed',
    calendarName: 'Default Calendar',
  },
  {
    id: 'apt-3',
    title: 'Sprint Planning',
    vertical: 'meetings',
    contact: { name: 'Dev Team', initials: 'DT', color: 'bg-indigo-500' },
    startTime: weekDate(2, 11, 0),
    endTime: weekDate(2, 12, 30),
    assignedTo: 'Jane Doe',
    status: 'confirmed',
    calendarName: 'Team Calendar',
  },
  {
    id: 'apt-4',
    title: 'Strategy Review',
    vertical: 'meetings',
    contact: { name: 'Marketing Team', initials: 'MT', color: 'bg-cyan-500' },
    startTime: weekDate(4, 12, 0),
    endTime: weekDate(4, 13, 30),
    assignedTo: 'Hannah Smith',
    status: 'confirmed',
    calendarName: 'Default Calendar',
  },
  {
    id: 'apt-5',
    title: 'Sales Discovery Call',
    vertical: 'meetings',
    contact: { name: 'Mayank Jain', initials: 'MJ', color: 'bg-orange-500' },
    startTime: weekDate(3, 14, 0),
    endTime: weekDate(3, 14, 30),
    assignedTo: 'Jane Doe',
    status: 'pending',
    calendarName: 'Tax Counselling Session',
  },
  {
    id: 'apt-6',
    title: 'Data Retention Review',
    vertical: 'meetings',
    contact: { name: 'nik@gohighlevel.com', initials: 'N', color: 'bg-red-500' },
    startTime: weekDate(3, 16, 0),
    endTime: weekDate(3, 16, 30),
    assignedTo: 'Hannah Smith',
    status: 'confirmed',
    calendarName: 'Copy of Speak with Abhis...',
  },

  // SERVICES (green)
  {
    id: 'apt-7',
    title: 'Facial',
    vertical: 'services',
    contact: { name: 'Emma Wilson', initials: 'EW', color: 'bg-rose-500' },
    startTime: weekDate(2, 10, 0),
    endTime: weekDate(2, 11, 0),
    assignedTo: 'Hannah Smith',
    status: 'confirmed',
    paymentStatus: 'unpaid',
    serviceName: 'Facial Treatment',
  },
  {
    id: 'apt-8',
    title: 'Haircut',
    vertical: 'services',
    contact: { name: 'Ainsley Morton', initials: 'AM', color: 'bg-amber-500' },
    startTime: weekDate(1, 12, 0),
    endTime: weekDate(1, 13, 0),
    assignedTo: 'Jane Doe',
    status: 'confirmed',
    paymentStatus: 'paid',
    serviceName: 'Haircut',
  },
  {
    id: 'apt-9',
    title: 'Manicure',
    vertical: 'services',
    contact: { name: 'Linda Park', initials: 'LP', color: 'bg-teal-500' },
    startTime: weekDate(0, 13, 0),
    endTime: weekDate(0, 14, 30),
    assignedTo: 'Hannah Smith',
    status: 'confirmed',
    paymentStatus: 'paid',
    serviceName: 'Manicure',
  },
  {
    id: 'apt-10',
    title: 'Deep Tissue Massage',
    vertical: 'services',
    contact: { name: 'James Lee', initials: 'JL', color: 'bg-lime-500' },
    startTime: weekDate(2, 13, 0),
    endTime: weekDate(2, 15, 0),
    assignedTo: 'Mathew Jane',
    status: 'confirmed',
    paymentStatus: 'paid',
    serviceName: 'Massage 60min',
  },
  {
    id: 'apt-11',
    title: 'Gel Polish',
    vertical: 'services',
    contact: { name: 'Baker Stephens', initials: 'BS', color: 'bg-violet-500' },
    startTime: weekDate(1, 16, 0),
    endTime: weekDate(1, 17, 0),
    assignedTo: 'Jane Doe',
    status: 'confirmed',
    paymentStatus: 'pending',
    serviceName: 'Gel Polish',
  },
  {
    id: 'apt-12',
    title: 'Hair Spa',
    vertical: 'services',
    contact: { name: 'John Doe', initials: 'JD', color: 'bg-sky-500' },
    startTime: weekDate(4, 10, 0),
    endTime: weekDate(4, 11, 0),
    assignedTo: 'Hannah Smith',
    status: 'confirmed',
    paymentStatus: 'paid',
    serviceName: 'Hair Spa for Women',
  },

  // RENTALS (purple)
  {
    id: 'apt-13',
    title: 'Tesla Model Y',
    vertical: 'rentals',
    contact: { name: 'Anna Bell', initials: 'AB', color: 'bg-fuchsia-500' },
    startTime: weekDate(0, 7, 0),
    endTime: weekDate(2, 19, 0), // multi-day Mon-Wed
    assignedTo: 'Tesla Model Y',
    status: 'pending',
    paymentStatus: 'pending',
    listingName: 'Tesla Model Y',
  },
  {
    id: 'apt-14',
    title: 'Standard Villa',
    vertical: 'rentals',
    contact: { name: 'Mark Davis', initials: 'MD', color: 'bg-emerald-600' },
    startTime: weekDate(1, 7, 0),
    endTime: weekDate(3, 19, 0), // multi-day Tue-Thu
    assignedTo: 'Standard Villa',
    status: 'confirmed',
    paymentStatus: 'paid',
    listingName: 'Standard Villa',
  },
  {
    id: 'apt-15',
    title: 'Tesla Model Y',
    vertical: 'rentals',
    contact: { name: 'Mike Johnson', initials: 'MJ', color: 'bg-blue-600' },
    startTime: weekDate(4, 7, 0),
    endTime: weekDate(6, 19, 0), // multi-day Fri-Sun
    assignedTo: 'Tesla Model Y',
    status: 'confirmed',
    paymentStatus: 'paid',
    listingName: 'Tesla Model Y',
  },
  {
    id: 'apt-16',
    title: 'Whispering Grove Villa',
    vertical: 'rentals',
    contact: { name: 'Lisa Chen', initials: 'LC', color: 'bg-yellow-600' },
    startTime: weekDate(2, 7, 0),
    endTime: weekDate(5, 19, 0), // multi-day Wed-Sat
    assignedTo: 'Whispering Grove Villa',
    status: 'confirmed',
    paymentStatus: 'paid',
    listingName: 'Whispering Grove Villa',
  },
  {
    id: 'apt-17',
    title: 'Standard Villa',
    vertical: 'rentals',
    contact: { name: 'Tom Hardy', initials: 'TH', color: 'bg-gray-600' },
    startTime: weekDate(5, 7, 0),
    endTime: weekDate(6, 19, 0), // Sat-Sun
    assignedTo: 'Standard Villa',
    status: 'confirmed',
    paymentStatus: 'paid',
    listingName: 'Standard Villa',
  },
]

// Staff/resources for day view columns
export const mockResources = {
  staff: [
    { name: 'Hannah Smith', initials: 'HS', color: 'bg-blue-500' },
    { name: 'Jane Doe', initials: 'JD', color: 'bg-indigo-500' },
    { name: 'Mathew Jane', initials: 'MJ', color: 'bg-amber-500' },
  ],
  listings: [
    { name: 'Standard Villa', initials: 'SV', color: 'bg-purple-500' },
    { name: 'Whispering Grove Villa', initials: 'WG', color: 'bg-purple-400' },
    { name: 'Tesla Model Y', initials: 'TY', color: 'bg-purple-600' },
  ],
}
