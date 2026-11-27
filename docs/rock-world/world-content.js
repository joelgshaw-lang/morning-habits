/* Rock World: the words, by age (6, 8, 12). Plain, kind, grace first (docs/rock-test/round-4-heart.md).
   Never "magic". Never rank the children. Hay words lead with forgiveness. A value is a string (all ages) or { 6, 8, 12 }.
   {name}, {n}, {piece}, {when} are filled in. Browser: defines window.WorldWords. */
(function (root) {
  'use strict';
  var T = {
    pieces: { G: 'Gold', S: 'Silver', M: 'Gem', P: 'Pearl', X: 'Jewelled gold', Y: 'Fruit stone', D: 'Door', W: 'Window', V: 'Stained-glass window', T: 'Table', B: 'Bed', L: 'Lamp', C: 'Treasure chest', N: 'Pile of gold coins', H: 'Hay' },
    pieceFrom: { G: 'time with God', S: 'jobs done well', M: 'a good moment', P: 'a changed heart', X: 'giving', Y: 'a day you nailed your focus', C: 'a finished plan', N: 'a surprise for giving', D: 'made from any 2 pieces', W: 'made from a gem', V: 'made from 2 fruit stones', T: 'made from 2 silver', B: 'made from 2 silver and a gem', L: 'made from gold' },
    /* the focus habit (27 Nov 2026, Joel) */
    focus: {
      name: { obey: 'Obeying', self: 'Self-control', kind: 'Kind words', listen: 'Listening', thanks: 'A thankful heart' },
      desc: { obey: 'Say "yes" and come straight away.', self: 'Stop, breathe, and choose what is right.', kind: 'Use kind words, even when I feel cross.', listen: 'Listen the first time I am spoken to.', thanks: 'Say thank you, and no grumbling.' },
      verse: { obey: 'Colossians 3:20', self: 'Galatians 5:22-23', kind: 'Ephesians 4:32', listen: 'James 1:19', thanks: '1 Thessalonians 5:18' },
      pick: '🎯 Pick a focus', chip: '🎯 {name} · {n} of 7', title: '🎯 My focus',
      choose: { 6: 'Pick one thing to grow in. Each day you nail it, you get a fruit stone. 7 nailed days, and something big appears on your island!', 8: 'Pick one thing to grow in. Each day a grown-up says you nailed it, you get a fruit stone to build with. 7 nailed days, and something big appears on your island.', 12: 'Pick one habit to grow in. Each nailed day (a grown-up decides) gives a fruit stone; every 7 nailed days build something big on your island.' },
      grace: 'A slip never takes anything away. Every nailed day counts, and Jesus helps you grow (Philippians 2:13).',
      nailBtn: '✅ Nailed it today (a grown-up says)', nailTitle: '✅ Nailed it today?', nailAsk: 'Grown-up: was today a really good day for {name}? Not perfect: really trying, and it showed. ({desc})', nailYes: 'Yes, nailed it!',
      already: 'Today is already nailed. See you tomorrow!', change: 'Pick a different focus', changeSure: 'You have {n} nailed days towards your next big surprise for {name}. A new focus starts again from 0. Anything already built stays. Change it?', changeYes: 'Yes, change it',
      nailed: { 6: '✨ You nailed it! Here is a fruit stone. Build with it, or make a stained-glass window.', 8: '✨ Nailed it! A fruit stone for you, in the colour of {name}. Build with it, or make a stained-glass window (2 stones).', 12: '✨ Nailed it: a fruit stone in the colour of {name}. Two make a stained-glass window.' },
      week: { 6: '🎉 7 nailed days of {name}! Look: {feature} beside your island!', 8: '🎉 7 nailed days of {name}! Now {feature} rises beside your island.', 12: '🎉 7 nailed days of {name}: {feature} now stands beside your island.' },
      feature: { bell: 'a bell tower', fountain: 'a fountain', tree: 'a fruit tree of the Spirit' },
      morning: '🎯 Today\'s focus: {name}. {desc}', left: '{n} more nailed days to the next big surprise.'
    },
    levels: { apprentice: '🔨 Apprentice', wall: '🧱 Wall builder', home: '🏠 Home builder', homemaker: '🏡 Home maker' },

    hello: { 6: 'Hello {name}! Tap the grey rock to lay a block.', 8: 'Hello {name}! Tap the grey rock to lay a block. Build walls, close them in, and it becomes a room.', 12: 'Hello {name}. This is your plot. Build on the grey rock: walls, a room, a door and a roof make a home.' },
    welcomeBack: 'Welcome back, {name}.',

    goal: {
      wall: { 6: 'Build a wall: 4 blocks long, 2 high.', 8: 'Build a wall: 4 blocks long and 2 blocks high.', 12: 'Start with a wall: 4 blocks long and 2 high.' },
      room: { 6: 'Join your walls all the way round to make a room.', 8: 'Close your walls all the way round to make a room.', 12: 'Close the walls all the way round to make a room.' },
      door: 'Add a door so someone can come in. Tap 🪚 Make, then Door, then tap your wall where the door goes.',
      roof: { 6: 'Put a roof on top: lay blocks across the tops of your walls ({n} of {total} covered).', 8: 'Put a roof over your room: lay blocks across from the tops of your walls ({n} of {total} covered).', 12: 'Roof the room ({n} of {total} covered).' },
      home: 'Finish your home: a room, a door and a roof.',
      bigger: { 6: 'Make your room bigger: a home needs 4 squares inside (2 by 2).', 8: 'Make your room bigger: a home needs at least 4 squares inside (2 by 2).', 12: 'A home needs at least 4 squares inside (2 by 2). Move a wall out to make the room bigger.' },
      window: 'Add a window to let the light in. Tap 🪚 Make, then Window, then tap a wall block.',
      windowHave: 'Add a window to let the light in. Tap Window in your tray, then tap a wall block.',
      doorHave: 'Add a door so someone can come in. Tap Door in your tray, then tap your wall where the door goes.',   /* play round 7: no Make when it is already in the tray */
      furn: 'Make it cosy: put 2 things inside (a bed, a table or a lamp).',
      done: 'Your home is finished! Pick a plan in 📐 Plans, make your house bigger, or build in the family middle.',
      nextPlan: 'The {name} is finished! Pick your next build in 📐 Plans.',
      saveFor: 'The {name} is finished! Save silver and gems for the {next} in 📐 Plans.',
      broken: { 6: 'Your home has a gap. Build it back so your sheep can come home.', 8: 'Your home has a gap. Build it back so your sheep can come home.', 12: 'Your home has a gap. Build it back and your sheep comes home.' }
    },
    yay: {
      wall: 'You built a wall!',
      room: 'You made a room! It has an inside now.',
      door: 'A door! Now someone can come in.',
      roof: 'The roof is on. It is dry inside now.',
      home: 'It is a home! A sheep has moved in.',
      window: 'A window! Light comes in.',
      furn: 'Now it feels like home.',
      unlocked: 'The bridge to the family middle is open.',
      mended: 'Your home is mended! Your sheep came home.',
      broken: 'Your home has a gap now. Your sheep is safe nearby. Mend the gap and it will come home.',
      sticker: '⭐ Your home stood through the fire. A sticker for you.',
      changed: '💛 A changed heart sticker for you: you did less, and filled it in for good.',
      chest: '🧰 A treasure chest for finishing your plan! It is in your pieces.',
      coins: '🪙 A pile of gold coins for your giving! It is in your pieces.',
      stickerClean: '⭐ Nothing burned tonight! A shining sticker for you.'
    },

    why: {
      locked: 'The middle opens when your home is done: a room, a door and a roof.',
      noGround: { 6: 'You can only build on your plot.', 8: 'You can only build on your own plot.', 12: 'That is off your plot.' },
      taken: '',
      tooHigh: 'That is as high as you can build.',
      none: 'No {piece} left today. Your pieces come from real life. More tomorrow.',
      needsBelow: 'A {piece} needs to stand on the ground or on a block.',
      nothingOnTop: 'Nothing can sit on top of that.',
      doorSpace: 'A door needs two spaces, one above the other.',
      floating: 'A block has to touch another block.',
      hay: 'That is hay. Tap it to put it right.',
      noPost: { 6: 'That is too far out. Build a post up from the ground first.', 8: 'That is too far out. It needs a post under it: build up from the ground nearer to it.', 12: 'That is too far out. It needs a post under it: build up from the ground nearer to it.' },
      leaning: 'That block is leaning on hay. Put the hay right first.',
      notWall: 'Tap a wall block to put it in the wall.',
      holding: 'Something is resting on that. Pick up the one on top first.',
      pearl: 'Pearls stay where they are. They are strong.',
      brace: 'A silver brace is holding the wall up here. Choose gold, silver or a gem and tap it to fill it again.',
      noTool: 'Choose a piece at the bottom first.'
    },
    outOfPieces: { 6: "That's all your pieces for today. You can still walk and look around.", 8: "That's today's pieces. You can still walk about, go inside and look around.", 12: "That's today's pieces. Walk about, go inside, have a look." },
    closer: 'Closer now. Tap again to build.',
    scene: { sky: '☁️ Your rock floats in the sky.', sea: '🌊 Your rock stands in the sea. Wise builders build on the rock!' },
    madeOne: 'You made a {piece}. Tap where it goes.',
    plan: {
      note: 'Plans use silver and gems. Keep your gold to build with: it shines brightest in your walls. A plan\'s outline shows on your rock in blue: tap a blue square and your builder fills it in.',
      bought: 'The {name} plan is ready to build! Tap "Build this one" to see its outline.',
      placed: { 6: 'Here is the {name}! Tap the blue squares to build it.', 8: 'The {name} plan is on your rock. Tap a blue square to build there. {n} blocks to go.', 12: '{name} plan placed: {n} blocks. Tap a blue square to build it.' },
      left: '{n} of {total} blocks to go. Tap a blue square.',
      doorLeft: 'Only the door is left! Make a door (🪚 Make → Door), then tap the door gap.',
      leftHidden: '{n} of {total} blocks to go. Outline hidden (👁️ Show plan).',
      done: 'The {name} is finished!',
      isHome: 'It is a home, and a sheep moved in.',
      noFit: 'There is no room for that plan yet. Make room, or grow your rock.',
      notFurniture: 'That square is part of the plan. Furniture goes inside the room.',
      wallsFirst: 'Build the walls up first, then the roof can go on top.',
      doorHere: 'The door goes here. Make a door (🪚 Make → Door), then tap this spot.',
      hidden: 'Plan outline hidden. Build any way you like. If your blocks match the plan, it still counts.',
      shown: 'Plan outline back on. Tap a blue square to build there.'
    },
    swapped: 'The {piece} is in. {blocks} came back to build with.',
    make: { need: 'needs {need}' },
    insideHint: { 6: 'You are looking through your builder\'s eyes. Push the round stick to walk.', 8: 'You are looking through your builder\'s eyes. Push the round stick to walk, and drag to look around.', 12: 'Builder\'s eyes. Round stick to walk, drag to look, tap to build.' },
    outsideHint: 'Drag to turn. Pinch to zoom. Push the round stick to walk.',
    tooFar: 'Your builder can\'t get close enough to build there.',
    tomorrowPlan: { 6: 'Tomorrow: more pieces for your {name}! {n} to go.', 8: '{name}: {n} to go. Tomorrow\'s pieces bring it closer!', 12: '{name}: {n} to go. More pieces tomorrow.' },
    tomorrowHome: 'Tomorrow: new pieces to finish your home.',
    noWay: 'Your builder can\'t find a way there. Is something in the way? Tap ✋ Pick up, then a table or bed, to make room.',
    noRoom: 'There is no room inside yet. Build a room first.',

    sandLesson: {
      6: 'This is sand. Jesus told a story: a wise man built his house on the rock, and it stood in the storm. Listening to Jesus and doing what he says is like building on the rock. Build on the grey rock.',
      8: 'This is sand. Jesus told of a wise builder who built on the rock, and a foolish one who built on sand. When the storm came, only the house on the rock stood. The wise builder is like someone who hears Jesus and does what he says. Sand is fine for a path, but build your house on the grey rock.',
      12: 'Sand. Jesus said whoever hears his words and does them is like a man who built on the rock (Matthew 7:24-27). The storm will test what stands on sand. Build your house on the rock; the rock is Jesus (1 Corinthians 3:11).'
    },

    /* the hard moment each piece came from, said kindly (28 Nov 2026) */
    area: { tantrum: 'angry shouting', listen: 'not listening', unkind: 'unkind words', rude: 'being rude', fight: 'fighting', disobeyed: 'disobeying', grumpy: 'grumbling', other: 'that hard moment' },
    /* 💛 the heart list (28 Nov 2026): short words; "Jesus loves you" said once, at the top */
    heart: {
      love: { 6: 'Jesus loves you. Let us make things right.', 8: 'Jesus loves you. Let us make things right.', 12: 'Jesus loves you, always. Let us make things right.' },
      fireTonight: '🔥 Fire tonight', fireTomorrow: '🔥 Fire tomorrow night', fireIn: '🔥 Fire in {n} days',
      empty: 'Nothing waiting. Your walls are clean.',
      spread: '{n} spread',
      danger: '🔥 Same again: this wall is in danger',
      prop: '🔩 Less! Prop it up ({n} silver)',
      lessNeedSorry: '📉 Less! Say sorry to Jesus and to them, then prop it up',
      propped: '🔩 Propped up',
      tomorrow: { 6: '⏳ Wait and see tomorrow', 8: '⏳ Tomorrow shows how strong', 12: '⏳ Tomorrow shows how strong' },
      madeRight: '✨ Made it right (a grown-up says)',
      didJesus: { 6: '🙏 Jesus forgives you. The flies are gone!', 8: '🙏 Jesus forgives you. The flies are gone, and the mould stops spreading.', 12: '🙏 Forgiven. The flies are gone and the mould stops spreading.' },
      didJesusDanger: { 6: '🙏 Jesus forgives you, right now. This wall is still weak: make a plan, and ask him to help you tomorrow.', 8: '🙏 Jesus forgives you, right now. This wall is still weak: say sorry to them, make a plan, and ask him to help you tomorrow.', 12: '🙏 Forgiven, right now. The wall is still weak: a plan and his help, and tomorrow can show the change.' },
      didThem: { 6: '🤝 You said sorry to them. The mould washed off!', 8: '🤝 You said sorry to them. The mould washed off.', 12: '🤝 You went and said sorry (Matthew 5:24). The mould washed off.' },
      didRight: { 6: '✨ Made right! It is a pearl now.', 8: '✨ Made right. It is a pearl now, and pearls do not burn.', 12: '✨ Made right. Pearls do not burn.' },
      healed: { 6: ' The mould is gone from the good blocks too!', 8: ' The good blocks the mould spoiled are good again.', 12: ' Any gold, silver or gems the mould spoiled are good again.' },
      spreadNews: { 6: '🦠 Some mould spread to {blocks}, but Jesus is ready to forgive: say sorry to him and it stops.', 8: '🦠 Some mould spread to {blocks} next to it, but Jesus is ready to forgive: sorry to him stops it.', 12: '🦠 The mould spread to {blocks}, but Jesus is ready to forgive: sorry to him stops it spreading.' },
      spreadSoon: { 6: '🦠 Jesus is ready to forgive. Say sorry to him today and the mould will not spread.', 8: '🦠 Jesus is ready to forgive. Say sorry to him today and the mould will not spread tonight.', 12: '🦠 Jesus is ready to forgive: say sorry to him today, or tonight the mould spreads.' },
      prayJesus: { 6: 'Pray: "Jesus, I am sorry for {area}. Please help me."', 8: 'Pray: "Jesus, I am sorry for {area}. Thank you for forgiving me. Please help me change."', 12: 'Pray: "Jesus, I am sorry for {area}. Thank you for forgiving me. Help me change."' },
      sayThem: { 6: 'Go and say: "I am sorry. Will you forgive me?"', 8: 'Go and say: "I am sorry for {area}. That was wrong. Will you forgive me?"', 12: 'Go and say: "I am sorry for {area}. That was wrong. Will you forgive me?"' },
      rightIdea: { tantrum: 'Help clean up anything you threw or broke.', listen: 'Ask what you need to do, then do it.', unkind: 'Say something kind to them, or make them a card.', rude: 'Say it again, kindly.', fight: 'Give back what you grabbed, or let them go first.', disobeyed: 'Go and do what you were asked, straight away.', grumpy: 'Say thank you for one thing today.', other: 'Ask a grown-up what would make it right.' },
      ideaLead: '💡 Making it right: ',
      rightTitle: '✨ Made it right?',
      rightAsk: 'Ask a grown-up: did you say sorry to them and put it right? A grown-up says yes, and you get a pearl: the fruit of a changed heart.',
      rightAskOwed: 'Ask a grown-up: did you say sorry to them and put it right? A grown-up says yes, and you get a pearl to build with.',
      rightYes: 'Yes, a grown-up says so',
      betterOther: 'other hard moments',
      noneNews: '🌟 A whole day of {area} yesterday!',
      lessNews: '📉 More {area} yesterday.',
      helping: { 6: ' Jesus is helping you change.', 8: ' Jesus is helping you change!', 12: ' Real change, with Jesus\' help.' },
      propHint: { 6: ' Say sorry and make a plan in 💛 your heart list.', 8: ' Say sorry and make a plan in 💛 your heart list.', 12: ' Say sorry and make a plan in 💛 your heart list.' }, propHintOld: { 6: ' Say sorry, and you can make it strong.', 8: ' Say sorry, then prop it up in 💛 your heart list.', 12: ' Once you have said sorry, brace it in 💛 your heart list.' },
      betterNews: { 6: '📉 It happened less yesterday: {area}! Jesus is helping you change. Say sorry, and you can make it strong.', 8: '📉 It happened less yesterday: {area}. Jesus is helping you change! Say sorry, then prop it up in 💛 your heart list.', 12: '📉 It happened less yesterday: {area}. Real change, with Jesus\' help. Once you have said sorry, brace it in 💛 your heart list.' },
      owedTag: '🔥 burned',
      makePlan: '📝 Make a plan for tomorrow', planTomorrow: '📝 One plan a day: plan this one tomorrow', sorryThenPlan: { 6: 'Say both sorries, then make a plan', 8: 'Both sorries, then a plan', 12: 'Both sorries, then a plan' },
      planHelp: { 6: '📝 Sorry, then changing: pick a plan so it happens less tomorrow.', 8: '📝 Repentance is sorry, then turning around. Pick a plan so it happens less tomorrow.', 12: '📝 Repentance is sorry, then turning around. Pick a plan so it happens less tomorrow.' },
      pfWaiting: '🪜 Holding for now: practise your plan', pfFill: '✨ Did less! Fill it in for good', pfAgain: '📝 Same again: make a new plan to hold it up', pfAgainSpan: '🪜 Same again: it gives way at the next fire',
      pfAgainHelp: 'Plans take practice. Jesus is with you. Make a new plan today, and it holds again.', pfNoPiece: 'You need a pearl, gold, silver or a gem to fill it in. A pearl comes from ✨ Made it right.',
      pfFilled: { 6: '🎉 Filled in for good! You did less: Jesus is changing you.', 8: '🎉 Filled in for good. You did less: that is real change, with Jesus\' help.', 12: '🎉 Filled in for good. The change is real (Philippians 2:13).' },
      pfFilledPearl: { 6: '🦪 A pearl filled it in: the fruit of a changed heart! It will never burn.', 8: '🦪 Filled in with a pearl: the fruit of a changed heart and changed actions (Matthew 3:8). It will never burn.', 12: '🦪 Filled with a pearl: fruit in keeping with repentance (Matthew 3:8). It will never burn.' },
      didRightPearl: { 6: '✨ Made right! Here is a pearl: the fruit of a changed heart. When you do less, it fills your platform.', 8: '✨ Made right. Here is a pearl, the fruit of a changed heart (Matthew 3:8). When you do less, it fills your platform for good.', 12: '✨ Made right: a pearl, fruit in keeping with repentance (Matthew 3:8). Once you are doing less, it fills the platform for good.' },
      more: 'Show {n} more', fewer: 'Show fewer',
      tag: { new: 'new', better: 'getting better', danger: 'in danger', pf: { waiting: 'platform: practise your plan', less: 'did less!', again: 'same again' } },
      didThemSpread: { 6: '🤝 You said sorry to them! Now ✨ make it right, and the good blocks come back too.', 8: '🤝 You said sorry to them. ✨ Made right makes the spoiled block good again.', 12: '🤝 You went and said sorry (Matthew 5:24). ✨ Made right makes the spoiled blocks good again.' },
      planSorryFirst: 'First say both sorries for the new one (🙏 and 🤝). Then you can make a plan.',
      lessNeedThem: '📉 Less! Say sorry to them, then prop it up',
      didRightOwed: { 6: '✨ Made right! Here is a pearl to build with. Pearls never burn.', 8: '✨ Made right. The piece burned, but here is a pearl to build with: pearls never burn.', 12: '✨ Made right. What burned is gone, but here is a pearl to build with: it will never burn.' },
      didRightHealed: { 6: '✨ Made right! The mould is gone, and your good block is back!', 8: '✨ Made right. The block the mould spoiled is good again.', 12: '✨ Made right: what the mould spoiled is good again.' },
      didThemOwed: { 6: '🤝 You said sorry to them. Well done!', 8: '🤝 You said sorry to them. That matters more than any block.', 12: '🤝 You went and said sorry. That matters more than any block.' },
      owedNote: 'sorry still worth saying',
      didJesusOwed: { 6: '🙏 Jesus forgives you!', 8: '🙏 Jesus forgives you. The piece burned, but you are forgiven.', 12: '🙏 Forgiven (1 John 1:9). The piece burned; the guilt is gone.' },
    },
    lamp: {
      on: { 6: '🔦 Red shows what the fire could burn or knock down. Jesus loves you. Say sorry, and ask him to help you, and you can make it strong.', 8: '🔦 Red shows what the fire could burn or knock down ({n}). Before the fire: say sorry, make a plan, or move good blocks off. Pieces glowing like coals are in danger: they burn first.', 12: '🔦 Red is what the fire would burn or bring down ({n}). Pieces glowing like coals are in danger and burn first, past any limit. Sorry, a plan, and real change make it safe.' },
      off: '🔦 Lamp off.'
    },
    hay: {
      title: '{icon} This is {what}',
      text: {
        6: 'Jesus loves you and is ready to forgive. This {what} came from {area}. Have you said sorry?',
        8: 'Jesus loves you and is ready to forgive. This {what} came from {area}. Have you said sorry? Saying sorry stops the cracks and the sand.',
        12: 'Jesus loves you and is ready to forgive. This {what} came from {area}. Have you said sorry? Sorry stops the cracks and the sand; the next day shows how strong it is.'
      },
      yesSorry: 'Yes, I said sorry',
      sorryDone: { 6: '💛 Jesus forgives you! Ask him to help you tomorrow. If it happens less, you can make this strong.', 8: '💛 Jesus forgives you. Tomorrow shows how strong this is: if {area} happens less, you can prop it up with silver. If it happens just as much, it will be in danger in the fire.', 12: '💛 Forgiven. Tomorrow shows how strong this is: if {area} happens less, you can brace it with silver; just as much, and it is in danger in the fire.' },
      waitText: { 6: 'You said sorry, and Jesus forgives you. Ask him to help you tomorrow. If it happens less, you can make this strong.', 8: 'You said sorry, and Jesus forgives you. Tomorrow shows how strong this is: if {area} happens less, you can prop it up with silver. If it happens just as much, it will be in danger in the fire.', 12: 'Forgiven. Tomorrow shows how strong this is: if {area} happens less, you can brace it with silver; just as much, and it is in danger in the fire.' },
      betterText: { 6: 'It happened less. Jesus is helping you change! Prop this up with 1 silver, and nothing will fall when it burns.', 8: 'There was less {area}. Jesus is helping you change! You can prop this up with 1 silver. When the fire comes, the brace holds and nothing falls.', 12: 'Less {area}: real change. Brace it with 1 silver and, when it burns, the brace holds the wall.' },
      dangerText: { 6: 'Jesus still loves you. But it happened just as much again, so this {what} is in danger in the fire. Ask Jesus to help you today. If it happens less, you can make it strong.', 8: 'Jesus still loves you. But {area} happened just as much again, so this {what} is in danger: in the fire it burns first, and what rests on it falls. Ask Jesus to help you today. If it happens less, you can prop it up.', 12: 'Jesus still loves you; that never changes. But {area} came back just as much, so this {what} is in danger: it burns first in the fire, past any limit, and brings down what rests on it. Less of it tomorrow, and you can brace it.' },
      proppedText: 'This {what} is propped up with silver. When it burns, the brace holds and nothing falls. When it is made right, it becomes a pearl.',
      propBtn: 'Prop it up (1 silver)',
      propDone: { 6: '🔩 Propped up! Now nothing falls when it burns.', 8: '🔩 Propped up with silver. When the fire comes, the brace will hold.', 12: '🔩 Braced with silver. When it burns, the brace holds the wall.' },
      cant: { noSilver: 'You need 1 silver to prop it up. Silver comes from jobs done well.', danger: 'This one is in danger. Ask Jesus to help you today; if {area} happens less, you can prop it up tomorrow.', wait: 'Wait and see how tomorrow goes first.', sorryFirst: 'Say sorry to them first (🤝). Then a grown-up can say it is made right.', already: 'It is already propped up.', notHay: '' },
      madeRight: { 6: 'A grown-up says we made it right', 8: 'We made it right (a grown-up says)', 12: 'It is made right (a grown-up says)' },
      braceFilled: '🔩 The brace is filled with a good block again.',
      yes: { 6: 'Yes, I said sorry', 8: 'Yes, I put it right', 12: 'Yes, I put it right' },
      no: 'Not yet',
      done: { 6: '✨ Made right! That {what} is a pearl now. It will stand through the fire.', 8: '✨ Put right with love. That {what} is a pearl now. Pearls do not burn.', 12: '✨ Put right with love. That {what} is a pearl now. Pearls do not burn.' },
      touch: 'Jesus loves you. Later, in your 💛 heart list, you can make this right.',
      touch6: 'Jesus loves you. Tonight, with a grown-up, you can make this right.',
      back: ' And one fallen block came back to build with.',
      anyway: 'Build on it anyway (it may fall in the fire)',
      last: ' This one has smoked twice. Put it right before the next fire.',
      cap: 'Jesus has already forgiven you. More pearls can come tomorrow.',
      landed: { 6: '{icon} Some {what} landed. Tap it to say sorry and make it right.', 8: '{icon} Some {what} landed. Make it right in 💛 your heart list.', 12: '{icon} Some {what} landed. Make it right in 💛 your heart list.' },
      line: 'Jesus loves you and is ready to forgive. Something in your walls is waiting to be made strong.'
    },
    rock: {
      size: '⛰️ Room to build',
      toGrow: '({n} more gold, silver or gem blocks to clear more sand)',
      grew: { 6: '⛰️ The sand blew away. More rock to build on!', 8: '⛰️ The sand blew away: more rock to build on!', 12: '⛰️ More of the rock is clear. More room to build.' },
      sand: { 6: '🏖️ Some sand blew onto the edge of your rock. The rock is still there underneath. When you say sorry to Jesus, the sand blows away.', 8: '🏖️ Sand blew onto the edge of your rock. The rock is still there underneath. Saying sorry to Jesus blows it away, and gold, silver and gems clear more.', 12: '🏖️ Sand drifted over the edge of the rock. The rock itself never moves. Sorry to Jesus clears it (1 John 1:9); gold, silver and gems clear more room.' }
    },
    chip: { heart: '💛 {n} to make right', danger: ' · {n} in danger', waiting1: '🌾 1 waiting to become a pearl', waiting: '🌾 {n} waiting to become pearls', hay: '🌾 {n} hay', leaning: ' · {n} leaning', sand: '🏖️ {n} on sand', fallen: '↩️ {n} fallen' },

    fireWhen: { tonight: 'Fire tonight.', tomorrow: 'Fire tomorrow night.', day: 'Fire on {when}.', owed: 'Fire night is waiting.' },
    fire: {
      title: '🔥 Fire night',
      text: { 6: 'Fire night! Wood, hay, stubble and chaff burn. Blocks on top of them or right next to them fall. Pearls do not burn. Tap 🔦 Check to see what could fall.', 8: 'Fire night! Wood, hay, stubble and chaff burn, and blocks resting on them or right beside them fall. Pieces in danger burn first. A platform holds, unless it was same again. Pearls and treasure do not burn. Tap 🔦 Check to see what could fall.', 12: 'Last look. Wood, hay, stubble and chaff burn and bring down what rests on them or sits beside them; pieces in danger burn first, past any limit. A platform holds unless it was same again. Pearls and treasure do not burn. 🔦 Check shows it all.' },
      storm: ' A storm comes first tonight. What stands only on sand will wash away.',
      light: 'Light the fire',
      wait: 'Not yet',
      none: '🔥 The fire came, and everything stood! Gold, silver and gems last. 🎉',
      practiceBurn: ' This was a practice fire: pieces with nothing on them burned, and the rest only smoked. Nothing fell.',
      stillSay: { 6: ' You can still say sorry: it is waiting in 💛 your heart list.', 8: ' Sorry is still worth saying for what burned, to Jesus and to them: it is waiting in 💛 your heart list.', 12: ' Sorry is still worth saying for what burned, to Jesus and to them: it is waiting in 💛 your heart list.' },
      platformGone: { 6: ' The wooden platform gave way. Jesus still loves you: plans take practice, keep trying yours.', 8: ' A platform gave way after the same thing happened again. Plans take practice: keep trying yours.', 12: ' A platform gave way after the same thing happened again. Plans take practice: keep trying yours.' },
      spoiledBack: ' {blocks} the mould had spoiled came through the fire as good as new (↩️ Put back).',
      practice: ' This first fire was practice, so nothing fell. The pieces that smoked are still there. Say sorry and make a plan, and they can be made strong.',
      smoked: ' Some pieces smoked. They are still there, and you can still make them right.',
      mercy: ' Your home was kept safe this time. That is mercy: a kindness you did not have to earn. The pieces that smoked are still there to make right.',
      away: 'Have a look at your building, then light the fire.',
      lookFirst: 'Let me look first',
      looking: 'Have a look round. Tap 🔥 Fire night when you are ready.',
      waitNote: 'You can wait once. Next time you open your world, the fire will be ready to light.',
      burned: '🔥 The fire came. {pieces} burned.',
      smoked2: { 6: ' Some pieces have smoked two times. At the next fire they will burn, even with blocks on them. You can still say sorry and make a plan before then.', 8: ' Some pieces have smoked twice. At the next fire they will burn, even if blocks rest on them. Say sorry and make a plan before then.', 12: ' Some pieces have smoked twice. At the next fire they will burn, even if blocks rest on them. Say sorry and make a plan before then.' },
      fell: { 6: ' {blocks} fell down too, but Jesus still loves you, and you can build again.', 8: ' {blocks} fell down too. Jesus still loves you. Some can be put back.', 12: ' {blocks} that rested on them or stood beside them fell. The fire tests the work, not the builder: you are safe (1 Corinthians 3:15). Some can be put back.' },
      stood: ' Nothing else fell.',
      lost: { 6: ' {blocks} broke for good in the fall. We can build again!', 8: ' {blocks} broke for good in the fall. Let us build again, on what is strong.', 12: ' {blocks} broke in the fall, gone for good; but you are not: build again on the rock.' },
      braced: ' 🔩 The silver brace held, so nothing fell there.'
    },
    storm: { lost: ' {blocks} washed away for good.', none: '⛈️ The storm came. Everything stood on the rock.', fell: '⛈️ The storm came. {blocks} on the sand washed away. What stood on the rock is still here.' },
    stickers: { title: '⭐ My stickers:', none: '⭐ No stickers yet. They come when your home stands through a fire, when there is nothing to burn, and when you finish a plan.', stood: '🔥 stood through the fire × {n}', clean: '✨ nothing to burn × {n}', plan: '📐 plans finished × {n}', week: '🏛️ big surprises from 7 nailed days × {n}', changed: '💛 a changed heart (a platform filled in) × {n}' },
    morning: { againFire: '🪜 Fire tonight: a platform is weak after the same thing happened again. Make a new plan today, and it holds.', bestWeek: '🏛️ Yesterday you reached 7 nailed days: look, {feature} beside your island!', bestPlan: '📐 Yesterday you finished a plan building. Well done!', bestFire: '⭐ Last night your home stood through the fire!', plan: '📝 Today\'s plan: {plan}', planWorked: { 6: '🎉 Your plan worked: {area} happened less! Fill in your platform in 💛 your heart list.', 8: '🎉 Your plan worked: {area} happened less yesterday! Fill in your platform in 💛 your heart list.', 12: '🎉 The plan worked: {area} happened less. Fill the platform in 💛 your heart list.' }, planAgain: { 6: '💛 Jesus loves you. Plans take practice: try your plan again today.', 8: '💛 Jesus loves you. Plans take practice: try your plan again today, or pick a new one.', 12: '💛 Plans take practice. Try it again today, or pick a new one; Jesus is with you.' }, hello: { 6: '☀️ Good morning! Yesterday you laid {blocks}.', 8: '☀️ Good morning! Yesterday {blocks} went into your walls.', 12: '☀️ Morning. Yesterday: {blocks} laid.' }, helloNew: '☀️ Good morning! A new day to build.', today: 'Today: {goal}', putBack: '↩️ Put back is ready: {blocks} to build with again.', mend: '🏠 Mend the gap in your home and your sheep comes home.' },
    /* plan cards (27 Nov 2026, research: docs/rock-world/plan-research.md). "When ..., I will ..." — one plan a day */
    planCards: {
      tantrum: { 6: ['When I feel hot and cross, I will be a turtle: stop and take 3 slow breaths.', 'When I want to shout, I will use my quiet voice and say "I feel cross."', 'When I\'m too cross, I will go to my calm spot and pray, "Jesus, help me."'], 8: ['When I feel anger rising, I will stop and take 3 slow breaths before I speak.', 'When I want to yell, I will say calmly, "I\'m feeling angry because…"', 'When I\'m too angry to talk, I will say "I need a minute", step away and pray.'], v: ['James 1:19', 'Proverbs 15:1', 'Philippians 4:6'] },
      listen: { 6: ['When Mum or Dad says my name, I will stop and look at them.', 'When I\'m told something, I will say it back.', 'When I\'m playing and get called, I will press pause first.'], 8: ['When a parent talks to me, I will pause what I\'m doing and look up.', 'When I\'m given a job, I will repeat it back so I know I heard.', 'When I\'m on a screen or busy, I will pause it the first time I\'m called.'], v: ['James 1:19', 'Proverbs 19:20', 'Proverbs 1:8'] },
      unkind: { 6: ['When I want to say something mean, I will close my lips and think "Is it kind?"', 'When I\'m upset with someone, I will say "I don\'t like that" instead of a mean word.', 'When a mean word slips out, I will say sorry and something kind straight away.'], 8: ['When I\'m about to say something unkind, I will ask: is it true, helpful, kind?', 'When someone annoys me, I will say what I need without putting them down.', 'When an unkind word slips out, I will fix it fast: sorry, then one kind thing.'], v: ['Psalm 141:3', 'Colossians 4:6', 'Ephesians 4:29'] },
      rude: { 6: ['When I want something, I will say "please" and "thank you".', 'When I feel grumpy with a grown-up, I will use my kind face and kind voice.', 'When someone is talking, I will wait for my turn to talk.'], 8: ['When I ask for something, I will use please, thank you and a calm voice.', 'When I\'m annoyed with a parent, I will keep my voice respectful (no eye-rolls).', 'When I want to interrupt, I will wait or say "Excuse me."'], v: ['Colossians 4:6', 'Ephesians 6:2', 'Romans 12:10'] },
      fight: { 6: ['When I want a toy someone has, I will ask, "Can I have a turn when you\'re done?"', 'When my hands want to hit or grab, I will put them in my pockets and walk away.', 'When we start fighting, I will go and get Mum or Dad.'], 8: ['When I want what someone else has, I will ask and agree on a turn.', 'When I feel like pushing or hitting, I will put my hands down and step back.', 'When an argument heats up, I will suggest a fair fix (turns, timer, share) or get a parent.'], v: ['Matthew 7:12', 'Romans 12:18', 'Matthew 5:9'] },
      disobeyed: { 6: ['When Mum or Dad asks me to do something, I will do it the first time.', 'When I don\'t want to, I will say "Okay" and ask nicely, "Can I finish this first?"', 'When I\'m told "no", I will say "Okay" in a calm voice.'], 8: ['When a parent asks me to do something, I will start straight away.', 'When I disagree, I will obey first, then ask respectfully to talk about it.', 'When I\'m told "no", I will accept it calmly and not sneak around it.'], v: ['Psalm 119:60', 'Luke 2:51', 'Colossians 3:20'] },
      grumpy: { 6: ['When I want to grumble, I will say one thing I\'m thankful for.', 'When I have a job I don\'t like, I will sing or hum while I do it.', 'When something feels unfair, I will ask nicely instead of whining.'], 8: ['When I notice I\'m complaining, I will switch it to one thing I\'m thankful for.', 'When I get a job I don\'t like, I will do it cheerfully and quickly.', 'When something feels unfair, I will ask calmly once instead of moaning.'], v: ['1 Thessalonians 5:18', 'Colossians 3:23', 'Philippians 2:14'] },
      other: { 6: ['When it starts to happen, I will stop and pray, "Jesus, help me."', 'When I feel it coming, I will go and tell a grown-up.', 'When it happens, I will say sorry straight away.'], 8: ['When I feel it starting, I will stop and pray, "Jesus, help me."', 'When I notice it coming, I will ask a grown-up for help.', 'When it slips out, I will put it right straight away.'], v: ['Philippians 4:6', 'Proverbs 19:20', 'Matthew 5:24'] }
    },
    /* practise it or draw it (27 Nov 2026, Joel) */
    practice: {
      tantrum: ['Pretend you feel cross. Be a turtle: tuck in, and breathe slowly with the circle, 3 times.', 'Say it now in your quiet voice: "I feel cross."', 'Walk to your calm spot and whisper, "Jesus, help me."'],
      listen: ['Ask a grown-up to say your name. Stop, and look at them!', 'Ask a grown-up to tell you a small job. Say it back.', 'Pretend you are playing. When a grown-up calls, press pause and say "Coming!"'],
      unkind: ['Close your lips, breathe with the circle, and think: is it kind?', 'Practise saying it: "I don\'t like that."', 'Practise: "Sorry. You are really good at…" and finish it with something kind.'],
      rude: ['Ask a grown-up for something now, with please and thank you.', 'Show your kind face, and say something in your kind voice.', 'Practise waiting: breathe with the circle, then say "Excuse me."'],
      fight: ['Practise asking: "Can I have a turn when you\'re done?"', 'Put your hands in your pockets and take 3 big steps away.', 'Practise saying: "Let\'s take turns. You go first!"'],
      disobeyed: ['Ask a grown-up for a small job. Say "Okay!" and do it straight away.', 'Practise in a nice voice: "Okay. Can I finish this first?"', 'Ask a grown-up to say "No." Answer "Okay" in a calm voice.'],
      grumpy: ['Say 3 things you are thankful for, right now.', 'Hum a happy tune while the circle breathes.', 'Practise asking nicely, just once: "Could we please…?"'],
      other: ['Pray now: "Jesus, help me."', 'Go and tell a grown-up your plan.', 'Practise saying sorry straight away.'],
      title: '🎭 Try your plan now', own: 'With a grown-up, act out your own plan once, right now.', wait: 'Try it… {n}', done: '✓ I practised it!',
      drawTitle: '🖍️ Draw your plan', drawLine: { 6: 'Draw you, doing your plan. (Tap Done when you have drawn.)', 8: 'Draw yourself doing your plan tomorrow: where you are, and what you do.', 12: 'Sketch the moment: where it will happen, and what you will do instead.' },
      practised: '🎭 You practised it!', drawn: '🖍️ Great drawing!', picAlt: 'My plan drawing'
    },
    cuts: { name: { set: '👑 Gold-set jewel', bril: '💎 Brilliant cut', fire: '🔥 Inner fire', rain: '🌈 Rainbow glint' }, how: { bril: 'Finish your first home', fire: 'Do less, and fill in a platform', rain: 'Nail your focus 7 days' },
      using: 'your gems now', tap: 'tap to use', chosen: 'Your gems now shine as {name}.', unlocked: '💎 A new gem cut is yours: {name}! Try it in 🪚 Make.' },
    goodArea: { tantrum: 'staying calm', listen: 'listening', unkind: 'kind words', rude: 'kind manners', fight: 'playing fair', disobeyed: 'obeying', grumpy: 'thankfulness', other: 'doing better' },
    plan2: {
      title: '📝 My plan for tomorrow',
      text: { 6: 'Jesus has forgiven you. Now pick a plan, so {area} happens less tomorrow. Say it out loud!', 8: 'You are forgiven. Now pick one plan, so {area} happens less tomorrow. Say it out loud, then try it once now.', 12: 'Forgiven. Turning around is the next step: pick one plan for {area} tomorrow. Say it, picture when it will happen, and try it once now.' },
      own: '✏️ My own plan (made with a grown-up)', ownText: 'the plan I made with a grown-up.', ownNote: 'Work it out together tonight',
      made: { 6: '📝 Your plan: {plan} The weak block is out, and a wooden platform holds its place for now. Do less tomorrow, and you can fill it in for good!', 8: '📝 Your plan: {plan} The weak block is out, and a temporary platform holds its place until tomorrow shows the change. Do less tomorrow, and you can fill it in for good.', 12: '📝 Plan: {plan} The weak block is out; a temporary platform holds its place until tomorrow shows the change. Show the change tomorrow, and you can fill it in for good.' }
    },
    putBack: { done: '↩️ {blocks} back in your pieces.', none: 'That is all the putting back for today.' },
    treasure: 'Something new is shining on the Rock.',
    arrived: 'New pieces: {list}.',
    touch: { notToday: 'That {piece} is not from today. Today\'s pieces show in the tray.', chip: 'Today: {n} left', left: 'You have {n} pieces from today to build with.', none: 'No new pieces yet today. You can look around.', used: "That's today's pieces used. Well done! You can still look around.", head: '☀️ Morning building', over: "That's this morning's building. You can still look around.", done: 'Done' }
  };
  function band(a) { a = +a || 8; return a <= 6 ? 6 : a <= 9 ? 8 : 12; }
  function pick(v, age) { return v && typeof v === 'object' && !Array.isArray(v) && (6 in v || 8 in v || 12 in v) ? v[band(age)] : v; }
  function fill(t, vars) { return String(t == null ? '' : t).replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] != null ? vars[k] : m; }); }
  function get(path, age, vars) {
    var v = path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, T);
    return fill(pick(v, age), vars);
  }
  root.WorldWords = { T: T, get: get, band: band };
})(typeof self !== 'undefined' ? self : this);
