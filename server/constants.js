// Game States
export const GAME_STATES = {
  INIT: 'INIT',
  INTRO: 'INTRO',
  MEMORY_INTRO: 'MEMORY_INTRO',
  MEMORY_PUZZLE: 'MEMORY_PUZZLE',
  MEMORY_PHYSICAL: 'MEMORY_PHYSICAL',
  MEMORY_RESOLUTION: 'MEMORY_RESOLUTION',
  ENDING: 'ENDING'
};

// Puzzle Layers (order matters!)
export const PUZZLE_LAYERS = {
  KIDS: 'KIDS',
  ADULTS: 'ADULTS',
  TOGETHER: 'TOGETHER'
};

// Puzzle Types
export const PUZZLE_TYPES = {
  DRAG_DROP: 'DRAG_DROP',
  CIPHER: 'CIPHER',
  LOCATION_SELECT: 'LOCATION_SELECT',
  TAP_TARGETS: 'TAP_TARGETS',
  SEQUENCE: 'SEQUENCE'
};

// Physical Challenge Types
export const CHALLENGE_TYPES = {
  STIRRING: 'STIRRING',
  WALKING: 'WALKING',
  TREE_SHAPE: 'TREE_SHAPE',
  ANTLERS: 'ANTLERS',
  SLEIGH_RIDE: 'SLEIGH_RIDE',
  RED_OBJECT: 'RED_OBJECT',
  STAR_SHAPE: 'STAR_SHAPE'
};

// Color Palettes
export const COLORS = {
  // Night/Exterior
  deepBlue: '#1a1a2e',
  navy: '#16213e',
  white: '#ffffff',

  // Warm/Interior
  amber: '#ffb347',
  deepOrange: '#ff8c00',
  brown: '#8b4513',

  // Tomten/Seasonal
  tomteRed: '#8b0000',
  highlight: '#c41e3a',

  // UI/Feedback
  successGreen: '#4a7c4e',
  errorRed: '#8b3a3a',
  gold: '#ffd700',

  // Text
  textLight: '#f5f5f5',
  textDark: '#2d2d2d'
};

// The 7 Memories - Complete game content
export const MEMORIES = [
  {
    id: 0,
    name: 'Tomtegröten',
    nameEn: 'The Christmas Porridge',
    intro: {
      problem: '[SWEDISH: Gröten är förstörd! Tomten minns inte hur man gör den perfekta julgröten.]',
      hint: '[SWEDISH: Vi måste hjälpa tomten att minnas receptet...]'
    },
    puzzles: {
      kids: {
        type: PUZZLE_TYPES.DRAG_DROP,
        instruction: '[SWEDISH: Dra rätt ingredienser till grytan!]',
        items: [
          { id: 'rice', label: '[SWEDISH: Ris]', correct: true },
          { id: 'milk', label: '[SWEDISH: Mjölk]', correct: true },
          { id: 'sugar', label: '[SWEDISH: Socker]', correct: true },
          { id: 'salt', label: '[SWEDISH: Salt]', correct: false },
          { id: 'pepper', label: '[SWEDISH: Peppar]', correct: false },
          { id: 'ketchup', label: '[SWEDISH: Ketchup]', correct: false }
        ],
        requiredCorrect: 3
      },
      adults: {
        type: PUZZLE_TYPES.CIPHER,
        instruction: '[SWEDISH: Var gömmer sig tomtenissarna? Lös koden!]',
        cipher: '19-11-1-16-5-20',
        answer: 'SKAPET',
        hint: '[SWEDISH: A=1, B=2, C=3...]'
      },
      together: {
        type: PUZZLE_TYPES.LOCATION_SELECT,
        instruction: '[SWEDISH: Diskutera tillsammans: Var brukar tomtenissarna gömma sig?]',
        options: [
          { id: 'cupboard', label: '[SWEDISH: I skåpet]', correct: true },
          { id: 'fridge', label: '[SWEDISH: I kylskåpet]', correct: false },
          { id: 'oven', label: '[SWEDISH: I ugnen]', correct: false },
          { id: 'sink', label: '[SWEDISH: I vasken]', correct: false },
          { id: 'window', label: '[SWEDISH: Vid fönstret]', correct: false }
        ]
      }
    },
    physical: {
      type: CHALLENGE_TYPES.STIRRING,
      instruction: '[SWEDISH: Rör om i grytan! Gör cirkelrörelser med handen.]',
      duration: 5000,
      hint: '🥄 ↻'
    },
    resolution: {
      success: '[SWEDISH: Underbart! Tomten minns nu hur man gör den perfekta julgröten. Doften av kanel och socker fyller stugan.]',
      celebration: '🎄 ⭐ 🥣'
    }
  },
  {
    id: 1,
    name: 'Lucia',
    nameEn: 'The Lucia Procession',
    intro: {
      problem: '[SWEDISH: Luciatåget har gått vilse i mörkret! Ljusen har slocknat.]',
      hint: '[SWEDISH: Vi måste tända ljusen i rätt ordning...]'
    },
    puzzles: {
      kids: {
        type: PUZZLE_TYPES.TAP_TARGETS,
        instruction: '[SWEDISH: Tänd ljusen i ordning från 1 till 7!]',
        targets: [
          { id: 1, x: 0.5, y: 0.3 },
          { id: 2, x: 0.3, y: 0.4 },
          { id: 3, x: 0.7, y: 0.4 },
          { id: 4, x: 0.2, y: 0.5 },
          { id: 5, x: 0.8, y: 0.5 },
          { id: 6, x: 0.4, y: 0.6 },
          { id: 7, x: 0.6, y: 0.6 }
        ],
        ordered: true
      },
      adults: {
        type: PUZZLE_TYPES.CIPHER,
        instruction: '[SWEDISH: Vem leder luciatåget? Lös koden!]',
        cipher: '19-1-14-11-20-1 12-21-3-9-1',
        answer: 'SANKTA LUCIA',
        hint: '[SWEDISH: A=1, B=2, C=3...]'
      },
      together: {
        type: PUZZLE_TYPES.LOCATION_SELECT,
        instruction: '[SWEDISH: Diskutera tillsammans: Vart ska luciatåget gå?]',
        options: [
          { id: 'cottage', label: '[SWEDISH: Till tomtens stuga]', correct: true },
          { id: 'forest', label: '[SWEDISH: In i skogen]', correct: false },
          { id: 'lake', label: '[SWEDISH: Till sjön]', correct: false },
          { id: 'mountain', label: '[SWEDISH: Upp på berget]', correct: false },
          { id: 'cave', label: '[SWEDISH: In i grottan]', correct: false }
        ]
      }
    },
    physical: {
      type: CHALLENGE_TYPES.WALKING,
      instruction: '[SWEDISH: Gå i procession! Gå fram och tillbaka framför kameran.]',
      duration: 3000,
      hint: '🚶 ➡️ 🚶'
    },
    resolution: {
      success: '[SWEDISH: Fantastiskt! Luciatåget lyser upp vintermörkret. Tomten minns nu den vackra traditionen.]',
      celebration: '🕯️ ✨ 👑'
    }
  },
  {
    id: 2,
    name: 'Julgranen',
    nameEn: 'The Christmas Tree',
    intro: {
      problem: '[SWEDISH: Julgranen står odekorerad! Tomten har glömt var prydnaderna finns.]',
      hint: '[SWEDISH: Hjälp tomten att pynta granen...]'
    },
    puzzles: {
      kids: {
        type: PUZZLE_TYPES.DRAG_DROP,
        instruction: '[SWEDISH: Dra rätt dekorationer till granen!]',
        items: [
          { id: 'star', label: '[SWEDISH: Stjärna]', correct: true },
          { id: 'balls', label: '[SWEDISH: Julgranskulor]', correct: true },
          { id: 'lights', label: '[SWEDISH: Ljusslinga]', correct: true },
          { id: 'sock', label: '[SWEDISH: Strumpa]', correct: false },
          { id: 'hat', label: '[SWEDISH: Hatt]', correct: false },
          { id: 'shoe', label: '[SWEDISH: Sko]', correct: false }
        ],
        requiredCorrect: 3
      },
      adults: {
        type: PUZZLE_TYPES.CIPHER,
        instruction: '[SWEDISH: Vad ska sitta högst upp? Lös koden!]',
        cipher: '19-20-10-1-18-14-1',
        answer: 'STJARNA',
        hint: '[SWEDISH: A=1, B=2, C=3... (Å=A, Ä=A, Ö=O)]'
      },
      together: {
        type: PUZZLE_TYPES.LOCATION_SELECT,
        instruction: '[SWEDISH: Diskutera tillsammans: Var ska julgranen stå?]',
        options: [
          { id: 'window', label: '[SWEDISH: Vid fönstret]', correct: true },
          { id: 'door', label: '[SWEDISH: Vid dörren]', correct: false },
          { id: 'kitchen', label: '[SWEDISH: I köket]', correct: false },
          { id: 'bedroom', label: '[SWEDISH: I sovrummet]', correct: false },
          { id: 'outside', label: '[SWEDISH: Utomhus]', correct: false }
        ]
      }
    },
    physical: {
      type: CHALLENGE_TYPES.TREE_SHAPE,
      instruction: '[SWEDISH: Forma en julgran! Sträck upp armarna som en triangel.]',
      duration: 3000,
      hint: '🌲 △'
    },
    resolution: {
      success: '[SWEDISH: Vackert! Julgranen glittrar och lyser. Tomten minns nu julens finaste tradition.]',
      celebration: '🎄 ⭐ ✨'
    }
  },
  {
    id: 3,
    name: 'Renarna',
    nameEn: 'The Reindeer',
    intro: {
      problem: '[SWEDISH: Renarna vill inte svara! Tomten har glömt deras namn.]',
      hint: '[SWEDISH: Hitta renarna och kom ihåg det viktigaste namnet...]'
    },
    puzzles: {
      kids: {
        type: PUZZLE_TYPES.TAP_TARGETS,
        instruction: '[SWEDISH: Hitta alla 4 gömda renar!]',
        targets: [
          { id: 1, x: 0.2, y: 0.3, hidden: true },
          { id: 2, x: 0.8, y: 0.4, hidden: true },
          { id: 3, x: 0.5, y: 0.7, hidden: true },
          { id: 4, x: 0.3, y: 0.6, hidden: true }
        ],
        ordered: false
      },
      adults: {
        type: PUZZLE_TYPES.CIPHER,
        instruction: '[SWEDISH: Vilken ren har en röd nos? Lös koden!]',
        cipher: '18-21-4-15-12-6',
        answer: 'RUDOLF',
        hint: '[SWEDISH: A=1, B=2, C=3...]'
      },
      together: {
        type: PUZZLE_TYPES.LOCATION_SELECT,
        instruction: '[SWEDISH: Diskutera tillsammans: Vilken ren leder släden?]',
        options: [
          { id: 'rudolf', label: '[SWEDISH: Rudolf]', correct: true },
          { id: 'dasher', label: '[SWEDISH: Dasher]', correct: false },
          { id: 'dancer', label: '[SWEDISH: Dancer]', correct: false },
          { id: 'prancer', label: '[SWEDISH: Prancer]', correct: false },
          { id: 'comet', label: '[SWEDISH: Comet]', correct: false }
        ]
      }
    },
    physical: {
      type: CHALLENGE_TYPES.ANTLERS,
      instruction: '[SWEDISH: Gör renhorn! Håll händerna ovanför huvudet som horn.]',
      duration: 3000,
      hint: '🦌 🤘'
    },
    resolution: {
      success: '[SWEDISH: Hurra! Renarna svarar glatt på sina namn. Rudolf lyser vägen med sin röda nos.]',
      celebration: '🦌 ❤️ ✨'
    }
  },
  {
    id: 4,
    name: 'Släden',
    nameEn: 'The Sleigh',
    intro: {
      problem: '[SWEDISH: Släden är i oordning! Fel saker har fastnat på den.]',
      hint: '[SWEDISH: Hjälp tomten att fixa släden...]'
    },
    puzzles: {
      kids: {
        type: PUZZLE_TYPES.DRAG_DROP,
        instruction: '[SWEDISH: Dra rätt saker till släden!]',
        items: [
          { id: 'reins', label: '[SWEDISH: Tömmar]', correct: true },
          { id: 'bells', label: '[SWEDISH: Bjällror]', correct: true },
          { id: 'blanket', label: '[SWEDISH: Filt]', correct: true },
          { id: 'anchor', label: '[SWEDISH: Ankare]', correct: false },
          { id: 'wheel', label: '[SWEDISH: Hjul]', correct: false },
          { id: 'propeller', label: '[SWEDISH: Propeller]', correct: false }
        ],
        requiredCorrect: 3
      },
      adults: {
        type: PUZZLE_TYPES.CIPHER,
        instruction: '[SWEDISH: Vad följde de tre vise männen? Lös koden!]',
        cipher: '13-1-7-9',
        answer: 'MAGI',
        hint: '[SWEDISH: A=1, B=2, C=3...]'
      },
      together: {
        type: PUZZLE_TYPES.LOCATION_SELECT,
        instruction: '[SWEDISH: Diskutera tillsammans: Vad är viktigast på släden?]',
        options: [
          { id: 'sack', label: '[SWEDISH: Julklappssäcken]', correct: true },
          { id: 'radio', label: '[SWEDISH: En radio]', correct: false },
          { id: 'gps', label: '[SWEDISH: En GPS]', correct: false },
          { id: 'coffee', label: '[SWEDISH: En kaffetermos]', correct: false },
          { id: 'phone', label: '[SWEDISH: En telefon]', correct: false }
        ]
      }
    },
    physical: {
      type: CHALLENGE_TYPES.SLEIGH_RIDE,
      instruction: '[SWEDISH: Åk släde! Studsa upp och ner som om du åker i en släde.]',
      duration: 5000,
      hint: '🛷 ↕️'
    },
    resolution: {
      success: '[SWEDISH: Perfekt! Släden är redo för färd. Bjällrorna klingar i vinternatten.]',
      celebration: '🛷 🔔 ❄️'
    }
  },
  {
    id: 5,
    name: 'Julklapparna',
    nameEn: 'The Christmas Presents',
    intro: {
      problem: '[SWEDISH: Julklappslapparna har ramlat av! Vem ska få vad?]',
      hint: '[SWEDISH: Sortera julklapparna och hitta vem som ska dela ut dem...]'
    },
    puzzles: {
      kids: {
        type: PUZZLE_TYPES.DRAG_DROP,
        instruction: '[SWEDISH: Dra julklapparna till högen!]',
        items: [
          { id: 'gift1', label: '[SWEDISH: Röd klapp]', correct: true },
          { id: 'gift2', label: '[SWEDISH: Grön klapp]', correct: true },
          { id: 'gift3', label: '[SWEDISH: Blå klapp]', correct: true },
          { id: 'rock', label: '[SWEDISH: Sten]', correct: false },
          { id: 'stick', label: '[SWEDISH: Pinne]', correct: false },
          { id: 'leaf', label: '[SWEDISH: Löv]', correct: false }
        ],
        requiredCorrect: 3
      },
      adults: {
        type: PUZZLE_TYPES.CIPHER,
        instruction: '[SWEDISH: Vem delar ut julklappar? Lös koden!]',
        cipher: '20-15-13-20-5-14',
        answer: 'TOMTEN',
        hint: '[SWEDISH: A=1, B=2, C=3...]'
      },
      together: {
        type: PUZZLE_TYPES.LOCATION_SELECT,
        instruction: '[SWEDISH: Diskutera tillsammans: Var lägger man julklapparna?]',
        options: [
          { id: 'tree', label: '[SWEDISH: Under granen]', correct: true },
          { id: 'bed', label: '[SWEDISH: Under sängen]', correct: false },
          { id: 'table', label: '[SWEDISH: På bordet]', correct: false },
          { id: 'roof', label: '[SWEDISH: På taket]', correct: false },
          { id: 'car', label: '[SWEDISH: I bilen]', correct: false }
        ]
      }
    },
    physical: {
      type: CHALLENGE_TYPES.RED_OBJECT,
      instruction: '[SWEDISH: Hitta något rött! Visa upp det för kameran.]',
      duration: 2000,
      hint: '🔴 👀'
    },
    resolution: {
      success: '[SWEDISH: Underbart! Alla julklappar har rätt lappar. Tomten är redo att dela ut dem.]',
      celebration: '🎁 🎀 ⭐'
    }
  },
  {
    id: 6,
    name: 'Julstjärnan',
    nameEn: 'The Christmas Star',
    intro: {
      problem: '[SWEDISH: Julstjärnan har försvunnit! Tomten kan inte hitta vägen utan den.]',
      hint: '[SWEDISH: Detta är det sista minnet - hjälp tomten att hitta stjärnan!]'
    },
    puzzles: {
      kids: {
        type: PUZZLE_TYPES.SEQUENCE,
        instruction: '[SWEDISH: Upprepa färgsekvensen för att tända stjärnan!]',
        sequence: ['blue', 'yellow', 'red', 'green'],
        colors: {
          blue: '#4169E1',
          yellow: '#FFD700',
          red: '#DC143C',
          green: '#228B22'
        }
      },
      adults: {
        type: PUZZLE_TYPES.CIPHER,
        instruction: '[SWEDISH: Åt vilket håll pekar julstjärnan? Lös koden!]',
        cipher: '14-15-18-18',
        answer: 'NORR',
        hint: '[SWEDISH: A=1, B=2, C=3...]'
      },
      together: {
        type: PUZZLE_TYPES.LOCATION_SELECT,
        instruction: '[SWEDISH: Diskutera tillsammans: Åt vilket håll ska tomten åka?]',
        options: [
          { id: 'north', label: '[SWEDISH: Norrut mot Polstjärnan]', correct: true },
          { id: 'south', label: '[SWEDISH: Söderut]', correct: false },
          { id: 'east', label: '[SWEDISH: Österut]', correct: false },
          { id: 'west', label: '[SWEDISH: Västerut]', correct: false },
          { id: 'down', label: '[SWEDISH: Nedåt]', correct: false }
        ]
      }
    },
    physical: {
      type: CHALLENGE_TYPES.STAR_SHAPE,
      instruction: '[SWEDISH: Forma en stjärna! Sträck ut armar och ben som en stjärna.]',
      duration: 4000,
      hint: '⭐ 🙆'
    },
    resolution: {
      success: '[SWEDISH: FANTASTISKT! Julstjärnan lyser klart på himlen! Tomten har återfått alla sina minnen och julen är räddad!]',
      celebration: '⭐ 🎄 🎅 ✨ 🎉'
    }
  }
];
