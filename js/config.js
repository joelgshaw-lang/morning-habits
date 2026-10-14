// Default family setup. Saved to IndexedDB on first run; editable later in parent settings (Stage 3).

const baseHabits = (chore) => [
  { id: 'bed', name: 'Make bed', icon: '🛏️' },
  { id: 'pray', name: 'Pray', icon: '🙏', type: 'timer' },
  { id: 'bible', name: 'Bible', icon: '📖' },
  { id: 'music', name: 'Music', icon: '🎹' },
  chore,
];

// Bump version when adding fields; app.js fills missing fields into saved settings.
export const DEFAULT_SETTINGS = {
  version: 2,
  windowOpen: '06:30',
  windowClose: '07:30',
  dayStartHour: 3, // a new day starts at 3:00am
  kids: [
    {
      id: 'eliana', name: 'Eliana', age: 12, avatar: '🦋', color: '#7c3aed', prayerMinutes: 10,
      habits: baseHabits({ id: 'trash', name: 'Take out trash', icon: '🗑️' }),
    },
    {
      id: 'annabelle', name: 'Annabelle', age: 8, avatar: '🌸', color: '#db2777', prayerMinutes: 5,
      habits: baseHabits({ id: 'dishwasher', name: 'Dishwasher', icon: '🍽️' }),
    },
    {
      id: 'judah', name: 'Judah', age: 6, avatar: '🚀', color: '#2563eb', prayerMinutes: 3,
      habits: baseHabits({ id: 'utensils', name: 'Utensils', icon: '🥄' }),
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
