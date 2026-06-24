import { EventMemory, SponsorMemory } from './types';

export const INITIAL_EVENTS: EventMemory[] = [
  {
    id: "e-1",
    name: "TechFest 2025",
    year: 2025,
    budget: 50000,
    outcome: "Attracted 500+ participants. Tech keynotes and project showcases went flawlessly, but catering queues were long.",
    lessons: "Start sponsor outreach 3 months earlier. Double the catering budget and implement staggered lunch tokens."
  },
  {
    id: "e-2",
    name: "HackDay 2024",
    year: 2024,
    budget: 30000,
    outcome: "An intense 24-hour hackathon with 120 coders and 25 finished project submissions. Highly energetic.",
    lessons: "Increase volunteer count by 30% for overnight shifts. Provide quiet resting areas for participants."
  },
  {
    id: "e-3",
    name: "CodeSprint 2023",
    year: 2023,
    budget: 18000,
    outcome: "Competitive programming contest with 200 online registrants. High engagement on leaderboards.",
    lessons: "Set up backup servers and test the automated test-case runner extensively 48 hours prior."
  },
  {
    id: "e-4",
    name: "AI Workshop Series 2025",
    year: 2025,
    budget: 12000,
    outcome: "Hands-on API integrations. Over 150 students built simple LLM applets successfully.",
    lessons: "Request students to pre-install runtime dependencies via email to avoid local Wi-Fi bottlenecking."
  }
];

export const INITIAL_SPONSORS: SponsorMemory[] = [
  {
    id: "s-1",
    name: "Google Developer Groups",
    amount: 25000,
    notes: "Provided cash funding and custom tech swag (stickers, t-shirts) for TechFest 2025."
  },
  {
    id: "s-2",
    name: "Local Biotech Incubator",
    amount: 15000,
    notes: "Sponsored HackDay 2024. Interested in healthcare and logistics project themes."
  },
  {
    id: "s-3",
    name: "Coding Ninjas India",
    amount: 10000,
    notes: "Provided free learning vouchers, free course access licenses, and sponsored prizes for CodeSprint 2023."
  },
  {
    id: "s-4",
    name: "Stripe Developer Platform",
    amount: 20000,
    notes: "Sponsored general annual developer club activities in 2025. Responsive to tech-focused hackathons."
  },
  {
    id: "s-5",
    name: "Local Gourmet Cafe",
    amount: 8000,
    notes: "Supplied free high-grade coffee flasks and discounted donuts for HackDay overnight volunteer crew."
  }
];

export function getStoredMemories() {
  const eventsKey = 'chronicle_events';
  const sponsorsKey = 'chronicle_sponsors';
  
  let events = localStorage.getItem(eventsKey);
  let sponsors = localStorage.getItem(sponsorsKey);
  
  if (!events) {
    localStorage.setItem(eventsKey, JSON.stringify(INITIAL_EVENTS));
    events = JSON.stringify(INITIAL_EVENTS);
  }
  
  if (!sponsors) {
    localStorage.setItem(sponsorsKey, JSON.stringify(INITIAL_SPONSORS));
    sponsors = JSON.stringify(INITIAL_SPONSORS);
  }
  
  return {
    events: JSON.parse(events) as EventMemory[],
    sponsors: JSON.parse(sponsors) as SponsorMemory[]
  };
}

export function saveStoredMemories(data: { events?: EventMemory[]; sponsors?: SponsorMemory[] }) {
  if (data.events) {
    localStorage.setItem('chronicle_events', JSON.stringify(data.events));
  }
  if (data.sponsors) {
    localStorage.setItem('chronicle_sponsors', JSON.stringify(data.sponsors));
  }
}
