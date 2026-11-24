// The grown-up PIN (6 digits) for the portal, reminders and confirming jobs.
export const GROWN_PIN = '040910';
// After the PIN, grown-up screens stay open this long, then ask for the PIN again.
export const GROWN_MINUTES = 3;

// Default family setup. Saved to IndexedDB on first run; grown-ups change it in the Grown-ups portal.

const baseHabits = (chore) => [
  { id: 'bed', name: 'Make bed', icon: '🛏️' },
  { id: 'pray', name: 'Pray', icon: '🙏', type: 'timer' },
  { id: 'bible', name: 'Bible', icon: '📖' },
  // Timed practice (18 Nov 2026): tap to start the iPad timer; the job ticks itself at 7 minutes.
  // Keyboard keeps counting: +1 coin a minute from 8 to 15 minutes (bonusTo), morning session only.
  // 24 Nov 2026 (Joel): Singing is now "Singing lesson"; Keyboard is longer (10 minutes, bonus coins up to 20).
  { id: 'singing', name: 'Singing lesson', icon: '🎤', type: 'practice', minutes: 7 },
  { id: 'keyboard', name: 'Keyboard', icon: '🎹', type: 'practice', minutes: 10, bonusTo: 20 },
  chore,
];

// Night = the after-dinner house jobs only (allocated per child in the portal, timed by "Start night chores").
// Bath, pyjamas, teeth, toilet and bed happen upstairs, after the child taps "🌙 Going up!" on the iPad.
// Next morning a grown-up says how bedtime went ("Last night 🛏️"), which pays the bedtime bonus.
const nightHabits = () => [];

// Bump version when adding fields; app.js fills missing fields into saved settings.
export const DEFAULT_SETTINGS = {
  version: 13,
  windowOpen: '06:30',
  startBy: '07:15', // start the morning by this time, or that morning's job coins are lost (job stars still count)
  windowClose: '07:30',
  nightOpen: '18:00',
  nightClose: '20:00', // bedtime for everyone
  dayStartHour: 3, // a new day starts at 3:00am
  // After-dinner house jobs. A grown-up allocates them to children in the Grown-ups portal (nightAlloc).
  houseJobs: [
    { id: 'h-table', name: 'Clean the table', icon: '🧽', coins: 2 },
    { id: 'h-dishes', name: 'Do the dishes', icon: '🫧', coins: 3 },
    { id: 'h-counters', name: 'Wipe the counters', icon: '🧼', coins: 2 },
    { id: 'h-kitchen', name: 'Kitchen floor', icon: '🧹', coins: 3 },
    { id: 'h-dining', name: 'Dining room floor', icon: '🧹', coins: 3 },
    { id: 'h-sunroom', name: 'Sunroom floor', icon: '🧹', coins: 3 },
    { id: 'h-rumpus', name: 'Rumpus room floor', icon: '🧹', coins: 3 },
    { id: 'h-trash', name: 'Take out the trash', icon: '🗑️', coins: 2 },
  ],
  nightAlloc: {
    eliana: ['h-dishes', 'h-counters', 'h-kitchen'],
    annabelle: ['h-dining', 'h-sunroom', 'h-trash'],
    judah: ['h-table', 'h-rumpus'],
  },
  // Extra chores any child can do any time of day, once each per day. coins = price, by effort.
  // A child claims one; a grown-up confirms it with the PIN. Grown-ups can add their own in the portal.
  extraChores: [
    { id: 'floor', name: 'Clean the floor', icon: '🧹', coins: 4 },
    { id: 'trash', name: 'Take out the trash', icon: '🗑️', coins: 3 },
    { id: 'table', name: 'Wipe the table', icon: '🧽', coins: 2 },
    { id: 'washing', name: 'Fold washing', icon: '👚', coins: 3 },
    { id: 'plants', name: 'Water the plants', icon: '🪴', coins: 2 },
    { id: 'cook', name: 'Help with dinner', icon: '🍳', coins: 4 },
    { id: 'toys', name: 'Pack away toys', icon: '🧸', coins: 2 },
    { id: 'dishes', name: 'Do the dishes', icon: '🫧', coins: 4 },
    { id: 'settable', name: 'Set the table', icon: '🍴', coins: 2 },
    { id: 'clothes', name: 'Put clothes away', icon: '🧦', coins: 2 },
    { id: 'shoes', name: 'Line up the shoes', icon: '👟', coins: 1 },
    { id: 'shopping', name: 'Unpack the shopping', icon: '🛍️', coins: 3 },
    { id: 'sink', name: 'Wipe the bathroom sink', icon: '🧼', coins: 3 },
    { id: 'yard', name: 'Help in the yard', icon: '🍂', coins: 5 },
    { id: 'sibling', name: 'Help a brother or sister', icon: '🤗', coins: 3 },
    { id: 'vacuum', name: 'Vacuum', icon: '🌀', coins: 5 },
    { id: 'bathfloor', name: 'Pick up clothes and towels from the bathroom floor', icon: '🩳', coins: 2 },
    // Several "another helpful job" tiles, so kids can log a few jobs that aren't on the list.
    { id: 'other2', name: 'Another helpful job', icon: '💪', coins: 2 },
    { id: 'other3', name: 'Another helpful job', icon: '🌟', coins: 2 },
    { id: 'other4', name: 'Another helpful job', icon: '👐', coins: 2 },
    { id: 'other', name: 'Another helpful job', icon: '🙌', coins: 2 },
  ],
  kids: [
    {
      id: 'eliana', name: 'Eliana', age: 12, avatar: '🦋', color: '#7c3aed', prayerMinutes: 10,
      habits: baseHabits({ id: 'trash', name: 'Take out trash', icon: '🗑️' }),
      nightHabits: nightHabits(),
    },
    {
      id: 'annabelle', name: 'Annabelle', age: 8, avatar: '🌸', color: '#db2777', prayerMinutes: 5,
      habits: baseHabits({ id: 'dishwasher', name: 'Dishwasher', icon: '🍽️' }),
      nightHabits: nightHabits(),
    },
    {
      id: 'judah', name: 'Judah', age: 6, avatar: '🚀', color: '#2563eb', prayerMinutes: 3,
      habits: baseHabits({ id: 'utensils', name: 'Utensils', icon: '🥄' }),
      nightHabits: nightHabits(),
    },
  ],
};

// Breath prayers: a child holds 🙏 on the board for one guided breath (about 5 seconds).
// Up to 3 a day. They are time with God, so they give no coins.
export const BREATHS_PER_DAY = 3;
export const BREATH_MS = 5000;
