// Default family setup. Saved to IndexedDB on first run; grown-ups change it in the Grown-ups portal.

const baseHabits = (chore) => [
  { id: 'bed', name: 'Make bed', icon: '🛏️' },
  { id: 'pray', name: 'Pray', icon: '🙏', type: 'timer' },
  { id: 'bible', name: 'Bible', icon: '📖' },
  { id: 'music', name: 'Music', icon: '🎹' },
  chore,
];

// The night has two parts: after-dinner house jobs (allocated per child, timed by "Start night chores"),
// then this bedtime list. Toilet, teeth and in bed by bedtime earn the bedtime bonus.
const nightHabits = () => [
  { id: 'room', name: 'Tidy my room', icon: '🧺' },
  { id: 'bag', name: 'Pack my bag', icon: '🎒' },
  { id: 'shower', name: 'Bath or shower', icon: '🛁' },
  { id: 'pjs', name: 'Pyjamas on', icon: '👕' },
  { id: 'teeth', name: 'Brush teeth', icon: '🪥' },
  { id: 'toilet', name: 'Go to the toilet', icon: '🚽' },
  { id: 'inbed', name: 'In bed', icon: '🛌' },
];

// Bump version when adding fields; app.js fills missing fields into saved settings.
export const DEFAULT_SETTINGS = {
  version: 9,
  windowOpen: '06:30',
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

// Breath prayers: a child holds 🙏 on the board to log one. 10 of them = 1 mine swing.
export const BREATHS_PER_SWING = 10;
export const BREATHS_PER_DAY = 20;
