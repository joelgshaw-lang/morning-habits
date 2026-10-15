// Default family setup. Saved to IndexedDB on first run; editable later in parent settings (Stage 3).

const baseHabits = (chore) => [
  { id: 'bed', name: 'Make bed', icon: '🛏️' },
  { id: 'pray', name: 'Pray', icon: '🙏', type: 'timer' },
  { id: 'bible', name: 'Bible', icon: '📖' },
  { id: 'music', name: 'Music', icon: '🎹' },
  chore,
];

// Night routine: the same for everyone to start with; editable in parent settings (Stage 3).
const nightHabits = () => [
  { id: 'shower', name: 'Shower or bath', icon: '🛁' },
  { id: 'pjs', name: 'Pyjamas on', icon: '👕' },
  { id: 'teeth', name: 'Brush teeth', icon: '🪥' },
  { id: 'room', name: 'Tidy my room', icon: '🧺' },
  { id: 'bag', name: 'Pack my bag', icon: '🎒' },
  // Toilet, teeth and in bed by bedtime earn the bedtime bonus.
  { id: 'toilet', name: 'Go to the toilet', icon: '🚽' },
  { id: 'inbed', name: 'In bed', icon: '🛌' },
];

// Bump version when adding fields; app.js fills missing fields into saved settings.
export const DEFAULT_SETTINGS = {
  version: 6,
  windowOpen: '06:30',
  windowClose: '07:30',
  nightOpen: '18:00',
  nightClose: '20:00', // bedtime for everyone
  dayStartHour: 3, // a new day starts at 3:00am
  // Extra chores any child can do any time of day, once each per day.
  extraChores: [
    { id: 'floor', name: 'Clean the floor', icon: '🧹' },
    { id: 'trash', name: 'Take out the trash', icon: '🗑️' },
    { id: 'table', name: 'Wipe the table', icon: '🧽' },
    { id: 'washing', name: 'Fold washing', icon: '👚' },
    { id: 'plants', name: 'Water the plants', icon: '🪴' },
    { id: 'cook', name: 'Help with dinner', icon: '🍳' },
    { id: 'toys', name: 'Pack away toys', icon: '🧸' },
    { id: 'dishes', name: 'Do the dishes', icon: '🫧' },
    { id: 'settable', name: 'Set the table', icon: '🍴' },
    { id: 'clothes', name: 'Put clothes away', icon: '🧦' },
    { id: 'shoes', name: 'Line up the shoes', icon: '👟' },
    { id: 'shopping', name: 'Unpack the shopping', icon: '🛍️' },
    { id: 'sink', name: 'Wipe the bathroom sink', icon: '🧼' },
    { id: 'yard', name: 'Help in the yard', icon: '🍂' },
    { id: 'sibling', name: 'Help a brother or sister', icon: '🤗' },
    { id: 'vacuum', name: 'Vacuum', icon: '🌀' },
    // Several "another helpful job" tiles, so kids can log a few jobs that aren't on the list.
    { id: 'other2', name: 'Another helpful job', icon: '💪' },
    { id: 'other3', name: 'Another helpful job', icon: '🌟' },
    { id: 'other4', name: 'Another helpful job', icon: '👐' },
    { id: 'other', name: 'Another helpful job', icon: '🙌' },
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

// ---------- Fruit Tree ----------
// Galatians 5:22-23. Kid-sized meanings are read aloud when a fruit is tapped.
export const FRUITS = {
  love: { name: 'Love', icon: '🍓', meaning: 'putting others first' },
  joy: { name: 'Joy', icon: '🍊', meaning: 'a happy heart, even on hard days' },
  peace: { name: 'Peace', icon: '🫒', meaning: 'making things right' },
  patience: { name: 'Patience', icon: '🍇', meaning: 'waiting with a calm heart' },
  kindness: { name: 'Kindness', icon: '🍒', meaning: 'doing something nice for someone' },
  goodness: { name: 'Goodness', icon: '🍎', meaning: "doing right, even when it's hard" },
  faithfulness: { name: 'Faithfulness', icon: '🍐', meaning: 'keeping my promises' },
  gentleness: { name: 'Gentleness', icon: '🍑', meaning: 'soft hands, soft words' },
  selfControl: { name: 'Self-control', icon: '🥥', meaning: 'my body listens to me, not my mad feelings' },
};

// Moment cards suggest a fruit; at Harvest the family can talk about which fruit it really was.
export const CARDS = [
  { id: 'calm', icon: '😤➡️😌', label: 'I stayed calm when I was cross', fruit: 'selfControl' },
  { id: 'waited', icon: '⏳', label: 'I waited my turn', fruit: 'patience' },
  { id: 'helped', icon: '🤝', label: 'I helped without being asked', fruit: 'kindness' },
  { id: 'shared', icon: '🎁', label: 'I shared', fruit: 'love' },
  { id: 'truth', icon: '🙋', label: 'I told the truth', fruit: 'goodness' },
  { id: 'sorry', icon: '🫂', label: 'I said sorry first', fruit: 'peace' },
];

export const FRUIT_PER_DAY = 5; // soft cap per child, so Judah can't plant the whole orchard

// Stop & Pray: Scripture breath prayers by feeling (breathe in / breathe out).
export const BREATH = {
  angry: { face: '😠', label: 'Angry', in: 'Set a guard, Lord…', out: '…over my mouth', ref: 'Psalm 141:3' },
  worried: { face: '😟', label: 'Worried', in: 'When I am afraid…', out: '…I will trust in you', ref: 'Psalm 56:3' },
  sad: { face: '😢', label: 'Sad', in: 'The Lord is close…', out: '…to the broken-hearted', ref: 'Psalm 34:18' },
  hurt: { face: '🤕', label: 'Hurt', in: 'God is my refuge…', out: '…and my strength', ref: 'Psalm 46:1' },
};
