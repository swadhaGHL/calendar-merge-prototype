export interface Service {
  id: string
  name: string
  category: string
  duration: string
  price: string
  staff: { name: string; initials: string; color: string }[]
}

export interface Listing {
  id: string
  name: string
  category: string
  initials: string
  color: string
  status: 'active' | 'inactive'
  basePrice: string
  stock: number
}

export const serviceCategories = [
  { name: 'Rentals', count: 3 },
  { name: 'Men', count: 2 },
  { name: 'Women', count: 2 },
  { name: 'Mani - Pedi', count: 2 },
  { name: 'Hair Services', count: 5 },
  { name: 'Latest Cat', count: 0 },
]

export const mockServices: Service[] = [
  { id: 's1', name: 'Upstair Event Space', category: 'Rentals', duration: '1 hr', price: '€120.00', staff: [{ name: 'Hannah Smith', initials: 'H', color: 'bg-green-500' }, { name: '+3', initials: '+3', color: 'bg-gray-400' }] },
  { id: 's2', name: 'Downstair Event Space', category: 'Rentals', duration: '5 hrs', price: '€0.00', staff: [] },
  { id: 's3', name: 'Whole Facility', category: 'Rentals', duration: '5 hrs', price: '€0.00', staff: [{ name: 'Jane Doe', initials: 'J', color: 'bg-yellow-500' }] },
  { id: 's4', name: 'Haircut for Men (H&B)', category: 'Men', duration: '45 mins - 12 hrs', price: '€59.00 - €450.00', staff: [{ name: 'Abhishek C.', initials: 'A', color: 'bg-green-500' }, { name: '+2', initials: '+2', color: 'bg-gray-400' }] },
  { id: 's5', name: 'Hair Spa for Men (H&B)', category: 'Men', duration: '30 mins', price: '€49.00', staff: [{ name: 'Baker', initials: 'B', color: 'bg-purple-500' }] },
  { id: 's6', name: 'Hair Spa for Women (H&B)', category: 'Women', duration: '30 mins - 1 hr', price: '€0.00 - €200.00', staff: [{ name: 'Hannah Smith', initials: 'H', color: 'bg-green-500' }] },
  { id: 's7', name: 'Haircut for Women (H&B)', category: 'Women', duration: '1 hr', price: '€0.00', staff: [{ name: 'Hannah Smith', initials: 'H', color: 'bg-green-500' }, { name: 'Jane Doe', initials: 'J', color: 'bg-yellow-500' }] },
  { id: 's8', name: 'Gel Overlays (H&B)', category: 'Mani - Pedi', duration: '30 mins', price: '€79.00', staff: [] },
]

export const rentalCategories = [
  { name: 'Villas', count: 5 },
  { name: 'Gears', count: 2 },
  { name: 'Cars', count: 2 },
]

export const mockListings: Listing[] = [
  { id: 'l1', name: 'Fixed Duration', category: 'Villas', initials: 'FD', color: 'bg-purple-400', status: 'active', basePrice: '$15.00/day', stock: 1 },
  { id: 'l2', name: 'The Whispering Grove Villa', category: 'Villas', initials: 'WG', color: 'bg-purple-500', status: 'active', basePrice: '$200.00/month', stock: 5 },
  { id: 'l3', name: 'Pro Scuba Diving Set11', category: 'Gears', initials: 'PS', color: 'bg-purple-600', status: 'active', basePrice: '$100.00/hour', stock: 1 },
  { id: 'l4', name: 'Snorkel Explorer Kit', category: 'Gears', initials: 'SE', color: 'bg-purple-300', status: 'active', basePrice: '$25.00/hour', stock: 25 },
  { id: 'l5', name: 'Hillux', category: 'Cars', initials: 'H', color: 'bg-purple-700', status: 'active', basePrice: '$50.00/hour', stock: 1 },
  { id: 'l6', name: 'Tesla Model Y', category: 'Cars', initials: 'TM', color: 'bg-purple-500', status: 'active', basePrice: '$155.00/hour', stock: 10 },
  { id: 'l7', name: 'Jeep Wrangler Convertible', category: 'Cars', initials: 'JW', color: 'bg-purple-400', status: 'active', basePrice: '$120.00/day', stock: 1 },
]
