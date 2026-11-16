// The one list of the 9 fruits of the Spirit (Galatians 5:22–23) for the whole app.
// Each fruit has: its name, a kid word, one hand action, a verse, a small thing to practise,
// and the words for its ✓ "this is" and ✗ "this is not" pictures (pictures are in fruit-art.js).
// The order here is the order children meet them: 3 a day, Love first.
//
// Hand actions are the current ones. Joel still has to choose for Peace, Gentleness and Goodness
// (see docs/review-round3.md, "For Joel to decide" 13). Change them here and the whole app follows.

import { FRIENDS, YES_PICS, NOT_PICS } from './fruit-art.js';

export const FRUITS = [
  { id: 'love', name: 'Love', word: 'Caring', hand: 'Hug yourself',
    verse: '“We love because God loved us first.” 1 John 4:19',
    practice: 'Be a secret helper: do one kind job nobody asked for.',
    yes: 'Giving a hug to someone who is sad', no: 'Turning away from someone who is sad' },
  { id: 'joy', name: 'Joy', word: 'Glad heart', hand: 'Big smile, hands up high',
    verse: '“The joy of the Lord makes you strong.” Nehemiah 8:10',
    practice: 'Say three thank-yous to God at breakfast.',
    yes: 'Smiling even when the rain changes our plans', no: 'Stomping and grumpy when the rain changes our plans' },
  { id: 'peace', name: 'Peace', word: 'Peacemaker', hand: 'Hand on your heart',
    verse: '“Happy are those who make peace.” Matthew 5:9',
    practice: 'Three slow breaths before you answer.',
    yes: 'Letting someone else have the toy', no: 'Fighting over the toy' },
  { id: 'patience', name: 'Patience', word: 'Waiting well', hand: 'Hand on a shoulder, count to 10',
    verse: '“Love is patient. Love is kind.” 1 Corinthians 13:4',
    practice: 'When you have to wait, count to 10 slowly.',
    yes: 'Waiting quietly while a grown-up is on the phone', no: 'Interrupting a grown-up on the phone' },
  { id: 'kindness', name: 'Kindness', word: 'Helping hands', hand: 'Open hands',
    verse: '“Be kind and loving to each other.” Ephesians 4:32',
    practice: 'Say one kind word to each person at breakfast.',
    yes: 'Sharing my snack', no: 'Keeping all the snack to myself' },
  { id: 'goodness', name: 'Goodness', word: 'Doing good', hand: 'Thumbs up',
    verse: '“Let us do good to all people.” Galatians 6:10',
    practice: 'Do one good thing today that nobody asked you to do.',
    yes: 'Giving back what isn’t mine', no: 'Keeping something that isn’t mine' },
  { id: 'faithfulness', name: 'Faithfulness', word: 'Promise keeper', hand: 'Pinky promise',
    verse: '“God’s love is new every morning.” Lamentations 3:22–23',
    practice: 'Make one small promise today, and keep it.',
    yes: 'Making my bed without being asked', no: 'Staying in bed and leaving my jobs' },
  { id: 'gentleness', name: 'Gentleness', word: 'Soft hands, soft voice', hand: 'Stroke your arm softly',
    verse: '“A gentle answer turns anger away.” Proverbs 15:1',
    practice: 'Whisper challenge: use a soft voice all morning.',
    yes: 'Soft hands with a little pet', no: 'Grabbing the pet too roughly' },
  { id: 'selfcontrol', name: 'Self-control', word: 'Stop and choose', hand: 'Stop hand, palm out',
    verse: '“God gave us a spirit of power, love and self-control.” 2 Timothy 1:7',
    practice: 'Stop, breathe, choose. iPad face down when time is up.',
    yes: 'Putting the iPad down when time is up', no: 'Not giving the iPad back when time is up' },
];

// Add each fruit's Fruit Friend (name like "Pina the pineapple", and its drawing) and pictures.
for (const f of FRUITS) {
  f.friend = FRIENDS[f.id].name;
  f.blurb = FRIENDS[f.id].blurb;
  f.art = FRIENDS[f.id].svg;
  f.yesPic = YES_PICS[f.id];
  f.noPic = NOT_PICS[f.id];
  f.lower = f.name.toLowerCase(); // "patience", for the middle of a sentence
}

export const fruitById = (id) => FRUITS.find((f) => f.id === id);
