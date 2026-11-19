/* Build on the Rock: every word the game says (1 Cor 3:10-15). Words only. No rules, no DOM.
   Browser: <script src="content.js"> sets globalThis.RockContent.  Node: require('./content.js').

   PLACEHOLDERS (swap with RockContent.fill(text, { name: '...', sibling: '...' })):
     {name} the child   {sibling} a brother or sister   {fruit} a fruit name in lower case
     {hard} a hard-moment "when" phrase   {plan} a response "will" phrase
     {did} an own-up card's "did" phrase   {feeling} a feeling label in lower case
     {moment} the parent's one-sentence growth note
   No real names live in this file. Ages are the keys '6', '8', '12'.

   SHAPE
     version        string
     fill(text, vars) -> string
     pieceCodes     { G, S, W, P, and the nine gem codes } -> plain name
     fruitOrder     ['r','o','b','t','e','y','v','k','p']
     fruits[code]   { code, fruit, gem, kidLine, thisIs, thisIsNot, acts[4], praise[3], verse, verseLine,
                      older, morningPrayer }
                    acts[i] = { id, label, area }  area: 'sibling' | 'schoolwork' | 'chores' | 'speech'
     gold, silver   { name, meaning, acts[], lines[], older }
     peaceTogether  { label, line }          two children settle a quarrel without a grown-up
     morningPlan    { intro, hardMoments[], responses[], ifThen{6,8,12}, pray{6,8,12}, done[] }
                    hardMoments[i] = { id, icon, label, when, fruit }   responses[i] = { id, icon, label, will }
     stopAndPray    { open, feelings[], breath{steps[],prayers[]}, after[], offer }
     straw          { meaning, kinds{wood,hay,stubble}, ownUpCards[] ({id,kind,icon,label,did,sibling}), parentLine, parentLines[],
                      neverSay[], ownedUpFirst[], forgivenStillBurns }
     sorry          { prayers{6[],8[],12[]}, forgiveness, forgivenessLines[], makeItRight{wood,hay,stubble},
                      afterMakeRight[] }
     fireWords      { before, lastLook, small, wallFalls, caveIn, stoodFirm, sealed, parentRule }
     nightAccount   { catchUp{minutes, steps[]}, strawQuestion{6,8,12}, noStraw{8,12}, goodnight[] }
     familyTalk     [ { week, theme, verse, questions[] } ] x 12
     seasons        { blueprints[12], stickers[] }
                    blueprints[i] = { month (1-12), name, line, verse, verseLine, fruit }
     milestones     [ { id, when, title, line } ]     surprises, never shown ahead of time
     parentTips     [ string ] (15 at most)
     growthCheck    { intro, when, lookBack, scale[], items[], noteprompt, parentView{}, childView{},
                      gamingSignals[], fadeRules[], raiseTheBar[] }
     fairness       { familySees[], privateOnly[], lines{} }

   ADDED IN THE MERGE (built from the lists above, same ids and fruit codes)
     fruits[code].praiseFor  { actId: praise line }      praiseForAct('t1') -> line
     hardMoments    morningPlan.hardMoments items + { iconIdea, fruits[], iWill[3] }
                    iWill[i] = { id, type: 'pray'|'say'|'do', label, will }   iWill[0] is always the breath prayer
     strawCards     straw.ownUpCards items + { kidWords, growsInstead (fruit code),
                    makeItRight{ kind: 'person'|'task', label, words }, sorryPrayer }
     breathPrayers  [ { id, feeling, fruit, lines[3], 0, 1, 2 } ]   first 8 match stopAndPray.feelings by index and id
     gospel         { verse, verseLine{6,8,12}, actCard{ id, icon, iconIdea, label, kidWords{6,8,12},
                      examples{6[3],8[3],12[3]}, ask, askNote, limit }, lamp{ name, meaning, verse, line },
                      seedPlanted{6,8,12}, seedOnly{6,8,12}, seedAnyResponse{ listened, notInterested, laughed, unsure },
                      watering{ line, prompt }, newBuilder{6,8,12}, newBuilderThanks, prayed{6,8,12},
                      prayerForThem{6,8,12}, prayerForNewBuilder{6,8,12}  (use {friend}),
                      rules[5], parentTips[3] ({ id, when, tip }), familyTalk{ theme, verse, questions[3] } }
     parentCoach    [ { id, when, tip } ]   all of parentTips, then long-haul tips, then gospel.parentTips
     weeklyCheck    { intro, when, lookBack, perChild, scale[4] ({ value, label }),
                      items[7] ({ id, better: 'lower'|'higher', fruit, ask }), parentItem{ id, better, ask },
                      trend{ average, min, max, working, peaceful }, howToRead[8], neverShow }
     fadePlan       [ { month: 1|3|6|12, name, changes[] } ]
     blueprints     seasons.blueprints items + { id, beauty, size: 'small'|'medium'|'large', freeBuild, challenge }
     fireWordsOlder { before, small, wallFalls, caveIn, stoodFirm, sealed } each { '8', '12' }  (age 6 uses fireWords)
     identityMilestones [ { id, title, fruit, counts, needs, line } ]
     helpers        ageBand(age) -> '6'|'8'|'12', forAge(thing, age), byId(list, id), pick(list, n)

   ROUND 3
     hardMoments    + card 'mean'.   straw.ownUpCards / strawCards + card 's5' (job done late).
     morningPlan    + responses item 'kindWord'; + positivePlans[ { id, fruit, icon, label, plan{6,8,12}, pray, nightAsk, praise } ]
     honour         { calmedAndCameBack, sortedItTogether: { fruit, label, gem, line{6,8,12} }, spokeKindly, didNotBlowUp: { fruit, label, line } }
     morningShort   { fruitCode: [hardMomentId x 3] }      hardMomentsFor(code) -> the 3 cards
     nightAccount2  { order[], '6'|'8'|'12': { open, hardMoment{ ask, answers[3]{ id:'used'|'didnt'|'notCome', label, reply,
                      needsConfirm?, next? } }, tomorrow{ ask, reply, nextMorning{ ask, keep, change } },
                      talkedToJesus{ ask, answers[5]{ id, label }, reply{ any, forgot }, note },
                      ownUp{ prompt, yes, no, dealtWith? (12 only), praise, note },
                      confirm{ line, parentAsk, yes, given }, blessing[] } }
     repair         { intro, didIt{ label, line{6,8,12} }, rightAgain{ label, ask, line, thanks }, prayedTogether{ label, line, note },
                      notReadyYet{ label, toChild, toOther, later, note }, taskDone{ label, line }, pearlAfter{6,8,12} }
     throughTheDay  { lunch{ prompt, when, ifRemembered, ifForgot, parentNote },
                      calmPractice{ when, minutes, intro, steps[5]{ say, act }, close, parentNote }, quietWays[5]{ id, label, how } }
     fairness       + mortar{ name, extraStraw: 1, kid, kidEnds, sibling, parent }, + lines.mortar
     commissions    { intro, goals[4]{ id, label, line, done }, spire{ dare, yes, no, falls, stands }, practiceFire, window{ dark, relit } }
     fadePlan[i]    + message, + flags{ parentTapsPrompt, tapOnlyCostly, childSelfReport, ownHardMoment, calmPractice, lunchPrompt,
                      weeklyNotDaily, mentor, serviceGold, childPicksChallenge, fireWeeklyForAll }     fadeStage(monthNumber) -> stage
     gospel         lamp is a garden lamp; + whoDidYouTell, labels, prayFirst, seedPlantedFor, newBuilderFor, prayedFor (all use {friend})
     kidRules       { reasonCode: warm line }   pullCap, rubbleCap, notForgiven, slot, noPiece, notStraw, notReady, tooSoon,
                    alreadyToday, houseDone, noNeighbour, capGold, capSilver, capStraw, capGem, capLamp

   RULES FOR ANYONE ADDING WORDS: name the act, point to God's work, never to a score.
   Straw is "work that can't last", never "God is cross with you". Forgiveness is free and at once.
   Never compare children. Short sentences a six-year-old can follow when read aloud. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.RockContent = api;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this), function () {
  'use strict';

  function fill(text, vars) {
    return String(text).replace(/\{(\w+)\}/g, function (m, k) {
      return vars && vars[k] != null ? String(vars[k]) : m;
    });
  }

  var pieceCodes = {
    G: 'gold', S: 'silver', W: 'straw', P: 'pearl',
    r: 'love', o: 'joy', b: 'peace', t: 'patience', e: 'kindness',
    y: 'goodness', v: 'faithfulness', k: 'gentleness', p: 'self-control'
  };

  var fruitOrder = ['r', 'o', 'b', 't', 'e', 'y', 'v', 'k', 'p'];

  var fruits = {
    r: {
      code: 'r', fruit: 'Love', gem: 'Ruby',
      kidLine: 'I put someone else first.',
      thisIs: 'Giving up something I want so someone else is glad.',
      thisIsNot: 'Being nice only to people who are nice to me.',
      acts: [
        { id: 'r1', label: 'Let a brother or sister go first', area: 'sibling' },
        { id: 'r2', label: 'Helped someone with their schoolwork', area: 'schoolwork' },
        { id: 'r3', label: 'Did a job that was not theirs', area: 'chores' },
        { id: 'r4', label: 'Said something loving out loud', area: 'speech' }
      ],
      praise: [
        'You put {sibling} first. God is growing love in you.',
        'You gave up your turn. That is what the love of Jesus looks like.',
        'You helped when you did not have to. God is growing love in you.'
      ],
      verse: '1 John 4:19', verseLine: 'We love because He first loved us.',
      older: 'Love is choosing what is good for someone else when it costs you something. Jesus did that first, for you.',
      morningPrayer: 'Jesus, please grow love in me today.'
    },
    o: {
      code: 'o', fruit: 'Joy', gem: 'Topaz',
      kidLine: 'I was thankful, not grumbly.',
      thisIs: 'A glad heart because God is good, even on a hard day.',
      thisIsNot: 'Only being happy when I get my own way.',
      acts: [
        { id: 'o1', label: 'Was glad when a brother or sister won', area: 'sibling' },
        { id: 'o2', label: 'Started schoolwork without a grumble', area: 'schoolwork' },
        { id: 'o3', label: 'Did a chore with a cheerful face', area: 'chores' },
        { id: 'o4', label: 'Said thank you without being asked', area: 'speech' }
      ],
      praise: [
        'You started your work without a grumble. God is growing joy in you.',
        'You were glad for {sibling}. That joy comes from God.',
        'You said thank you all by yourself. God is growing joy in you.'
      ],
      verse: 'Philippians 4:4', verseLine: 'Rejoice in the Lord always.',
      older: 'Joy is not the same as fun. It is being settled and thankful because God is good, even when the day is not.',
      morningPrayer: 'Jesus, please grow joy in me today.'
    },
    b: {
      code: 'b', fruit: 'Peace', gem: 'Sapphire',
      kidLine: 'I helped stop a fight.',
      thisIs: 'Making things right and calm between people.',
      thisIsNot: 'Hiding a problem, or giving in so nobody talks about it.',
      acts: [
        { id: 'b1', label: 'Sorted out a quarrel without a grown-up', area: 'sibling' },
        { id: 'b2', label: 'Stayed calm when schoolwork went wrong', area: 'schoolwork' },
        { id: 'b3', label: 'Shared a job without arguing who does what', area: 'chores' },
        { id: 'b4', label: 'Said sorry first', area: 'speech' }
      ],
      praise: [
        'You and {sibling} sorted it out. God is growing peace in you.',
        'You said sorry first. Jesus is the peacemaker, and He is at work in you.',
        'You stayed calm when it went wrong. God is growing peace in you.'
      ],
      verse: 'Matthew 5:9', verseLine: 'Blessed are the peacemakers.',
      older: 'Peace is not avoiding the problem. It is stepping towards the other person to mend it, the way Jesus stepped towards us.',
      morningPrayer: 'Jesus, please grow peace in me today.'
    },
    t: {
      code: 't', fruit: 'Patience', gem: 'Teal',
      kidLine: 'I waited without whining.',
      thisIs: 'Waiting, or keeping going, with a calm heart.',
      thisIsNot: 'Waiting while sighing and stomping.',
      acts: [
        { id: 't1', label: 'Waited for a turn without whining', area: 'sibling' },
        { id: 't2', label: 'Kept trying when the work was hard', area: 'schoolwork' },
        { id: 't3', label: 'Finished the whole job, not just the start', area: 'chores' },
        { id: 't4', label: 'Waited to speak and did not butt in', area: 'speech' }
      ],
      praise: [
        'You waited without whining. God is growing patience in you.',
        'You kept trying when it was hard. God is growing patience in you.',
        'You let {sibling} finish talking. That patience comes from God.'
      ],
      verse: 'Psalm 27:14', verseLine: 'Wait for the Lord. Be strong and take heart.',
      older: 'Patience is trusting God with the timing. You can wait, or stay with a hard task, without making everyone else pay for it.',
      morningPrayer: 'Jesus, please grow patience in me today.'
    },
    e: {
      code: 'e', fruit: 'Kindness', gem: 'Emerald',
      kidLine: 'I did something nice without being asked.',
      thisIs: 'Seeing what someone needs and doing it.',
      thisIsNot: 'Being nice so I get something back.',
      acts: [
        { id: 'e1', label: 'Shared without being asked', area: 'sibling' },
        { id: 'e2', label: 'Cheered someone on with their work', area: 'schoolwork' },
        { id: 'e3', label: 'Helped with a job without being asked', area: 'chores' },
        { id: 'e4', label: 'Used kind words to a brother or sister', area: 'speech' }
      ],
      praise: [
        'You shared without being asked. God is growing kindness in you.',
        'You spoke kindly to {sibling}. God is growing kindness in you.',
        'You saw a job and helped. That is the kindness of Jesus showing in you.'
      ],
      verse: 'Ephesians 4:32', verseLine: 'Be kind to one another.',
      older: 'Kindness notices. It sees what someone needs before they ask, and it does not keep a tally of who owes what.',
      morningPrayer: 'Jesus, please grow kindness in me today.'
    },
    y: {
      code: 'y', fruit: 'Goodness', gem: 'Citrine',
      kidLine: 'I did the right thing when no one was looking.',
      thisIs: 'Telling the truth and doing right, seen or not.',
      thisIsNot: 'Only being good when a grown-up is watching.',
      acts: [
        { id: 'y1', label: 'Stuck up for a brother or sister', area: 'sibling' },
        { id: 'y2', label: 'Did their own work honestly', area: 'schoolwork' },
        { id: 'y3', label: 'Did the job properly with no one checking', area: 'chores' },
        { id: 'y4', label: 'Told the truth when it was hard', area: 'speech' }
      ],
      praise: [
        'You told the truth when it was hard. God is growing goodness in you.',
        'You did it properly with no one checking. God sees, and He is glad.',
        'You stuck up for {sibling}. God is growing goodness in you.'
      ],
      verse: 'Matthew 5:16', verseLine: 'Let your light shine.',
      older: 'Goodness is being the same person in the dark as in the light. It is what you do when nobody will ever find out.',
      morningPrayer: 'Jesus, please grow goodness in me today.'
    },
    v: {
      code: 'v', fruit: 'Faithfulness', gem: 'Violet',
      kidLine: 'I did what I said I would do.',
      thisIs: 'Keeping my word and finishing my job.',
      thisIsNot: 'Starting well, then leaving it when it gets boring.',
      acts: [
        { id: 'v1', label: 'Kept a promise to a brother or sister', area: 'sibling' },
        { id: 'v2', label: 'Finished schoolwork without being chased', area: 'schoolwork' },
        { id: 'v3', label: 'Did a chore on time without a reminder', area: 'chores' },
        { id: 'v4', label: 'Said they would, and then did', area: 'speech' }
      ],
      praise: [
        'You did your job without a reminder. God is growing faithfulness in you.',
        'You said you would, and you did. God is growing faithfulness in you.',
        'You finished it all. God is faithful, and He is making you like Him.'
      ],
      verse: 'Luke 16:10', verseLine: 'Faithful with little, faithful with much.',
      older: 'Faithfulness is being someone others can lean on. Small jobs done well, again and again, when nobody claps.',
      morningPrayer: 'Jesus, please grow faithfulness in me today.'
    },
    k: {
      code: 'k', fruit: 'Gentleness', gem: 'Pink sapphire',
      kidLine: 'I used soft words and soft hands.',
      thisIs: 'Being strong and careful at the same time.',
      thisIsNot: 'Being weak, or never saying what I think.',
      acts: [
        { id: 'k1', label: 'Was careful with someone smaller', area: 'sibling' },
        { id: 'k2', label: 'Took a correction without snapping', area: 'schoolwork' },
        { id: 'k3', label: 'Was careful with things that are not theirs', area: 'chores' },
        { id: 'k4', label: 'Answered softly when cross', area: 'speech' }
      ],
      praise: [
        'You answered softly when you were cross. God is growing gentleness in you.',
        'You were careful with {sibling}. God is growing gentleness in you.',
        'You used a soft voice. Jesus is gentle, and He is at work in you.'
      ],
      verse: 'Proverbs 15:1', verseLine: 'A gentle answer turns away anger.',
      older: 'Gentleness is strength under control. You could win the argument or push past, and you choose to be careful with the person.',
      morningPrayer: 'Jesus, please grow gentleness in me today.'
    },
    p: {
      code: 'p', fruit: 'Self-control', gem: 'Amethyst',
      kidLine: 'I stopped myself.',
      thisIs: 'Feeling a big feeling and still choosing well.',
      thisIsNot: 'Pretending I do not feel anything.',
      acts: [
        { id: 'p1', label: 'Kept hands to themselves when cross', area: 'sibling' },
        { id: 'p2', label: 'Stayed at the desk until it was done', area: 'schoolwork' },
        { id: 'p3', label: 'Stopped the screen or game when told', area: 'chores' },
        { id: 'p4', label: 'Held back a rude word', area: 'speech' }
      ],
      praise: [
        'You were cross, and you stopped yourself. God is growing self-control in you.',
        'You turned it off the first time. God is growing self-control in you.',
        'You calmed down and came back. The Holy Spirit is helping you.'
      ],
      verse: 'Proverbs 25:28', verseLine: 'Self-control is like strong city walls.',
      older: 'Self-control is not bottling it up. It is feeling the full feeling, asking the Holy Spirit for help, and still choosing what you do next.',
      morningPrayer: 'Jesus, please grow self-control in me today.'
    }
  };

  var gold = {
    name: 'Gold', meaning: 'Time with God',
    acts: [
      { id: 'G1', label: 'Bible and prayer time' },
      { id: 'G2', label: 'Family worship or church' },
      { id: 'G3', label: 'Prayed about their day' }
    ],
    lines: [
      'You were with Jesus today. This is His gift.',
      'You spent time with God today. He loves being with you.',
      'Gold is for time with Jesus. He was glad you came.'
    ],
    older: 'Gold is not pay for praying well. It marks that you were with Him. A wriggly, distracted prayer still counts, because He came to meet you.'
  };

  var silver = {
    name: 'Silver', meaning: 'Faithful work',
    acts: [
      { id: 'S1', label: 'Morning jobs done on time' },
      { id: 'S2', label: 'Night jobs done on time' }
    ],
    lines: [
      'You did your jobs on time. That is faithful work.',
      'Jobs done, and on time. You worked as if for the Lord.',
      'You finished what was yours to do. Well done, faithful worker.'
    ],
    older: 'Silver is for ordinary work done well and on time. Most of life is this. God sees it. (Colossians 3:23)'
  };

  var peaceTogether = {
    label: 'Sorted it out together',
    line: 'You two sorted it out without a grown-up. A peace gem each. God is growing peace in this family.'
  };

  var morningPlan = {
    intro: {
      '6': 'What might be hard today? Pick one.',
      '8': 'Think about today. What is one moment that might be hard?',
      '12': 'Look ahead at today. Where are you most likely to come unstuck?'
    },
    hardMoments: [
      { id: 'takes', icon: 'grab', label: 'Someone takes my thing', when: 'someone takes my thing', fruit: 'p' },
      { id: 'school', icon: 'pencil', label: 'Schoolwork is hard', when: 'my schoolwork is hard', fruit: 't' },
      { id: 'no', icon: 'stop-hand', label: 'I am told "no"', when: 'I am told no', fruit: 'p' },
      { id: 'chore', icon: 'broom', label: 'It is chore time', when: 'it is time for my jobs', fruit: 'v' },
      { id: 'lose', icon: 'dice', label: 'I lose a game', when: 'I lose a game', fruit: 'o' },
      { id: 'teased', icon: 'speech-zigzag', label: 'Someone teases me', when: 'someone teases me', fruit: 'k' },
      { id: 'tired', icon: 'low-battery', label: 'I am tired or hungry', when: 'I am tired or hungry', fruit: 't' },
      { id: 'screen', icon: 'screen-off', label: 'Screen time ends', when: 'screen time ends', fruit: 'p' },
      { id: 'bed', icon: 'moon', label: 'It is bedtime', when: 'it is bedtime', fruit: 'b' },
      { id: 'leftout', icon: 'two-and-one', label: 'I am left out', when: 'I am left out', fruit: 'r' },
      { id: 'turn', icon: 'hourglass', label: 'I have to wait my turn', when: 'I have to wait my turn', fruit: 't' },
      { id: 'blamed', icon: 'pointing', label: 'I get the blame', when: 'I get the blame', fruit: 'k' },
      { id: 'noisy', icon: 'loud', label: 'Someone is annoying me', when: 'someone is annoying me', fruit: 'b' }
    ],
    responses: [
      { id: 'breathe', icon: 'wind', label: 'Take three slow breaths', will: 'take three slow breaths' },
      { id: 'pray', icon: 'praying-hands', label: 'Pray "Jesus, help me"', will: 'pray, Jesus, help me' },
      { id: 'soft', icon: 'feather', label: 'Use soft words', will: 'use soft words' },
      { id: 'ask', icon: 'raised-hand', label: 'Ask a grown-up', will: 'ask a grown-up for help' },
      { id: 'walk', icon: 'footprints', label: 'Walk away and cool down', will: 'walk away and cool down' },
      { id: 'again', icon: 'loop-arrow', label: 'Try again', will: 'have another go' },
      { id: 'water', icon: 'cup', label: 'Get a drink of water', will: 'get a drink of water and come back' }
    ],
    ifThen: {
      '6': 'When {hard}, I will {plan}.',
      '8': 'When {hard}, I will {plan}. Jesus will help me.',
      '12': 'If {hard}, then I will {plan}. I am asking the Holy Spirit for {fruit}.'
    },
    pray: {
      '6': 'Jesus, please grow {fruit} in me today. Amen.',
      '8': 'Jesus, please grow {fruit} in me today. Help me when {hard}. Amen.',
      '12': 'Lord, I cannot grow {fruit} by trying harder. Please grow it in me. Stay close when {hard}. Amen.'
    },
    done: [
      'Plan made. Jesus goes with you today.',
      'You have a plan, and you are not on your own.',
      'Ready. You can talk to Jesus any time today.'
    ],
    allDay: 'You can talk to Jesus any time today. He is right there.'
  };

  var stopAndPray = {
    open: 'Stop. Jesus is here. How do you feel?',
    offer: 'Big feeling? Do you want to stop and pray with me?',
    feelings: [
      { id: 'angry', icon: 'storm-cloud', label: 'Angry' },
      { id: 'sad', icon: 'raindrop', label: 'Sad' },
      { id: 'frustrated', icon: 'tangle', label: 'Frustrated' },
      { id: 'worried', icon: 'wobbly-line', label: 'Worried' },
      { id: 'leftout', icon: 'two-and-one', label: 'Left out' },
      { id: 'tired', icon: 'low-battery', label: 'Tired' },
      { id: 'jealous', icon: 'side-eyes', label: 'Jealous' },
      { id: 'embarrassed', icon: 'hot-cheeks', label: 'Embarrassed' }
    ],
    breath: {
      steps: ['Breathe in slowly.', 'Hold it.', 'Breathe out slowly.'],
      prayers: [
        ['Jesus,', 'You are here.', 'Help me.'],
        ['Holy Spirit,', 'fill me up.', 'Make me calm.'],
        ['Father,', 'I feel {feeling}.', 'Hold me steady.']
      ]
    },
    after: [
      'Jesus heard you. Here is your plan again.',
      'You stopped and prayed. That lamp will shine in your window tonight.',
      'Well done for stopping. What will you do now?'
    ],
    older: 'This is what praying all day long looks like. Short. Honest. Right in the middle of it.'
  };

  var straw = {
    meaning: 'Straw is work that can\'t last. It fills a space, but it burns.',
    kinds: {
      wood: { label: 'Wood', kidWords: 'Fights and blow-ups', examples: 'hitting, pushing, snatching, a big blow-up' },
      hay: { label: 'Hay', kidWords: 'Unkind words', examples: 'rude words, teasing, shouting, answering back' },
      stubble: { label: 'Stubble', kidWords: 'Grumbling and dodging', examples: 'complaining, whining, leaving a job, not telling the truth' }
    },
    ownUpCards: [
      { id: 'w1', kind: 'wood', icon: 'fist', label: 'I hurt someone', did: 'hurt someone', sibling: true },
      { id: 'w2', kind: 'wood', icon: 'grab', label: 'I snatched or would not share', did: 'snatched and would not share', sibling: true },
      { id: 'w3', kind: 'wood', icon: 'storm-cloud', label: 'I blew up', did: 'blew up', sibling: false },
      { id: 'h1', kind: 'hay', icon: 'speech-zigzag', label: 'I said something unkind', did: 'said something unkind', sibling: true },
      { id: 'h2', kind: 'hay', icon: 'loud', label: 'I shouted or answered back', did: 'shouted and answered back', sibling: false },
      { id: 'h3', kind: 'hay', icon: 'pointing', label: 'I teased or left someone out', did: 'teased someone', sibling: true },
      { id: 's1', kind: 'stubble', icon: 'grumble', label: 'I grumbled about my work', did: 'grumbled about my work', sibling: false },
      { id: 's2', kind: 'stubble', icon: 'broom', label: 'I left my job or did it badly', did: 'left my job', sibling: false },
      { id: 's3', kind: 'stubble', icon: 'mask', label: 'I did not tell the truth', did: 'did not tell the truth', sibling: false },
      { id: 's4', kind: 'stubble', icon: 'ear-off', label: 'I did not listen the first time', did: 'did not listen the first time', sibling: false },
      { id: 's5', kind: 'stubble', icon: 'clock', label: 'I did my job late, or only after being asked again', did: 'did my job late', sibling: false }
    ],
    parentLine: 'That was a straw moment. You can fix it before the fire.',
    parentLines: [
      'That was a straw moment. You can fix it before the fire.',
      'That one was straw. It can\'t last. You can put it right.',
      'Straw moment. I love you. Come and find me when you are ready to fix it.'
    ],
    neverSay: [
      'See what you did.',
      'God is cross with you.',
      'Do you want straw?',
      'Your brother or sister never gets straw.',
      'One more and your wall will fall.'
    ],
    ownedUpFirst: [
      'You told me before I asked. That took courage. Thank you.',
      'You owned up first. Jesus is teaching you to walk in the light.',
      'You came to me first. God loves an honest heart, and so do I.'
    ],
    forgivenStillBurns: 'You are fully forgiven, free and for good. The bale stays in the wall until you make it right: go and love the person you hurt. That is the part that lasts.'
  };

  var sorry = {
    prayers: {
      '6': [
        'Jesus, I am sorry I {did}. Please forgive me. Thank You that You do. Amen.',
        'Sorry, Jesus. Thank You for loving me. Help me put it right. Amen.'
      ],
      '8': [
        'Jesus, I am sorry I {did}. It was wrong. Please forgive me and help me put it right. Thank You that You do. Amen.',
        'Father, I did the wrong thing. I am sorry. Thank You that Jesus paid for it. Please change my heart. Amen.'
      ],
      '12': [
        'Lord, I {did}. No excuses. I am sorry. Thank You that Jesus has already paid for this. Give me the courage to put it right. Amen.',
        'Father, I confess it to You. Thank You that You are faithful to forgive. Show me who I need to go to. Amen.'
      ]
    },
    forgiveness: 'You told Jesus. He forgives everyone who comes to Him. It\'s free.',
    forgivenessLines: [
      'You told Jesus. He forgives everyone who comes to Him. It\'s free.',
      'Forgiven. All of it. That is what the cross is for.',
      'It is gone. Jesus is not keeping a list.'
    ],
    verse: '1 John 1:9',
    makeItRight: {
      wood: [
        { label: 'Say sorry and ask, "Are you okay?"', sibling: true },
        { label: 'Give it back, or fix what broke', sibling: true },
        { label: 'Ask {sibling}, "What can I do to help?"', sibling: true },
        { label: 'Play their game, their way, for ten minutes', sibling: true },
        { label: 'Tidy up the mess from the blow-up', sibling: false }
      ],
      hay: [
        { label: 'Say sorry, and say what you said', sibling: true },
        { label: 'Say three true, kind things to {sibling}', sibling: true },
        { label: 'Say it again, the kind way', sibling: false },
        { label: 'Write or draw a kind note', sibling: true }
      ],
      stubble: [
        { label: 'Go back and do the job properly', sibling: false },
        { label: 'Say thank you for three things', sibling: false },
        { label: 'Tell the true story', sibling: false },
        { label: 'Do one extra job to help', sibling: false },
        { label: 'Start again with a "Yes, Mum" or "Yes, Dad"', sibling: false }
      ]
    },
    siblingFirst: 'This one was with {sibling}. Go and make it right with them first.',
    afterMakeRight: [
      'You put it right. Look, pearl where the straw was.',
      'That is mended. You and {sibling} are right again.',
      'Sorry said and put right. The wall is steady.'
    ]
  };

  var fireWords = {
    before: 'One day Jesus will show what lasts. Tonight is a small picture of that. The fire is not God being cross with you. Jesus took that on the cross.',
    lastLook: 'Last look. Is there any straw you want to say sorry for and pull out?',
    small: 'Some straw burned. That bit couldn\'t last. Any blocks it knocked down are not lost: they wait in your rubble pile. Jesus loves you just the same.',
    wallFalls: 'This wall had a lot of straw, so it fell. That\'s sad. The stones are safe. Only the stacking is lost. Let\'s build again.',
    caveIn: 'The building fell. It\'s okay to feel sad. The Rock didn\'t move. Jesus hasn\'t moved, and He loves you just the same. Nothing you did with Him is lost. We\'ll rebuild together.',
    stoodFirm: 'The fire came, and it stood. What you built with Jesus lasts.',
    sealed: 'It is finished, and it stood through the fire. It goes into the City on the Rock, where nothing can ever be lost. Where would you like it?',
    parentRule: 'Never "see what you did". No straw for feelings at the fire. Sit close.'
  };

  var nightAccount = {
    catchUp: {
      minutes: 3,
      steps: [
        { id: 'open', say: 'Let\'s look back at today with Jesus.', note: 'Everyone together. Keep it light.' },
        { id: 'fruit', say: 'What fruit did we see today?', note: 'You may name a brother or sister\'s fruit. Never anyone\'s straw. Every child gets at least one.' },
        { id: 'plan', say: '{name}, did your hard moment come? What did you do?', note: 'If they used their plan: "Jesus helped you." Give this morning\'s fruit gem. If it did not come, or they forgot, say "Thanks for telling me" and move on.' },
        { id: 'withGod', say: 'When did you talk to Jesus today?', note: 'Any answer is fine. "I forgot" is fine too.' },
        { id: 'gold', say: 'You were with Jesus today. This is His gift.', note: 'Give gold to each child. Never hold it back.' },
        { id: 'thanks', say: 'Thank You, Jesus, for today. Thank You for the fruit You are growing in us. Amen.', note: 'One short prayer. A child may pray it.' }
      ]
    },
    strawQuestion: {
      '6': 'Is there anything from today you want to say sorry to Jesus for?',
      '8': 'Just you and Jesus now. Was there any straw today? Anything you want to put right?',
      '12': 'A private look back. Is there anything from today you would like to bring into the light?'
    },
    strawQuestionNote: {
      '6': 'Asked by a parent, sitting close, never on the screen alone.',
      '8': 'Asked on the screen during the solo build. No one else sees the answer.',
      '12': 'Asked on the screen. "I\'ve dealt with it" is a full answer. Her prayer is not checked.'
    },
    answers: {
      '8': ['Yes, I want to fix something', 'No, not today'],
      '12': ['Yes, I\'ll add it', 'I\'ve dealt with it', 'Nothing today']
    },
    noStraw: {
      '8': 'Thank You, Jesus, for helping me today.',
      '12': 'A clean day is a gift too. Thank Him for it.'
    },
    goodnight: [
      'Today is finished. It is safe with Jesus. Sleep well.',
      'His mercies are new every morning. Goodnight.',
      'You are loved the same tonight as this morning. Goodnight.'
    ]
  };

  var familyTalk = [
    { week: 1, theme: 'The Rock', verse: '1 Corinthians 3:11', questions: [
      'Why does a house need something strong under it?',
      'Jesus is our Rock. What is one thing about Him that never changes?',
      'What would it look like to build on Him this week?' ] },
    { week: 2, theme: 'What lasts', verse: 'Matthew 6:20', questions: [
      'What is something you loved last year that is broken or lost now?',
      'What can you think of that never wears out?',
      'What did someone do for you that you still remember?' ] },
    { week: 3, theme: 'God sees', verse: 'Matthew 6:4', questions: [
      'Did you see someone do something kind this week that nobody else saw?',
      'How does it feel to know God sees the small good things?',
      'What is one secret kind thing we could each do this week?' ] },
    { week: 4, theme: 'Grace first', verse: 'Ephesians 2:8-10', questions: [
      'Does God love you more on a day with lots of gems?',
      'If His love is a gift, why do we still build?',
      'Who gave us the Rock to build on?' ] },
    { week: 5, theme: 'Straw and pearls', verse: '1 John 1:9', questions: [
      'How does it feel just before you say sorry? How about just after?',
      'What does it cost us to be forgiven? What did it cost Jesus?',
      'Is there anything our family needs to put right together?' ] },
    { week: 6, theme: 'Praying all day', verse: '1 Thessalonians 5:17', questions: [
      'When did you talk to Jesus this week, apart from Bible time?',
      'What is the shortest prayer you know?',
      'Where could we stop and pray tomorrow?' ] },
    { week: 7, theme: 'The Helper', verse: 'Galatians 5:22-25', questions: [
      'Can an apple tree make apples by trying really hard?',
      'Who grows the fruit in us?',
      'Which fruit would you like the Holy Spirit to grow in you next?' ] },
    { week: 8, theme: 'The day we see Jesus', verse: 'Matthew 25:21', questions: [
      'What do you think it will be like to see Jesus face to face?',
      'He loves to say "Well done". What might He say it about?',
      'What are you looking forward to asking Him?' ] },
    { week: 9, theme: 'People last forever', verse: '1 Thessalonians 2:19-20', questions: [
      'Things wear out. People do not. Who is a person you are glad God made?',
      'How could we show {sibling} they matter more than our stuff?',
      'Who outside our family could we love this week?' ] },
    { week: 10, theme: 'Small and faithful', verse: 'Luke 16:10', questions: [
      'What is a small job you did well this week?',
      'Why do you think God cares about small jobs?',
      'What is a small job you could do without being asked?' ] },
    { week: 11, theme: 'Getting up again', verse: 'Proverbs 24:16', questions: [
      'Has something you built ever fallen down? What did you do next?',
      'What stayed the same when the wall fell?',
      'How can we help each other get up again?' ] },
    { week: 12, theme: 'The City', verse: 'Revelation 21:3-4', questions: [
      'What do you imagine the home God is making will be like?',
      'What sad things will not be there?',
      'What would you like to build with Jesus between now and then?' ] }
  ];

  var seasons = {
    blueprints: [
      { month: 1, name: 'The Lighthouse', line: 'A light for people who are lost.', verse: 'Matthew 5:16', verseLine: 'Let your light shine.', fruit: 'y' },
      { month: 2, name: 'The Schoolhouse', line: 'Small jobs, done well.', verse: 'Luke 16:10', verseLine: 'Faithful with little, faithful with much.', fruit: 'v' },
      { month: 3, name: 'The Bridge', line: 'A way back to each other.', verse: 'Matthew 5:9', verseLine: 'Blessed are the peacemakers.', fruit: 'b' },
      { month: 4, name: 'The Garden Chapel', line: 'He loved us first.', verse: 'Romans 5:8', verseLine: 'Christ died for us.', fruit: 'r' },
      { month: 5, name: 'The Long Table House', line: 'Always room for one more.', verse: 'Ephesians 4:32', verseLine: 'Be kind to one another.', fruit: 'e' },
      { month: 6, name: 'The Watchtower', line: 'Watch and pray.', verse: 'Matthew 26:41', verseLine: 'Watch and pray.', fruit: 'p' },
      { month: 7, name: 'The Inn on the Road', line: 'A safe place for someone hurting.', verse: 'Luke 10:34', verseLine: 'He went to him and bandaged his wounds.', fruit: 'k' },
      { month: 8, name: 'The Barn', line: 'The farmer waits for the harvest.', verse: 'James 5:7', verseLine: 'See how the farmer waits.', fruit: 't' },
      { month: 9, name: 'The Shepherd\'s Hut', line: 'Quiet waters and a Shepherd close by.', verse: 'Psalm 23:2', verseLine: 'He leads me beside quiet waters.', fruit: 'b' },
      { month: 10, name: 'The Gate House', line: 'A guard on the door of my mouth.', verse: 'Psalm 141:3', verseLine: 'Keep watch over the door of my lips.', fruit: 'p' },
      { month: 11, name: 'The Harbour House', line: 'Steady while we wait.', verse: 'Psalm 27:14', verseLine: 'Wait for the Lord.', fruit: 't' },
      { month: 12, name: 'The Stable', line: 'Good news of great joy.', verse: 'Luke 2:10', verseLine: 'Good news of great joy for all people.', fruit: 'o' }
    ],
    stickers: [
      'Red door', 'Blue door', 'Green door', 'Flag', 'Flower box', 'Climbing vine', 'Lantern', 'Bell',
      'Weathervane', 'Chimney smoke', 'Welcome mat', 'Bird nest', 'Fruit tree', 'Stepping stones', 'Little well',
      'Garden bench', 'Bunting', 'Sleeping cat', 'Letterbox', 'Round window', 'Star on the roof', 'Rainbow glass'
    ]
  };

  var milestones = [
    { id: 'firstPearl', when: 'first pearl', title: 'Forgiven', line: 'Your first pearl. You told Jesus, and He forgave you. It was free. It always will be.' },
    { id: 'firstPullOut', when: 'first straw put right', title: 'A mender', line: 'You put something right. Jesus is making you a mender.' },
    { id: 'ownedUpFirst', when: 'first time owning up before being asked', title: 'In the light', line: 'You told the truth before anyone asked. Jesus is teaching you to walk in the light.' },
    { id: 'firstWindow', when: 'first window', title: 'Light gets in', line: 'Three gems make a window. God\'s fruit in you lets the light in.' },
    { id: 'firstSealed', when: 'first sealed building', title: 'It lasts', line: 'It stood through the fire. What you build with Jesus lasts.' },
    { id: 'rebuilt', when: 'rebuilt after a wall fall or cave-in', title: 'A rebuilder', line: 'It fell, and you built again. Jesus does not give up on you, and He is teaching you to keep going.' },
    { id: 'plans7', when: '7 days of morning plans (not in a row)', title: 'A planner', line: 'Seven mornings you asked Jesus for help before the day began. You are learning to walk with Him.' },
    { id: 'usedPlan', when: 'first time the plan was used in the hard moment', title: 'Jesus helped', line: 'The hard moment came, and you did what you planned. Jesus helped you.' },
    { id: 'stopPray5', when: '5 Stop and Pray moments', title: 'Someone who prays', line: 'You keep turning to Jesus in the middle of things. He loves it when you come.' },
    { id: 'siblingFruit', when: 'a week of naming more fruit in a sibling than was named in them', title: 'An encourager', line: 'You saw so much good in {sibling} this week. God is making you an encourager.' },
    { id: 'peaceTogether', when: 'first quarrel settled without a grown-up', title: 'Peacemakers', line: 'You two made peace on your own. God is making you peacemakers.' },
    { id: 'allNine', when: 'all nine gems in the City', title: 'The whole fruit', line: 'All nine colours. The Spirit is growing the whole fruit in you.' },
    { id: 'pureGlass', when: 'first pure-glass window', title: 'Deep roots', line: 'Three of the same gem. That fruit is putting down roots in you.' },
    { id: 'cityStreet', when: 'the family has 5 sealed buildings', title: 'A street', line: 'Our city has its first street. We built it together, on the Rock.' },
    { id: 'firstFire', when: 'first real fire, whatever happened', title: 'Brave', line: 'Your first fire. That took courage, and the Rock did not move.' },
    { id: 'secretKind', when: 'a parent taps "done in secret"', title: 'Seen by God', line: 'Nobody was watching, and you did it anyway. Your Father saw.' }
  ];

  var parentTips = [
    'Name the act, then point to God: "You waited. God is growing patience in you."',
    'Catch fruit within a minute if you can. Late praise is weaker praise.',
    'Aim for about three fruit named for every straw. If you can\'t find fruit, look closer.',
    'Say the straw line once, calmly, then stop talking.',
    'Never use the fire as a threat. It is practice, not punishment.',
    'A hard night? Tap "Not tonight". Nothing is lost.',
    'Let the 12-year-old own her straw. Ask, don\'t check.',
    'Do not compare. Each child builds their own house at their own size.',
    'When a wall falls, sit close and say less. Sad is allowed.',
    'Own up to your own straw out loud. Children copy what they see.',
    'Forgiveness is given, not earned. Say "It\'s free" every time.',
    'If a child performs kindness for a gem, smile and say, "God sees the heart."',
    'Notice fruit that costs something. It is worth more than easy fruit.',
    'Ask "When did you talk to Jesus today?" more often than "Were you good?"',
    'Say who is doing the growing: "God is making you a peacemaker." Never "that is who you are".'
  ];

  var growthCheck = {
    intro: 'Two minutes, once a month, grown-ups only. Think about real life, not the game.',
    when: 'First Sunday of the month. Do one before the game starts, as the starting line.',
    lookBack: 'Think about the last two weeks.',
    perChild: true,
    bothParents: 'If two grown-ups can each do it without looking at the other\'s answers, do. Where you differ is worth a chat.',
    scale: [
      { value: 0, label: 'Hardly ever' },
      { value: 1, label: 'Once or twice a week' },
      { value: 2, label: 'Most days' },
      { value: 3, label: 'Every day' },
      { value: 4, label: 'Many times a day' }
    ],
    items: [
      { id: 'fights', better: 'lower', ask: 'How often did {name} get into a fight with a brother or sister?', fruit: 'b' },
      { id: 'rude', better: 'lower', ask: 'How often did {name} use rude or unkind words to a brother or sister?', fruit: 'k' },
      { id: 'blowups', better: 'lower', ask: 'How often did {name} blow up or have a tantrum?', fruit: 'p' },
      { id: 'grumble', better: 'lower', ask: 'How often did {name} complain about schoolwork?', fruit: 'o' },
      { id: 'chores', better: 'higher', ask: 'How often did {name} do jobs on time without being chased?', fruit: 'v' },
      { id: 'kindWords', better: 'higher', ask: 'How often did {name} speak kindly to a brother or sister without being told to?', fruit: 'e' },
      { id: 'recover', better: 'higher', ask: 'After things went wrong, how often did {name} calm down and put it right without a push?', fruit: 'p' },
      { id: 'turnsToGod', better: 'higher', ask: 'How often did you see or hear {name} turn to God on their own?', fruit: null }
    ],
    notePrompt: 'One real moment from this month that showed growth in {name}. One sentence.',
    hardestPrompt: 'What is still hardest for {name}? One sentence.',
    parentView: {
      shows: [
        'Each child on their own page, compared only with their own starting line.',
        'Three plain words per item: growing, steady, or harder. From the last three checks, not one.',
        'The one-sentence moments, as a growing list. This is the real record.',
        'A gentle flag when the game and real life disagree.'
      ],
      neverShows: [
        'Children side by side.',
        'A total score or a rank.',
        'A graph the children can see.'
      ],
      labels: { growing: 'Growing', steady: 'Steady', harder: 'Harder lately' },
      afterCheck: 'Thank you. Pick one moment to tell {name} about this week.'
    },
    childView: {
      rule: 'Children never see numbers or the check. They hear one true story.',
      sayAloud: [
        '{name}, I noticed something this month. {moment} God is growing you.',
        '{name}, a few months ago this was really hard for you. Look what God is doing.',
        '{name}, I saw you turn to Jesus this month. That made me so glad.'
      ]
    },
    gamingSignals: [
      { id: 'piecesNoChange', when: 'Lots of gems for two months, but the check says steady or harder.', ask: 'Are we tapping fruit for easy things? Look for fruit that cost something this week.' },
      { id: 'performing', when: 'Kind acts mostly happen when a grown-up is near the iPad.', ask: 'Try a week of noticing only what you see by surprise.' },
      { id: 'noStraw', when: 'No straw logged for three weeks, but fights are still on the check.', ask: 'Is straw feeling unsafe to own? Own up to some of your own first.' },
      { id: 'oneFruit', when: 'Nearly all gems are one fruit, the easy one.', ask: 'Choose a harder fruit together for the morning plan.' },
      { id: 'parentOnly', when: 'A grown-up taps all the fruit. Children name none.', ask: 'Ask each child to name one fruit they saw in someone else tonight.' }
    ],
    fadeRules: [
      { id: 'fadeItem', when: 'A hard item has been "hardly ever" for two checks.', then: 'Stop naming that hard moment in the morning plan. Offer a new one.' },
      { id: 'fadePraise', when: 'A fruit is seen most days for two checks.', then: 'Stop tapping the easy version. Keep saying thank you with words.' },
      { id: 'fadePrompt', when: 'A child makes the morning plan without being asked for a month.', then: 'Let them write their own hard moment and their own plan.' },
      { id: 'fadeFire', when: 'A child has sealed four buildings.', then: 'Offer a bigger blueprint and fewer fire nights, with more riding on each.' }
    ],
    raiseTheBar: [
      'Fruit shown to a brother or sister counts for more than fruit shown to a grown-up. Look for it.',
      'Fruit that nobody asked for. Fruit that cost something.',
      'Secret kindness: done without telling anyone.',
      'The older child coaches a younger one through their plan.',
      'Fruit outside the house: a neighbour, a friend, someone at church.'
    ]
  };

  var fairness = {
    familySees: [
      'The City on the Rock, built by everyone, with no counts per child.',
      'Fruit named out loud, for every child, every night.',
      'Sealed buildings, with no dates and no totals.'
    ],
    privateOnly: [
      'Straw, wobble, holes, fallen walls and cave-ins.',
      'How many gems anyone has.',
      'The growth check.'
    ],
    lines: {
      different: 'Everyone builds their own house, at their own size. We are not racing.',
      ahead: 'You have had a strong week. Who could you cheer on?',
      behind: 'A slow week does not change how much you are loved. Tomorrow is new.',
      whenComparing: 'We don\'t count each other\'s houses. We build one city.',
      whenBoasting: 'Who grew that fruit in you? Let\'s thank Him.',
      whenDiscouraged: 'The Rock is the same under your house as under theirs.',
      city: 'Every sealed building makes our city bigger. It belongs to all of us.',
      crown: 'The crown on our city is given by Jesus. None of us earned it.'
    }
  };

  /* =====================================================================================================
     ADDED SECTIONS (merge, 17 Nov). Nothing above this line changed name or shape.
     Each list below is built FROM the lists above (same ids, labels and fruit codes), with more on each item,
     so the two halves cannot drift apart.
     ===================================================================================================== */

  /* ---- Praise that matches the act that was tapped: fruits[code].praiseFor[actId] ---- */
  var praiseFor = {
    r1: 'You let {sibling} go first. God is growing love in you.',
    r2: 'You stopped to help with their schoolwork. God is growing love in you.',
    r3: 'That job was not yours, and you did it anyway. That is what the love of Jesus looks like.',
    r4: 'You said something loving out loud. God is growing love in you.',
    o1: 'You were glad when {sibling} won. That joy comes from God.',
    o2: 'You started your schoolwork without a grumble. God is growing joy in you.',
    o3: 'You did your chore with a cheerful face. God is growing joy in you.',
    o4: 'You said thank you all by yourself. God is growing joy in you.',
    b1: 'You and {sibling} sorted it out on your own. God is growing peace in you.',
    b2: 'Your schoolwork went wrong, and you stayed calm. God is growing peace in you.',
    b3: 'You shared the job without arguing about who does what. God is making you a peacemaker.',
    b4: 'You said sorry first. Jesus is the peacemaker, and He is at work in you.',
    t1: 'You waited for your turn without whining. God is growing patience in you.',
    t2: 'The work was hard, and you kept trying. God is growing patience in you.',
    t3: 'You finished the whole job, not just the start. God is growing patience in you.',
    t4: 'You waited to speak and did not butt in. That patience comes from God.',
    e1: 'You shared without being asked. God is growing kindness in you.',
    e2: 'You cheered {sibling} on with their work. God is growing kindness in you.',
    e3: 'You saw a job and helped without being asked. That is the kindness of Jesus showing in you.',
    e4: 'You used kind words to {sibling}. God is growing kindness in you.',
    y1: 'You stuck up for {sibling}. God is growing goodness in you.',
    y2: 'You did your own work honestly. God sees, and He is glad.',
    y3: 'You did the job properly with no one checking. God is growing goodness in you.',
    y4: 'You told the truth when it was hard. God is growing goodness in you.',
    v1: 'You kept your promise to {sibling}. God is growing faithfulness in you.',
    v2: 'You finished your schoolwork without being chased. God is growing faithfulness in you.',
    v3: 'You did your chore on time without a reminder. God is growing faithfulness in you.',
    v4: 'You said you would, and you did. God is faithful, and He is making you like Him.',
    k1: 'You were careful with someone smaller than you. God is growing gentleness in you.',
    k2: 'You were corrected, and you did not snap. God is growing gentleness in you.',
    k3: 'You were careful with things that are not yours. God is growing gentleness in you.',
    k4: 'You were cross, and you still answered softly. Jesus is gentle, and He is at work in you.',
    p1: 'You were cross, and you kept your hands to yourself. God is growing self-control in you.',
    p2: 'You stayed at your desk until it was done. God is growing self-control in you.',
    p3: 'You stopped the screen the first time you were told. God is growing self-control in you.',
    p4: 'A rude word was right there, and you held it back. The Holy Spirit is helping you.'
  };
  fruitOrder.forEach(function (c) {
    var f = fruits[c]; f.praiseFor = {};
    f.acts.forEach(function (a) { if (praiseFor[a.id]) f.praiseFor[a.id] = praiseFor[a.id]; });
  });
  /* Praise for a tapped act id ('t1'), or the fruit's first general line if the act is unknown. */
  function praiseForAct(actId) {
    var f = fruits[String(actId).charAt(0)];
    return f ? (f.praiseFor[actId] || f.praise[0]) : '';
  }

  /* ---- hardMoments: every morningPlan.hardMoments card (same id, icon, label, when, fruit) plus
          iconIdea, fruits[] and iWill[3]. iWill items have the same shape as morningPlan.responses
          ({ id, type, label, will }); the first is always a breath prayer. ---- */
  function iw(type, label, will) { return { type: type, label: label, will: will }; }
  var hardExtras = {
    takes: { iconIdea: 'Two hands on one toy', fruits: ['p', 'b', 'k'], iWill: [
      iw('pray', 'Breathe and pray, "Jesus, calm my heart"', 'breathe and pray, Jesus, calm my heart'),
      iw('say', 'Say, "Please give it back. I was using it"', 'use my words and ask for it back'),
      iw('do', 'Keep my hands down and ask a grown-up', 'keep my hands down and ask a grown-up') ] },
    school: { iconIdea: 'A pencil and a page with a scribble', fruits: ['t', 'o', 'p'], iWill: [
      iw('pray', 'Breathe and pray, "Jesus, help me keep going"', 'breathe and pray, Jesus, help me keep going'),
      iw('do', 'Do just the next little bit', 'do just the next little bit'),
      iw('say', 'Say, "Can you help me, please?" without a grumble', 'ask for help without a grumble') ] },
    no: { iconIdea: 'A raised hand and a small sad face', fruits: ['p', 'b', 'o'], iWill: [
      iw('pray', 'Breathe and pray, "Jesus, help me say okay"', 'breathe and pray, Jesus, help me say okay'),
      iw('say', 'Say, "Okay, Mum" or "Okay, Dad"', 'say okay the first time'),
      iw('do', 'Ask once, kindly, "Could I have it later?" and take the answer', 'ask once, kindly, and take the answer') ] },
    chore: { iconIdea: 'A broom and a clock', fruits: ['v', 'o', 'p'], iWill: [
      iw('pray', 'Breathe and pray, "Jesus, I do this for You"', 'breathe and pray, Jesus, I do this for You'),
      iw('do', 'Start straight away, before I do anything else', 'start straight away'),
      iw('do', 'Finish the whole job, then tell a grown-up', 'finish the whole job') ] },
    lose: { iconIdea: 'A game board and a tipped-over piece', fruits: ['o', 'p', 'e'], iWill: [
      iw('pray', 'Breathe and pray, "Jesus, You love me the same"', 'breathe and pray, Jesus, You love me the same'),
      iw('say', 'Say, "Good game. Well played"', 'say good game'),
      iw('do', 'Help pack the game away', 'help pack the game away') ] },
    teased: { iconIdea: 'A zigzag speech bubble and a small figure', fruits: ['k', 'p', 'b'], iWill: [
      iw('pray', 'Breathe and pray, "Jesus, guard my mouth"', 'breathe and pray, Jesus, guard my mouth'),
      iw('say', 'Say, "Please stop. I don\'t like that"', 'say please stop, in a calm voice'),
      iw('do', 'Walk away and tell a grown-up', 'walk away and tell a grown-up') ] },
    tired: { iconIdea: 'A drooping face and an empty plate', fruits: ['t', 'k', 'p'], iWill: [
      iw('pray', 'Breathe and pray, "Jesus, give me strength"', 'breathe and pray, Jesus, give me strength'),
      iw('say', 'Say, "I am tired. Can I have a rest or a snack?"', 'say how I feel and ask for a rest or a snack'),
      iw('do', 'Use a soft voice even though I feel grumpy', 'use a soft voice') ] },
    screen: { iconIdea: 'A screen turning off', fruits: ['p', 'o', 'v'], iWill: [
      iw('pray', 'Breathe and pray, "Jesus, help me stop"', 'breathe and pray, Jesus, help me stop'),
      iw('do', 'Turn it off the first time and put it face down', 'turn it off the first time'),
      iw('say', 'Say, "Thanks for my turn"', 'say thanks for my turn') ] },
    bed: { iconIdea: 'A moon and a pillow', fruits: ['b', 'p', 'o'], iWill: [
      iw('pray', 'Breathe and pray, "Jesus, thank You for today"', 'breathe and pray, Jesus, thank You for today'),
      iw('do', 'Go the first time I am asked', 'go the first time I am asked'),
      iw('do', 'Stay in bed and think of three thank-yous', 'stay in bed and think of three thank-yous') ] },
    leftout: { iconIdea: 'Two figures together and one apart', fruits: ['r', 'b', 'k'], iWill: [
      iw('pray', 'Breathe and pray, "Jesus, You are with me"', 'breathe and pray, Jesus, You are with me'),
      iw('say', 'Ask kindly, "Can I play too?"', 'ask kindly if I can play too'),
      iw('do', 'Find someone else who is on their own', 'find someone else who is on their own') ] },
    turn: { iconIdea: 'An hourglass and a queue of feet', fruits: ['t', 'p', 'r'], iWill: [
      iw('pray', 'Breathe and pray, "Jesus, help me wait"', 'breathe and pray, Jesus, help me wait'),
      iw('do', 'Count to twenty slowly', 'count to twenty slowly'),
      iw('do', 'Find something else to do while I wait', 'find something else to do while I wait') ] },
    blamed: { iconIdea: 'A pointing finger and a small figure', fruits: ['k', 'y', 'p'], iWill: [
      iw('pray', 'Breathe and pray, "Jesus, You know what is true"', 'breathe and pray, Jesus, You know what is true'),
      iw('say', 'Tell the true story in a calm voice', 'tell the true story in a calm voice'),
      iw('do', 'Own my part, even if it is small', 'own my part') ] },
    noisy: { iconIdea: 'A loud squiggle next to a cross face', fruits: ['b', 'k', 'p'], iWill: [
      iw('pray', 'Breathe and pray, "Jesus, make me gentle"', 'breathe and pray, Jesus, make me gentle'),
      iw('say', 'Say, "Please stop," once, kindly', 'ask them kindly to stop'),
      iw('do', 'Move to another room', 'move to another room') ] }
  };
  var hardMoments = morningPlan.hardMoments.map(function (m) {
    var x = hardExtras[m.id] || {}, out = {}, k;
    for (k in m) out[k] = m[k];
    out.iconIdea = x.iconIdea || '';
    out.fruits = x.fruits || [m.fruit];
    out.iWill = (x.iWill || []).map(function (r, i) {
      return { id: m.id + '-' + (i + 1), type: r.type, label: r.label, will: r.will };
    });
    return out;
  });

  /* ---- strawCards: every straw.ownUpCards card (same id, kind, icon, label, did, sibling) plus the
          one make-it-right that fits, the words to say, a one-line sorry prayer and the fruit to grow. ---- */
  var strawExtras = {
    w1: { grows: 'k', right: 'Go to them. Say sorry and ask, "Are you okay?" Get them what they need.',
      words: 'I am sorry I hurt you. Are you okay? Will you forgive me?',
      prayer: 'Jesus, I am sorry I hurt someone. Please forgive me and make my hands gentle.' },
    w2: { grows: 'e', right: 'Give it back. Say sorry. Offer them a turn with something of yours.',
      words: 'I am sorry I snatched. Here it is. Would you like a turn of mine?',
      prayer: 'Jesus, I am sorry I snatched and would not share. Please forgive me and make me kind.' },
    w3: { grows: 'p', right: 'Calm down first. Then say sorry to whoever was near, and tidy up any mess.',
      words: 'I am sorry I blew up. Can I try again?',
      prayer: 'Jesus, I am sorry I blew up. Please forgive me. Help me stop and pray next time.' },
    h1: { grows: 'e', right: 'Say sorry, and say what you said. Then say one true, kind thing.',
      words: 'I am sorry I said that. It was unkind. Will you forgive me?',
      prayer: 'Jesus, I am sorry for my unkind words. Please forgive me and guard my mouth.' },
    h2: { grows: 'k', right: 'Say sorry. Then say it again, the kind way, in a soft voice.',
      words: 'I am sorry I shouted. Can I say that again?',
      prayer: 'Jesus, I am sorry I shouted and answered back. Please forgive me and give me a gentle answer.' },
    h3: { grows: 'r', right: 'Say sorry. Then ask them to join in, and mean it.',
      words: 'I am sorry I teased you. Do you want to play with me?',
      prayer: 'Jesus, I am sorry I teased and left someone out. Please forgive me and help me love them.' },
    s1: { grows: 'o', right: 'Say sorry for the grumbling. Say thank you for three things. Then start again.',
      words: 'I am sorry I grumbled. I will have another go.',
      prayer: 'Jesus, I am sorry I grumbled. Please forgive me and give me a thankful heart.' },
    s2: { grows: 'v', right: 'Go back and do the job properly, now. Then tell a grown-up it is done.',
      words: 'I am sorry I left my job. I will do it now.',
      prayer: 'Jesus, I am sorry I left my job. Please forgive me and make me faithful.' },
    s3: { grows: 'y', right: 'Go and tell the true story, all of it.',
      words: 'What I said was not true. Here is what really happened.',
      prayer: 'Jesus, I am sorry I did not tell the truth. Please forgive me and make me brave to be honest.' },
    s4: { grows: 'p', right: 'Go back, say "Yes, Mum" or "Yes, Dad", and do it straight away.',
      words: 'I am sorry I did not listen. I will do it now.',
      prayer: 'Jesus, I am sorry I did not listen. Please forgive me and help me obey the first time.' },
    s5: { grows: 'v', right: 'Say sorry for the wait. Do one extra helpful job now, without being asked. Tomorrow, start before anyone reminds you.',
      words: 'I am sorry you had to ask me again. I will start on time tomorrow.',
      prayer: 'Jesus, I am sorry I was slow to do my job. Please forgive me and make me faithful.' }
  };
  var strawCards = straw.ownUpCards.map(function (c) {
    var x = strawExtras[c.id] || {}, out = {}, k;
    for (k in c) out[k] = c[k];
    out.kidWords = c.label + '.';
    out.growsInstead = x.grows || null;
    out.makeItRight = { kind: c.sibling ? 'person' : 'task', label: x.right || '', words: x.words || '' };
    out.sorryPrayer = x.prayer || fill(sorry.prayers['6'][0], { did: c.did });
    return out;
  });

  /* ---- breathPrayers: one prayer per feeling. The first eight are in the same order and use the
          same ids as stopAndPray.feelings, so breathPrayers[i] belongs to feelings[i].
          lines = [breathe in, hold, breathe out], to go with stopAndPray.breath.steps.
          Keys 0, 1, 2 repeat the lines so code that reads prayer[0..2] also works. ---- */
  function bp(id, feeling, fruit, a, b, c) {
    return { id: id, feeling: feeling, fruit: fruit, lines: [a, b, c], 0: a, 1: b, 2: c };
  }
  var breathPrayers = [
    bp('angry', 'I feel angry', 'p', 'Jesus,', 'You are here.', 'Calm my heart.'),
    bp('sad', 'I feel sad', 'o', 'Jesus,', 'You see me.', 'Hold me close.'),
    bp('frustrated', 'I feel frustrated', 't', 'Holy Spirit,', 'I can\'t do this alone.', 'Help me keep going.'),
    bp('worried', 'I feel worried', 'b', 'Father,', 'You are with me.', 'Give me Your peace.'),
    bp('leftout', 'I feel left out', 'r', 'Jesus,', 'You never leave me.', 'Be my friend right now.'),
    bp('tired', 'I feel tired', 'k', 'Jesus,', 'I am worn out.', 'Give me Your strength.'),
    bp('jealous', 'I feel jealous', 'e', 'Father,', 'You are good to me.', 'Make me glad for them.'),
    bp('embarrassed', 'I feel embarrassed', 'b', 'Jesus,', 'You love me the same.', 'Help me try again.'),
    bp('tempted', 'I want to do the wrong thing', 'y', 'Holy Spirit,', 'show me the right way.', 'Make me strong to choose it.'),
    bp('rude', 'I want to say something mean', 'k', 'Jesus,', 'guard my mouth.', 'Give me soft words.'),
    bp('thankful', 'I feel glad', 'o', 'Thank You, Jesus,', 'for this.', 'You are so good.')
  ];

  /* ---- gospel: "I told someone about Jesus" (1 Corinthians 3:6-9) ----
     "I planted, Apollos watered, but God gave the growth." "You are God's field, God's building."
     The child plants or waters. Only God makes it grow. The child never "saved" anyone.
     The seed is given for the telling, whatever the person said back.
     Placeholder {friend} = the first name of the person (not {name}, which is the child). */
  var gospel = {
    verse: '1 Corinthians 3:6-9',
    verseLine: {
      '6': 'One plants. One waters. God makes it grow.',
      '8': 'I planted the seed, Apollos watered it, but God made it grow.',
      '12': 'I planted, Apollos watered, but God gave the growth. You are God\'s field, God\'s building.'
    },
    actCard: {
      id: 'toldAboutJesus', icon: 'lamp-and-seed',
      iconIdea: 'A small lamp held out in two hands, with a seed beside it',
      label: 'I told someone about Jesus',
      kidWords: {
        '6': 'I told someone about Jesus.',
        '8': 'I told someone about Jesus, or what He has done for me.',
        '12': 'I talked with someone about Jesus, honestly, in my own words.'
      },
      examples: {
        '6': ['I told my friend that Jesus loves them.', 'I told someone a Bible story I know.',
          'I asked a friend to come to church or kids\' club.'],
        '8': ['I told a friend why we pray, when they asked.',
          'I told someone how Jesus helped me when I was scared or cross.',
          'I asked a friend to come to church or kids\' club.'],
        '12': ['I answered a friend\'s question about what I believe.',
          'I told someone what Jesus has changed in me.',
          'I offered to pray for a friend having a hard time, or invited them along.']
      },
      ask: 'Who did you tell? What did you say?',
      askNote: 'Ask about the telling, not about what the person said back.',
      limit: 'One lamp a day at most. It records a real moment. It is not a target.'
    },
    /* The lamp is a GARDEN lamp. It stands by the gate, beside the seed. It is not a wall block. */
    lamp: { name: 'Garden lamp', meaning: 'I shared Jesus', verse: 'Matthew 5:14-16', where: 'By the gate, beside the seed',
      line: 'A light by your gate for {friend}. Jesus is the light. You carried it.',
      lineNoName: 'A light by your gate. Jesus is the light. You carried it.' },
    /* Asked straight after the tap. The seed, the lamp and any later island carry this first name. */
    whoDidYouTell: { prompt: 'Who did you tell?', placeholder: 'First name', skip: 'I\'d rather not say',
      note: 'Only a first name is kept. It stays on this iPad.',
      seedLabel: '{friend}\'s seed', lampLabel: 'A light for {friend}', islandLabel: '{friend}\'s house' },
    labels: { told: 'I told someone about Jesus', friendFollows: 'A friend says they want to follow Jesus',
      friendFollowsNote: 'Grown-ups only', prayFor: 'Pray for {friend}', prayForNoName: 'Pray for them',
      confirmFollows: 'Grown-ups only. Has {friend} said they want to follow Jesus? A new builder will start next door.' },
    /* The prayer is shown and prayed BEFORE any stone lands. */
    prayFirst: { intro: 'Let\'s pray for {friend}.', done: 'Amen', then: 'prayedFor' },
    /* Lines with the person's name, for when the page has one. The un-named lines below stay as they were. */
    seedPlantedFor: {
      '6': 'You told {friend} about Jesus. A seed is planted, and a light by your gate for {friend}. You plant. God makes it grow.',
      '8': 'A seed is planted for {friend}, and a light by your gate. Whatever {friend} said, you did your part and Jesus is glad. Only God can make a seed grow.',
      '12': 'A seed in the ground for {friend}, and a light by your gate. How {friend} answered isn\'t yours to carry. One plants, one waters, and God gives the growth.'
    },
    newBuilderFor: {
      '6': 'Look! A new little island. {friend} says they want to follow Jesus. God did that. It is the same Rock as yours.',
      '8': 'A new island! {friend} wants to build on Jesus, the same foundation as you. You planted. God made it grow. Let\'s thank Him.',
      '12': 'A new foundation next to yours. {friend} wants to follow Jesus. God gave the growth, and others watered too. Same Rock, their own building.'
    },
    prayedFor: {
      '6': 'You prayed for {friend}. A stone for their house. God is the builder.',
      '8': 'You prayed for {friend}, and their house gains a stone. God is the builder.',
      '12': 'You prayed for {friend}. A stone for their house. Praying is watering, and God gives the growth.'
    },
    /* Spoken when the lamp piece and the seed are given. */
    seedPlanted: {
      '6': 'You told someone about Jesus. A seed is planted, and a lamp shines by your gate. You plant. God makes it grow.',
      '8': 'A seed is planted, and a lamp shines by your gate. Whatever they said, you did your part and Jesus is glad. Only God can make a seed grow.',
      '12': 'A seed in the ground, and a lamp by your gate. How they answered isn\'t yours to carry. One plants, one waters, and God gives the growth.'
    },
    /* Spoken when a seed is planted but today's lamp has already been given. */
    seedOnly: {
      '6': 'Another seed is planted. You plant. God makes it grow.',
      '8': 'Another seed in the ground. You did your part. God makes it grow.',
      '12': 'Another seed planted. The growth is God\'s work, not yours.'
    },
    seedAnyResponse: {
      listened: 'They listened. The seed is in the ground. God knows what to do with it.',
      notInterested: 'They didn\'t want to hear it today. That\'s okay. The seed is still planted, and you were brave and kind.',
      laughed: 'That hurt. Jesus saw you, and He is glad you spoke. A seed can sit a long time before it grows.',
      unsure: 'You\'re not sure what they thought. You don\'t need to know. God does.'
    },
    watering: { line: 'Praying for them is watering. Being a kind friend is watering too.',
      prompt: 'Would you like to pray for the people you have told?' },
    /* Spoken when a neighbour's foundation appears. */
    newBuilder: {
      '6': 'Look! A new little island. Your friend says they want to follow Jesus. God did that. It is the same Rock as yours.',
      '8': 'A new island! Your friend wants to build on Jesus, the same foundation as you. You planted. God made it grow. Let\'s thank Him.',
      '12': 'A new foundation next to yours. God gave the growth. You got to be part of it, and so did others who watered. Same Rock, their own building.'
    },
    newBuilderThanks: 'Thank You, God. You made this grow. Not me. You.',
    /* Spoken when the child prays for them and their house gains a stone. */
    prayed: {
      '6': 'You prayed for them. A stone for their house. God is the builder.',
      '8': 'You prayed for them, and their house gains a stone. God is the builder.',
      '12': 'You prayed. A stone for their house. Praying is watering, and God gives the growth.'
    },
    prayerForThem: {
      '6': 'Jesus, please look after {friend}. Help them know You love them. Amen.',
      '8': 'Jesus, thank You for {friend}. Please help them know You and grow close to You. Amen.',
      '12': 'Lord, thank You for {friend}. Keep working in them. Make me a faithful friend, and give the growth only You can give. Amen.'
    },
    prayerForNewBuilder: {
      '6': 'Jesus, thank You that {friend} is Yours. Help them grow. Amen.',
      '8': 'Jesus, thank You that {friend} follows You now. Help them build with gold and stay close to You. Amen.',
      '12': 'Lord, thank You for what You have done in {friend}. Root them in You, and show me how to help them keep building. Amen.'
    },
    rules: [
      'Only a grown-up adds a neighbour\'s island, after talking with the child.',
      'Seeds, lamps and islands carry a first name only. No counter of seeds or islands anywhere.',
      'The child prays the prayer for them first. Then the stone lands.',
      'The child cannot build on it or lose it. It is that person\'s house, on the same Rock.',
      'It grows one stone each time the child prays for them, one a day at most.',
      'It gives the child no gems, no extra blocks and no milestone.'
    ],
    parentTips: [
      { id: 'gospelNoPressure', when: 'early',
        tip: 'No pressure. Never ask "Did you tell anyone today?" Share your own faith where they can hear it, and pray for friends by name. When they tell you about it, tap it.' },
      { id: 'gospelNoCounting', when: 'anytime',
        tip: 'Never count converts. The seed is for the telling, whatever the answer. If an island appears, say "God did that." No tallies, no comparing the children.' },
      { id: 'gospelFaithfulness', when: 'anytime',
        tip: 'Celebrate faithfulness, not results: "You spoke up. That was brave." Then keep them praying for that person. A kind friendship comes first.' }
    ],
    familyTalk: { theme: 'Planting and watering', verse: '1 Corinthians 3:6-9', questions: [
      'If we plant the seed, who makes it grow?',
      'Who planted and watered so that our family knows Jesus?',
      'Who could we pray for this week?' ] }
  };

  /* ---- parentCoach: every parentTips line, then more for the long haul. { id, when, tip }
          when: 'early' (month 1), 'anytime', 'hard-night', 'slump' (interest fading), 'later' (month 3 on). ---- */
  var parentCoach = parentTips.map(function (t, i) { return { id: 'tip' + (i + 1), when: 'anytime', tip: t }; }).concat([
    { id: 'opposite', when: 'early', tip: 'Pick the one thing that bothers you most and hunt for its opposite. Fights? Catch every calm minute together.' },
    { id: 'practiseCalm', when: 'early', tip: 'Practise Stop and Pray once a day when nobody is upset. Skills learned calm get used when cross.' },
    { id: 'askPlan', when: 'early', tip: 'At lunch, ask "What was your plan again?" A plan remembered at noon is a plan used at three.' },
    { id: 'prayAloud', when: 'anytime', tip: 'Pray short prayers out loud in your own hard moments. "Jesus, help me be patient." They learn all-day prayer by hearing it.' },
    { id: 'strawPrivate', when: 'anytime', tip: 'Name straw quietly, away from brothers and sisters. Shame in front of others teaches hiding.' },
    { id: 'caveInNight', when: 'hard-night', tip: 'On a cave-in night: a hug, the Rock line, bed. Talk about it tomorrow in daylight, and lay the first stone together.' },
    { id: 'notCaring', when: 'slump', tip: 'If a child says "I don\'t care": don\'t push the game. Drop to the morning plan and one true praise a day for a week.' },
    { id: 'noveltyDip', when: 'slump', tip: 'Weeks four to six feel flat. That is normal. Keep the night catch-up, even if the building waits.' },
    { id: 'youLapsed', when: 'slump', tip: 'Missed a week yourself? Say so, say sorry, start again tonight. That is the lesson, lived.' },
    { id: 'eldest', when: 'later', tip: 'Give the eldest a real job: designing a blueprint, or coaching a younger one\'s plan. Trust grows character faster than gems.' },
    { id: 'serve', when: 'later', tip: 'Do one thing a month for someone outside the house, together. Character grows when it is spent on others.' },
    { id: 'fadeTaps', when: 'later', tip: 'When a fruit shows most days, stop tapping it and just say thank you. The aim is a child who does it with no iPad in the room.' },
    { id: 'endGoal', when: 'later', tip: 'The game is scaffolding. Success is the day they pray, plan and say sorry without it.' }
  ]).concat(gospel.parentTips);

  /* ---- weeklyCheck: 60 seconds, once a week, grown-ups only. A quick pulse between the monthly
          growthCheck. Same item ids as growthCheck so the two can sit on one chart.
          Score each 0-3 on the one scale. For 'lower' items the page turns it round (3 - value),
          so on the trend line higher is always better. ---- */
  var weeklyCheck = {
    intro: 'Sixty seconds, once a week, grown-ups only. Go with your first answer.',
    when: 'Sunday night, after the children are in bed.',
    lookBack: 'Think about the last seven days.',
    perChild: true,
    scale: [
      { value: 0, label: 'Hardly ever' },
      { value: 1, label: 'Some days' },
      { value: 2, label: 'Most days' },
      { value: 3, label: 'Every day' }
    ],
    items: [
      { id: 'fights', better: 'lower', fruit: 'b', ask: 'Fights with a brother or sister?' },
      { id: 'rude', better: 'lower', fruit: 'k', ask: 'Rude or unkind words to a brother or sister?' },
      { id: 'blowups', better: 'lower', fruit: 'p', ask: 'Blow-ups or tantrums?' },
      { id: 'grumble', better: 'lower', fruit: 'o', ask: 'Complaining about schoolwork?' },
      { id: 'chores', better: 'higher', fruit: 'v', ask: 'Jobs done on time without a second reminder?' },
      { id: 'kindWords', better: 'higher', fruit: 'e', ask: 'Kind words that nobody asked for?' },
      { id: 'turnsToGod', better: 'higher', fruit: null, ask: 'Turning to God in the day without being told?' }
    ],
    parentItem: { id: 'me', better: 'higher', ask: 'Me: did I name more good than I corrected, and stay calm?' },
    trend: { average: 4, min: 0, max: 3, working: 0.4, peaceful: 2.3 },
    howToRead: [
      'Read the four-week average, never one week. One bad week is a cold, a late night or school holidays.',
      'Expect a jump in weeks 1 to 3 and a dip in weeks 4 to 6 when the newness wears off. The line that matters starts at week 6.',
      'Working: by month 3 the average sits about half a point above your first month, and it holds at month 6.',
      'One item stuck at the bad end for four weeks: make it next month\'s fruit, and give that child a hard-moment plan for it.',
      'Line falling three weeks in a row: look at your own answer first. When the grown-up line drops, the children\'s follows.',
      'Lots of gems but a flat line for six weeks: they are playing the game, not changing. Tap less, talk more.',
      'Prayer stuck while the rest rise: behaviour is improving, but not from the root. Pray out loud yourself, and practise Stop and Pray when calm.',
      'A steady line near the top is a peaceful home, not a stall. Start fading the taps.'
    ],
    neverShow: 'Never shown to the children. Never compared between children.'
  };

  /* ---- fadePlan: what changes by the calendar, so the scaffolding comes down and the character
          stays. (growthCheck.fadeRules are the "when you see this" triggers; this is the timetable.) ---- */
  var fadePlan = [
    { month: 1, name: 'Learn it', changes: [
      'Grown-ups tap fruit often and fast.',
      'Morning plan every day, with a grown-up beside each child.',
      'Practise Stop and Pray once a day when nobody is upset.' ] },
    { month: 3, name: 'Hand it over', changes: [
      'Tap only fruit that cost something. Say thank you for the rest.',
      'Each child names their own fruit and straw at night before a grown-up adds any.',
      'Each child writes their own hard moment and plan.' ] },
    { month: 6, name: 'Turn it outward', changes: [
      'The eldest coaches a younger one through the morning plan.',
      'The children choose the month\'s family challenge.',
      'One family service project a month counts as gold: time with God, spent on others.',
      'Fire nights drop to once a week for everyone.' ] },
    { month: 12, name: 'Keep the habits, rest the game', changes: [
      'Morning plan and night catch-up carry on by voice, with no iPad.',
      'The eldest keeps a journal or prayer list instead of blocks.',
      'The game opens once a week, for the family talk.',
      'The City stays as the family\'s stones of remembrance.' ] }
  ];

  /* ---- blueprints: every seasons.blueprints month (same month, name, line, verse, verseLine, fruit)
          plus what makes it beautiful, a suggested size, the free-build idea and a family challenge. ---- */
  var bpExtras = {
    1: ['A tall striped tower with a lamp room of glass at the top.', 'medium', 'The lamp room and a rocky path',
      'Do one good thing each day that nobody sees. Tell only Jesus.'],
    2: ['A neat row of windows, a bell and a bright front door.', 'small', 'The bell tower and a play yard',
      'Jobs chart week: every job on time, no reminders. Celebrate with a family game.'],
    3: ['Two stone arches meeting in the middle over still water.', 'medium', 'Lanterns along the rail',
      'Peace table: when a quarrel starts, both sit down, each says what they want, and you find one answer.'],
    4: ['A little chapel wrapped in flowers, with one round window.', 'small', 'The garden and a gate',
      'Secret helper: each person does one loving job a day for someone in the family.'],
    5: ['Wide windows, an open door and a long table you can see from outside.', 'large', 'The table and the welcome path',
      'Ask someone over for a meal. The children plan it and serve.'],
    6: ['A tall, slim tower with a lookout window on every side.', 'medium', 'The lookout and a flag',
      'Stop and Pray week: everyone, grown-ups too, prays one breath prayer a day out loud.'],
    7: ['Warm windows, a wide porch and a lantern by the door.', 'medium', 'The porch and a stable out the back',
      'Soft voice week: answer softly even when cross. Grown-ups go first.'],
    8: ['A big red barn with wide doors and a loft window.', 'large', 'The field and a fence',
      'Plant something slow, like beans or sunflowers, and wait for it together.'],
    9: ['A tiny hut by still water, with one warm window.', 'small', 'The sheepfold and a stream',
      'Quiet ten: ten quiet minutes each day with a Bible story or a psalm.'],
    10: ['A strong arch with a watch window above the gate.', 'medium', 'The gate doors and a banner',
      'Mouth guard week: before speaking when cross, ask "Is it true? Is it kind?"'],
    11: ['A row of windows facing the sea, and a bell for the boats.', 'large', 'The jetty and a little boat',
      'Waiting jar: every time someone waits well, a stone goes in the jar. Fill it together.'],
    12: ['Rough timber, golden light and a star over the roof.', 'small', 'The star and the manger',
      'Give good news: make a card or a gift for a neighbour, and tell them why.']
  };
  var blueprints = seasons.blueprints.map(function (b) {
    var x = bpExtras[b.month] || [], out = {}, k;
    for (k in b) out[k] = b[k];
    out.id = 'bp' + b.month;
    out.beauty = x[0] || '';
    out.size = x[1] || 'medium';
    out.freeBuild = x[2] || '';
    out.challenge = x[3] || '';
    return out;
  });

  /* ---- fireWordsOlder: the same fire lines as fireWords, reworded for ages 8 and 12.
          Age 6 uses fireWords as it stands. ---- */
  var fireWordsOlder = {
    before: {
      '8': 'One day Jesus will show what lasts in everything we have done. Tonight is a small picture of that. The fire is not God being cross. Jesus took that on the cross.',
      '12': 'Paul says each one\'s work will be shown for what it is. Tonight is a small picture of that day. It tests the work, never His love. Belonging to Him comes by trusting Him, not by building.'
    },
    small: {
      '8': 'Some straw burned and knocked blocks down. That part couldn\'t last. Your gold, silver and gems are not lost: they are in your rubble pile, ready to build back. Jesus loves you just the same.',
      '12': 'A bit of straw burned. That part didn\'t last. Everything done with Him is still yours. Fill the gap this week.'
    },
    wallFalls: {
      '8': 'This wall had a lot of straw, so it fell. That is sad. Every stone is safe. Only the stacking is lost. We can build it again, stone by stone.',
      '12': 'That wall was carrying too much straw to stand. It is a real loss, and it is fine to feel it. The stones are safe. What would you build differently?'
    },
    caveIn: {
      '8': 'The building fell. It is okay to feel sad. The Rock has not moved. Jesus hasn\'t moved, and He loves you just the same. Nothing you did with Jesus is lost. We will rebuild together.',
      '12': 'It came down. That hurts. Look at what is left: the foundation. The Rock didn\'t move. Jesus hasn\'t moved, and He loves you just the same. We will rebuild.'
    },
    stoodFirm: {
      '8': 'The fire came, and it stood. What you built with Jesus lasts. Let\'s thank Him.',
      '12': 'It stood. What is built with Him lasts. Thank Him for it. He grew the fruit.'
    },
    sealed: {
      '8': 'It is finished, and it stood through the fire. It goes into the City on the Rock, where nothing can ever be lost. Where would you like it?',
      '12': 'Finished, and tested. It joins the City, where nothing is ever lost. Choose its place, and thank the One who built it with you.'
    }
  };

  /* ---- identityMilestones: who the child is becoming, over months. Named out loud by a parent,
          never shown as a bar to fill, never paid with blocks. counts = what the page tallies quietly. ---- */
  var identityMilestones = [
    { id: 'peacemaker', title: 'Peacemaker', fruit: 'b', counts: 'quarrels settled without a grown-up', needs: 10,
      line: 'Ten times you made peace on your own. He is making you a peacemaker.' },
    { id: 'gentleAnswer', title: 'Gentle Answer', fruit: 'k', counts: 'soft answers when cross', needs: 15,
      line: 'Fifteen times you were cross and answered softly. God has been making you gentle.' },
    { id: 'steadyHeart', title: 'Steady Heart', fruit: 'p', counts: 'Stop and Pray moments in a real hard moment', needs: 20,
      line: 'Twenty times you stopped and prayed when it was hard. He is teaching you to turn to Him.' },
    { id: 'firstTime', title: 'First-Time Helper', fruit: 'v', counts: 'chores done on time with no reminder', needs: 30,
      line: 'Thirty jobs done on time. God is making you faithful.' },
    { id: 'keepsGoing', title: 'Keeps Going', fruit: 't', counts: 'times they kept trying at hard schoolwork', needs: 20,
      line: 'Twenty times it was hard and you kept going. God has grown patience in you.' },
    { id: 'quickToMendIt', title: 'Quick to Mend It', fruit: 'b', counts: 'straw owned up to before being asked', needs: 10,
      line: 'Ten times you owned up before anyone asked. He is teaching you to walk in the light.' },
    { id: 'encourager', title: 'Encourager', fruit: 'e', counts: 'times they named fruit in a brother or sister', needs: 25,
      line: 'Twenty-five times you saw good in someone else and said so. God is making you an encourager.' },
    { id: 'friendOfGod', title: 'Days with Jesus', fruit: null, counts: 'days with time with God', needs: 100,
      line: 'One hundred days with Jesus. He has loved every one of them. He is drawing you close.' }
  ];

  /* ---- tiny helpers ---- */
  /* Age band for words keyed '6' / '8' / '12'. */
  function ageBand(age) { age = Number(age); return age <= 7 ? '6' : (age <= 10 ? '8' : '12'); }
  /* Pick the wording for an age from { '6':..., '8':..., '12':... }. Anything else is passed back as is. */
  function forAge(thing, age) {
    if (thing === null || typeof thing !== 'object' || Array.isArray(thing)) return thing;
    var b = ageBand(age);
    if (thing[b] != null) return thing[b];
    if (thing['8'] != null) return thing['8'];
    if (thing['6'] != null) return thing['6'];
    if (thing['12'] != null) return thing['12'];
    return thing;
  }
  /* Find an item by id in any of the lists. */
  function byId(list, id) {
    for (var i = 0; i < (list || []).length; i++) if (list[i] && list[i].id === id) return list[i];
    return null;
  }
  /* Rotate through a list by a counter (day, week or month number). */
  function pick(list, n) { return list && list.length ? list[((n % list.length) + list.length) % list.length] : null; }

  /* =====================================================================================================
     ROUND 3 (reviewers). All additive: new keys, new fields, new items on the end of lists.
     ===================================================================================================== */

  /* ---- Item 3: gaps in the named behaviours ---- */
  /* Hard moment "I want to say something mean" (top-level hardMoments only; breath prayer first). */
  hardMoments.push({
    id: 'mean', icon: 'speech-zigzag', label: 'I want to say something mean', when: 'I want to say something mean',
    fruit: 'k', iconIdea: 'A zigzag speech bubble with a hand held over it', fruits: ['k', 'p', 'e'],
    iWill: [
      { id: 'mean-1', type: 'pray', label: 'Breathe and pray, "Jesus, guard my mouth"', will: 'breathe and pray, Jesus, guard my mouth' },
      { id: 'mean-2', type: 'do', label: 'Close my mouth and count to five', will: 'close my mouth and count to five' },
      { id: 'mean-3', type: 'say', label: 'Say what I need in kind words, or say nothing', will: 'say what I need in kind words, or say nothing' }
    ]
  });
  /* A positive plan for kind speech: something to go looking for, not only something to avoid. */
  morningPlan.responses.push({ id: 'kindWord', icon: 'heart-speech', label: 'Look for one kind thing to say',
    will: 'look for one kind thing to say to {sibling}' });
  morningPlan.positivePlans = [
    { id: 'kindSpeech', fruit: 'e', icon: 'heart-speech', label: 'One kind thing to say',
      plan: {
        '6': 'Today I will look for one kind thing to say to {sibling}.',
        '8': 'Today I will look for one kind thing to say to {sibling}, and say it out loud.',
        '12': 'Today I will look for one true, kind thing to say to {sibling}, and say it without being asked.'
      },
      pray: 'Jesus, show me something good in {sibling} today, and help me say it.',
      nightAsk: 'Did you find a kind thing to say? What was it?',
      praise: 'You went looking for something kind to say, and you said it. God is growing kindness in you.' }
  ];
  /* Honour lines. */
  var honour = {
    calmedAndCameBack: { fruit: 'p', label: 'Calmed down and came back', gem: 'one self-control gem, once a day at most',
      line: {
        '6': 'You were so cross, and you calmed down and came back. The Holy Spirit helped you. God is growing self-control in you.',
        '8': 'That was a big feeling, and you calmed down and came back. That is hard to do. God is growing self-control in you.',
        '12': 'You got yourself back and came back in. That takes strength you didn\'t have a year ago. God is growing self-control in you.'
      } },
    sortedItTogether: { fruit: 'b', label: 'Sorted it out together', gem: 'a peace gem each',
      line: {
        '6': 'You two sorted it out together, with no grown-up. A peace gem each. God is growing peace in you both.',
        '8': 'You worked it out between you, with no grown-up. A peace gem each. God is making peace in this family.',
        '12': 'You two worked that out yourselves. A peace gem each. That is God making peace through you.'
      } },
    spokeKindly: { fruit: 'e', label: 'Spoke kindly without being asked',
      line: 'You spoke kindly to {sibling}, and nobody asked you to. God is growing kindness in you.' },
    didNotBlowUp: { fruit: 'p', label: 'Stayed calm when it was hard',
      line: 'That was a hard moment, and you did not blow up. The Holy Spirit is helping you.' }
  };

  /* ---- Item 4: a shorter morning. For each fruit, the three hard moments that fit it best. ---- */
  var morningShort = {
    r: ['leftout', 'takes', 'noisy'],
    o: ['lose', 'school', 'chore'],
    b: ['noisy', 'takes', 'bed'],
    t: ['turn', 'school', 'tired'],
    e: ['mean', 'teased', 'leftout'],
    y: ['blamed', 'chore', 'school'],
    v: ['chore', 'school', 'bed'],
    k: ['mean', 'teased', 'blamed'],
    p: ['no', 'screen', 'takes']
  };
  /* The three hard-moment cards for a fruit code. */
  function hardMomentsFor(code) {
    return (morningShort[code] || []).map(function (id) { return byId(hardMoments, id); }).filter(Boolean);
  }

  /* ---- Item 5: the night account, rebuilt. One question at a time, child first.
          Same shape in every age band; the age-12 one is shorter and adult in tone. ---- */
  var talkAnswers = [
    { id: 'morning', label: 'This morning' },
    { id: 'hard', label: 'In a hard moment' },
    { id: 'thanks', label: 'To say thank You' },
    { id: 'lots', label: 'Lots of little times' },
    { id: 'forgot', label: 'I forgot today' }
  ];
  var nightAccount2 = {
    order: ['hardMoment', 'tomorrow', 'talkedToJesus', 'ownUp', 'confirm', 'blessing'],
    '6': {
      open: 'Let\'s look back at today with Jesus.',
      hardMoment: { ask: 'Did your hard moment come?', answers: [
        { id: 'used', label: 'I used my plan', reply: 'The hard moment came, and you did your plan. Jesus helped you.', needsConfirm: true },
        { id: 'didnt', label: 'It came and I didn\'t', reply: 'Thank you for telling the truth. That was brave. Jesus loves you just the same.', next: 'tomorrow' },
        { id: 'notCome', label: 'It didn\'t come', reply: 'It didn\'t come today. Your plan is ready for when it does.' } ] },
      tomorrow: { ask: 'What will you try tomorrow?', reply: 'Good. We will ask Jesus to help you with that.',
        nextMorning: { ask: 'Yesterday was hard. Keep your plan, or change it?', keep: 'Keep my plan', change: 'Change my plan' } },
      talkedToJesus: { ask: 'When did you talk to Jesus today?', answers: talkAnswers,
        reply: { any: 'He loved hearing from you.', forgot: 'Thanks for telling me. He is here right now. Let\'s say hello.' },
        note: 'No reward for any answer. It is only a look back.' },
      ownUp: { prompt: 'Is there anything you want to own up to?', yes: 'I want to own up', no: 'Not today',
        praise: 'You told me before I asked. That took courage. Thank you.',
        note: 'With a grown-up, sitting close. Sorry is never a button at this age.' },
      confirm: { line: 'A grown-up says yes', parentAsk: 'Did you see it, or do you believe it? Either is enough.',
        yes: 'Yes', given: 'Jesus helped you. Here is your gem.' },
      blessing: [ 'Today is finished. It is safe with Jesus. Sleep well.',
        'Jesus loves you tonight just the same as this morning. Goodnight.' ]
    },
    '8': {
      open: 'Let\'s look back at today with Jesus.',
      hardMoment: { ask: 'Did your hard moment come today?', answers: [
        { id: 'used', label: 'I used my plan', reply: 'It came, and you did what you planned. Jesus helped you.', needsConfirm: true },
        { id: 'didnt', label: 'It came and I didn\'t', reply: 'Thanks for being honest. That counts for a lot. Jesus loves you just the same.', next: 'tomorrow' },
        { id: 'notCome', label: 'It didn\'t come', reply: 'Not today. Your plan is ready for when it does.' } ] },
      tomorrow: { ask: 'What will you try tomorrow?', reply: 'Good plan. Ask Jesus to help you with it.',
        nextMorning: { ask: 'Yesterday it came and it was hard. Keep your plan, or change it?', keep: 'Keep my plan', change: 'Change my plan' } },
      talkedToJesus: { ask: 'When did you talk to Jesus today?', answers: talkAnswers,
        reply: { any: 'He was glad to hear from you.', forgot: 'Thanks for being honest. He is here now. Say hello.' },
        note: 'No reward for any answer. It is only a look back.' },
      ownUp: { prompt: 'Just you and Jesus. Anything you want to own up to?', yes: 'I want to own up', no: 'Not today',
        praise: 'You owned up before anyone asked. That is walking in the light.',
        note: 'Private. No one else sees the answer.' },
      confirm: { line: 'A grown-up says yes', parentAsk: 'Did you see it, or do you believe it? Either is enough.',
        yes: 'Yes', given: 'Jesus helped you. Here is this morning\'s gem.' },
      blessing: [ 'Today is finished and safe with Jesus. His mercies are new in the morning. Goodnight.',
        'You are loved the same tonight as this morning. Goodnight.' ]
    },
    '12': {
      open: 'A quick look back.',
      hardMoment: { ask: 'Did the moment you planned for come up?', answers: [
        { id: 'used', label: 'Yes, and I used my plan', reply: 'Good. Thank Him for the help.', needsConfirm: true },
        { id: 'didnt', label: 'Yes, and I didn\'t', reply: 'Thanks for saying so. Honesty is its own kind of strength.', next: 'tomorrow' },
        { id: 'notCome', label: 'It didn\'t come up', reply: 'Fair enough. The plan keeps.' } ] },
      tomorrow: { ask: 'What would you do differently tomorrow?', reply: 'Worth a try. Ask Him for help with it.',
        nextMorning: { ask: 'Yesterday didn\'t go to plan. Keep the plan, or change it?', keep: 'Keep it', change: 'Change it' } },
      talkedToJesus: { ask: 'When did you talk to God today?', answers: talkAnswers,
        reply: { any: 'Good. Keep the conversation going.', forgot: 'It happens. He is here now.' },
        note: 'No reward for any answer. Not checked.' },
      ownUp: { prompt: 'Anything from today you want to deal with?', yes: 'Yes, I\'ll add it', no: 'Nothing today',
        dealtWith: 'I\'ve dealt with it',
        praise: 'You brought it up yourself. That takes courage.',
        note: 'Private. "I\'ve dealt with it" is a full answer. Her prayer is not checked.' },
      confirm: { line: 'A grown-up says yes', parentAsk: 'Take her word for it.',
        yes: 'Yes', given: 'This morning\'s gem. He helped you.' },
      blessing: [ 'The day is done. Leave it with Him. Goodnight.',
        'His mercies are new every morning. Goodnight.' ]
    }
  };

  /* ---- Item 6: repair, made real. Forgiveness comes first and is free. Then go and love the person. ---- */
  var repair = {
    intro: 'You are fully forgiven. Now go and love the person you hurt. That is the part that lasts.',
    didIt: { label: 'I went and did it',
      line: { '6': 'I went and made it right.', '8': 'I went and put it right.', '12': 'I went and put it right with them.' } },
    rightAgain: { label: 'We\'re right again', ask: '{sibling}, are you two right again?',
      line: 'We\'re right again.', thanks: 'Thank you for forgiving. That is a gift too.' },
    prayedTogether: { label: 'We prayed it together',
      line: 'We said sorry to Jesus together, and went and made it right.',
      note: 'Age 6: a grown-up taps this after praying with the child. The child never taps sorry alone.' },
    notReadyYet: { label: 'Not ready yet',
      toChild: 'They are not ready yet. That\'s okay. You did your part. You can try again later.',
      toOther: 'You don\'t have to be ready yet. Tell us when you are.',
      later: 'Would you like to try again with {sibling} now?',
      note: 'The straw waits. It does not count against the child for today, and nobody is hurried into saying "I forgive you".' },
    taskDone: { label: 'I did the job', line: 'I went back and did it properly.' },
    pearlAfter: {
      '6': 'It is mended. Look, pearl where the straw was.',
      '8': 'Sorry said and put right. Pearl where the straw was. You and {sibling} are right again.',
      '12': 'Put right. A line of pearl where the straw was. That is what lasts.'
    }
  };

  /* ---- Item 7: prayer off the iPad ---- */
  var throughTheDay = {
    lunch: { prompt: 'What was your plan?', when: 'lunchtime',
      ifRemembered: 'You remembered. Jesus is with you this afternoon too.',
      ifForgot: 'That\'s okay. Here it is again.',
      parentNote: 'Ask it in passing, at the table or in the car. No iPad needed. A plan remembered at noon gets used at three.' },
    calmPractice: { when: 'Once a day in month 1, when nobody is upset.', minutes: 1,
      intro: 'Let\'s practise Stop and Pray, so we know it when we need it.',
      steps: [
        { say: 'Pretend something is hard. Put your stop hand up.', act: 'Stop hand, palm out.' },
        { say: 'Breathe in slowly. "Jesus,"', act: 'Breathe in for three.' },
        { say: 'Hold it. "You are here."', act: 'Hold for two.' },
        { say: 'Breathe out slowly. "Help me."', act: 'Breathe out for four.' },
        { say: 'Now say your plan out loud.', act: 'The child says "When..., I will...".' }
      ],
      close: 'That is all it takes. Jesus hears you every time.',
      parentNote: 'Do it with them. Keep it light. Skills learned calm get used when cross.' },
    quietWays: [
      { id: 'breath', label: 'A breath prayer', how: 'Breathe in, "Jesus." Breathe out, "help me." Nobody needs to know.' },
      { id: 'thanks', label: 'A thank-You', how: 'When something is good, say "Thank You, Jesus" in your head.' },
      { id: 'hand', label: 'Hand on your heart', how: 'Put your hand on your heart and say, "You are here."' },
      { id: 'arrow', label: 'An arrow prayer for someone', how: 'When you see someone sad or cross, pray one line for them.' },
      { id: 'walk', label: 'A walking prayer', how: 'Walk to another room and talk to Jesus on the way.' }
    ]
  };

  /* ---- Item 8: fairness, shown openly. "Extra mortar" is one extra straw of tolerance, never more. ---- */
  fairness.mortar = {
    name: 'Extra mortar',
    extraStraw: 1,
    kid: 'Rebuilders get extra mortar for a while. Your walls hold a little more while you build again.',
    kidEnds: 'Your walls are strong again. The extra mortar has done its job.',
    sibling: 'When someone is rebuilding, they get extra mortar. It will be the same for you if your wall ever falls. Everyone gets what they need.',
    parent: 'After a wall falls or a cave-in, that child\'s walls hold one more straw than usual until the building has stood through a fire. It is one straw, never more, and it is the same rule for every child.'
  };
  fairness.lines.mortar = 'Rebuilders get extra mortar for a while.';

  /* ---- Item 9: game goals ---- */
  var commissions = {
    intro: 'Something lovely to aim for. You choose.',
    goals: [
      { id: 'twoPure', label: 'Two pure windows', line: 'Can you make two windows of pure glass? Three gems the same for each.',
        done: 'Two pure windows. That fruit is putting down deep roots.' },
      { id: 'rainbowRow', label: 'A rainbow row', line: 'Can you lay a row with every colour of gem in it?',
        done: 'A rainbow row. The Spirit grows the whole fruit.' },
      { id: 'goldTop', label: 'Gold along the top', line: 'Can you lay gold all along the top of your front wall?',
        done: 'Gold along the top. Time with Jesus crowns the wall.' },
      { id: 'windowEveryWall', label: 'A window in every wall', line: 'Can you put a window in every wall?',
        done: 'A window in every wall. Light gets in from every side.' }
    ],
    spire: {
      dare: 'Dare to build a spire? If any straw burns, the spire comes down.',
      yes: 'I dare', no: 'Not this time',
      falls: 'Some straw burned, so the spire came down. The stones are safe. You can dare again.',
      stands: 'No straw burned, and the spire stands. It points up to the One who helped you.'
    },
    practiceFire: 'This first fire is practice. Watch what straw does.',
    window: {
      dark: 'This window has gone dark. A stone fell out of it. Lay it again and the light comes back.',
      relit: 'The window is shining again.'
    }
  };

  /* ---- Item 10: fade plan the page can read. flags = screen switches; message = one line shown to
          the parent when the stage begins. ---- */
  var fadeFlags = {
    1: { message: 'Month 1: learn it together. Tap fruit often, sit beside each morning plan, and practise Stop and Pray once a day when everyone is calm.',
      flags: { parentTapsPrompt: true, tapOnlyCostly: false, childSelfReport: false, ownHardMoment: false, calmPractice: true,
        lunchPrompt: true, weeklyNotDaily: false, mentor: false, serviceGold: false, childPicksChallenge: false, fireWeeklyForAll: false } },
    3: { message: 'Month 3: hand it over. The children name their own fruit and straw first, and you tap only fruit that cost something.',
      flags: { parentTapsPrompt: false, tapOnlyCostly: true, childSelfReport: true, ownHardMoment: true, calmPractice: false,
        lunchPrompt: true, weeklyNotDaily: false, mentor: false, serviceGold: false, childPicksChallenge: false, fireWeeklyForAll: false } },
    6: { message: 'Month 6: turn it outward. The eldest coaches, the children choose the challenge, and serving others together counts as gold.',
      flags: { parentTapsPrompt: false, tapOnlyCostly: true, childSelfReport: true, ownHardMoment: true, calmPractice: false,
        lunchPrompt: false, weeklyNotDaily: false, mentor: true, serviceGold: true, childPicksChallenge: true, fireWeeklyForAll: true } },
    12: { message: 'Month 12: keep the habits, rest the game. Plan and look back by voice each day, and open the game once a week.',
      flags: { parentTapsPrompt: false, tapOnlyCostly: true, childSelfReport: true, ownHardMoment: true, calmPractice: false,
        lunchPrompt: false, weeklyNotDaily: true, mentor: true, serviceGold: true, childPicksChallenge: true, fireWeeklyForAll: true } }
  };
  fadePlan.forEach(function (s) { s.message = fadeFlags[s.month].message; s.flags = fadeFlags[s.month].flags; });
  /* The stage for a month number (1-based): the latest stage that has begun. */
  function fadeStage(monthNumber) {
    var out = fadePlan[0];
    fadePlan.forEach(function (s) { if (monthNumber >= s.month) out = s; });
    return out;
  }

  /* ================= v5 (17 Nov 2026): "This week's three" and choose your design =================
     cards[i] = { id, fruit (content fruit name), art (key in js/fruit-art.js), title, caption, yes, no,
                  examples{6,8,12}[3] (the Tomorrow picks), praise, sorry (the owning-up prayer) }
     The rules hold the same ids with their gem code (RockRules.CONFIG.cards). */
  var cards = [
    { id: 'calm', fruit: 'Patience', art: 'patience', title: 'Stay calm', caption: 'When I\'m cross, I stop, breathe and pray.',
      yes: 'Waiting calmly', no: 'Shouting and pulling',
      examples: {
        '6': ['When I\'m cross, I will stop and take three big breaths.', 'When I have to wait, I will count to ten.', 'When I\'m upset, I will say, "Jesus, help me."'],
        '8': ['When someone takes my things, I will stop, breathe, and ask a grown-up.', 'When I have to wait, I will pray instead of whining.', 'When I\'m angry, I will walk away and pray before I speak.'],
        '12': ['When I\'m annoyed, I will pause and pray before I answer.', 'When plans change, I will breathe and ask Jesus for a calm heart.', 'When I feel a tantrum coming, I will go somewhere quiet and pray.'] },
      praise: 'You stayed calm. Jesus grew this in you. Thank you, Jesus!', sorry: 'Jesus, I lost my temper today. I\'m sorry. Please forgive me and help me stay calm.' },
    { id: 'kind', fruit: 'Kindness', art: 'kindness', title: 'Kind words', caption: 'My words help, not hurt.',
      yes: 'Sharing and kind', no: 'Keeping it all',
      examples: {
        '6': ['I will say one kind thing to my brother or sister.', 'I will say thank you at dinner.', 'When I want to say something mean, I will close my mouth.'],
        '8': ['I will say something kind to each person at breakfast.', 'When I\'m cross, I will use a soft voice.', 'I will cheer for someone else today.'],
        '12': ['Before I speak when cross, I will ask, "Is it kind?"', 'I will encourage someone who is having a hard day.', 'I will not answer back, even when I disagree.'] },
      praise: 'Your words helped. Jesus grew this in you. Thank you, Jesus!', sorry: 'Jesus, I said hurtful words today. I\'m sorry. Please forgive me and help my words be kind.' },
    { id: 'peace', fruit: 'Peace', art: 'peace', title: 'Make peace', caption: 'I stop the fight and say sorry first.',
      yes: 'Letting go of the teddy', no: 'Fighting over it',
      examples: {
        '6': ['When we both want the same toy, I will let go and find a grown-up.', 'I will say sorry first.', 'I will keep my hands to myself.'],
        '8': ['When a fight starts, I will stop and say, "Let\'s take turns."', 'I will say sorry first, even if it\'s not all my fault.', 'I will walk away from a fight and pray.'],
        '12': ['When we argue, I will listen first and then speak.', 'I will be the first to make up after a fight.', 'I will not try to win the argument. I will try to make peace.'] },
      praise: 'You made peace. Jesus grew this in you. Thank you, Jesus!', sorry: 'Jesus, I fought today. I\'m sorry. Please forgive me and help me make peace.' },
    { id: 'work', fruit: 'Joy', art: 'joy', title: 'Cheerful work', caption: 'I start schoolwork without grumbling.',
      yes: 'Glad even when plans change', no: 'Stomping and grumbling',
      examples: {
        '6': ['I will start my schoolwork when I\'m asked.', 'I will say, "I can do hard things with Jesus."', 'I will smile and try, even when it\'s tricky.'],
        '8': ['I will start my schoolwork the first time I\'m asked.', 'When it\'s hard, I will ask for help, not grumble.', 'I will thank God for one thing about my work.'],
        '12': ['I will start my work on time with no complaining.', 'When a subject is boring, I will do it well for Jesus.', 'I will ask for help early instead of getting cross.'] },
      praise: 'You worked with a glad heart. Jesus grew this in you. Thank you, Jesus!', sorry: 'Jesus, I grumbled about my work today. I\'m sorry. Please forgive me and give me a glad heart.' },
    { id: 'gentle', fruit: 'Gentleness', art: 'gentleness', title: 'Gentle hands and voice', caption: 'Soft hands, soft voice.',
      yes: 'Soft hands, soft voice', no: 'Too rough and too loud',
      examples: {
        '6': ['I will use soft hands with my brother or sister.', 'I will use my inside voice.', 'I will be gentle with the pets.'],
        '8': ['When I\'m cross, I will keep my hands soft and my voice quiet.', 'I will play gently with the little ones.', 'I will answer softly.'],
        '12': ['A gentle answer turns anger away: I will answer softly.', 'I will be gentle with the little ones, even when they annoy me.', 'I will lower my voice when I want to raise it.'] },
      praise: 'You were gentle. Jesus grew this in you. Thank you, Jesus!', sorry: 'Jesus, I was rough today. I\'m sorry. Please forgive me and make me gentle.' },
    { id: 'first', fruit: 'Love', art: 'love', title: 'You go first', caption: 'I let someone else go first.',
      yes: 'A hug for someone sad', no: 'Turning away',
      examples: {
        '6': ['I will let my brother or sister go first.', 'I will give someone a hug when they\'re sad.', 'I will share my turn.'],
        '8': ['I will let someone else choose first.', 'I will notice who is left out and include them.', 'I will help without being asked.'],
        '12': ['I will put someone else first when it costs me something.', 'I will notice who is sad and go to them.', 'I will do a job that isn\'t mine.'] },
      praise: 'You put someone first. Jesus grew this in you. Thank you, Jesus!', sorry: 'Jesus, I only thought of me today. I\'m sorry. Please forgive me and teach me to love.' },
    { id: 'truth', fruit: 'Goodness', art: 'goodness', title: 'Tell the truth', caption: 'I tell the truth, even when it\'s hard.',
      yes: 'Giving it back', no: 'Hiding it',
      examples: {
        '6': ['I will tell the truth, even if I\'m in trouble.', 'I will give back what isn\'t mine.', 'I will say, "It was me."'],
        '8': ['I will tell the truth the first time.', 'I will own up before anyone asks.', 'I will not hide things.'],
        '12': ['I will tell the whole truth, not half of it.', 'I will own up quickly when I get it wrong.', 'I will not twist the story to look good.'] },
      praise: 'You told the truth. Jesus grew this in you. Thank you, Jesus!', sorry: 'Jesus, I wasn\'t truthful today. I\'m sorry. Please forgive me and help me be honest.' },
    { id: 'wait', fruit: 'Self-control', art: 'selfcontrol', title: 'Wait my turn, stop when asked', caption: 'I stop when I\'m asked, the first time.',
      yes: 'Stopping when time is up', no: 'Five more minutes!',
      examples: {
        '6': ['When the timer goes, I will put the iPad down.', 'I will wait for my turn.', 'When a grown-up says stop, I will stop.'],
        '8': ['I will stop the first time I\'m asked.', 'I will wait my turn without pushing in.', 'When screen time ends, I will hand it back with no fuss.'],
        '12': ['I will stop the first time I\'m asked, with no argument.', 'I will put my phone or iPad away when time is up.', 'I will wait my turn to speak.'] },
      praise: 'You stopped when you were asked. Jesus grew this in you. Thank you, Jesus!', sorry: 'Jesus, I didn\'t stop when I was asked today. I\'m sorry. Please forgive me and help me with self-control.' }
  ];
  /* Straw a grown-up can add (any day, whatever this week's three are), each with its "not" picture. */
  var strawKinds = [
    { id: 'tantrum', label: 'Tantrum', art: 'selfcontrol', did: 'had a tantrum', kind: 'wood', old: 'w3' },
    { id: 'fight', label: 'Fighting', art: 'peace', did: 'fought', kind: 'wood', old: 'w1', sibling: true },
    { id: 'rude', label: 'Rude words', art: 'kindness', did: 'used rude words', kind: 'hay', old: 'h1', sibling: true },
    { id: 'grumble', label: 'Complaining about work', art: 'joy', did: 'complained about my work', kind: 'stubble', old: 's1' },
    { id: 'lie', label: 'Lying', art: 'goodness', did: 'told a lie', kind: 'stubble', old: 's3' },
    { id: 'other', label: 'Something else', art: null, did: 'did something that can\'t last', kind: 'hay', old: null }
  ];
  var v5 = {
    morning: { ask: 'Today\'s three', prayer: 'Jesus, I can\'t do this by myself. Stay close and help me. Amen.', start: 'Start my day',
      focus: 'My focus today', noFocus: 'Tonight you\'ll choose a focus for tomorrow.' },
    seen: { title: 'I saw it!', ask: 'What did you see?', prayed: 'I stopped and prayed', praise: 'Jesus grew this in you. Thank you, Jesus!',
      twin: 'Your focus! A twin gem: two glowing gems.', prayedLine: 'You stopped and prayed. The lamp in your window is lit.', anyone: 'Anyone can tap: a brother or sister too.' },
    straw: { title: 'Straw (grown-ups)', prayFirst: 'Pray together first?', prayNow: 'Stop & Pray together', line: 'That was a straw moment. It can be put right before the fire.' },
    quick: { prayed: 'I prayed', cooled: 'I cooled down', tell: 'Tell about today', great: 'Great attitude',
      tantrum: 'Tantrum', disobeyed: 'Disobeyed', negative: 'Grumbling / negative', who: 'Who is telling?',
      rude: 'Rude words', fight: 'Fighting', lie: 'Lying', other: 'Something else',
      precious: 'Precious stones', burns: 'Burns up (wood, hay, straw)', preciousAsk: 'What did you see?', burnsAsk: 'What happened?',
      pile: 'Tonight: \ud83d\udc8e {g} blocks \u00b7 \ud83d\udd25 {b} straw', pileTitle: 'Tonight\'s pile', pileEmpty: 'Nothing on the pile yet today.',
      pileNote: 'A grown-up checks the pile tonight. Then the blocks come.', seenNote: 'A picture you saw today',
      by: { me: 'Me', sibling: 'Brother or sister', grownup: 'Grown-up' },
      waiting: '{n} waiting for a grown-up', logged: 'Saved. A grown-up will look tonight.',
      prayedLine: 'You prayed. Thank you, Jesus!', cooledLine: 'You cooled down. That is self-control growing.',
      checkTitle: 'Grown-up check', checkLine: 'Before we build: is each of these right?', keep: 'Keep', notQuite: 'Not quite', keepAll: 'Keep all',
      done: 'Done', later: 'Not now (good ones arrive in the morning; the rest are let go)', prayers: 'Prayers today (thank you, Jesus)', strawNote: 'Kept straw lands tonight. Pray together first?',
      cooledAfterTantrum: 'Cooling down after a tantrum is good. Tonight the straw stays; tomorrow try to cool down first.',
      lateNote: 'Yesterday\'s good moments have arrived.' },
    stopPray: { open: 'Stop. Take a slow breath in... and out.', steps: ['Breathe in slowly.', 'Breathe out slowly.', 'Pray:'],
      prayer: { '6': 'Jesus, I need You. Please help me calm down.', '8': 'Jesus, I need You right now. Please help me calm down and choose what is right.', '12': 'Jesus, I need You right now. Calm my heart and help me choose what is right.' },
      after: 'You stopped and prayed. That is how we build with Jesus.' },
    night: { title: 'Looking back with Jesus', ask: 'Tell the truth about today. Jesus loves you the same.', both: 'A bit of both',
      goodReply: 'Thank you.', bothReply: 'Thank you for being honest.', notReply: 'Thank you for telling the truth.',
      ownUpTitle: 'Thank you for telling the truth', ownUpLine: 'Let\'s say sorry to Jesus. He forgives us, and it\'s free.',
      pearl: 'Jesus forgives you. It\'s free. (1 John 1:9) His pearl brings back a block the fire knocked down. Lay it again.',
      pearlShine: 'Jesus forgives you. It\'s free. (1 John 1:9) Nothing has fallen, so His pearl shines on the Rock.',
      confirm: 'Grown-up: Yes, I saw that too', confirmNote: 'One tap gives tonight\'s gems. If nobody taps, they arrive in the morning anyway.',
      later: 'Not now (they arrive in the morning)', addStraw: 'Grown-up: add one straw', sums: 'Today: {good} good pieces, {straw} straw',
      goldLine: 'You were with Jesus today. This is His gift.', lateGems: 'Last night\'s gems have arrived.' },
    tomorrow: { title: 'Tomorrow',
      reminder: { '6': 'One day Jesus will show what lasts. What we build with Him lasts forever. You are safe in Jesus.',
                  '8': 'Your work will be tested by fire. Tomorrow will be played on eternity\'s screen.',
                  '12': 'Your work will be tested by fire. Tomorrow will be played on eternity\'s screen.' },
      joel: 'Your work will be tested by fire. Tomorrow will be played on eternity\'s screen.',
      verse: '1 Corinthians 3:13', ask: 'Which one will you build with tomorrow?', example: 'How will you do it?',
      pray: 'Jesus, help me tomorrow: {example} Amen.', done: 'Goodnight. Jesus is with you, and the Rock never moves.' },
    review: { title: 'This week with Jesus', ask: 'How much did I see God growing {fruit} in me this week?',
      reply: 'Thank you for being honest. God loves you, and He\'s still growing you.',
      shelf: 'Choose 3 bonus pieces', shelfNote: 'For doing your review honestly, not for high scores.', release: 'Grown-up: We talked about it',
      next: 'Choose next week\'s three', nextNote: 'The ones that need growing most come first.', done: 'Next week\'s three are ready.',
      week: 'Your week', shelfItems: { gem: 'A gem (any colour)', glass: 'A stained-glass piece', lantern: 'A lantern', flag: 'A flag' } },
    designs: { title: 'Choose your design', note: 'You can choose while the building is empty.', roof: 'Roof colour', door: 'Door colour',
      locked: 'Opens after {n} more {buildings}', name: 'What will you call your building?',
      lines: { cottage: 'A snug home with a pointed roof.', tower: 'Tall and narrow, with a pointed cap.', barn: 'Wide and low, with big doors.',
               chapel: 'A steeple that points to God.', lighthouse: 'A glowing lamp room at the top.', castle: 'Strong walls and battlements.' } },
    animals: { title: 'Someone wants to move in!', ask: 'Who will you invite?', names: { lamb: 'Lamb', cat: 'Cat', dog: 'Dog', rabbit: 'Rabbit', bird: 'Bird', hen: 'Hen' },
      first: 'Your first wall is finished. An animal can move in!', second: 'All your walls are up. Another animal can move in!',
      third: 'Your building is sealed. A third animal can move in, and all three go to the City.',
      onRock: 'The animals are waiting safe on the Rock until the wall is rebuilt.', home: '{animal} has moved in.' },
    prayers: { candles: 'Prayers: {n} of 10', lantern: 'Ten prayers! A lantern hangs on your house. Lanterns never burn.' },
    colours: { pick: 'Choose its colour', badge: 'From: {card}' }
  };

  /* ---- Warm wording for the game's limits, keyed by the rules' reason codes. ---- */
  var kidRules = {
    pullCap: 'That is enough mending for one day. Saying sorry is always free. This one will be here for you tomorrow.',
    rubbleCap: 'You have laid lots of fallen stones today. The rest are safe, and waiting for tomorrow. Today\'s new pieces can always go in.',
    notForgiven: 'Tell Jesus first. Then go and make it right.',
    slot: 'That spot needs something under it first.',
    noPiece: 'That piece is already in your wall.',
    notStraw: 'That one is not straw. It can stay.',
    notReady: 'Nearly there. Fill every space and clear the straw, and then it is ready for the fire.',
    tooSoon: 'Their house begins tomorrow. Pray for them then.',
    alreadyToday: 'You have prayed for them today. Pray again tomorrow.',
    houseDone: 'Their house is built. Keep praying for them anyway.',
    noNeighbour: 'Nobody is building next door yet. Keep planting and praying.',
    capGold: 'Gold is given once a day. You have today\'s.',
    capSilver: 'You have both of today\'s silver.',
    capStraw: 'No more straw today.',
    capGem: 'That is all the gems for one day. What a day.',
    capLamp: 'One lamp a day. The seed is still planted.'
  };

  /* live mode: the game inside the family app. Pieces come from real life through the app
     (prayer timer = gold, morning/night jobs = silver, good moments a grown-up saw = gems, confirmed bad moments = straw). */
  var live = {
    title: '{name}\'s building',
    titleNoName: 'My building',
    hello: 'Hello {name}! Choose your design. Then the good things you do in real life come here as pieces to build with.',
    none: 'Your pieces come from real life: time with God, jobs done well, and good things a grown-up saw. They show up here.',
    todayHead: 'Today\'s pieces',
    place: 'Tap a piece, then tap a glowing space.',
    arrived: 'New pieces: {list}. Tap a piece, then a glowing space.',
    strawLanded: 'Straw landed: {list}. Straw can\'t last in the fire. Tap a bale to put it right.',
    strawHint: 'There is straw in your walls. Tap a bale to put it right before the fire.',
    newDay: 'A new day!',
    fireOwed: 'Last night was fire night. Have a last look, then light the fire.',
    fireLater: 'Fire tonight. You can light it after 5 o\'clock.',
    fireButton: 'Last look before the fire',
    fireDone: 'The fire is over for today.',
    materials: { wood: 'wood', hay: 'hay', stubble: 'stubble' }
  };

  return {
    version: '1.0.0',
    fill: fill,
    pieceCodes: pieceCodes,
    fruitOrder: fruitOrder,
    fruits: fruits,
    gold: gold,
    silver: silver,
    peaceTogether: peaceTogether,
    morningPlan: morningPlan,
    stopAndPray: stopAndPray,
    straw: straw,
    sorry: sorry,
    fireWords: fireWords,
    nightAccount: nightAccount,
    familyTalk: familyTalk,
    seasons: seasons,
    milestones: milestones,
    parentTips: parentTips,
    growthCheck: growthCheck,
    fairness: fairness,
    /* added in the merge */
    praiseForAct: praiseForAct,
    hardMoments: hardMoments,
    strawCards: strawCards,
    breathPrayers: breathPrayers,
    gospel: gospel,
    parentCoach: parentCoach,
    weeklyCheck: weeklyCheck,
    fadePlan: fadePlan,
    blueprints: blueprints,
    fireWordsOlder: fireWordsOlder,
    identityMilestones: identityMilestones,
    ageBand: ageBand,
    forAge: forAge,
    byId: byId,
    pick: pick,
    /* round 3 */
    honour: honour,
    morningShort: morningShort,
    hardMomentsFor: hardMomentsFor,
    nightAccount2: nightAccount2,
    repair: repair,
    throughTheDay: throughTheDay,
    commissions: commissions,
    fadeStage: fadeStage,
    kidRules: kidRules,
    /* v5 */
    cards: cards,
    strawKinds: strawKinds,
    v5: v5,
    /* live mode */
    live: live
  };
});
