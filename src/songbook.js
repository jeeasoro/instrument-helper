/**
 * A starter songbook of public-domain traditional songs, chosen for beginners:
 * few chords, no barres, and singable without picking out the melody.
 *
 * `level` is 1-3 by how hard the chord changes are, not how well known the song
 * is. Anything still in copyright belongs in the paste box, not in here.
 */

export const SONGBOOK = [
  /* ---------------------------------------------------- one and two chords */
  {
    id: 'hejo',
    title: 'Hejo, spann den Wagen an',
    origin: { de: 'Volkslied / Kanon', en: 'German folk round' },
    level: 1,
    chords: ['Em'],
    note: {
      de: 'Ein einziger Akkord für das ganze Lied. Ideal als allererstes Stück — und als Kanon zu mehreren singbar.',
      en: 'One single chord for the whole song. Ideal as a first piece, and it works as a round with several singers.',
    },
    chordpro: `{title: Hejo, spann den Wagen an}
{key: Em}
[Em]Hejo, spann den Wagen an,
[Em]sieh, der Wind treibt Regen übers Land!
[Em]Hol die goldnen Garben,
[Em]hol die goldnen Garben!`,
  },
  {
    id: 'bruder-jakob',
    title: 'Bruder Jakob',
    origin: { de: 'Kanon, überliefert', en: 'Traditional round' },
    level: 1,
    chords: ['C', 'G7'],
    note: {
      de: 'Zwei Akkorde, und du kennst die Melodie schon. Gut, um den Wechsel C–G7 zu üben.',
      en: 'Two chords, and you already know the tune. Good for drilling the C–G7 change.',
    },
    chordpro: `{title: Bruder Jakob}
{key: C}
[C]Bruder Jakob, [C]Bruder Jakob,
[C]schläfst du noch? [C]Schläfst du noch?
[C]Hörst du nicht die [G7]Glocken, [C]hörst du nicht die [G7]Glocken?
[C]Ding dang dong, [G7]ding dang [C]dong.`,
  },
  {
    id: 'michael-row',
    title: 'Michael, Row the Boat Ashore',
    origin: { de: 'Spiritual, überliefert', en: 'Traditional spiritual' },
    level: 1,
    chords: ['G', 'C', 'Em', 'D'],
    note: {
      de: 'Sehr langsame Wechsel — du hast bei jedem Akkord viel Zeit. In G statt in C, damit kein Barré nötig ist.',
      en: 'Very slow changes — plenty of time on each chord. Set in G rather than C so no barre is needed.',
    },
    chordpro: `{title: Michael, Row the Boat Ashore}
{key: G}
[G]Michael, row the boat a[C]shore, Halle[G]lujah!
[G]Michael, row the boat a[Em]shore, Halle[D]lu[G]jah!

[G]Sister, help to trim the [C]sail, Halle[G]lujah!
[G]Sister, help to trim the [Em]sail, Halle[D]lu[G]jah!`,
  },

  /* --------------------------------------------------------- three chords */
  {
    id: 'gedanken-frei',
    title: 'Die Gedanken sind frei',
    origin: { de: 'Deutsches Volkslied, um 1800', en: 'German folk song, c. 1800' },
    level: 2,
    chords: ['G', 'C', 'D'],
    tags: ['freedom'],
    note: {
      de: 'Das bekannteste deutsche Freiheitslied und in jedem Pfadfinder-Liederbuch. Drei Akkorde.',
      en: 'The best-known German freedom song, and in every scout songbook. Three chords.',
    },
    chordpro: `{title: Die Gedanken sind frei}
{key: G}
[G]Die Gedanken sind [D]frei, wer kann sie er[G]raten,
sie fliehen vor[D]bei wie nächtliche [G]Schatten.
Kein Mensch kann sie [C]wissen, kein [G]Jäger er[D]schießen,
es bleibet da[G]bei: die Ge[D]danken sind [G]frei!

[G]Ich denke, was [D]ich will, und was mich beg[G]lücket,
doch alles in der [D]Still, und wie es sich [G]schicket.
Mein Wunsch und Be[C]gehren kann [G]niemand ver[D]wehren,
es bleibet da[G]bei: die Ge[D]danken sind [G]frei!`,
  },
  {
    id: 'kein-schoener-land',
    title: 'Kein schöner Land in dieser Zeit',
    origin: { de: 'Zuccalmaglio, 1840', en: 'Zuccalmaglio, 1840' },
    level: 2,
    chords: ['G', 'C', 'D', 'Em', 'Am'],
    note: {
      de: 'Das klassische Abendlied am Feuer. Fünf Akkorde, aber alle leicht und in ruhigem Tempo.',
      en: 'The classic end-of-evening campfire song. Five chords, but all easy ones at a gentle tempo.',
    },
    chordpro: `{title: Kein schöner Land in dieser Zeit}
{key: G}
[G]Kein schöner [D]Land in [Em]dieser [C]Zeit
als [G]hier das [C]unsre [D]weit und [G]breit,
wo [C]wir uns [G]finden
wohl [Em]unter [Am]Linden zur [D]Abend[G]zeit.

[G]Da haben [D]wir so [Em]manche [C]Stund
ge[G]sessen [C]da in [D]froher [G]Rund
und [C]taten [G]singen,
die [Em]Lieder [Am]klingen im [D]Eichen[G]grund.`,
  },
  {
    id: 'das-wandern',
    title: 'Das Wandern ist des Müllers Lust',
    origin: { de: 'Müller / Zöllner, 1821', en: 'Müller / Zöllner, 1821' },
    level: 2,
    chords: ['G', 'C', 'D'],
    note: {
      de: 'Fröhliches Wanderlied, gutes Tempo zum Üben der Wechsel G–C–D.',
      en: 'A cheerful walking song, good tempo for drilling the G–C–D changes.',
    },
    chordpro: `{title: Das Wandern ist des Müllers Lust}
{key: G}
[G]Das Wandern ist des [D]Müllers [G]Lust,
das [G]Wandern ist des [D]Müllers [G]Lust,
das [C]Wandern!
[G]Das muss ein schlechter [D]Müller sein,
dem [G]niemals fiel das [D]Wandern ein,
das [G]Wan[C]dern, das [G]Wan[D]dern,
das [G]Wandern ist des [D]Müllers [G]Lust!`,
  },
  {
    id: 'hoch-auf-dem-wagen',
    title: 'Hoch auf dem gelben Wagen',
    origin: { de: 'Baumbach / Höhne, 19. Jh.', en: 'Baumbach / Höhne, 19th c.' },
    level: 2,
    chords: ['G', 'C', 'D', 'A7'],
    note: {
      de: 'A7 ist neu, aber leicht: wie A-Dur, nur ein Finger weniger.',
      en: 'A7 is the new one here, and it is easy — like A major with one finger fewer.',
    },
    chordpro: `{title: Hoch auf dem gelben Wagen}
{key: G}
[G]Hoch auf dem gelben [C]Wagen
[G]sitz ich beim Schwager vorn.
[G]Vorwärts die Rosse [C]traben,
[A7]lustig schmettert das [D]Horn.
[G]Felder und Wiesen und [C]Auen,
[G]leuchtendes Ährengold.
[C]Ich möchte ja so gerne noch [G]schauen,
[A7]aber der Wagen, der [D]rollt.`,
  },
  {
    id: 'wenn-alle-bruennlein',
    title: 'Wenn alle Brünnlein fließen',
    origin: { de: 'Volkslied, 16. Jh.', en: 'German folk song, 16th c.' },
    level: 2,
    chords: ['G', 'C', 'D', 'D7'],
    note: {
      de: 'Sehr alt und sehr bekannt. D7 ist neu, liegt aber direkt neben D.',
      en: 'Very old and very well known. D7 is the new shape, and it sits right next to D.',
    },
    chordpro: `{title: Wenn alle Brünnlein fließen}
{key: G}
[G]Wenn alle Brünnlein [D]fließen,
so soll man [D7]trinken; [G]ei,
wenn ich mein Schatz nicht [C]rufen darf,
[G]tu ich ihm [D]winken, ja [G]winken.`,
  },
  {
    id: 'amazing-grace',
    title: 'Amazing Grace',
    origin: { de: 'Newton, 1779 / überliefert', en: 'Newton, 1779 / traditional' },
    level: 2,
    chords: ['G', 'C', 'D'],
    note: {
      de: 'Langsam, viel Zeit für jeden Wechsel. Weltweit bekannt.',
      en: 'Slow, with plenty of time on every change. Known everywhere.',
    },
    chordpro: `{title: Amazing Grace}
{key: G}
A[G]mazing grace, how [C]sweet the [G]sound
that saved a wretch like [D]me.
I [G]once was lost, but [C]now am [G]found,
was [D]blind but [G]now I see.`,
  },
  {
    id: 'when-the-saints',
    title: 'Oh, When the Saints Go Marching In',
    origin: { de: 'Spiritual, überliefert', en: 'Traditional spiritual' },
    level: 2,
    chords: ['G', 'C', 'D', 'G7'],
    note: {
      de: 'Schnell und fröhlich. Die Akkorde bleiben trotz des Tempos lange stehen.',
      en: 'Fast and cheerful, but each chord lasts a long time despite the tempo.',
    },
    chordpro: `{title: Oh, When the Saints Go Marching In}
{key: G}
Oh, when the [G]saints go marching in,
oh, when the saints go marching [D]in,
oh, [G]how I want to [G7]be in that [C]number
when the [G]saints go [D]marching [G]in!`,
  },
  {
    id: 'down-by-the-riverside',
    title: 'Down by the Riverside',
    origin: { de: 'Spiritual, überliefert', en: 'Traditional spiritual' },
    level: 2,
    chords: ['G', 'C', 'D', 'G7'],
    tags: ['peace'],
    note: {
      de: 'Ein altes Antikriegs-Spiritual. Treibender Rhythmus, aber lange Akkorde.',
      en: 'An old anti-war spiritual. Driving rhythm, but the chords last a long time.',
    },
    chordpro: `{title: Down by the Riverside}
{key: G}
Gonna [G]lay down my sword and shield,
down by the riverside, [D]down by the riverside,
down by the [G]riverside.
Gonna [G]lay down my sword and [G7]shield,
down by the [C]riverside,
ain’t gonna [G]study [D]war no [G]more.

Ain’t gonna [G]study war no more,
ain’t gonna study war no [D]more,
ain’t gonna study war no [G]more.`,
  },

  /* ---------------------------------------------------- four chords, minor */
  {
    id: 'zogen-einst',
    title: 'Zogen einst fünf wilde Schwäne',
    origin: { de: 'Litauisches Volkslied, dt. Fassung 1917', en: 'Lithuanian folk song, German version 1917' },
    level: 3,
    chords: ['Em', 'Am', 'D', 'G'],
    tags: ['peace'],
    note: {
      de: 'Ein Klagelied über den Krieg, in Moll. Der Wechsel Em–Am ist leicht, weil zwei Finger liegen bleiben.',
      en: 'A lament about war, in a minor key. The Em–Am change is easy — two fingers stay put.',
    },
    chordpro: `{title: Zogen einst fünf wilde Schwäne}
{key: Em}
[Em]Zogen einst fünf wilde [Am]Schwäne,
[Em]Schwäne leuchtend weiß und [D]schön.
[G]Sing, sing, was ge[D]schah?
[Em]Keiner ward mehr ge[Am]sehn. [Em]Ja!

[Em]Wuchsen einst fünf junge [Am]Birken
[Em]schön und schlank am Baches[D]rand.
[G]Sing, sing, was ge[D]schah?
[Em]Keine in Blüten [Am]stand. [Em]Ja!`,
  },
  {
    id: 'der-mond',
    title: 'Der Mond ist aufgegangen',
    origin: { de: 'Claudius / Schulz, 1779', en: 'Claudius / Schulz, 1779' },
    level: 3,
    chords: ['G', 'D', 'Em', 'Am'],
    note: {
      de: 'Das deutsche Abendlied schlechthin. Vier Akkorde, alle einfach und langsam gewechselt.',
      en: 'The German evening song. Four chords, all easy ones and changed slowly.',
    },
    chordpro: `{title: Der Mond ist aufgegangen}
{key: G}
Der [G]Mond ist auf[D]gegangen,
die [Em]goldnen Stern[Am]lein prangen
am [G]Himmel [D]hell und [G]klar.
Der [G]Wald steht [D]schwarz und schweiget,
und [Em]aus den Wiesen [Am]steiget
der [G]weiße [D]Nebel [G]wunderbar.`,
  },
  {
    id: 'house-rising-sun',
    title: 'The House of the Rising Sun',
    origin: { de: 'Amerikanisches Volkslied, überliefert', en: 'American folk song, traditional' },
    level: 3,
    chords: ['Am', 'C', 'D', 'F', 'E'],
    note: {
      de: 'Oft das erste „richtige“ Lied, das Anfänger lernen. F ist der schwerste Griff — wenn er noch nicht geht, nimm stattdessen Fmaj7.',
      en: 'Often the first "real" song a beginner learns. F is the hard one — if it will not sound yet, use Fmaj7 instead.',
    },
    chordpro: `{title: The House of the Rising Sun}
{key: Am}
There [Am]is a [C]house in [D]New Or[F]leans,
they [Am]call the [C]Rising [E]Sun.
And it’s [Am]been the [C]ruin of [D]many a poor [F]boy,
and [Am]God, I [E]know I’m [Am]one.`,
  },
];

/**
 * Chord patterns rather than songs. Progressions are not anyone's property,
 * and a beginner gets more mileage from these than from any single piece.
 */
export const PROGRESSIONS = [
  {
    id: 'four-chord',
    name: { de: 'Der Vier-Akkorde-Trick', en: 'The four-chord trick' },
    chords: ['G', 'D', 'Em', 'C'],
    note: {
      de: 'Diese vier Akkorde in dieser Reihenfolge tragen erstaunlich viele Popsongs. Wenn du sie sicher wechseln kannst, kannst du sehr vieles begleiten.',
      en: 'These four chords in this order carry a startling number of pop songs. Once you can change between them cleanly, you can back an enormous amount of music.',
    },
  },
  {
    id: 'fifties',
    name: { de: 'Die 50er-Wendung', en: 'The fifties progression' },
    chords: ['C', 'Am', 'F', 'G'],
    note: {
      de: 'Der Klang alter Balladen und Doo-Wop-Songs. Am nach C ist ein sehr kleiner Fingerweg — guter erster Wechsel.',
      en: 'The sound of old ballads and doo-wop. Am after C is a tiny finger move, which makes it a good first change to learn.',
    },
  },
  {
    id: 'twelve-bar',
    name: { de: 'Zwölftakt-Blues', en: 'Twelve-bar blues' },
    chords: ['A', 'D', 'E'],
    note: {
      de: 'Die Grundlage von Blues, Rock’n’Roll und unzähligen Lagerfeuer-Jams. Drei Akkorde, feste Reihenfolge.',
      en: 'The basis of blues, rock and roll and countless campfire jams. Three chords in a fixed order.',
    },
  },
  {
    id: 'folk-minor',
    name: { de: 'Moll-Folkwendung', en: 'Minor folk turn' },
    chords: ['Em', 'C', 'G', 'D'],
    note: {
      de: 'Der nachdenkliche Klang vieler Wander- und Abendlieder. Em und C liegen bequem nebeneinander.',
      en: 'The wistful sound of a lot of walking and evening songs. Em and C sit comfortably next to each other.',
    },
  },
];

export function levelLabel(level, lang) {
  const labels = {
    de: { 1: 'sehr leicht', 2: 'leicht', 3: 'etwas schwerer' },
    en: { 1: 'very easy', 2: 'easy', 3: 'a bit harder' },
  };
  return (labels[lang] || labels.en)[level];
}
