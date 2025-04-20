// Common chord progression definitions

export type RomanNumeral =
  | 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII'
  | 'i' | 'ii' | 'iii' | 'iv' | 'v' | 'vi' | 'vii'
  | 'bII' | 'bIII' | 'bVI' | 'bVII'
  | 'I7' | 'II7' | 'III7' | 'IV7' | 'V7' | 'VI7' | 'VII7'
  | 'i7' | 'ii7' | 'iii7' | 'iv7' | 'v7' | 'vi7' | 'vii7'
  | 'Imaj7' | 'IImaj7' | 'IIImaj7' | 'IVmaj7' | 'Vmaj7' | 'VImaj7' | 'VIImaj7'
  | 'imaj7' | 'iimaj7' | 'iiimaj7' | 'ivmaj7' | 'vmaj7' | 'vimaj7' | 'viimaj7'
  | 'im7' | 'iim7' | 'iiim7' | 'ivm7' | 'vm7' | 'vim7' | 'viim7'
  | 'viio' | 'viø7' | 'iiø7' | 'viiø7'
  | 'Isus4' | 'IVsus4' | 'Vsus4'
  | 'Isus2' | 'IVsus2' | 'Vsus2'
  | 'Iaug' | 'IVaug' | 'Vaug'
  | 'idim' | 'iidim' | 'iiidim' | 'ivdim' | 'vdim' | 'vidim' | 'viidim';

export interface ChordProgression {
  id: string;
  name: string;
  chords: RomanNumeral[];
  genre: string[];
  mood: string[];
  description: string;
  complexity: 'simple' | 'intermediate' | 'advanced';
  modes: ('major' | 'minor')[];
}

export const COMMON_PROGRESSIONS: ChordProgression[] = [
  // Pop/Rock Progressions
  {
    id: 'pop-1',
    name: 'I-V-vi-IV (Axis of Awesome)',
    chords: ['I', 'V', 'vi', 'IV'],
    genre: ['Pop', 'Rock'],
    mood: ['Happy', 'Uplifting', 'Anthemic'],
    description: 'One of the most popular progressions in modern pop music. Used in countless hit songs.',
    complexity: 'simple',
    modes: ['major']
  },
  {
    id: 'pop-2',
    name: 'I-IV-V-IV',
    chords: ['I', 'IV', 'V', 'IV'],
    genre: ['Pop', 'Rock'],
    mood: ['Energetic', 'Driving'],
    description: 'Classic rock progression with strong momentum.',
    complexity: 'simple',
    modes: ['major']
  },
  {
    id: 'pop-3',
    name: 'vi-IV-I-V (Sensitive)',
    chords: ['vi', 'IV', 'I', 'V'],
    genre: ['Pop', 'Ballad'],
    mood: ['Emotional', 'Melancholic'],
    description: 'Starting on the relative minor gives this a more emotional feel.',
    complexity: 'simple',
    modes: ['major']
  },
  {
    id: 'pop-4',
    name: 'I-vi-IV-V (50s Progression)',
    chords: ['I', 'vi', 'IV', 'V'],
    genre: ['Pop', 'Doo-wop', 'Oldies'],
    mood: ['Nostalgic', 'Classic'],
    description: 'The classic 1950s doo-wop progression.',
    complexity: 'simple',
    modes: ['major']
  },
  {
    id: 'pop-5',
    name: 'I-III-IV-iv',
    chords: ['I', 'III', 'IV', 'iv'],
    genre: ['Pop', 'Indie'],
    mood: ['Bittersweet', 'Contemplative'],
    description: 'The borrowed minor iv chord creates a bittersweet feeling.',
    complexity: 'intermediate',
    modes: ['major']
  },

  // Jazz Progressions
  {
    id: 'jazz-1',
    name: 'ii-V-I (Major)',
    chords: ['iim7', 'V7', 'Imaj7'],
    genre: ['Jazz', 'Bossa Nova'],
    mood: ['Sophisticated', 'Smooth'],
    description: 'The most fundamental progression in jazz. The cornerstone of jazz harmony.',
    complexity: 'intermediate',
    modes: ['major']
  },
  {
    id: 'jazz-2',
    name: 'ii-V-I (Minor)',
    chords: ['iiø7', 'V7', 'im7'],
    genre: ['Jazz'],
    mood: ['Dark', 'Mysterious'],
    description: 'Minor version of the ii-V-I with half-diminished ii chord.',
    complexity: 'intermediate',
    modes: ['minor']
  },
  {
    id: 'jazz-3',
    name: 'I-VI-ii-V (Rhythm Changes)',
    chords: ['Imaj7', 'VI7', 'iim7', 'V7'],
    genre: ['Jazz', 'Bebop'],
    mood: ['Swinging', 'Upbeat'],
    description: 'Classic jazz progression based on "I Got Rhythm".',
    complexity: 'advanced',
    modes: ['major']
  },
  {
    id: 'jazz-4',
    name: 'iii-VI-ii-V',
    chords: ['iiim7', 'VI7', 'iim7', 'V7'],
    genre: ['Jazz'],
    mood: ['Smooth', 'Flowing'],
    description: 'Extended jazz turnaround with descending circle of fifths motion.',
    complexity: 'advanced',
    modes: ['major']
  },
  {
    id: 'jazz-5',
    name: 'Imaj7-IVmaj7-viim7-iiim7',
    chords: ['Imaj7', 'IVmaj7', 'viim7', 'iiim7'],
    genre: ['Jazz', 'Fusion'],
    mood: ['Dreamy', 'Ethereal'],
    description: 'Quartal harmony progression common in modern jazz.',
    complexity: 'advanced',
    modes: ['major']
  },

  // Blues Progressions
  {
    id: 'blues-1',
    name: '12-Bar Blues (Basic)',
    chords: ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7'],
    genre: ['Blues', 'Rock'],
    mood: ['Bluesy', 'Gritty'],
    description: 'The classic 12-bar blues progression.',
    complexity: 'simple',
    modes: ['major']
  },
  {
    id: 'blues-2',
    name: '8-Bar Blues',
    chords: ['I7', 'IV7', 'I7', 'V7', 'IV7', 'I7', 'I7', 'V7'],
    genre: ['Blues'],
    mood: ['Bluesy'],
    description: 'Shorter blues form, common in early blues.',
    complexity: 'simple',
    modes: ['major']
  },
  {
    id: 'blues-3',
    name: 'Minor Blues',
    chords: ['im7', 'im7', 'im7', 'im7', 'ivm7', 'ivm7', 'im7', 'im7', 'vm7', 'ivm7', 'im7', 'vm7'],
    genre: ['Blues', 'Jazz'],
    mood: ['Dark', 'Moody'],
    description: 'Minor version of the 12-bar blues.',
    complexity: 'intermediate',
    modes: ['minor']
  },

  // Classical Progressions
  {
    id: 'classical-1',
    name: 'I-IV-V-I (Authentic Cadence)',
    chords: ['I', 'IV', 'V', 'I'],
    genre: ['Classical', 'Folk'],
    mood: ['Resolved', 'Complete'],
    description: 'The most conclusive chord progression in Western music.',
    complexity: 'simple',
    modes: ['major']
  },
  {
    id: 'classical-2',
    name: 'I-IV-I (Plagal Cadence)',
    chords: ['I', 'IV', 'I'],
    genre: ['Classical', 'Sacred'],
    mood: ['Peaceful', 'Amen'],
    description: 'The "Amen" cadence, common in hymns.',
    complexity: 'simple',
    modes: ['major']
  },
  {
    id: 'classical-3',
    name: 'I-V (Half Cadence)',
    chords: ['I', 'V'],
    genre: ['Classical'],
    mood: ['Unresolved', 'Questioning'],
    description: 'Creates suspense by ending on the dominant.',
    complexity: 'simple',
    modes: ['major']
  },
  {
    id: 'classical-4',
    name: 'I-vi (Deceptive Cadence)',
    chords: ['V', 'vi'],
    genre: ['Classical'],
    mood: ['Surprising', 'Unexpected'],
    description: 'Resolves to vi instead of expected I.',
    complexity: 'intermediate',
    modes: ['major']
  },

  // Minor Key Progressions
  {
    id: 'minor-1',
    name: 'i-iv-v-i',
    chords: ['i', 'iv', 'v', 'i'],
    genre: ['Classical', 'Folk'],
    mood: ['Sad', 'Melancholic'],
    description: 'Natural minor progression.',
    complexity: 'simple',
    modes: ['minor']
  },
  {
    id: 'minor-2',
    name: 'i-iv-V-i',
    chords: ['i', 'iv', 'V', 'i'],
    genre: ['Classical', 'Metal'],
    mood: ['Dark', 'Dramatic'],
    description: 'Harmonic minor with raised leading tone.',
    complexity: 'simple',
    modes: ['minor']
  },
  {
    id: 'minor-3',
    name: 'i-VI-III-VII',
    chords: ['i', 'VI', 'III', 'VII'],
    genre: ['Metal', 'Progressive'],
    mood: ['Epic', 'Powerful'],
    description: 'Popular in metal and progressive rock.',
    complexity: 'intermediate',
    modes: ['minor']
  },
  {
    id: 'minor-4',
    name: 'i-bVII-bVI-V',
    chords: ['i', 'bVII', 'bVI', 'V'],
    genre: ['Rock', 'Metal'],
    mood: ['Dramatic', 'Intense'],
    description: 'Descending progression with tension building to V.',
    complexity: 'intermediate',
    modes: ['minor']
  },

  // Modal Progressions
  {
    id: 'modal-1',
    name: 'i-bVII (Aeolian/Dorian)',
    chords: ['i', 'bVII'],
    genre: ['Rock', 'Modal'],
    mood: ['Mysterious', 'Modal'],
    description: 'Simple modal vamp common in rock.',
    complexity: 'simple',
    modes: ['minor']
  },
  {
    id: 'modal-2',
    name: 'I-bVII-IV (Mixolydian)',
    chords: ['I', 'bVII', 'IV'],
    genre: ['Rock', 'Folk'],
    mood: ['Folky', 'Open'],
    description: 'Mixolydian mode progression.',
    complexity: 'intermediate',
    modes: ['major']
  },
  {
    id: 'modal-3',
    name: 'i-II-i (Phrygian)',
    chords: ['i', 'bII', 'i'],
    genre: ['Flamenco', 'Metal'],
    mood: ['Spanish', 'Exotic'],
    description: 'Phrygian mode with characteristic bII.',
    complexity: 'intermediate',
    modes: ['minor']
  },

  // Contemporary/Electronic
  {
    id: 'edm-1',
    name: 'I-V-vi-iii-IV-I-IV-V',
    chords: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'],
    genre: ['EDM', 'House'],
    mood: ['Euphoric', 'Building'],
    description: 'Extended progression common in electronic dance music.',
    complexity: 'intermediate',
    modes: ['major']
  },
  {
    id: 'edm-2',
    name: 'vi-I-V-IV',
    chords: ['vi', 'I', 'V', 'IV'],
    genre: ['EDM', 'Pop'],
    mood: ['Emotional', 'Uplifting'],
    description: 'Popular in modern EDM drops.',
    complexity: 'simple',
    modes: ['major']
  },

  // R&B/Soul Progressions
  {
    id: 'rnb-1',
    name: 'I-IVmaj7-iiim7-vim7',
    chords: ['I', 'IVmaj7', 'iiim7', 'vim7'],
    genre: ['R&B', 'Soul'],
    mood: ['Smooth', 'Sophisticated'],
    description: 'Smooth R&B progression with extended chords.',
    complexity: 'intermediate',
    modes: ['major']
  },
  {
    id: 'rnb-2',
    name: 'iim7-V7-Imaj7-VImaj7',
    chords: ['iim7', 'V7', 'Imaj7', 'VImaj7'],
    genre: ['R&B', 'Neo-Soul'],
    mood: ['Jazzy', 'Chill'],
    description: 'Jazz-influenced R&B progression.',
    complexity: 'advanced',
    modes: ['major']
  }
];

// Diatonic chords in major and minor modes
export const DIATONIC_CHORDS = {
  major: [
    { numeral: 'I', type: 'major' },
    { numeral: 'ii', type: 'minor' },
    { numeral: 'iii', type: 'minor' },
    { numeral: 'IV', type: 'major' },
    { numeral: 'V', type: 'major' },
    { numeral: 'vi', type: 'minor' },
    { numeral: 'vii', type: 'diminished' }
  ],
  minor: [
    { numeral: 'i', type: 'minor' },
    { numeral: 'ii', type: 'diminished' },
    { numeral: 'III', type: 'major' },
    { numeral: 'iv', type: 'minor' },
    { numeral: 'v', type: 'minor' },
    { numeral: 'VI', type: 'major' },
    { numeral: 'VII', type: 'major' }
  ]
};

// Chord functions for analysis
export const CHORD_FUNCTIONS = {
  'I': 'Tonic',
  'i': 'Tonic',
  'II': 'Supertonic',
  'ii': 'Supertonic',
  'III': 'Mediant',
  'iii': 'Mediant',
  'IV': 'Subdominant',
  'iv': 'Subdominant',
  'V': 'Dominant',
  'v': 'Dominant',
  'VI': 'Submediant',
  'vi': 'Submediant',
  'VII': 'Leading Tone',
  'vii': 'Leading Tone'
};
