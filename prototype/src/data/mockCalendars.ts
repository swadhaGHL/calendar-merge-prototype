export interface MeetingLocation {
  type: 'in_person' | 'zoom' | 'google_meet' | 'ms_teams' | 'ask_booker'
  inPersonType?: 'phone' | 'address' | 'custom'
  customValue?: string
  // Optional display label shown to bookers in the booking widget. The actual
  // `customValue` (real address/phone/notes) is only revealed in the booking
  // confirmation. Useful for privacy — a host can show "Office address" pre-
  // booking and the actual street address only after confirmation.
  displayLabel?: string
  sourceUserId?: string
}

export interface MockTeamMember {
  userId: string
  userName: string
  meetingLocation: MeetingLocation
  connectedTools: string[]
  priority: number
  hostPriority?: HostPriority
  isPrimary?: boolean
  avatar?: string
}

export type AssignmentStrategy = 'rotate' | 'collective' | 'mixed' | null
export type BookingBehavior = 'shared' | 'separate'
export type RotationOptimization = 'availability' | 'equal_distribution'
export type HostPriority = 'high' | 'medium' | 'low'
export type ReschedulePreference = 'reassign' | 'keep_owner'

export interface NotificationChannels {
  email: boolean
  inApp: boolean
  sms: boolean
  whatsapp: boolean
}

export interface NotificationConfig {
  type: string
  label: string
  channels: NotificationChannels
}

export interface UnifiedCalendarConfig {
  id: string
  name: string
  description: string
  slug: string
  groupId: string
  eventColor: string
  logoUrl: string

  // Staff & Assignment
  teamMembers: MockTeamMember[]
  assignmentStrategy: AssignmentStrategy
  rotationOptimization: RotationOptimization
  enableBookerStaffSelection: boolean
  requiredAttendeeIds: string[]
  calendarLocation: MeetingLocation | null
  // Single picker for how the meeting location is decided.
  // - per_host: each team member's own location is used (multi-host only)
  // - single: one location for the whole calendar (uses calendarLocation)
  // - multiple: list of options the booker picks from (uses additionalLocationOptions)
  // - ask_booker: booker provides their own location
  locationMode: 'per_host' | 'single' | 'multiple' | 'ask_booker'
  additionalLocationOptions: MeetingLocation[]
  // Contact routing preferences (multi-host)
  reschedulePreference: ReschedulePreference
  alwaysBookWithAssignedUser: boolean

  // Booking Rules
  meetingInterval: number
  meetingIntervalUnit: string
  meetingDuration: number
  meetingDurationUnit: string
  // Multi-duration: bookers can pick from these. First entry is the default.
  durationOptions: { value: number; unit: string }[]
  seatsPerSlot: number
  bookingBehavior: BookingBehavior
  showSeatsToBookers: boolean
  maxBookingsPerDay: number | null
  minSchedulingNotice: number | null
  minSchedulingNoticeUnit: string
  dateRange: number | null
  dateRangeUnit: string
  preBufferTime: number | null
  preBufferTimeUnit: string
  postBufferTime: number | null
  postBufferTimeUnit: string
  lookBusy: number

  // Availability
  enableRecurring: boolean
  recurringFrequency: string
  recurringCount: number
  // Calendar-level weekly schedule used when teamMembers.length === 0 (Event
  // calendars have no host whose schedule we can intersect, so the user sets
  // it directly). Days keyed sun→sat. Multi-host calendars ignore this and
  // intersect per-host schedules per locked decision #14.
  calendarAvailability: { day: string; enabled: boolean; start: string; end: string }[]
  // Calendar-level time zone — required for 0-host calendars (no host whose
  // tz we could borrow). The schedule above is interpreted in this tz; the
  // booker widget converts to the booker's local tz at display time.
  calendarTimeZone: string

  // Form & Confirmation
  enableGuests: boolean
  selectedFormId: string
  widgetSteps: string[]
  guestInfoMode: 'name_email' | 'count_only'
  sendCustomFormToGuests: boolean
  requireGuestsForBooking: boolean
  confirmationType: 'default' | 'redirect'
  thankYouMessage: string
  redirectUrl: string
  metaPixelId: string
  autoConfirmMeetings: boolean

  // Payments
  enablePayments: boolean
  paymentAmount: number | null
  paymentMode: 'test' | 'live'
  currency: string
  acceptPartialPayment: boolean
  collectPaymentForAllAttendees: boolean
  enableCouponCodes: boolean
  paymentDescription: string

  // Notifications & Policies
  notifications: NotificationConfig[]
  assignContactsToTeamMembers: boolean
  skipAssigningIfAlreadyAssigned: boolean
  allowReschedule: boolean
  rescheduleLinkExpiry: number | null
  rescheduleLinkExpiryUnit: string
  allowCancellation: boolean
  cancellationLinkExpiry: number | null
  cancellationLinkExpiryUnit: string
  allowThirdPartyCalendarInvites: boolean
  meetingInviteNotes: string

  // For migration demo
  _oldType?: string
  _oldTypeLabel?: string
}

export const mockStaff: MockTeamMember[] = [
  {
    userId: 'user-1',
    userName: 'Swadha Bhoj',
    meetingLocation: { type: 'zoom' },
    connectedTools: ['zoom', 'google_meet'],
    priority: 1,
    isPrimary: true,
  },
  {
    userId: 'user-2',
    userName: 'John Doe',
    meetingLocation: { type: 'google_meet' },
    connectedTools: ['google_meet'],
    priority: 2,
  },
  {
    userId: 'user-3',
    userName: 'Sarah Chen',
    meetingLocation: { type: 'zoom' },
    connectedTools: ['zoom', 'ms_teams'],
    priority: 3,
  },
  {
    userId: 'user-4',
    userName: 'Mike Johnson',
    meetingLocation: { type: 'in_person', inPersonType: 'phone', customValue: '+1 (555) 123-4567' },
    connectedTools: [],
    priority: 4,
  },
]

export const allStaffOptions = mockStaff.map(s => ({
  label: s.userName,
  value: s.userId,
}))

export const locationOptions = [
  { label: 'In-Person / Phone / Custom', shortLabel: 'In-Person', value: 'in_person' },
  { label: 'Zoom', shortLabel: 'Zoom', value: 'zoom' },
  { label: 'Google Meet', shortLabel: 'Google Meet', value: 'google_meet' },
  { label: 'Microsoft Teams', shortLabel: 'MS Teams', value: 'ms_teams' },
  { label: 'Ask the Booker', shortLabel: 'Ask Booker', value: 'ask_booker' },
]

export const inPersonSubOptions = [
  { label: 'Phone', value: 'phone' as const, prefill: '{{location.phone}}' },
  { label: 'Full Address', value: 'address' as const, prefill: '{{location.address}}' },
  { label: 'Other / Custom', value: 'custom' as const, prefill: '' },
]

// Templates for the new creation flow
export interface CalendarTemplate {
  id: string
  name: string
  description: string
  icon: string
  config: Partial<UnifiedCalendarConfig>
}

export const calendarTemplates: CalendarTemplate[] = [
  {
    id: 'one-on-one',
    name: '1:1 Meeting',
    description: 'One-on-one meetings with a specific team member. Great for client consultations and private sessions.',
    icon: 'user',
    config: {
      teamMembers: [mockStaff[0]],
      assignmentStrategy: null,
      seatsPerSlot: 1,
      bookingBehavior: 'separate',
      meetingDuration: 30,
      meetingInterval: 30,
    },
  },
  {
    id: 'group-session',
    name: 'Group Session',
    description: 'One host meets with multiple participants. Perfect for webinars, group training, and classes.',
    icon: 'users',
    config: {
      teamMembers: [mockStaff[0]],
      assignmentStrategy: null,
      seatsPerSlot: 10,
      bookingBehavior: 'shared',
      showSeatsToBookers: true,
      meetingDuration: 60,
      meetingInterval: 60,
    },
  },
  {
    id: 'team-rotation',
    name: 'Team Rotation',
    description: 'Distribute appointments across team members in a rotating order. Ideal for sales calls and support.',
    icon: 'refresh',
    config: {
      teamMembers: [mockStaff[0], mockStaff[1], mockStaff[2]],
      assignmentStrategy: 'rotate',
      rotationOptimization: 'availability',
      seatsPerSlot: 1,
      bookingBehavior: 'separate',
      meetingDuration: 30,
      meetingInterval: 30,
    },
  },
  {
    id: 'panel',
    name: 'Panel / Committee',
    description: 'All team members attend together. Perfect for panel interviews, committee reviews, and group consultations.',
    icon: 'people',
    config: {
      teamMembers: [mockStaff[0], mockStaff[1], mockStaff[2]],
      assignmentStrategy: 'collective',
      seatsPerSlot: 1,
      bookingBehavior: 'separate',
      meetingDuration: 45,
      meetingInterval: 60,
    },
  },
  {
    id: 'open-event',
    name: 'Event',
    description: 'No host association. For scheduling registrations, RSVPs, conferences, and public events.',
    icon: 'calendar',
    config: {
      teamMembers: [],
      assignmentStrategy: null,
      seatsPerSlot: 50,
      bookingBehavior: 'shared',
      showSeatsToBookers: true,
      meetingDuration: 120,
      meetingInterval: 120,
    },
  },
  {
    id: 'blank',
    name: 'Blank Calendar',
    description: 'Start from scratch with smart defaults. Configure everything exactly how you want it.',
    icon: 'plus',
    config: {
      teamMembers: [mockStaff[0]],
      assignmentStrategy: null,
      seatsPerSlot: 1,
      bookingBehavior: 'separate',
      meetingDuration: 30,
      meetingInterval: 30,
    },
  },
]

export function createDefaultConfig(): UnifiedCalendarConfig {
  return {
    id: `cal-${Date.now()}`,
    name: '',
    description: '',
    slug: '',
    groupId: '',
    eventColor: '#039855',
    logoUrl: '',
    teamMembers: [mockStaff[0]],
    assignmentStrategy: null,
    rotationOptimization: 'availability',
    enableBookerStaffSelection: false,
    requiredAttendeeIds: [],
    calendarLocation: null,
    locationMode: 'per_host',
    additionalLocationOptions: [],
    reschedulePreference: 'reassign',
    alwaysBookWithAssignedUser: false,
    meetingInterval: 30,
    meetingIntervalUnit: 'mins',
    meetingDuration: 30,
    meetingDurationUnit: 'mins',
    durationOptions: [{ value: 30, unit: 'mins' }],
    seatsPerSlot: 1,
    bookingBehavior: 'separate',
    showSeatsToBookers: false,
    maxBookingsPerDay: null,
    minSchedulingNotice: null,
    minSchedulingNoticeUnit: 'days',
    dateRange: null,
    dateRangeUnit: 'days',
    preBufferTime: null,
    preBufferTimeUnit: 'mins',
    postBufferTime: null,
    postBufferTimeUnit: 'mins',
    lookBusy: 0,
    enableRecurring: false,
    recurringFrequency: 'DAILY',
    recurringCount: 1,
    calendarAvailability: [
      { day: 'Sun', enabled: false, start: '09:00', end: '17:00' },
      { day: 'Mon', enabled: true,  start: '09:00', end: '17:00' },
      { day: 'Tue', enabled: true,  start: '09:00', end: '17:00' },
      { day: 'Wed', enabled: true,  start: '09:00', end: '17:00' },
      { day: 'Thu', enabled: true,  start: '09:00', end: '17:00' },
      { day: 'Fri', enabled: true,  start: '09:00', end: '17:00' },
      { day: 'Sat', enabled: false, start: '09:00', end: '17:00' },
    ],
    calendarTimeZone: 'America/New_York',

    // Form & Confirmation
    enableGuests: false,
    selectedFormId: 'conditional_logic',
    widgetSteps: ['date_time', 'form'],
    guestInfoMode: 'name_email',
    sendCustomFormToGuests: false,
    requireGuestsForBooking: false,
    confirmationType: 'default',
    thankYouMessage: 'Thank you for your appointment request. We will contact you shortly to confirm your request. Please call our office at {{contactMethod}} if you have any questions.',
    redirectUrl: '',
    metaPixelId: '',
    autoConfirmMeetings: false,

    // Payments
    enablePayments: false,
    paymentAmount: null,
    paymentMode: 'test',
    currency: 'USD',
    acceptPartialPayment: false,
    collectPaymentForAllAttendees: false,
    enableCouponCodes: false,
    paymentDescription: '',

    // Notifications & Policies
    notifications: [
      { type: 'booked_unconfirmed', label: 'Appointment booked (Status: Unconfirmed)', channels: { email: true, inApp: true, sms: false, whatsapp: false } },
      { type: 'booked_confirmed', label: 'Appointment booked (Status: Confirmed)', channels: { email: false, inApp: true, sms: true, whatsapp: false } },
      { type: 'cancellation', label: 'Cancellation', channels: { email: false, inApp: false, sms: false, whatsapp: false } },
      { type: 'reschedule', label: 'Reschedule', channels: { email: false, inApp: false, sms: true, whatsapp: false } },
      { type: 'reminder', label: 'Reminder', channels: { email: false, inApp: false, sms: false, whatsapp: false } },
      { type: 'follow_up', label: 'Follow-Up', channels: { email: false, inApp: false, sms: false, whatsapp: false } },
    ],
    assignContactsToTeamMembers: true,
    skipAssigningIfAlreadyAssigned: true,
    allowReschedule: true,
    rescheduleLinkExpiry: null,
    rescheduleLinkExpiryUnit: 'Minutes',
    allowCancellation: true,
    cancellationLinkExpiry: null,
    cancellationLinkExpiryUnit: 'Minutes',
    allowThirdPartyCalendarInvites: true,
    meetingInviteNotes: 'Phone:- {{contact.phone}}\nEmail:- {{contact.email}}',
  }
}

// Mock existing calendars for migration demo
export const existingCalendars: UnifiedCalendarConfig[] = [
  {
    ...createDefaultConfig(),
    id: 'existing-personal',
    name: 'Strategy Consultation',
    description: 'One-on-one strategy sessions',
    slug: 'strategy-consultation',
    teamMembers: [mockStaff[0]],
    assignmentStrategy: null,
    seatsPerSlot: 1,
    meetingDuration: 45,
    meetingInterval: 60,
    enablePayments: true,
    paymentAmount: 100,
    _oldType: 'personal',
    _oldTypeLabel: 'Personal Booking',
  },
  {
    ...createDefaultConfig(),
    id: 'existing-roundrobin',
    name: 'Sales Discovery Call',
    description: 'Quick 30-min discovery call with our sales team',
    slug: 'sales-discovery',
    teamMembers: [mockStaff[0], mockStaff[1], mockStaff[2]],
    assignmentStrategy: 'rotate',
    rotationOptimization: 'equal_distribution',
    enableBookerStaffSelection: true,
    seatsPerSlot: 1,
    meetingDuration: 30,
    meetingInterval: 30,
    _oldType: 'round_robin',
    _oldTypeLabel: 'Round Robin',
  },
  {
    ...createDefaultConfig(),
    id: 'existing-class',
    name: 'Yoga Morning Flow',
    description: 'Start your day with a 60-minute yoga session',
    slug: 'yoga-morning',
    teamMembers: [mockStaff[0]],
    assignmentStrategy: null,
    seatsPerSlot: 15,
    bookingBehavior: 'shared',
    showSeatsToBookers: true,
    meetingDuration: 60,
    meetingInterval: 60,
    enablePayments: true,
    paymentAmount: 25,
    _oldType: 'class_booking',
    _oldTypeLabel: 'Class Booking',
  },
  {
    ...createDefaultConfig(),
    id: 'existing-collective',
    name: 'Technical Panel Interview',
    description: 'Panel interview with the engineering team',
    slug: 'tech-panel',
    teamMembers: [mockStaff[0], mockStaff[1], mockStaff[2], mockStaff[3]],
    assignmentStrategy: 'collective',
    seatsPerSlot: 1,
    meetingDuration: 60,
    meetingInterval: 90,
    _oldType: 'collective',
    _oldTypeLabel: 'Collective Booking',
  },
  {
    ...createDefaultConfig(),
    id: 'existing-event',
    name: 'Product Launch Webinar',
    description: 'Join us for the Q2 product launch',
    slug: 'product-launch',
    teamMembers: [],
    assignmentStrategy: null,
    seatsPerSlot: 200,
    bookingBehavior: 'shared',
    showSeatsToBookers: true,
    meetingDuration: 90,
    meetingInterval: 90,
    _oldType: 'event',
    _oldTypeLabel: 'Event Calendar',
  },
  {
    ...createDefaultConfig(),
    id: 'existing-service',
    name: 'Spa & Wellness Package',
    description: 'Full spa treatment booking',
    slug: 'spa-wellness',
    teamMembers: [mockStaff[0], mockStaff[1]],
    assignmentStrategy: 'rotate',
    rotationOptimization: 'availability',
    seatsPerSlot: 1,
    meetingDuration: 90,
    meetingInterval: 120,
    enablePayments: true,
    paymentAmount: 150,
    _oldType: 'service_booking',
    _oldTypeLabel: 'Service Booking (v1)',
  },
]

// Mock time slots for widget preview
export const mockTimeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '1:00 PM', '1:30 PM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM',
]

export const mockSlotSeats: Record<string, number> = {
  '9:00 AM': 12, '9:30 AM': 8, '10:00 AM': 15,
  '10:30 AM': 3, '11:00 AM': 10, '11:30 AM': 6,
  '1:00 PM': 14, '1:30 PM': 9, '2:00 PM': 2,
  '2:30 PM': 11, '3:00 PM': 7, '3:30 PM': 13,
  '4:00 PM': 5, '4:30 PM': 1,
}
