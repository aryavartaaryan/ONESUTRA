export interface Person {
  name: string;
  category: string;
  location: string;
  contact: string;
}

export interface Institution {
  name: string;
  category: string;
  location: string;
  contact: string;
}

export const GURUS: Person[] = [
  { name: 'Swami Ramdev', category: 'Yoga', location: 'Haridwar', contact: 'Patanjali Yogpeeth' },
  { name: 'Swami Dayananda Saraswati', category: 'Arya Samaj', location: 'Gujarat', contact: 'Founder of Arya Samaj' },
  { name: 'Acharya Balkrishna', category: 'Ayurveda', location: 'Haridwar', contact: 'Patanjali Ayurved' }
];

export const GURUKULS: Institution[] = [
  { name: 'Gurukul Kangri Vishwavidyalaya', category: 'University', location: 'Haridwar', contact: 'Vedic & Modern Studies' },
  { name: 'Darshan Yoga Mahavidyalaya', category: 'Yoga Ashrama', location: 'Gujarat', contact: 'Traditional Yoga Studies' },
  { name: 'Arya Kanya Gurukul', category: 'Women Education', location: 'Porbandar', contact: 'Vedic Female Education' }
];
