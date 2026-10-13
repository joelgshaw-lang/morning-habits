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
