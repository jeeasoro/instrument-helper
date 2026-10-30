/**
 * Content for the "Getting started" page, per instrument and per language.
 *
 * Each section may name a diagram, drawn by src/diagrams.js. Prose lives here
 * rather than in i18n.js so the page reads as one written piece per language
 * instead of a pile of disconnected keys — which also means each instrument's
 * guide is its own piece of writing, not one guide with the nouns swapped.
 * Almost nothing a beginner needs to be told is common to all four: a lyre
 * player needs to know that a third of the chromatic scale is simply absent,
 * and a guitarist has never had to think about that in their life.
 *
 * The one thing that *is* shared is the technique material — posture, the arch
 * of the hand, the habits that are hard to unlearn — and even there the advice
 * is written out per instrument rather than factored out, because "keep the
 * last joint from collapsing" means something different to a thumb striking a
 * steel tine than to a finger pressing a fret.
 */

const GUITAR = {
  en: {
    title: 'Getting started',
    sub: 'Everything the rest of this app assumes you already know. Nothing here needs any musical background.',
    sections: [
      {
        id: 'parts',
        title: 'The parts you need names for',
        diagram: 'anatomy',
        paras: [
          'A guitar has six <b>strings</b> running along its <b>neck</b>. The neck is divided by metal bars called <b>frets</b>. The thick bar where the neck meets the head — where the tuning pegs are — is the <b>nut</b>.',
          'Almost everything in this app is described as a combination of a string and a fret. That pair is all you need to find any note.',
        ],
      },
      {
        id: 'strings',
        title: 'The six strings, and their confusing numbers',
        diagram: 'strings',
        paras: [
          'The strings are numbered <b>1 to 6</b>. String 1 is the <b>thinnest</b> one, which sounds highest. String 6 is the <b>thickest</b>, which sounds lowest.',
          'This catches everyone out at first: when you hold the guitar and look down, string 6 — number six, the thick one — is the string <b>closest to you</b>, at the top. String 1 is nearest the floor. The numbering runs the opposite way to how they sit.',
          'Each string also has a note name. From thickest to thinnest they are <b>E&nbsp;A&nbsp;D&nbsp;G&nbsp;B&nbsp;E</b>. The two outer strings are both called E — they are the same note, six tones apart in height. This is called <b>standard tuning</b>, and it is what this app assumes.',
        ],
        note: 'When this app says "string 6, fret 3", it means the thickest string, pressed at the third fret.',
      },
      {
        id: 'frets',
        title: 'What a fret is, and how to count them',
        diagram: 'frets',
        paras: [
          'Pressing a string against the neck shortens it, and a shorter string sounds higher. The frets are there so the shortening happens at exact, repeatable places.',
          '<b>Fret 1</b> is the space nearest the nut. Fret 2 is the next space along, and so on. You press <b>in the space</b>, not on the metal bar itself — and pressing closer to the bar ahead of you makes a cleaner sound with less effort.',
          'Each fret is one <b>semitone</b>, the smallest step in Western music. Twelve frets along, the note repeats — higher, but the same name.',
        ],
      },
      {
        id: 'open',
        title: 'Open, fretted, muted',
        diagram: 'stringstates',
        paras: [
          'At any moment, each string is doing one of three things.',
          '<b>Open</b> means you play it without pressing anywhere. The whole string sounds. This app writes it as fret&nbsp;<b>0</b>, and chord boxes mark it with a small <b>circle</b> above the string. Open strings are the easiest thing on the instrument — no finger required.',
          '<b>Fretted</b> means you press it down at some fret before playing. This app writes it as the fret number.',
          '<b>Muted</b> means you deliberately do not sound that string at all. Chord boxes mark it with an <b>×</b>. Some chords simply leave a string out.',
        ],
      },
      {
        id: 'twoways',
        title: 'Two different ways to play',
        paras: [
          'This is the thing nobody tells you at the start, and it explains almost everything else.',
          'A guitar can be played <b>one note at a time</b> — picking out a tune, the way a flute or a violin plays. A melody. Only one string sounds at any moment.',
          'Or it can be played <b>several strings at once</b> — pressing a shape with your left hand and strumming across the strings with your right. That is a <b>chord</b>. You are not playing the tune at all; your <b>voice</b> does that while the guitar supplies the backing.',
          'Almost every campfire, scout and singalong song is the second kind. You will learn perhaps eight chord shapes and a strumming rhythm, and that is genuinely enough for hundreds of songs. You never pick out the melody, because you are singing it.',
          'The first kind — melodies — is what fiddle tunes and classical guitar pieces are, and it is what the tune search in this app finds. It is a real and rewarding way to play, but it is not what you need for singing round a fire.',
        ],
        note: 'The two are written down differently, which is why the next two sections look nothing alike. Chords get a <b>chord box</b>; melodies get <b>tab</b>. Advanced players combine both at once, but that is a long way off and not something to worry about now.',
      },
      {
        id: 'chordbox',
        title: 'Reading a chord box',
        diagram: 'chordbox',
        paras: [
          'A <b>chord</b> is several strings sounding together. A chord box shows you which fingers go where — but it is drawn as if the guitar were <b>standing upright</b>, facing you, rather than lying in your hands.',
          'The <b>vertical lines are the strings</b> — thickest on the left, thinnest on the right. The <b>horizontal lines are the frets</b>, with the thick line at the top being the nut. <b>Dots</b> are where you press.',
          'Above the box: <b>○</b> means play that string open, <b>×</b> means do not play it at all. A <b>thick bar</b> across several strings means one finger lies flat across all of them — that is called a <b>barre</b>, and it is genuinely hard at first. Do not be discouraged by it.',
        ],
        note: 'If a box shows a number to its right, the diagram starts at that fret instead of at the nut.',
      },
      {
        id: 'tab',
        title: 'Reading tablature',
        diagram: 'tabreading',
        paras: [
          'Six horizontal lines represent the six strings. Confusingly again, the <b>top line is the thinnest string</b>, as if you were looking down at the guitar in your lap. A number on a line tells you which fret to press on that string. <b>0</b> means play it open.',
          'The <b>position of the numbers is the whole point</b>. Numbers spread out <b>left to right</b> are played <b>one after another</b> — a melody. Numbers stacked in a <b>single column</b> are played <b>all at once</b> — a chord. Same six lines, same numbers, completely different instruction.',
          'In the melody above, the fret numbers climb 0–1–3 along one string, then drop to the next line and climb again. Underneath each one is the <b>note you actually hear</b> — the fret number tells your finger where to go, the letter tells you what comes out.',
          'An <b>×</b> means do not play that string at all.',
        ],
      },
      {
        id: 'notes',
        title: 'Note names and the numbers after them',
        paras: [
          'Notes are named with the letters <b>A</b> to <b>G</b>, then it starts over. Between some of them sit extra notes, written with <b>#</b> (sharp, one fret higher) or <b>♭</b> (flat, one fret lower). So <b>F#</b> is one fret above F.',
          'The number after a note — <b>E2</b>, <b>A4</b> — says which <b>octave</b> it is in, meaning how high. Bigger number, higher sound. Your thickest string is <b>E2</b>; your thinnest is <b>E4</b>. Same letter, same note, two octaves apart.',
          'You do not need to memorise any of this to play. It matters only when you want to know <i>why</i> two things sound the same.',
        ],
      },
      {
        id: 'tuning',
        title: 'What the tuner is telling you',
        paras: [
          'A string is in tune when it vibrates at the right speed. The tuner measures that speed and compares it to where it should be.',
          'The needle shows how far off you are, in <b>cents</b>. One hundred cents is one fret — so being 30 cents out is roughly a third of a fret, small enough to look fine and still sound wrong. Under about 5 cents is in tune for practical purposes.',
          'If the note reads <b>too low</b>, tighten the string; <b>too high</b>, loosen it. Turn the peg slowly and keep replaying the string. Always finish by tightening <i>up</i> to the note rather than loosening down to it — the string holds its tuning better that way.',
          '<b>A4 = 440 Hz</b> is the reference everything else is measured from. Leave it alone unless you are playing along with an instrument or recording tuned differently.',
        ],
        note: 'Tune the thickest string first and work towards the thinnest. Then go around again — tightening one string slightly bends the neck and detunes the others.',
      },
      {
        id: 'capo',
        title: 'Capo',
        paras: [
          'A <b>capo</b> is a clamp that presses all six strings down at one fret, making the whole guitar sound higher.',
          'This is useful for two reasons. It moves a song into a range you can actually sing. And it lets you play a song that would need difficult shapes using easy ones instead — the app suggests exactly where to put it.',
          'With a capo at fret 3, the shapes you grip are still called G, C, D — but what comes out is higher. The app shows both: the shape you play and the chord it sounds like.',
        ],
      },
      {
        id: 'posture',
        title: 'How to sit with it',
        diagram: 'posture',
        paras: [
          'None of this is fussiness. Nothing you do wrong in week one hurts in week one — it hurts in year one, by which time it is a habit rather than a choice, and unlearning it costs far more than learning it right did.',
          'Sit <b>forward on the seat</b>, not back in a soft chair, with both feet flat on the floor. Your back should be long and your shoulders should drop. A chair with arms will push your elbows up and out; use one without.',
          'Rest the guitar\'s waist — the narrow part — on your right thigh if you are right-handed, and let the neck point <b>slightly upward</b>, at about twenty degrees. A neck that droops toward the floor forces your left wrist to bend hard to reach the strings, and that bend is where wrist pain comes from.',
          'Do not lean over the top to watch your fingers. Everyone does it and it rounds the back and shortens the neck. Tilt the guitar slightly toward you instead if you must look — better still, look at the chord box on screen and let your fingers find the strings by feel, which is the skill you are actually trying to build.',
        ],
        note: 'A strap is not just for standing up. Even sitting, a strap set so the guitar stays put without your right arm clamping it frees that arm to do nothing but strum, which is what it should be doing.',
      },
      {
        id: 'hands',
        title: 'Where your hands go, and why it matters',
        diagram: 'guitarthumb',
        paras: [
          'The <b>thumb of your fretting hand belongs flat on the back of the neck</b>, roughly opposite your second finger, pointing up the neck rather than along it. That gives your other four fingers their full length and lets them come down on the strings from above.',
          'The habit to avoid is <b>hooking the thumb over the top edge</b>. It feels far more secure, which is exactly why it spreads, and it does three bad things at once: it drags your palm against the neck, it shortens every other finger\'s reach, and it makes a barre chord physically impossible later. If your thumb is over the top, you are not going to get an F.',
          'Press with the <b>fingertip, not the pad</b>, with the last joint of the finger bent so it meets the string end-on. A collapsed joint cannot control pressure and lies flat across the neighbouring string, which is why a chord buzzes on one string and you cannot work out which.',
          'Press <b>just behind the fret wire</b>, not in the middle of the space and never on the metal itself. Right behind the wire, a chord needs about a third of the force it needs in the middle of the fret — most beginners are squeezing far harder than the instrument asks.',
          'Your strumming hand should move from a <b>loose wrist</b>, like shaking water off your fingers, not from a stiff elbow. Hold the pick lightly enough that a firm tug would pull it out of your hand.',
        ],
        note: 'Keep the nails on your fretting hand short. A nail even slightly long stops the fingertip standing upright, and no amount of practice fixes a shape your fingernail is preventing.',
      },
      {
        id: 'habits',
        title: 'Six habits worth not learning',
        diagram: 'handarch',
        paras: [
          '<b>Squeezing.</b> Almost everyone presses several times harder than needed. Try this: fret a note, then slowly release until it buzzes, then add just enough to stop the buzz. That is how hard it should be — and it is startlingly light.',
          '<b>Thumb over the top.</b> See above. This is the one that quietly caps how far you get.',
          '<b>Watching your left hand constantly.</b> You will never change chords in time while you are looking. Practise one change with your eyes shut from the very first week; it feels impossible for about three days and then it does not.',
          '<b>Only ever playing what you can already play.</b> Deeply pleasant, and it is not practice.',
          '<b>Speeding up when a bit goes wrong.</b> Rushing past a mistake teaches you the mistake. Slow down until it is right, then speed up.',
          '<b>Playing through pain.</b> Sore fingertips are fine and pass in a couple of weeks. Pain in the wrist, thumb joint, forearm or shoulder is a signal that something in your setup is wrong — stop, change the position, and come back.',
        ],
        note: 'The honest test for any of these: could you still do it in an hour\'s time without your hand aching? If not, it is not sustainable, and something has to change now rather than later.',
      },
      {
        id: 'practice',
        title: 'How to practise so it sticks',
        paras: [
          '<b>Little and often beats long and rare.</b> Fifteen minutes a day will take you further in a month than two hours every Sunday. The learning happens between sessions, and daily gives it more chances to.',
          '<b>Practise the change, not the chord.</b> Any single chord is easy inside a week. Moving cleanly from one to another is the whole difficulty, and it is a separate skill that only improves if you attack it directly — two chords, back and forth, slowly, forty times. The practice page ranks a song\'s changes by how often each occurs, so you can drill the ones that actually matter.',
          '<b>Slow enough to be right every time.</b> Speed is a by-product of accuracy, never the other way round. If you can play it right three times in a row, go slightly faster; if you cannot, you were already too fast.',
          '<b>Tune it every single time.</b> An out-of-tune guitar teaches your ear the wrong things, and it is by far the most common reason a beginner believes they are playing badly when they are not.',
          '<b>Finish on something you can play.</b> Ending a session on a failure is how a hobby dies. Play one thing you enjoy at the end, however simple.',
        ],
      },
      {
        id: 'start',
        title: 'If this is your first week',
        paras: [
          'Tune the guitar every single time before you play. An out-of-tune instrument teaches your ear the wrong things, and it is the most common reason a beginner thinks they are playing badly when they are not.',
          'Learn <b>Em</b> first — it uses two fingers and no muted strings. Then <b>Am</b>, then <b>G</b>, then <b>D</b>. Those four cover an enormous number of campfire songs.',
          'Sore fingertips are normal and pass in a couple of weeks. Pain in your wrist is not — if your wrist hurts, stop and change how you are holding the neck.',
          'Changing between chords cleanly is harder than any single chord, and it is the thing worth practising. Pick two chords and swap between them slowly, over and over, before worrying about any song.',
        ],
      },
    ],
  },

  de: {
    title: 'Erste Schritte',
    sub: 'Alles, was der Rest dieser App als bekannt voraussetzt. Nichts davon braucht musikalische Vorkenntnisse.',
    sections: [
      {
        id: 'parts',
        title: 'Die Teile, für die du Namen brauchst',
        diagram: 'anatomy',
        paras: [
          'Eine Gitarre hat sechs <b>Saiten</b>, die über den <b>Hals</b> laufen. Der Hals ist durch Metallstäbchen unterteilt, die <b>Bünde</b> heißen. Der dicke Steg dort, wo der Hals in den Kopf mit den Wirbeln übergeht, ist der <b>Sattel</b>.',
          'Fast alles in dieser App wird als Kombination aus Saite und Bund beschrieben. Mit diesem Paar findest du jeden Ton.',
        ],
      },
      {
        id: 'strings',
        title: 'Die sechs Saiten und ihre verwirrende Nummerierung',
        diagram: 'strings',
        paras: [
          'Die Saiten sind von <b>1 bis 6</b> nummeriert. Saite 1 ist die <b>dünnste</b> und klingt am höchsten. Saite 6 ist die <b>dickste</b> und klingt am tiefsten.',
          'Das verwirrt am Anfang alle: Wenn du die Gitarre hältst und nach unten schaust, ist Saite 6 — die Nummer sechs, die dicke — die Saite <b>am nächsten bei dir</b>, ganz oben. Saite 1 ist dem Boden am nächsten. Die Nummerierung läuft also genau andersherum als die Anordnung.',
          'Jede Saite hat außerdem einen Tonnamen. Von der dicksten zur dünnsten sind das <b>E&nbsp;A&nbsp;D&nbsp;G&nbsp;H&nbsp;E</b>. Die beiden äußeren Saiten heißen beide E — derselbe Ton, nur zwei Oktaven auseinander. Das nennt man <b>Standardstimmung</b>, und davon geht diese App aus.',
        ],
        note: 'Im Englischen heißt die H-Saite <b>B</b>. Diese App zeigt Tonnamen international an, dort steht also B, wo du H sagen würdest.',
      },
      {
        id: 'frets',
        title: 'Was ein Bund ist und wie man zählt',
        diagram: 'frets',
        paras: [
          'Wenn du eine Saite auf den Hals drückst, wird sie kürzer — und eine kürzere Saite klingt höher. Die Bünde sorgen dafür, dass das an genauen, immer gleichen Stellen passiert.',
          '<b>Bund 1</b> ist der Zwischenraum direkt am Sattel. Bund 2 ist der nächste und so weiter. Du drückst <b>in den Zwischenraum</b>, nicht auf das Metallstäbchen — und je näher am vorderen Stäbchen, desto sauberer klingt es bei weniger Kraftaufwand.',
          'Jeder Bund ist ein <b>Halbton</b>, der kleinste Schritt in der westlichen Musik. Zwölf Bünde weiter wiederholt sich der Ton: höher, aber mit demselben Namen.',
        ],
      },
      {
        id: 'open',
        title: 'Leer, gegriffen, abgedämpft',
        diagram: 'stringstates',
        paras: [
          'Jede Saite tut in jedem Moment genau eines von drei Dingen.',
          '<b>Leer</b> heißt: Du spielst sie, ohne irgendwo zu drücken. Die ganze Saite klingt. Diese App schreibt dafür Bund&nbsp;<b>0</b>, und in Akkordkästchen steht ein kleiner <b>Kreis</b> über der Saite. Leere Saiten sind das Einfachste am ganzen Instrument — es braucht keinen Finger.',
          '<b>Gegriffen</b> heißt: Du drückst die Saite vor dem Anschlagen in einem Bund herunter. Diese App schreibt dann die Bundnummer.',
          '<b>Abgedämpft</b> heißt: Diese Saite soll bewusst gar nicht klingen. Akkordkästchen markieren das mit einem <b>×</b>. Manche Akkorde lassen eine Saite einfach weg.',
        ],
      },
      {
        id: 'twoways',
        title: 'Zwei ganz verschiedene Arten zu spielen',
        paras: [
          'Das sagt einem am Anfang niemand, und es erklärt fast alles andere.',
          'Man kann eine Gitarre <b>Ton für Ton</b> spielen — eine Melodie heraussuchen, so wie eine Flöte oder eine Geige spielt. Dann klingt in jedem Moment nur eine einzige Saite.',
          'Oder man spielt <b>mehrere Saiten gleichzeitig</b> — mit der linken Hand einen Griff drücken und mit der rechten über die Saiten schlagen. Das ist ein <b>Akkord</b>. Dabei spielst du die Melodie gar nicht; das macht deine <b>Stimme</b>, während die Gitarre die Begleitung liefert.',
          'Fast jedes Lagerfeuer-, Pfadfinder- und Mitsinglied ist die zweite Art. Du lernst vielleicht acht Akkordgriffe und einen Schlagrhythmus, und das reicht wirklich für Hunderte von Liedern. Die Melodie greifst du nie — du singst sie ja.',
          'Die erste Art — Melodien — ist das, was Geigenstücke und klassische Gitarrenstücke sind, und das ist auch, was die Melodiesuche in dieser App findet. Das ist eine echte und lohnende Art zu spielen, aber nicht die, die du fürs Singen am Feuer brauchst.',
        ],
        note: 'Beide werden unterschiedlich aufgeschrieben — deshalb sehen die nächsten zwei Abschnitte völlig verschieden aus. Akkorde bekommen ein <b>Akkordkästchen</b>, Melodien bekommen <b>Tabulatur</b>. Fortgeschrittene verbinden beides gleichzeitig, aber das ist noch weit weg und im Moment kein Thema.',
      },
      {
        id: 'chordbox',
        title: 'Ein Akkordkästchen lesen',
        diagram: 'chordbox',
        paras: [
          'Ein <b>Akkord</b> sind mehrere Saiten, die zusammen klingen. Ein Akkordkästchen zeigt, welche Finger wohin kommen — gezeichnet ist es aber so, als stünde die Gitarre <b>aufrecht</b> vor dir, nicht als läge sie in deinen Händen.',
          'Die <b>senkrechten Linien sind die Saiten</b> — die dickste links, die dünnste rechts. Die <b>waagerechten Linien sind die Bünde</b>, wobei der dicke Strich oben der Sattel ist. <b>Punkte</b> zeigen, wo du drückst.',
          'Über dem Kästchen bedeutet <b>○</b>: diese Saite leer spielen, und <b>×</b>: diese Saite gar nicht spielen. Ein <b>dicker Balken</b> über mehrere Saiten heißt, dass ein Finger flach über alle liegt — das nennt man <b>Barré</b>, und es ist am Anfang wirklich schwer. Lass dich davon nicht entmutigen.',
        ],
        note: 'Steht rechts neben dem Kästchen eine Zahl, beginnt das Diagramm bei diesem Bund statt am Sattel.',
      },
      {
        id: 'tab',
        title: 'Tabulatur lesen',
        diagram: 'tabreading',
        paras: [
          'Sechs waagerechte Linien stehen für die sechs Saiten. Auch hier verwirrend: Die <b>oberste Linie ist die dünnste Saite</b>, so als würdest du von oben auf die Gitarre in deinem Schoß schauen. Eine Zahl auf einer Linie sagt dir, welchen Bund du auf dieser Saite drückst. <b>0</b> heißt leer spielen.',
          'Entscheidend ist die <b>Position der Zahlen</b>. Zahlen, die <b>nebeneinander</b> stehen, werden <b>nacheinander</b> gespielt — eine Melodie. Zahlen, die <b>übereinander</b> in einer Spalte stehen, werden <b>gleichzeitig</b> gespielt — ein Akkord. Dieselben sechs Linien, dieselben Zahlen, eine völlig andere Anweisung.',
          'In der Melodie oben steigen die Bundzahlen 0–1–3 auf einer Saite an, springen dann auf die nächste Linie und steigen wieder. Darunter steht jeweils der <b>Ton, den du wirklich hörst</b> — die Bundzahl sagt deinem Finger, wohin er soll, der Buchstabe sagt dir, was herauskommt.',
          'Ein <b>×</b> heißt: diese Saite gar nicht anschlagen.',
        ],
      },
      {
        id: 'notes',
        title: 'Tonnamen und die Zahlen dahinter',
        paras: [
          'Töne werden mit den Buchstaben <b>A</b> bis <b>G</b> benannt, danach fängt es wieder von vorn an. Zwischen manchen liegen weitere Töne, geschrieben mit <b>#</b> (Kreuz, einen Bund höher) oder <b>♭</b> (b, einen Bund tiefer). <b>F#</b> ist also einen Bund über F.',
          'Die Zahl hinter einem Ton — <b>E2</b>, <b>A4</b> — sagt, in welcher <b>Oktave</b> er liegt, also wie hoch. Größere Zahl, höherer Klang. Deine dickste Saite ist <b>E2</b>, deine dünnste <b>E4</b>. Gleicher Buchstabe, gleicher Ton, zwei Oktaven auseinander.',
          'Du musst nichts davon auswendig lernen, um zu spielen. Es wird erst wichtig, wenn du wissen willst, <i>warum</i> zwei Dinge gleich klingen.',
        ],
      },
      {
        id: 'tuning',
        title: 'Was dir das Stimmgerät sagt',
        paras: [
          'Eine Saite ist richtig gestimmt, wenn sie mit der richtigen Geschwindigkeit schwingt. Das Stimmgerät misst diese Geschwindigkeit und vergleicht sie mit dem Sollwert.',
          'Der Zeiger zeigt die Abweichung in <b>Cent</b> an. Hundert Cent sind ein Bund — 30 Cent daneben ist also etwa ein Drittel Bund: klein genug, um richtig auszusehen, und trotzdem hörbar falsch. Unter etwa 5 Cent gilt praktisch als gestimmt.',
          'Zeigt es <b>zu tief</b>, dreh die Saite straffer; <b>zu hoch</b>, dreh sie lockerer. Dreh langsam und schlag die Saite immer wieder neu an. Nähere dich dem Ton am Ende immer <i>von unten</i>, also durch Straffen — so hält die Stimmung besser.',
          '<b>A4 = 440 Hz</b> ist der Bezugston, an dem alles andere gemessen wird. Lass ihn in Ruhe, außer du spielst zu einem Instrument oder einer Aufnahme, die anders gestimmt ist.',
        ],
        note: 'Stimme zuerst die dickste Saite und arbeite dich zur dünnsten vor. Dann noch einmal von vorn — jede gestraffte Saite biegt den Hals minimal und verstimmt die anderen wieder.',
      },
      {
        id: 'capo',
        title: 'Kapodaster',
        paras: [
          'Ein <b>Kapodaster</b> ist eine Klemme, die alle sechs Saiten in einem Bund herunterdrückt. Dadurch klingt die ganze Gitarre höher.',
          'Das ist aus zwei Gründen nützlich. Es verschiebt ein Lied in eine Tonlage, die du auch singen kannst. Und es erlaubt dir, ein Lied mit einfachen Griffen zu spielen, das sonst schwere bräuchte — die App schlägt dir vor, wohin genau er gehört.',
          'Mit einem Kapodaster im 3. Bund heißen die Griffe weiterhin G, C, D — aber was herauskommt, klingt höher. Die App zeigt beides an: den Griff, den du spielst, und den Akkord, wie er klingt.',
        ],
      },
      {
        id: 'posture',
        title: 'Wie du damit sitzt',
        diagram: 'posture',
        paras: [
          'Nichts davon ist Pedanterie. Was du in der ersten Woche falsch machst, tut in der ersten Woche nicht weh — es tut im ersten Jahr weh, und dann ist es eine Gewohnheit statt einer Entscheidung. Es wieder loszuwerden kostet weit mehr, als es richtig zu lernen gekostet hätte.',
          'Setz dich <b>vorn auf die Sitzfläche</b>, nicht tief in einen Polstersessel, beide Füße flach auf dem Boden. Der Rücken lang, die Schultern locker nach unten. Ein Stuhl mit Armlehnen drückt deine Ellbogen nach oben und außen — nimm einen ohne.',
          'Leg die Taille der Gitarre — die schmale Stelle — auf den rechten Oberschenkel, wenn du Rechtshänder bist, und lass den Hals <b>leicht nach oben</b> zeigen, etwa zwanzig Grad. Ein Hals, der Richtung Boden hängt, zwingt dein linkes Handgelenk in einen scharfen Knick, und genau dieser Knick ist der Ursprung von Handgelenkschmerzen.',
          'Beug dich nicht über die Gitarre, um deinen Fingern zuzusehen. Das macht jeder, und es rundet den Rücken und staucht den Nacken. Kipp die Gitarre stattdessen leicht zu dir, wenn du hinsehen musst — besser noch: schau auf das Akkordkästchen am Bildschirm und lass deine Finger die Saiten ertasten. Genau das ist ja die Fähigkeit, die du aufbauen willst.',
        ],
        note: 'Ein Gurt ist nicht nur fürs Stehen. Auch im Sitzen hält er die Gitarre so, dass dein rechter Arm sie nicht festklemmen muss — und dann kann dieser Arm das tun, was er soll: nur anschlagen.',
      },
      {
        id: 'hands',
        title: 'Wohin die Hände gehören — und warum das zählt',
        diagram: 'guitarthumb',
        paras: [
          'Der <b>Daumen der Greifhand gehört flach hinten an den Hals</b>, ungefähr gegenüber dem zweiten Finger, und zeigt den Hals hinauf statt an ihm entlang. So haben die anderen vier Finger ihre volle Länge und können von oben auf die Saiten kommen.',
          'Die Gewohnheit, die du vermeiden willst, ist der <b>über die Oberkante gehakte Daumen</b>. Er fühlt sich viel sicherer an — deshalb macht es fast jeder — und richtet drei Dinge gleichzeitig an: Er zieht die Handfläche an den Hals, er verkürzt die Reichweite aller anderen Finger, und er macht einen Barré-Akkord später schlicht unmöglich. Liegt dein Daumen oben, wird das nichts mit dem F.',
          'Drück mit der <b>Fingerkuppe, nicht mit dem flachen Finger</b>, das letzte Gelenk so gebeugt, dass die Kuppe die Saite von vorn trifft. Ein eingeknicktes Gelenk kann den Druck nicht dosieren und legt sich flach auf die Nachbarsaite — deshalb schnarrt ein Akkord an einer Stelle, und du findest nicht heraus, an welcher.',
          'Drück <b>direkt hinter dem Bundstäbchen</b>, nicht in der Mitte des Zwischenraums und nie auf dem Metall. Direkt hinter dem Stäbchen braucht ein Akkord etwa ein Drittel der Kraft, die er in der Bundmitte braucht — die meisten Anfänger quetschen weit fester, als das Instrument verlangt.',
          'Die Anschlagshand bewegt sich aus dem <b>lockeren Handgelenk</b>, so wie du Wasser von den Fingern schüttelst, nicht aus einem steifen Ellbogen. Halt das Plektrum so leicht, dass ein beherzter Zug es dir aus der Hand ziehen würde.',
        ],
        note: 'Halt die Fingernägel der Greifhand kurz. Ein auch nur leicht zu langer Nagel verhindert, dass die Fingerkuppe aufrecht steht — und keine Übung der Welt repariert eine Haltung, die dein Fingernagel unmöglich macht.',
      },
      {
        id: 'habits',
        title: 'Sechs Gewohnheiten, die du lieber nicht lernst',
        diagram: 'handarch',
        paras: [
          '<b>Quetschen.</b> Fast alle drücken um ein Vielfaches fester als nötig. Probier das: Greif einen Ton, lass dann langsam nach, bis es schnarrt, und gib gerade so viel dazu, dass das Schnarren aufhört. So fest soll es sein — und das ist erstaunlich leicht.',
          '<b>Daumen über der Kante.</b> Siehe oben. Das ist die Gewohnheit, die still und leise deckelt, wie weit du kommst.',
          '<b>Ständig auf die linke Hand schauen.</b> Solange du hinsiehst, wirst du nie rechtzeitig wechseln. Üb einen Wechsel von der ersten Woche an mit geschlossenen Augen; drei Tage lang fühlt es sich unmöglich an, danach nicht mehr.',
          '<b>Immer nur spielen, was du schon kannst.</b> Sehr angenehm — und keine Übung.',
          '<b>Schneller werden, wenn eine Stelle schiefgeht.</b> Über einen Fehler hinwegzuhetzen übt den Fehler. Werd langsamer, bis es stimmt, und dann erst schneller.',
          '<b>Gegen Schmerzen weiterspielen.</b> Schmerzende Fingerkuppen sind normal und vergehen in ein paar Wochen. Schmerz im Handgelenk, im Daumengelenk, im Unterarm oder in der Schulter ist ein Signal, dass an deiner Haltung etwas nicht stimmt — aufhören, ändern, wiederkommen.',
        ],
        note: 'Der ehrliche Test für all das: Könntest du das in einer Stunde noch tun, ohne dass die Hand wehtut? Wenn nicht, ist es nicht tragfähig, und es muss sich jetzt etwas ändern und nicht später.',
      },
      {
        id: 'practice',
        title: 'So üben, dass es hängen bleibt',
        paras: [
          '<b>Wenig und oft schlägt viel und selten.</b> Fünfzehn Minuten am Tag bringen dich in einem Monat weiter als zwei Stunden jeden Sonntag. Das Lernen passiert zwischen den Einheiten, und täglich gibt ihm mehr Gelegenheiten dazu.',
          '<b>Üb den Wechsel, nicht den Akkord.</b> Jeder einzelne Akkord sitzt binnen einer Woche. Sauber von einem zum anderen zu kommen ist die eigentliche Schwierigkeit, und das ist eine eigene Fähigkeit, die sich nur bessert, wenn du sie direkt angehst: zwei Akkorde, hin und her, langsam, vierzigmal. Die Übungsseite sortiert die Wechsel eines Liedes danach, wie oft sie vorkommen — dann übst du die, auf die es ankommt.',
          '<b>Langsam genug, um jedes Mal richtig zu sein.</b> Tempo ist ein Nebenprodukt von Genauigkeit, nie umgekehrt. Wenn du es dreimal hintereinander richtig spielst, geh ein wenig schneller; wenn nicht, warst du schon zu schnell.',
          '<b>Stimm sie jedes einzelne Mal.</b> Eine verstimmte Gitarre bringt deinem Ohr das Falsche bei, und sie ist mit Abstand der häufigste Grund, warum Anfänger glauben, sie spielten schlecht, obwohl sie es nicht tun.',
          '<b>Hör mit etwas auf, das du kannst.</b> Eine Übungseinheit mit einem Misserfolg zu beenden ist die Art, wie ein Hobby stirbt. Spiel am Ende eine Sache, die dir Spaß macht, und sei sie noch so einfach.',
        ],
      },
      {
        id: 'start',
        title: 'Wenn das deine erste Woche ist',
        paras: [
          'Stimme die Gitarre jedes Mal vor dem Spielen. Ein verstimmtes Instrument bringt deinem Ohr das Falsche bei, und es ist der häufigste Grund, warum Anfänger denken, sie würden schlecht spielen, obwohl sie es gar nicht tun.',
          'Lerne zuerst <b>Em</b> — zwei Finger und keine abgedämpfte Saite. Dann <b>Am</b>, dann <b>G</b>, dann <b>D</b>. Diese vier decken eine riesige Zahl von Lagerfeuerliedern ab.',
          'Schmerzende Fingerkuppen sind normal und vergehen nach ein paar Wochen. Schmerzen im Handgelenk sind es nicht — wenn das Handgelenk wehtut, hör auf und ändere, wie du den Hals hältst.',
          'Sauber zwischen Akkorden zu wechseln ist schwerer als jeder einzelne Akkord, und genau das lohnt sich zu üben. Nimm zwei Akkorde und wechsle langsam immer wieder hin und her, bevor du dich um ein ganzes Lied kümmerst.',
        ],
      },
    ],
  },
};

const PIANO = {
  en: {
    title: 'Getting started',
    sub: 'Everything the rest of this app assumes you already know about a keyboard. Nothing here needs any musical background.',
    sections: [
      {
        id: 'pattern',
        title: 'Finding your way around the keys',
        diagram: 'keyboardpattern',
        paras: [
          'Every white key looks exactly like every other white key. The only thing that tells you where you are is the <b>black keys</b>, which run in an endless repeating pattern: a group of <b>two</b>, then a group of <b>three</b>, then two again, for the whole length of the instrument.',
          '<b>C is the white key immediately to the left of any group of two.</b> That one fact is the whole trick. Learn it and you can find C anywhere on any keyboard in the world, instantly, without counting.',
          'Its partner: <b>F is immediately to the left of any group of three.</b> Between them you always know roughly where you are.',
          'From C the white keys are named <b>C D E F G A B</b>, and then it starts again at C. Seven letters, over and over, seven or eight times across the instrument.',
        ],
        note: 'The black keys are named after their neighbours: the key between C and D is both <b>C♯</b> ("C sharp", one step up from C) and <b>D♭</b> ("D flat", one step down from D). Same key, two names, depending on which side you arrived from.',
      },
      {
        id: 'middlec',
        title: 'Middle C, and what the numbers mean',
        diagram: 'middlec',
        paras: [
          'There are seven or eight Cs on a piano and they all sound like C, just higher or lower. So when this app says <b>C4</b>, the number says <i>which</i> C.',
          'The counting starts at the bottom: the lowest full C is C1, the next C up is C2, and so on. <b>C4</b> is the fourth one, and it is called <b>middle C</b> because it sits roughly at the centre of a full-size keyboard — usually right around the maker\'s name.',
          'Every note carries the same kind of number. <b>A4</b> is the A just above middle C, and it is the note the whole tuning system is built on at 440 Hz. The number changes at C, not at A — so B3 and C4 are next-door neighbours.',
        ],
        note: 'This app marks middle C with a small blue dot on every keyboard diagram, so you never have to count.',
      },
      {
        id: 'fingers',
        title: 'Finger numbers',
        diagram: 'fingernumbers',
        paras: [
          'Piano music numbers your fingers, and the numbering is the same for both hands: <b>1 is the thumb</b>, 2 the index finger, 3 the middle, 4 the ring, 5 the little finger.',
          'This catches people out because it mirrors. Both hands count outward from the thumb, so your two number 1s point towards each other and your two number 5s point outward.',
          'When this app shows a chord, the small number on each key is the finger to use with your <b>right hand</b>. They are suggestions that keep your hand in one comfortable position — not rules.',
        ],
        note: 'Guitar players will know this numbering as 1–4 with no thumb. The piano includes the thumb, so the same finger has a different number on each instrument.',
      },
      {
        id: 'twoways',
        title: 'Two different ways to play',
        paras: [
          'This is the thing nobody tells you at the start, and it explains almost everything else.',
          'A piano can be played <b>one note at a time</b> — picking out a tune, the way a flute or a voice does. A melody. That is usually the right hand\'s job.',
          'Or it can be played <b>several notes at once</b> — pressing three or four keys together. That is a <b>chord</b>. Play chords and you are not playing the tune at all; your <b>voice</b> does that while the piano supplies the backing.',
          'Almost every campfire, scout and singalong song is the second kind. You will learn perhaps eight chords, and that is genuinely enough for hundreds of songs. You never pick out the melody, because you are singing it.',
          'Real piano playing eventually does both at once — chords in the left hand, melody in the right — but that is a long way off and not something to worry about now.',
        ],
      },
      {
        id: 'chords',
        title: 'What a chord actually is',
        diagram: 'pianochord',
        paras: [
          'A guitar chord is a <b>shape</b> you memorise — which finger presses which string. A piano chord is not a shape at all. It is simply a <b>set of notes</b>, and you press them.',
          'That makes chords much easier to understand here and slightly harder to find, because there is no picture to copy — you have to know which notes.',
          'The plain ones follow a pattern: start on the note the chord is named after, <b>skip a white key</b>, press the next, skip another, press the next. C major is <b>C E G</b>. F major is <b>F A C</b>. G major is <b>G B D</b>. Three fingers — thumb, middle, little.',
          'Minor chords, written with a small <b>m</b> like <b>Am</b> or <b>Em</b>, move the middle note down by exactly one key. That single key is the whole difference between the bright sound and the sad one.',
        ],
        note: 'A chord written with a slash, like <b>C/G</b>, means the chord C with a G underneath it. This app draws that lower note in purple: it is for the left hand.',
      },
      {
        id: 'input',
        title: 'MIDI or microphone',
        paras: [
          'This app can follow what you play in two completely different ways, and it is worth knowing which you are using.',
          'The <b>microphone</b> listens to sound. It works with any piano at all — an acoustic upright, a grand, a keyboard through its own speakers — because it only needs to hear you. But it has to work the notes out from the sound, which is genuinely hard: it can be fooled by a quiet room, by playing too far away, and it is much less certain about several notes at once than about one.',
          'A <b>MIDI keyboard</b> sends what you press as data, over a USB cable, before any sound exists. Nothing is heard and nothing is inferred: the app knows you pressed exactly those keys, exactly that hard, at exactly that moment. Chords are read perfectly, and the app can tell you precisely which note of a chord you are missing rather than a percentage.',
          'If your keyboard has a USB socket, use it. Almost every digital piano made in the last twenty years will work with nothing to install — plug it in, choose <b>MIDI keyboard</b> as the input, and allow the browser access when it asks.',
        ],
        note: 'MIDI needs Chrome or Edge. Firefox and Safari do not support it, and the microphone is the only option there.',
      },
      {
        id: 'tuning',
        title: 'Tuning, and why yours is not quite wrong',
        paras: [
          'You do not tune a piano. A tuner does, once or twice a year, with tools — there are over two hundred strings under several tonnes of combined tension. Nothing on the note-finder page is asking you to turn anything.',
          'What it is useful for is <b>checking</b>. If one note reads clearly flat or sharp while its neighbours are fine, a single string has slipped. If everything reads flat, the whole instrument has drifted and it is time to book someone.',
          'One warning before you judge your piano harshly. Pianos are deliberately tuned <b>stretched</b>: the bass slightly flat and the treble slightly sharp, growing to as much as thirty cents at the extremes. That is not a fault — it is correct, and it is what makes a piano sound like a piano. Judge the two octaves around middle C, where the stretch is almost nothing.',
        ],
      },
      {
        id: 'posture',
        title: 'How to sit at it',
        diagram: 'posture',
        paras: [
          'None of this is fussiness. Nothing you do wrong in week one hurts in week one — it hurts in year one, by which point it is a habit rather than a choice.',
          'Sit on the <b>front half of the bench</b>, not back on it, with both feet flat on the floor. Your weight should be on your feet and sitting bones, not slumped into your lower back.',
          'Height matters more than anything else here. Set the bench so your <b>forearms are roughly level with the keys</b> and your wrists are not dropping below them. If your elbows are lower than the keyboard you will play from a bent wrist all day; if they are much higher you will push down instead of playing.',
          'Distance: sit far enough back that your elbows stay slightly in front of your body when you play in the middle, and you can reach both ends without leaning off the bench. If you have to fold your arms in to play middle C, you are too close.',
          'Middle C sits roughly opposite your navel. That is the reference point for everything else.',
        ],
        note: 'Almost every dining chair is too low for a piano and almost every piano stool is adjustable. Five minutes with the height is worth more than five hours of practice at the wrong one.',
      },
      {
        id: 'hands',
        title: 'The shape of the hand',
        diagram: 'handarch',
        paras: [
          'Let your arm hang loose at your side for a moment and look at your hand. That relaxed, slightly curled shape is exactly the shape it should keep on the keys. Nothing needs to be added to it — the work is not letting it flatten out.',
          'Play <b>from the knuckle</b>, the joint where the finger meets the hand, rather than flapping the whole finger or pushing with the arm. The finger falls; it is not thrown.',
          'The failure to watch for is the <b>last joint collapsing inward</b> so the fingertip caves and the pad lands flat. It is comfortable, it is very common, and it costs you all control over how loudly a note sounds — plus it drives force into a small joint instead of down the bone. The fingertip should stay firm, like a small arch holding itself up.',
          'The <b>thumb plays on its side</b>, on the outer corner near the nail, and stays curved rather than sticking out stiffly. A collapsed thumb joint is the single most common reason the bottom note of a chord does not sound.',
          'Keep your <b>wrist level and loose</b> — in line with the forearm, not bent up and not sagging below the keys. A locked wrist is what turns half an hour of practice into an aching forearm.',
          'A piano key needs surprisingly little force. If your forearm aches, you are pressing several times harder than the instrument asks; the note gets loud from <i>speed</i> of the key going down, not from squeezing it once it is there.',
        ],
        note: 'Fingernails: short. A nail that touches the key before the fingertip does forces the finger flat, and no amount of practice fixes a shape your nail is preventing.',
      },
      {
        id: 'habits',
        title: 'Six habits worth not learning',
        paras: [
          '<b>Flat fingers and collapsed joints.</b> The one thing on this page most worth fixing on day one, because every other technique is built on the arch holding.',
          '<b>Ignoring the fingering numbers.</b> They look like a suggestion and they are not arbitrary: they are chosen so the <i>next</i> notes are reachable. Getting through a bar with the wrong fingers usually means the following bar is impossible.',
          '<b>Always starting from the beginning.</b> Play a piece from bar one thirty times and you will have practised the opening thirty times and the hard bit twice. Start <i>at</i> the hard bit.',
          '<b>Watching your hands.</b> Necessary at first, and a habit to start breaking early — you cannot read ahead while you are looking down. Try one hand at a time with your eyes on the screen.',
          '<b>Playing louder to be more accurate.</b> Force feels like control and is the opposite of it. If a passage is going wrong, play it quieter and slower, not harder.',
          '<b>Practising through pain.</b> Aching forearms mean you are pressing far too hard. Pain in the wrist is not normal at any stage — stop, check the bench height, and change what you are doing.',
        ],
      },
      {
        id: 'practice',
        title: 'How to practise so it sticks',
        paras: [
          '<b>Little and often beats long and rare.</b> Fifteen minutes a day will take you further in a month than two hours every Sunday. The consolidation happens between sessions.',
          '<b>Hands separately, then together.</b> Not a beginner\'s crutch — it is how the piece is actually learned. Each hand is doing a different job, and trying to fix both at once means fixing neither.',
          '<b>Slow enough to be right every time.</b> Speed is a by-product of accuracy, never the other way round. Three correct repetitions in a row earn a small increase; anything less means you were already too fast.',
          '<b>Name the hard bar and work on that bar.</b> Four beats, twenty times, is worth more than the whole piece twice.',
          '<b>Finish on something you can play.</b> Ending on a failure is how a hobby dies. Play one thing you enjoy at the end, however simple.',
        ],
      },
      {
        id: 'start',
        title: 'If this is your first week',
        paras: [
          'Sit so your forearms are roughly level with the keys and your wrists are not dropping below them. Keep your hands rounded, as though holding a small ball, and press from the knuckle rather than by flapping the whole finger.',
          'Learn <b>C major</b> first — C E G, all white keys, thumb–middle–little. Then <b>F</b> and <b>G</b>. Those three cover an enormous number of songs on their own.',
          'Aching in your forearm means you are pressing far harder than a key needs. A piano key needs surprisingly little. Pain in your wrist is not normal — stop and change how you are sitting.',
          'Changing between chords cleanly is harder than any single chord, and it is the thing worth practising. Pick two, swap between them slowly, over and over, before worrying about any song.',
        ],
      },
    ],
  },

  de: {
    title: 'Erste Schritte',
    sub: 'Alles, was der Rest dieser App über eine Klaviatur als bekannt voraussetzt. Nichts davon braucht musikalische Vorkenntnisse.',
    sections: [
      {
        id: 'pattern',
        title: 'Sich auf den Tasten zurechtfinden',
        diagram: 'keyboardpattern',
        paras: [
          'Jede weiße Taste sieht aus wie jede andere weiße Taste. Das Einzige, was dir sagt, wo du bist, sind die <b>schwarzen Tasten</b>. Sie laufen in einem endlos wiederholten Muster: eine Gruppe aus <b>zwei</b>, dann eine aus <b>drei</b>, dann wieder zwei — über das ganze Instrument.',
          '<b>C ist die weiße Taste direkt links neben einer Zweiergruppe.</b> Das ist der ganze Trick. Wenn du das weißt, findest du das C auf jeder Klaviatur der Welt sofort, ohne zu zählen.',
          'Der Gegenstück-Merksatz: <b>F liegt direkt links neben einer Dreiergruppe.</b> Zusammen weißt du damit immer ungefähr, wo du bist.',
          'Ab dem C heißen die weißen Tasten <b>C D E F G A H</b>, und dann fängt es beim C wieder an. Sieben Buchstaben, immer wieder, sieben- oder achtmal über das Instrument.',
        ],
        note: 'Die schwarzen Tasten heißen nach ihren Nachbarn: die Taste zwischen C und D ist sowohl <b>Cis</b> (einen Schritt über C) als auch <b>Des</b> (einen Schritt unter D). Dieselbe Taste, zwei Namen — je nachdem, von welcher Seite du kommst. <b>Achtung:</b> Was auf Deutsch <b>H</b> heißt, schreibt die App international als <b>B</b>, und was hier <b>B</b> heißt, schreibt sie als <b>B♭</b>.',
      },
      {
        id: 'middlec',
        title: 'Das mittlere C und was die Zahlen bedeuten',
        diagram: 'middlec',
        paras: [
          'Es gibt sieben oder acht Cs auf einem Klavier, und sie klingen alle nach C — nur höher oder tiefer. Wenn die App also <b>C4</b> schreibt, sagt die Zahl, <i>welches</i> C gemeint ist.',
          'Gezählt wird von unten: das tiefste vollständige C ist C1, das nächste C2 und so weiter. <b>C4</b> ist das vierte, und es heißt <b>mittleres C</b>, weil es ungefähr in der Mitte einer vollen Klaviatur liegt — meistens genau dort, wo der Name des Herstellers steht.',
          'Jeder Ton trägt so eine Zahl. <b>A4</b> ist das A direkt über dem mittleren C, und auf ihm ist mit 440 Hz das ganze Stimmsystem aufgebaut. Die Zahl wechselt beim C, nicht beim A — H3 und C4 sind also direkte Nachbarn.',
        ],
        note: 'Die App markiert das mittlere C auf jedem Tastatur-Bild mit einem kleinen blauen Punkt, damit du nie zählen musst.',
      },
      {
        id: 'fingers',
        title: 'Fingersätze',
        diagram: 'fingernumbers',
        paras: [
          'Klaviernoten nummerieren die Finger, und zwar für beide Hände gleich: <b>1 ist der Daumen</b>, 2 der Zeigefinger, 3 der Mittelfinger, 4 der Ringfinger, 5 der kleine Finger.',
          'Das verwirrt anfangs, weil es gespiegelt ist. Beide Hände zählen vom Daumen nach außen, deine beiden Einsen zeigen also aufeinander zu und deine beiden Fünfen nach außen.',
          'Wenn die App einen Akkord zeigt, ist die kleine Zahl auf jeder Taste der Finger der <b>rechten Hand</b>. Das sind Vorschläge, die deine Hand in einer bequemen Lage halten — keine Vorschriften.',
        ],
        note: 'Von der Gitarre kennst du die Nummerierung 1–4 ohne Daumen. Am Klavier zählt der Daumen mit, derselbe Finger hat auf beiden Instrumenten also eine andere Nummer.',
      },
      {
        id: 'twoways',
        title: 'Zwei ganz verschiedene Arten zu spielen',
        paras: [
          'Das ist die Sache, die einem am Anfang niemand sagt, und sie erklärt fast alles andere.',
          'Ein Klavier kann man <b>Ton für Ton</b> spielen — eine Melodie heraussuchen, so wie es eine Flöte oder eine Stimme tut. Das ist normalerweise die Aufgabe der rechten Hand.',
          'Oder man spielt <b>mehrere Töne gleichzeitig</b> — drei oder vier Tasten zusammen. Das ist ein <b>Akkord</b>. Wer Akkorde spielt, spielt die Melodie gar nicht; das macht die <b>Stimme</b>, während das Klavier die Begleitung liefert.',
          'Fast jedes Lagerfeuer-, Pfadfinder- und Singlied ist die zweite Art. Du lernst vielleicht acht Akkorde, und das reicht wirklich für Hunderte von Liedern. Die Melodie suchst du nie heraus, weil du sie singst.',
          'Richtiges Klavierspiel macht irgendwann beides gleichzeitig — Akkorde links, Melodie rechts — aber das ist weit weg und muss dich jetzt nicht kümmern.',
        ],
      },
      {
        id: 'chords',
        title: 'Was ein Akkord eigentlich ist',
        diagram: 'pianochord',
        paras: [
          'Ein Gitarrenakkord ist ein <b>Griff</b>, den man auswendig lernt — welcher Finger drückt welche Saite. Ein Klavierakkord ist überhaupt kein Griff. Er ist einfach eine <b>Menge von Tönen</b>, und die drückst du.',
          'Dadurch sind Akkorde hier viel leichter zu verstehen und ein bisschen schwerer zu finden: Es gibt kein Bild zum Abmalen, du musst wissen, welche Töne es sind.',
          'Die einfachen folgen einem Muster: Fang auf dem Ton an, nach dem der Akkord heißt, <b>überspring eine weiße Taste</b>, drück die nächste, überspring wieder eine, drück die nächste. C-Dur ist <b>C E G</b>. F-Dur ist <b>F A C</b>. G-Dur ist <b>G H D</b>. Drei Finger — Daumen, Mittelfinger, kleiner Finger.',
          'Moll-Akkorde, geschrieben mit einem kleinen <b>m</b> wie <b>Am</b> oder <b>Em</b>, schieben den mittleren Ton um genau eine Taste nach unten. Diese eine Taste ist der ganze Unterschied zwischen dem hellen und dem traurigen Klang.',
        ],
        note: 'Ein Akkord mit Schrägstrich, etwa <b>C/G</b>, meint den Akkord C mit einem G darunter. Die App zeichnet diesen tieferen Ton violett: er gehört der linken Hand.',
      },
      {
        id: 'input',
        title: 'MIDI oder Mikrofon',
        paras: [
          'Die App kann auf zwei ganz verschiedene Arten verfolgen, was du spielst, und es lohnt sich zu wissen, welche du gerade benutzt.',
          'Das <b>Mikrofon</b> hört auf den Klang. Es funktioniert mit jedem Klavier — einem akustischen Klavier, einem Flügel, einem Keyboard über seine eigenen Lautsprecher — weil es dich nur hören muss. Aber es muss die Töne aus dem Klang erschließen, und das ist wirklich schwer: ein leiser Raum oder zu großer Abstand können es täuschen, und bei mehreren Tönen gleichzeitig ist es deutlich unsicherer als bei einem einzelnen.',
          'Ein <b>MIDI-Keyboard</b> schickt jeden Tastendruck als Daten über ein USB-Kabel, bevor überhaupt ein Klang entsteht. Nichts wird gehört und nichts erschlossen: Die App weiß, dass du genau diese Tasten gedrückt hast, genau so fest, genau in diesem Moment. Akkorde werden fehlerfrei gelesen, und die App kann dir statt einer Prozentzahl genau sagen, welcher Ton eines Akkords dir fehlt.',
          'Wenn dein Keyboard eine USB-Buchse hat, nimm sie. Fast jedes Digitalpiano der letzten zwanzig Jahre funktioniert ohne Installation — anstecken, als Eingang <b>MIDI-Keyboard</b> wählen und den Zugriff erlauben, wenn der Browser fragt.',
        ],
        note: 'MIDI braucht Chrome oder Edge. Firefox und Safari unterstützen es nicht; dort bleibt nur das Mikrofon.',
      },
      {
        id: 'tuning',
        title: 'Stimmung — und warum deine gar nicht falsch ist',
        paras: [
          'Ein Klavier stimmt man nicht selbst. Das macht ein Klavierstimmer ein- oder zweimal im Jahr mit Werkzeug — es sind über zweihundert Saiten unter mehreren Tonnen Gesamtzug. Nichts auf der Tonfinder-Seite verlangt, dass du irgendwo drehst.',
          'Nützlich ist sie zum <b>Prüfen</b>. Liest ein einzelner Ton deutlich zu tief oder zu hoch, während seine Nachbarn stimmen, hat sich eine Saite verzogen. Liest alles zu tief, ist das ganze Instrument abgesackt und es wird Zeit für einen Termin.',
          'Eine Warnung, bevor du hart über dein Klavier urteilst: Klaviere werden absichtlich <b>gespreizt</b> gestimmt — der Bass etwas tiefer, der Diskant etwas höher, an den Rändern bis zu dreißig Cent. Das ist kein Fehler, sondern richtig, und es ist genau das, was ein Klavier nach Klavier klingen lässt. Beurteile die zwei Oktaven um das mittlere C, dort ist die Spreizung fast null.',
        ],
      },
      {
        id: 'posture',
        title: 'Wie du davor sitzt',
        diagram: 'posture',
        paras: [
          'Nichts davon ist Pedanterie. Was du in der ersten Woche falsch machst, tut in der ersten Woche nicht weh — es tut im ersten Jahr weh, und dann ist es eine Gewohnheit statt einer Entscheidung.',
          'Setz dich auf die <b>vordere Hälfte der Bank</b>, nicht weit hinten, beide Füße flach auf dem Boden. Dein Gewicht liegt auf den Füßen und den Sitzbeinhöckern, nicht zusammengesackt im unteren Rücken.',
          'Die Höhe ist hier wichtiger als alles andere. Stell die Bank so ein, dass deine <b>Unterarme ungefähr auf Tastenhöhe</b> liegen und die Handgelenke nicht darunter durchhängen. Sind die Ellbogen tiefer als die Tastatur, spielst du den ganzen Tag aus einem abgeknickten Gelenk; sind sie viel höher, drückst du statt zu spielen.',
          'Abstand: weit genug weg, dass die Ellbogen beim Spielen in der Mitte leicht vor dem Körper bleiben und du beide Enden erreichst, ohne von der Bank zu rutschen. Wenn du die Arme anwinkeln musst, um das mittlere C zu spielen, sitzt du zu nah.',
          'Das mittlere C liegt ungefähr auf Höhe deines Bauchnabels. Das ist der Bezugspunkt für alles andere.',
        ],
        note: 'Fast jeder Esszimmerstuhl ist fürs Klavier zu niedrig, und fast jede Klavierbank ist verstellbar. Fünf Minuten mit der Höhe sind mehr wert als fünf Stunden Üben auf der falschen.',
      },
      {
        id: 'hands',
        title: 'Die Form der Hand',
        diagram: 'handarch',
        paras: [
          'Lass den Arm einen Moment locker herunterhängen und sieh dir die Hand an. Diese entspannte, leicht gekrümmte Form ist genau die, die sie auf den Tasten behalten soll. Es muss nichts hinzukommen — die Arbeit besteht darin, sie nicht flach werden zu lassen.',
          'Spiel <b>aus dem Fingergrundgelenk</b>, dort wo der Finger an die Hand ansetzt, statt den ganzen Finger zu schlagen oder mit dem Arm zu drücken. Der Finger fällt; er wird nicht geworfen.',
          'Der Fehler, auf den du achten solltest, ist das <b>eingeknickte vordere Gelenk</b>: Die Fingerkuppe klappt ein und die Fingerbeere landet flach. Das ist bequem, das ist sehr verbreitet, und es kostet dich jede Kontrolle über die Lautstärke — außerdem leitet es die Kraft in ein kleines Gelenk statt in den Knochen. Die Kuppe soll fest bleiben, wie ein kleiner Bogen, der sich selbst trägt.',
          'Der <b>Daumen spielt auf der Seite</b>, an der äußeren Ecke neben dem Nagel, und bleibt gerundet statt steif abzustehen. Ein eingeknicktes Daumengelenk ist der mit Abstand häufigste Grund, warum der unterste Ton eines Akkords nicht klingt.',
          'Halt das <b>Handgelenk waagerecht und locker</b> — in einer Linie mit dem Unterarm, nicht nach oben abgeknickt und nicht unter die Tasten durchgesackt. Ein festgestelltes Handgelenk ist es, was aus einer halben Stunde Üben einen ziehenden Unterarm macht.',
          'Eine Klaviertaste braucht erstaunlich wenig Kraft. Zieht dein Unterarm, drückst du um ein Vielfaches fester, als das Instrument verlangt: Der Ton wird laut durch die <i>Geschwindigkeit</i>, mit der die Taste heruntergeht, nicht durch Nachdrücken, wenn sie unten ist.',
        ],
        note: 'Fingernägel: kurz. Ein Nagel, der die Taste vor der Fingerkuppe berührt, zwingt den Finger flach — und keine Übung repariert eine Haltung, die dein Nagel unmöglich macht.',
      },
      {
        id: 'habits',
        title: 'Sechs Gewohnheiten, die du lieber nicht lernst',
        paras: [
          '<b>Flache Finger und eingeknickte Gelenke.</b> Das ist auf dieser Seite das, was sich am meisten lohnt, gleich am ersten Tag zu korrigieren — jede weitere Technik baut darauf auf, dass der Bogen hält.',
          '<b>Fingersätze ignorieren.</b> Sie sehen aus wie ein Vorschlag und sind nicht willkürlich: Sie sind so gewählt, dass die <i>nächsten</i> Töne erreichbar bleiben. Einen Takt mit den falschen Fingern zu schaffen heißt meistens, dass der folgende unmöglich wird.',
          '<b>Immer von vorn anfangen.</b> Spiel ein Stück dreißigmal ab Takt eins, und du hast den Anfang dreißigmal geübt und die schwere Stelle zweimal. Fang <i>an</i> der schweren Stelle an.',
          '<b>Auf die Hände schauen.</b> Am Anfang nötig, und eine Gewohnheit, die du früh aufbrechen solltest — solange du nach unten siehst, kannst du nicht vorauslesen. Probier es mit einer Hand und dem Blick auf dem Bildschirm.',
          '<b>Lauter spielen, um genauer zu werden.</b> Kraft fühlt sich nach Kontrolle an und ist ihr Gegenteil. Wenn eine Stelle schiefgeht, spiel sie leiser und langsamer, nicht härter.',
          '<b>Gegen Schmerzen üben.</b> Ziehende Unterarme heißen, dass du viel zu fest drückst. Schmerz im Handgelenk ist in keinem Stadium normal — aufhören, die Bankhöhe prüfen und etwas ändern.',
        ],
      },
      {
        id: 'practice',
        title: 'So üben, dass es hängen bleibt',
        paras: [
          '<b>Wenig und oft schlägt viel und selten.</b> Fünfzehn Minuten am Tag bringen dich in einem Monat weiter als zwei Stunden jeden Sonntag. Das Festigen passiert zwischen den Einheiten.',
          '<b>Hände einzeln, dann zusammen.</b> Keine Anfängerkrücke, sondern die Art, wie ein Stück tatsächlich gelernt wird. Jede Hand macht etwas anderes, und wer beides gleichzeitig reparieren will, repariert keines.',
          '<b>Langsam genug, um jedes Mal richtig zu sein.</b> Tempo ist ein Nebenprodukt von Genauigkeit, nie umgekehrt. Drei richtige Wiederholungen hintereinander verdienen eine kleine Steigerung; alles darunter heißt, du warst schon zu schnell.',
          '<b>Benenne den schweren Takt und arbeite an diesem Takt.</b> Vier Schläge, zwanzigmal, sind mehr wert als das ganze Stück zweimal.',
          '<b>Hör mit etwas auf, das du kannst.</b> Mit einem Misserfolg aufzuhören ist die Art, wie ein Hobby stirbt. Spiel am Ende eine Sache, die dir Spaß macht, und sei sie noch so einfach.',
        ],
      },
      {
        id: 'start',
        title: 'Wenn das deine erste Woche ist',
        paras: [
          'Setz dich so, dass deine Unterarme ungefähr auf Tastenhöhe sind und die Handgelenke nicht darunter durchhängen. Halt die Hände rund, als hieltest du einen kleinen Ball, und drück aus dem Fingergrundgelenk statt mit dem ganzen Finger zu schlagen.',
          'Lerne zuerst <b>C-Dur</b> — C E G, alles weiße Tasten, Daumen–Mittelfinger–kleiner Finger. Dann <b>F</b> und <b>G</b>. Diese drei decken für sich schon eine riesige Zahl von Liedern ab.',
          'Ziehen im Unterarm heißt, dass du viel fester drückst, als eine Taste braucht. Eine Klaviertaste braucht erstaunlich wenig. Schmerzen im Handgelenk sind nicht normal — hör auf und ändere, wie du sitzt.',
          'Sauber zwischen Akkorden zu wechseln ist schwerer als jeder einzelne Akkord, und genau das lohnt sich zu üben. Nimm zwei, wechsle langsam immer wieder hin und her, bevor du dich um ein ganzes Lied kümmerst.',
        ],
      },
    ],
  },
};

const LYRE = {
  en: {
    title: 'Getting started',
    sub: 'Everything the rest of this app assumes you already know about a 16-string lyre. Nothing here needs any musical background.',
    sections: [
      {
        id: 'parts',
        title: 'What you are holding',
        paras: [
          'A lyre is a wooden frame with sixteen metal strings stretched across it. There is no neck and there are no frets, because there is nothing to press: <b>each string plays one note and only that note</b>. Play a string and you get its note; that is the entire instrument.',
          'Along the top arm are the <b>tuning pins</b>, one per string, turned with the little <b>wrench</b> that came in the box. The flat face is the <b>soundboard</b>, and the hole in it is what makes the instrument audible at all.',
          'That one-note-per-string design is why a lyre is the fastest instrument on this page to make a pleasant sound on, and why it is the most restricted. There is nothing to learn about <i>where</i> a note is. Everything you will spend time on is which string, in what order, and keeping the sixteen of them in tune.',
        ],
        note: 'This app assumes the common 16-string lyre tuned to C major from G3 to A5, which is how nearly all of them are sold. If your strings are labelled with different letters, yours is tuned differently and the string numbers here will not match.',
      },
      {
        id: 'strings',
        title: 'The sixteen strings',
        diagram: 'lyrestrings',
        paras: [
          'The strings are numbered <b>1 to 16</b>. String 1 is the <b>longest and thickest</b>, and it plays the <b>lowest</b> note — it sits on the left as the front of the instrument faces you. String 16 is the shortest and thinnest and plays the highest note.',
          'If you have come from a guitar, note that this is the other way round. On a guitar, string 1 is the <i>thinnest</i>. Here the numbers run the same way the pitch does, which is far easier to remember once you stop expecting otherwise.',
          'The notes, from string 1 upward, are <b>G A B C D E F G A B C D E F G A</b> — the plain letters, in order, one per string, starting on G. There are no sharps or flats anywhere on the instrument. Most lyres arrive with the letters printed on a sticker beside the pins; if yours has lost it, the tuner page lists all sixteen.',
        ],
        note: 'Two full octaves plus two notes. The lowest string is three notes below middle C, and the highest is an octave and a half above it.',
      },
      {
        id: 'holding',
        title: 'How to hold it',
        diagram: 'lyrehold',
        paras: [
          'Sit with the base of the lyre on your lap and <b>tilt the top back against your chest or shoulder</b>, at roughly the angle you would hold a book you were reading. Held flat, you cannot see the strings and your wrists have to bend awkwardly to reach them; held vertically, it slides.',
          'Let it <b>rest</b> against you rather than gripping it. The frame is light and the tilt does the holding; if your arms are clamping it in place they are not free to play.',
          'Your <b>left hand plays the low strings</b> and your <b>right hand plays the high ones</b>. They divide the instrument between them and do not normally cross. A melody that wanders across the middle is passed from one hand to the other, which feels odd for a week and then stops being a thing you think about.',
          'Reach the strings from the <b>front</b>, with your fingers coming in over the top of the soundboard. Some players hold the instrument the other way round and play from behind; either works, but pick one and stay with it, because the strings are in the opposite order from the far side.',
        ],
        note: 'If you cannot see the string you want, the tilt is wrong. Adjust the instrument, not your neck — leaning over to look is how a pleasant half hour becomes a sore upper back.',
      },
      {
        id: 'hands',
        title: 'How to pluck',
        diagram: 'handarch',
        paras: [
          'Pluck with the <b>side of the fingertip, just next to the nail</b>, and let the finger travel <i>through</i> the string and away. That gives a round, full note. Landing flat on the pad of the finger damps the string at the moment it leaves, which is why some notes come out as a dull thud with no reason you can hear.',
          'Keep the finger <b>curved</b>, with the last joint firm rather than collapsing inward. This is the same arch as on a guitar or a piano, and it matters for the same reason: a collapsed joint cannot control how hard it plucks.',
          'Use your <b>thumb, index and middle fingers</b> for most things. The ring finger joins in later; the little finger essentially never does.',
          'Metal strings <b>ring for a long time</b>, and that is the whole reason a lyre sounds magical and also the whole reason it turns to mush. Two notes that should not overlap will overlap unless you stop them. To silence a string, touch it lightly with the side of a finger you are not using; to silence everything, lay a flat palm across all sixteen. Learning to damp is not an advanced technique — it is half of playing this instrument cleanly.',
        ],
        note: 'Nails: a little length helps and a lot does not. If your nails are long enough to click, they are too long. Some players use finger picks; most do not need them.',
      },
      {
        id: 'tuning',
        title: 'Tuning it, which you will do a lot',
        paras: [
          'A lyre goes out of tune far faster than a guitar. A brand-new one drifts flat for <b>several weeks</b> while the strings stretch, and even a settled one wants checking every time you pick it up. This is normal and not a fault in your instrument.',
          'Push the <b>wrench fully down onto the pin</b> before you turn anything. A wrench sitting half on will round off the square end of the pin, and a rounded pin cannot be tuned at all.',
          'Turn in <b>tiny amounts</b>. These are friction pins with no gearing, so an eighth of a turn is a large move — far larger than the same movement on a guitar peg. Pluck the string again after every adjustment rather than turning while listening.',
          'Work from <b>string 1 upward to string 16</b>, then go back and do it again. Every string you tighten pulls a little harder on the frame and drops the ones you have already done; two passes is normal and three is not unusual on a new instrument.',
          'Always finish by coming <i>up</i> to the note. If you have gone too sharp, go below the note and come back up — a string approached from above slips back down as you play.',
          'On the tuner page, pluck one string at a time. The app names the string it heard and tells you which way to turn.',
        ],
        note: '<b>Do not over-tighten.</b> A string tuned much above its note will break, and a breaking lyre string can whip. If a string is a long way sharp of where it should be and getting tighter, stop and check you are on the string you think you are — tuning string 12 while looking at string 13 is the usual cause.',
      },
      {
        id: 'diatonic',
        title: 'The notes it has not got',
        paras: [
          'This is the one thing about a lyre that surprises people, and it is worth understanding early rather than being confused by it later.',
          'The instrument has the <b>white notes of a piano and nothing else</b>. There is no F♯ on it. Not in a hard-to-reach place — nowhere, in any octave, ever. The same goes for C♯, D♯, G♯ and A♯.',
          'So a song does not simply sit awkwardly in the wrong key here; it <b>loses notes</b>. A tune in D major needs F♯ and C♯, and on a lyre it would come out with holes in it.',
          'The fix is to <b>move the whole song</b> until it lands in a key the instrument has. That same tune in D, shifted down two semitones into C, needs no sharps at all and fits perfectly. The songs page has a <b>Find a key that fits</b> button that searches for exactly that, and it tells you how many notes are missing before and after.',
          'Songs in <b>C major</b> and <b>A minor</b> fit as written. Those two keys, plus anything you have transposed into them, is a very large amount of music.',
        ],
        note: 'A guitarist reading this: the lyre equivalent of a capo is transposing. There is no clamp, but the songs page does the same job in software.',
      },
      {
        id: 'habits',
        title: 'Five habits worth not learning',
        paras: [
          '<b>Letting everything ring.</b> The most common thing that separates a lyre that sounds lovely from one that sounds like a wash of noise. Damp deliberately.',
          '<b>Plucking with the flat pad.</b> Comfortable, quiet, and dull. Use the side of the fingertip.',
          '<b>Digging in for volume.</b> A lyre is a quiet instrument and pulling harder mostly produces buzz and broken nails, not volume. If you need it louder, hold it against a resonant surface or move closer to the microphone.',
          '<b>Playing with one hand.</b> Reaching across the whole instrument with your right hand works for about four strings and then stops. Divide the instrument between the hands from the start.',
          '<b>Skipping the tuning.</b> The one place where this instrument is genuinely more demanding than a guitar. An untuned lyre sounds wrong in a way that is easy to blame on yourself.',
        ],
      },
      {
        id: 'practice',
        title: 'How to practise so it sticks',
        paras: [
          '<b>Little and often beats long and rare.</b> Fifteen minutes a day will take you further in a month than two hours on a Sunday.',
          '<b>Learn where the strings are without looking.</b> The strings are identical to look at except for their length, so find your landmarks by feel: the two outer strings, and the middle. Play a scale with your eyes shut from the first week.',
          '<b>Slow enough to be right every time.</b> Speed is a by-product of accuracy. If you can play a phrase correctly three times running, go slightly faster.',
          '<b>Practise the hand-over.</b> The hard part on a lyre is not any single note but the moment the melody crosses from the left hand to the right. Find that spot in a tune and drill it on its own.',
          '<b>Finish on something you can play.</b> Ending on a failure is how a hobby dies.',
        ],
      },
      {
        id: 'start',
        title: 'If this is your first week',
        paras: [
          'Tune it before every single session, all sixteen strings, twice round. It takes four minutes and it is the difference between an instrument that sounds beautiful and one that does not.',
          'Play the scale up and back down — string 4 to string 11 is a full octave of C major — until your hands know where they are without looking.',
          'Then learn <b>C</b>, <b>F</b> and <b>G</b> as three-string chords. Almost every simple song is those three, and this app draws each one on the strings for you.',
          'Sore fingertips are normal for the first fortnight and then stop. Pain in the wrist, thumb or shoulder is not normal — change how you are holding the instrument.',
          'Do not buy new strings yet. Almost every "dead" sound on a new lyre is the tuning, not the strings.',
        ],
      },
    ],
  },

  de: {
    title: 'Erste Schritte',
    sub: 'Alles, was der Rest dieser App über eine 16-saitige Leierharfe als bekannt voraussetzt. Nichts davon braucht musikalische Vorkenntnisse.',
    sections: [
      {
        id: 'parts',
        title: 'Was du da in der Hand hast',
        paras: [
          'Eine Leier ist ein Holzrahmen mit sechzehn Metallsaiten. Es gibt keinen Hals und keine Bünde, weil es nichts zu greifen gibt: <b>Jede Saite spielt genau einen Ton und nur diesen</b>. Du zupfst eine Saite und bekommst ihren Ton — das ist das ganze Instrument.',
          'Am oberen Arm sitzen die <b>Stimmwirbel</b>, einer pro Saite, gedreht mit dem kleinen <b>Stimmschlüssel</b> aus der Verpackung. Die flache Seite ist der <b>Resonanzboden</b>, und das Loch darin ist der Grund, warum man das Instrument überhaupt hört.',
          'Genau dieses „ein Ton pro Saite“ ist der Grund, warum eine Leier von allen Instrumenten hier am schnellsten schön klingt — und warum sie am eingeschränktesten ist. Es gibt nichts darüber zu lernen, <i>wo</i> ein Ton liegt. Deine ganze Zeit geht in: welche Saite, in welcher Reihenfolge, und die sechzehn gestimmt zu halten.',
        ],
        note: 'Diese App geht von der verbreiteten 16-saitigen Leier in C-Dur von G3 bis A5 aus — so werden fast alle verkauft. Stehen an deinen Saiten andere Buchstaben, ist deine anders gestimmt und die Saitennummern hier passen nicht.',
      },
      {
        id: 'strings',
        title: 'Die sechzehn Saiten',
        diagram: 'lyrestrings',
        paras: [
          'Die Saiten sind von <b>1 bis 16</b> nummeriert. Saite 1 ist die <b>längste und dickste</b> und spielt den <b>tiefsten</b> Ton — sie liegt links, wenn die Vorderseite dir zugewandt ist. Saite 16 ist die kürzeste und dünnste und spielt den höchsten Ton.',
          'Wenn du von der Gitarre kommst: Das ist genau andersherum. Dort ist Saite 1 die <i>dünnste</i>. Hier laufen die Nummern in derselben Richtung wie die Tonhöhe, und das ist deutlich leichter zu merken, sobald man aufhört, etwas anderes zu erwarten.',
          'Die Töne, von Saite 1 aufwärts, sind <b>G A H C D E F G A H C D E F G A</b> — die reinen Buchstaben, der Reihe nach, einer pro Saite, beginnend auf G. Es gibt nirgends auf dem Instrument ein Kreuz oder ein b. Bei den meisten Leiern klebt ein Streifen mit den Buchstaben neben den Wirbeln; ist er weg, listet die Stimmgerät-Seite alle sechzehn auf.',
        ],
        note: 'Zwei volle Oktaven plus zwei Töne. Die tiefste Saite liegt drei Töne unter dem mittleren C, die höchste anderthalb Oktaven darüber. (Die App schreibt das deutsche H international als <b>B</b>.)',
      },
      {
        id: 'holding',
        title: 'Wie du sie hältst',
        diagram: 'lyrehold',
        paras: [
          'Setz dich hin, stell die Leier mit dem Fuß auf deinen Schoß und <b>lehn sie oben an Brust oder Schulter zurück</b>, ungefähr im Winkel eines Buchs, in dem du liest. Flach gehalten siehst du die Saiten nicht und musst die Handgelenke unbequem abknicken; senkrecht gehalten rutscht sie weg.',
          'Lass sie an dir <b>lehnen</b>, statt sie festzuhalten. Der Rahmen ist leicht, und die Neigung erledigt das Halten; wenn deine Arme sie festklemmen, sind sie nicht frei zum Spielen.',
          'Die <b>linke Hand spielt die tiefen Saiten</b>, die <b>rechte die hohen</b>. Sie teilen sich das Instrument und kreuzen sich normalerweise nicht. Eine Melodie, die über die Mitte wandert, wird von einer Hand an die andere übergeben — das fühlt sich eine Woche lang seltsam an und ist danach kein Thema mehr.',
          'Zupf von <b>vorn</b>, die Finger kommen über den Resonanzboden herein. Manche halten das Instrument andersherum und spielen von hinten; beides geht, aber entscheide dich für eins, denn von der anderen Seite liegen die Saiten in umgekehrter Reihenfolge.',
        ],
        note: 'Wenn du die gewünschte Saite nicht sehen kannst, stimmt die Neigung nicht. Verstell das Instrument, nicht deinen Nacken — sich zum Hinsehen vorzubeugen ist die Art, wie aus einer schönen halben Stunde ein steifer oberer Rücken wird.',
      },
      {
        id: 'hands',
        title: 'Wie du zupfst',
        diagram: 'handarch',
        paras: [
          'Zupf mit der <b>Fingerseite direkt neben dem Nagel</b> und lass den Finger <i>durch</i> die Saite und von ihr weg laufen. Das gibt einen runden, vollen Ton. Landest du flach auf der Fingerbeere, dämpfst du die Saite genau in dem Moment, in dem sie loskommt — deshalb klingen manche Töne dumpf, ohne dass man einen Grund hört.',
          'Halt den Finger <b>gekrümmt</b>, das letzte Gelenk fest statt eingeknickt. Das ist derselbe Bogen wie an Gitarre und Klavier, und aus demselben Grund wichtig: Ein eingeknicktes Gelenk kann nicht dosieren, wie stark es zupft.',
          'Nimm <b>Daumen, Zeige- und Mittelfinger</b> für das meiste. Der Ringfinger kommt später dazu, der kleine Finger praktisch nie.',
          'Metallsaiten <b>klingen sehr lange nach</b>, und genau das ist der Grund, warum eine Leier magisch klingt — und zugleich der Grund, warum sie zu Brei wird. Zwei Töne, die sich nicht überlappen sollten, überlappen sich, solange du sie nicht stoppst. Eine einzelne Saite dämpfst du, indem du sie mit der Seite eines unbenutzten Fingers leicht berührst; alle auf einmal mit der flachen Handfläche über allen sechzehn. Dämpfen ist keine Fortgeschrittenen-Technik — es ist die halbe Miete beim sauberen Spielen.',
        ],
        note: 'Nägel: ein wenig Länge hilft, viel nicht. Wenn deine Nägel lang genug sind, um zu klackern, sind sie zu lang. Manche spielen mit Fingerpicks, die meisten brauchen sie nicht.',
      },
      {
        id: 'tuning',
        title: 'Stimmen — und das oft',
        paras: [
          'Eine Leier verstimmt sich deutlich schneller als eine Gitarre. Eine fabrikneue sackt <b>wochenlang</b> ab, während sich die Saiten dehnen, und auch eine eingespielte will bei jedem Mal geprüft werden. Das ist normal und kein Mangel deines Instruments.',
          'Setz den <b>Schlüssel ganz auf den Wirbel</b>, bevor du irgendetwas drehst. Ein halb aufgesetzter Schlüssel rundet den Vierkant ab, und ein abgerundeter Wirbel lässt sich gar nicht mehr stimmen.',
          'Dreh in <b>winzigen Schritten</b>. Das sind ungeuntersetzte Reibungswirbel — eine Achteldrehung ist eine große Bewegung, viel größer als dieselbe Bewegung an einer Gitarrenmechanik. Zupf nach jeder Korrektur neu an, statt beim Drehen zu lauschen.',
          'Arbeite von <b>Saite 1 hinauf bis Saite 16</b> und geh dann noch einmal von vorn durch. Jede gestraffte Saite zieht stärker am Rahmen und lässt die schon gestimmten wieder absacken; zwei Durchgänge sind normal, bei einem neuen Instrument sind drei nicht ungewöhnlich.',
          'Nähere dich dem Ton am Ende immer <i>von unten</i>. Bist du zu hoch, geh unter den Ton und komm wieder herauf — eine von oben angefahrene Saite rutscht beim Spielen zurück.',
          'Zupf auf der Stimmgerät-Seite eine Saite nach der anderen. Die App nennt die erkannte Saite und sagt dir, in welche Richtung du drehen musst.',
        ],
        note: '<b>Nicht überspannen.</b> Eine deutlich zu hoch gestimmte Saite reißt, und eine reißende Leiersaite kann schnalzen. Ist eine Saite weit über ihrem Ton und wird immer straffer, hör auf und prüf, ob du wirklich an der Saite bist, die du meinst — Saite 12 zu drehen und dabei auf Saite 13 zu schauen ist die übliche Ursache.',
      },
      {
        id: 'diatonic',
        title: 'Die Töne, die sie nicht hat',
        paras: [
          'Das ist die eine Sache an einer Leier, die alle überrascht, und es lohnt sich, sie früh zu verstehen statt sich später darüber zu wundern.',
          'Das Instrument hat die <b>weißen Tasten eines Klaviers und sonst nichts</b>. Es gibt darauf kein Fis. Nicht an einer schwer erreichbaren Stelle — nirgends, in keiner Oktave, nie. Dasselbe gilt für Cis, Dis, Gis und B.',
          'Ein Lied liegt in der falschen Tonart hier also nicht bloß ungünstig; es <b>verliert Töne</b>. Eine Melodie in D-Dur braucht Fis und Cis, und auf der Leier käme sie mit Löchern heraus.',
          'Die Lösung ist, das <b>ganze Lied zu verschieben</b>, bis es in einer Tonart landet, die das Instrument hat. Dieselbe Melodie in D, zwei Halbtöne tiefer nach C geschoben, braucht überhaupt keine Kreuze mehr und passt perfekt. Auf der Lieder-Seite gibt es dafür den Knopf <b>Passende Tonart suchen</b>, und sie sagt dir, wie viele Töne vorher und nachher fehlen.',
          'Lieder in <b>C-Dur</b> und <b>a-Moll</b> passen so, wie sie notiert sind. Diese zwei Tonarten — plus alles, was du dorthin verschoben hast — sind sehr viel Musik.',
        ],
        note: 'Für Gitarristen: Das Gegenstück zum Kapodaster ist hier das Transponieren. Es gibt keine Klemme, aber die Lieder-Seite erledigt dieselbe Aufgabe in Software.',
      },
      {
        id: 'habits',
        title: 'Fünf Gewohnheiten, die du lieber nicht lernst',
        paras: [
          '<b>Alles klingen lassen.</b> Das ist der häufigste Unterschied zwischen einer Leier, die zauberhaft klingt, und einer, die nach Rauschen klingt. Dämpf bewusst.',
          '<b>Mit der flachen Fingerbeere zupfen.</b> Bequem, leise und stumpf. Nimm die Fingerseite.',
          '<b>Für Lautstärke reinhauen.</b> Eine Leier ist leise, und kräftiger zu ziehen bringt vor allem Schnarren und abgebrochene Nägel, nicht Lautstärke. Wenn du sie lauter brauchst, halt sie an eine mitschwingende Fläche oder geh näher ans Mikrofon.',
          '<b>Mit einer Hand spielen.</b> Mit der rechten Hand über das ganze Instrument zu greifen funktioniert für etwa vier Saiten und dann nicht mehr. Teil das Instrument von Anfang an zwischen den Händen auf.',
          '<b>Das Stimmen überspringen.</b> Der eine Punkt, an dem dieses Instrument wirklich anspruchsvoller ist als eine Gitarre. Eine ungestimmte Leier klingt auf eine Art falsch, die man leicht sich selbst anlastet.',
        ],
      },
      {
        id: 'practice',
        title: 'So üben, dass es hängen bleibt',
        paras: [
          '<b>Wenig und oft schlägt viel und selten.</b> Fünfzehn Minuten am Tag bringen dich in einem Monat weiter als zwei Stunden am Sonntag.',
          '<b>Lern die Saiten ohne Hinsehen.</b> Die Saiten sehen alle gleich aus, außer in der Länge — such dir deine Orientierungspunkte über das Gefühl: die beiden äußeren und die Mitte. Spiel schon in der ersten Woche eine Tonleiter mit geschlossenen Augen.',
          '<b>Langsam genug, um jedes Mal richtig zu sein.</b> Tempo ist ein Nebenprodukt von Genauigkeit. Drei richtige Durchgänge hintereinander verdienen eine kleine Steigerung.',
          '<b>Üb die Übergabe.</b> Das Schwere an einer Leier ist kein einzelner Ton, sondern der Moment, in dem die Melodie von der linken in die rechte Hand wechselt. Such diese Stelle in einem Stück und üb sie für sich.',
          '<b>Hör mit etwas auf, das du kannst.</b> Mit einem Misserfolg aufzuhören ist die Art, wie ein Hobby stirbt.',
        ],
      },
      {
        id: 'start',
        title: 'Wenn das deine erste Woche ist',
        paras: [
          'Stimm sie vor jeder Einheit, alle sechzehn Saiten, zwei Durchgänge. Das dauert vier Minuten und ist der Unterschied zwischen einem Instrument, das wunderbar klingt, und einem, das es nicht tut.',
          'Spiel die Tonleiter hinauf und wieder herunter — Saite 4 bis Saite 11 ist eine volle Oktave C-Dur — bis deine Hände ohne Hinsehen wissen, wo sie sind.',
          'Lern dann <b>C</b>, <b>F</b> und <b>G</b> als Dreiklänge über drei Saiten. Fast jedes einfache Lied besteht aus diesen dreien, und die App zeichnet dir jeden davon auf die Saiten.',
          'Schmerzende Fingerkuppen sind in den ersten zwei Wochen normal und hören dann auf. Schmerz im Handgelenk, im Daumen oder in der Schulter ist nicht normal — ändere, wie du das Instrument hältst.',
          'Kauf noch keine neuen Saiten. Fast jeder „tote“ Klang an einer neuen Leier ist die Stimmung, nicht die Saite.',
        ],
      },
    ],
  },
};

const KALIMBA = {
  en: {
    title: 'Getting started',
    sub: 'Everything the rest of this app assumes you already know about a 17-key kalimba. Nothing here needs any musical background.',
    sections: [
      {
        id: 'whatis',
        title: 'Kalimba or mbira?',
        paras: [
          'Both names get used for the thing you are holding, and they are not quite the same instrument.',
          'The <b>mbira</b> is a Zimbabwean instrument, centuries old, with two or three staggered ranks of tines, usually played inside a large gourd resonator, and tuned to scales that are nothing like a Western major scale. It has a repertoire and a tradition of its own.',
          'The <b>kalimba</b> is a single-rank instrument on a flat board or a hollow box, laid out in one Western scale. The seventeen-tine version sold everywhere today is a kalimba. It is a descendant of the mbira family and a genuine instrument in its own right, but it is not an mbira, and someone who plays one will not recognise the other\'s music.',
          'The rest of this guide says kalimba, and describes the standard 17-key instrument in C.',
        ],
        note: 'Both belong to a family called <b>lamellophones</b> — instruments played by plucking a flexible tongue fixed at one end. There are dozens across Africa under dozens of names.',
      },
      {
        id: 'layout',
        title: 'The layout, which is the whole trick',
        diagram: 'kalimbalayout',
        paras: [
          'Look at the tines. They are longest in the <b>middle</b> and get shorter towards both edges. A longer tine sounds lower, so the <b>lowest note is in the centre</b> and the highest notes are at the two outer edges.',
          'That means the scale does not run along the instrument the way it runs along a piano. It <b>alternates</b>. From the middle tine — which is C, the lowest note and number 1 — the next note up is one step to the <b>right</b>, the one after that is one step to the <b>left</b>, the next is further right, and so on out to the edges.',
          'So the numbers stamped on the tines are: <b>1 in the middle, the odd numbers running outward to the left, the even numbers outward to the right</b>. Number 17, the highest note, is the far left tine. Number 16, the second highest, is the far right.',
          'This is genuinely disorienting for about a week, and then it becomes the reason a kalimba is easy: because the scale alternates, <b>notes next to each other in the scale are on opposite thumbs</b>. A run up the scale is left, right, left, right, which is exactly what two thumbs are good at.',
          'The notes, from the middle outward, are <b>C D E F G A B</b> and then round again — the plain letters, no sharps and no flats anywhere.',
        ],
        note: 'A few manufacturers mirror this and put the even numbers on the left. The numbers stamped on your own tines are the authority; if yours disagree with the drawing, trust yours.',
      },
      {
        id: 'numbers',
        title: 'Reading kalimba music',
        diagram: 'kalimbanumbers',
        paras: [
          'Kalimba music is almost never written on a stave. It is written as the <b>numbers stamped on the tines</b>, and there are two systems in the wild.',
          'The common one uses <b>1 to 7 with dots</b>: the numbers are scale steps rather than tine numbers, and a dot above the digit means one octave up. So <b>1</b> is the middle C, <b>1</b> with one dot is the C an octave higher, and <b>1</b> with two dots is two octaves higher. On a 17-key instrument that covers everything.',
          'The other simply prints the <b>tine number, 1 to 17</b>, which needs no dots because every tine has its own number. That is what this app uses, because it is unambiguous and because it matches what is physically stamped on the instrument in front of you.',
          'Numbers stacked in a column are played <b>together</b>; numbers side by side are played <b>one after another</b>. That is the same convention as guitar tab, and the same trap: the same digits mean completely different things depending on whether they are stacked or spread.',
        ],
        note: 'Neither notation carries note lengths. A kalimba tab tells you which tines and in what order, and the rhythm is something you take from knowing the tune.',
      },
      {
        id: 'holding',
        title: 'How to hold it',
        diagram: 'kalimbahold',
        paras: [
          'Hold it in <b>both palms</b>, with your fingers curled behind the body and only your <b>two thumbs</b> in front, over the tines. Nothing else plays. The index fingers are sometimes used at the sides for the very outermost tines, but the instrument is designed around two thumbs.',
          '<b>Rest it, do not grip it.</b> A kalimba squeezed tight sounds dead, because the body has to be free to vibrate — and a clamped hand tires within minutes. It should feel like the instrument is sitting in your hands rather than being held up by them.',
          'If yours has a <b>hollow box</b>, there are usually two round holes on the <i>back</i>. Covering and uncovering them with your index fingers while a note rings gives the wavering "wah" sound that is most of what a kalimba is known for. Almost nobody finds these on their own, because you cannot see them from the playing side.',
          'If yours is a <b>flat board</b> with no box, it will be very quiet on its own. Resting it on a table, a closed laptop, or an empty box makes an enormous difference — the surface becomes the resonator.',
        ],
        note: 'For this app\'s microphone, a flat-board kalimba on a hard table gets picked up far more reliably than the same instrument held in the air.',
      },
      {
        id: 'hands',
        title: 'How to strike a tine',
        diagram: 'handarch',
        paras: [
          'Strike with the <b>corner of the thumbnail</b>, not the pad of the thumb. Press the thumb down onto the tine and let it slip off the end. The nail gives a clear, bell-like note; the pad gives a soft thud with no attack.',
          '<b>Lift away immediately.</b> A thumb left resting on the tine after striking it stops the note you have just made — that is the single most common reason a kalimba sounds short and choked.',
          'Keep the thumb <b>curved</b> rather than stiff and straight. The motion comes from the thumb joint, not from swinging the whole hand at the instrument.',
          'You need <b>a little nail</b> on both thumbs — a millimetre or two past the fingertip, filed smooth. Too short and you cannot get a clean attack; too long and it catches. Some players use stick-on thumb picks instead, which is a perfectly good answer if you keep your nails short for other reasons.',
          'Play the tines <b>near their tips</b>, not close to the bridge. Near the bridge the tine barely moves, the note is thin, and it buzzes.',
        ],
        note: 'A tine that rattles or buzzes is usually sitting slightly loose against the bridge rather than being broken. Press it firmly down at the bridge with a thumb; if it still buzzes, it has drifted sideways and wants nudging straight.',
      },
      {
        id: 'tuning',
        title: 'Tuning it, which works nothing like a string',
        paras: [
          'A kalimba has <b>no pegs and no pins</b>. The pitch of a tine is set by how much of it sticks out past the bridge, so you tune it by <b>moving the tine itself</b> with the little hammer that came in the box.',
          '<b>Tap the playing tip</b> and the tine slides inward. It gets shorter, and the note goes <b>up</b>.',
          '<b>Tap the stub sticking out at the back</b>, behind the bridge, and the tine slides outward. It gets longer, and the note goes <b>down</b>.',
          'Use <b>tiny taps</b> and pluck the tine again after every one. A tine moves further than you expect, and it is very easy to chase a note past itself several times in a row.',
          'Rest the instrument on a <b>hard, flat surface</b> while you do this, so the taps move the tine rather than bouncing the whole kalimba.',
          'Work one tine at a time on the tuner page: pluck it, read which tine the app names and which way it says to go, tap once, pluck again.',
        ],
        note: '<b>Never bend a tine sideways or upward.</b> It is spring steel and it will take a set, after which that tine buzzes forever. A tine driven too far out will also start to rattle or fall out — if one is sticking out much further at the back than its neighbours, tap it back in.',
      },
      {
        id: 'diatonic',
        title: 'The notes it has not got',
        paras: [
          'A standard kalimba has the <b>white notes of a piano and nothing else</b>. There is no F♯ on it — not somewhere awkward, but nowhere, in any octave. The same for C♯, D♯, G♯ and A♯.',
          'So a song in the wrong key does not sit awkwardly here; it <b>loses notes</b>. A tune in D major needs F♯ and C♯ and would come out full of holes.',
          'The fix is to <b>move the whole song</b> into a key the instrument has. That tune in D, shifted down two semitones into C, needs no sharps at all. The songs page has a <b>Find a key that fits</b> button for exactly this, and reports how many notes are missing before and after.',
          'Songs in <b>C major</b> and <b>A minor</b> fit as written, which is a very large amount of music — and it is why so much of what is written for kalimba is in those two keys.',
        ],
        note: 'You can retune individual tines to get a sharp, and plenty of players retune one tine to reach a particular piece. It is a real option, not a hack — but it is a change to the instrument, and everything else you play will then be missing the note you moved.',
      },
      {
        id: 'habits',
        title: 'Five habits worth not learning',
        paras: [
          '<b>Gripping the body tight.</b> It damps the instrument and tires your hands. Let it rest in your palms.',
          '<b>Striking with the pad of the thumb.</b> Soft and dull. Use the corner of the nail.',
          '<b>Leaving the thumb on the tine.</b> Strike and lift. Half of "my kalimba sounds dead" is this.',
          '<b>Playing only the middle.</b> The instrument is symmetrical and both thumbs are meant to do equal work. If your right thumb is doing everything, you are fighting the layout instead of using it.',
          '<b>Hunching over it to see the numbers.</b> Hold it up rather than bending down to it — and start learning the tines by feel early, since they are identical to the touch apart from their length and position.',
        ],
      },
      {
        id: 'practice',
        title: 'How to practise so it sticks',
        paras: [
          '<b>Little and often beats long and rare.</b> Fifteen minutes a day beats two hours on a Sunday.',
          '<b>Learn the scale as a zig-zag.</b> Play 1 to 8 slowly, out loud, noticing that it alternates thumbs. Once the alternation feels automatic, most simple tunes become sight-readable.',
          '<b>Find the landmarks by feel.</b> The centre tine and the two outermost ones are the only three you can identify without looking; everything else is counted from them. Practise finding them with your eyes shut.',
          '<b>Slow enough to be right every time.</b> Speed is a by-product of accuracy, never the other way round.',
          '<b>Finish on something you can play.</b> Ending on a failure is how a hobby dies.',
        ],
      },
      {
        id: 'start',
        title: 'If this is your first week',
        paras: [
          'Check the tuning before you decide anything sounds wrong. Kalimbas ship roughly tuned and travel badly, and one tine a quarter-tone out makes everything sound sour.',
          'Play the scale from the middle outward and back, slowly, until the left-right alternation stops needing thought.',
          'Then learn <b>C</b>, <b>F</b> and <b>G</b> as three-note chords. Two thumbs cannot hit three tines at once, so roll them — one just after another, quickly. That rolled sound is idiomatic rather than a compromise.',
          'Thumbs will ache a little for the first week. That passes. Pain in the thumb joint itself does not count as aching — ease off and check you are not gripping the body.',
          'A buzz is almost never a broken instrument. Press the tine down firmly at the bridge and try again.',
        ],
      },
    ],
  },

  de: {
    title: 'Erste Schritte',
    sub: 'Alles, was der Rest dieser App über eine 17-zungige Kalimba als bekannt voraussetzt. Nichts davon braucht musikalische Vorkenntnisse.',
    sections: [
      {
        id: 'whatis',
        title: 'Kalimba oder Mbira?',
        paras: [
          'Beide Namen werden für das Ding in deiner Hand benutzt, und es sind nicht ganz dieselben Instrumente.',
          'Die <b>Mbira</b> ist ein jahrhundertealtes simbabwisches Instrument mit zwei oder drei versetzten Zungenreihen, meist in einem großen Kürbisresonator gespielt und in Skalen gestimmt, die mit einer westlichen Dur-Tonleiter nichts zu tun haben. Sie hat ein eigenes Repertoire und eine eigene Tradition.',
          'Die <b>Kalimba</b> hat eine einzige Zungenreihe auf einem flachen Brett oder einem Hohlkörper, angeordnet in einer westlichen Tonleiter. Die heute überall verkaufte 17-zungige Variante ist eine Kalimba. Sie stammt aus der Mbira-Familie und ist ein vollwertiges Instrument für sich, aber sie ist keine Mbira, und wer das eine spielt, erkennt die Musik des anderen nicht wieder.',
          'Der Rest dieser Anleitung sagt Kalimba und beschreibt das übliche 17-zungige Instrument in C.',
        ],
        note: 'Beide gehören zur Familie der <b>Lamellophone</b> — Instrumente, bei denen eine an einem Ende eingespannte, biegsame Zunge angerissen wird. Es gibt Dutzende davon in Afrika unter Dutzenden Namen.',
      },
      {
        id: 'layout',
        title: 'Die Anordnung — und das ist der ganze Trick',
        diagram: 'kalimbalayout',
        paras: [
          'Sieh dir die Zungen an. In der <b>Mitte</b> sind sie am längsten und werden zu beiden Rändern hin kürzer. Eine längere Zunge klingt tiefer, also liegt der <b>tiefste Ton in der Mitte</b> und die höchsten Töne liegen an den beiden Außenkanten.',
          'Die Tonleiter läuft also nicht am Instrument entlang, so wie sie über eine Klaviatur läuft. Sie <b>wechselt die Seite</b>. Von der mittleren Zunge — das ist C, der tiefste Ton, Nummer 1 — geht der nächste Ton einen Schritt nach <b>rechts</b>, der übernächste einen Schritt nach <b>links</b>, der nächste weiter rechts, und so weiter bis zu den Rändern.',
          'Die auf den Zungen eingestanzten Nummern lauten deshalb: <b>1 in der Mitte, die ungeraden nach links außen, die geraden nach rechts außen</b>. Nummer 17, der höchste Ton, ist die Zunge ganz links. Nummer 16, der zweithöchste, ganz rechts.',
          'Das verwirrt etwa eine Woche lang und ist danach genau der Grund, warum eine Kalimba leicht ist: Weil die Tonleiter die Seite wechselt, liegen <b>benachbarte Töne auf verschiedenen Daumen</b>. Eine Tonleiter hinauf ist links, rechts, links, rechts — genau das, was zwei Daumen gut können.',
          'Die Töne, von der Mitte nach außen, sind <b>C D E F G A H</b> und dann wieder von vorn — die reinen Buchstaben, nirgends ein Kreuz oder ein b.',
        ],
        note: 'Ein paar Hersteller spiegeln das und setzen die geraden Nummern nach links. Maßgeblich sind die Zahlen auf deinen eigenen Zungen; widersprechen sie der Zeichnung, gilt deine.',
      },
      {
        id: 'numbers',
        title: 'Kalimba-Noten lesen',
        diagram: 'kalimbanumbers',
        paras: [
          'Kalimba-Musik steht so gut wie nie in Notenlinien. Sie wird als die <b>Zahlen auf den Zungen</b> geschrieben, und dafür gibt es zwei Systeme.',
          'Das verbreitete nimmt <b>1 bis 7 mit Punkten</b>: Die Zahlen sind Tonleiterstufen statt Zungennummern, und ein Punkt über der Ziffer heißt eine Oktave höher. <b>1</b> ist also das mittlere C, <b>1</b> mit einem Punkt das C eine Oktave darüber, <b>1</b> mit zwei Punkten zwei Oktaven darüber. Auf einem 17-zungigen Instrument deckt das alles ab.',
          'Das andere druckt einfach die <b>Zungennummer, 1 bis 17</b>, und braucht dafür keine Punkte, weil jede Zunge ihre eigene Nummer hat. Das nimmt diese App, weil es eindeutig ist und weil es zu dem passt, was physisch auf dem Instrument vor dir eingestanzt ist.',
          'Zahlen übereinander werden <b>gleichzeitig</b> gespielt, Zahlen nebeneinander <b>nacheinander</b>. Das ist dieselbe Konvention wie bei Gitarrentabulatur — und dieselbe Falle: Dieselben Ziffern bedeuten völlig Verschiedenes, je nachdem, ob sie gestapelt oder verteilt stehen.',
        ],
        note: 'Keine der beiden Schreibweisen enthält Notenlängen. Eine Kalimba-Tabulatur sagt dir, welche Zungen in welcher Reihenfolge; den Rhythmus musst du aus dem Lied kennen.',
      },
      {
        id: 'holding',
        title: 'Wie du sie hältst',
        diagram: 'kalimbahold',
        paras: [
          'Halt sie in <b>beiden Handflächen</b>, die Finger hinter dem Korpus gekrümmt, und nur die <b>beiden Daumen</b> vorn über den Zungen. Sonst spielt nichts. Die Zeigefinger kommen manchmal seitlich für die äußersten Zungen dazu, aber das Instrument ist um zwei Daumen herum gebaut.',
          '<b>Lass sie liegen, klammere nicht.</b> Eine fest umklammerte Kalimba klingt tot, weil der Korpus frei schwingen können muss — und eine verkrampfte Hand ermüdet binnen Minuten. Es soll sich anfühlen, als säße das Instrument in deinen Händen, statt von ihnen hochgehalten zu werden.',
          'Hat deine einen <b>Hohlkörper</b>, sind auf der <i>Rückseite</i> meist zwei runde Löcher. Sie mit den Zeigefingern abzudecken und wieder freizugeben, während ein Ton klingt, ergibt den wabernden „Wah“-Klang, für den die Kalimba vor allem bekannt ist. Fast niemand findet sie von selbst, weil man sie von der Spielseite aus nicht sieht.',
          'Ist deine ein <b>flaches Brett</b> ohne Korpus, ist sie für sich allein sehr leise. Sie auf einen Tisch, einen zugeklappten Laptop oder eine leere Kiste zu legen macht einen enormen Unterschied — die Fläche wird zum Resonator.',
        ],
        note: 'Für das Mikrofon dieser App wird eine Brett-Kalimba auf einem harten Tisch weit zuverlässiger erkannt als dasselbe Instrument frei in der Luft.',
      },
      {
        id: 'hands',
        title: 'Wie du eine Zunge anschlägst',
        diagram: 'handarch',
        paras: [
          'Schlag mit der <b>Ecke des Daumennagels</b> an, nicht mit der Daumenbeere. Drück den Daumen auf die Zunge und lass ihn vorn abrutschen. Der Nagel gibt einen klaren, glockigen Ton; die Beere gibt ein weiches Plumpsen ohne Ansprache.',
          '<b>Heb sofort ab.</b> Ein Daumen, der nach dem Anschlag auf der Zunge liegen bleibt, stoppt den Ton, den er gerade erzeugt hat — das ist der mit Abstand häufigste Grund, warum eine Kalimba kurz und abgewürgt klingt.',
          'Halt den Daumen <b>gekrümmt</b> statt steif durchgestreckt. Die Bewegung kommt aus dem Daumengelenk, nicht daher, dass du die ganze Hand gegen das Instrument schwingst.',
          'Du brauchst <b>ein wenig Nagel</b> an beiden Daumen — ein bis zwei Millimeter über die Kuppe hinaus, glatt gefeilt. Zu kurz, und du bekommst keine saubere Ansprache; zu lang, und er hakt. Manche nehmen stattdessen aufklebbare Daumenpicks, was eine völlig gute Antwort ist, wenn du deine Nägel aus anderen Gründen kurz hältst.',
          'Spiel die Zungen <b>nah an der Spitze</b>, nicht dicht am Steg. Am Steg bewegt sich die Zunge kaum, der Ton wird dünn, und es schnarrt.',
        ],
        note: 'Eine klappernde oder schnarrende Zunge sitzt meistens nur leicht locker am Steg und ist nicht kaputt. Drück sie mit dem Daumen fest am Steg herunter; schnarrt sie danach noch, ist sie seitlich verrutscht und will geradegerückt werden.',
      },
      {
        id: 'tuning',
        title: 'Stimmen — was hier ganz anders geht als bei einer Saite',
        paras: [
          'Eine Kalimba hat <b>keine Wirbel und keine Stimmpins</b>. Die Tonhöhe einer Zunge ergibt sich daraus, wie weit sie über den Steg hinausragt — du stimmst sie also, indem du die <b>Zunge selbst bewegst</b>, mit dem kleinen Hämmerchen aus der Verpackung.',
          '<b>Klopf auf die Spielspitze</b>, und die Zunge rutscht hinein. Sie wird kürzer, und der Ton geht <b>hinauf</b>.',
          '<b>Klopf auf den Stummel hinten</b>, hinter dem Steg, und die Zunge rutscht heraus. Sie wird länger, und der Ton geht <b>hinunter</b>.',
          'Nimm <b>winzige Schläge</b> und zupf die Zunge nach jedem einzelnen neu an. Eine Zunge wandert weiter als erwartet, und man jagt einen Ton sehr leicht mehrmals hintereinander an sich vorbei.',
          'Leg das Instrument dabei auf eine <b>harte, ebene Fläche</b>, damit die Schläge die Zunge bewegen und nicht die ganze Kalimba hüpfen lassen.',
          'Arbeite auf der Stimmgerät-Seite Zunge für Zunge: anschlagen, ablesen, welche Zunge die App nennt und in welche Richtung, einmal klopfen, neu anschlagen.',
        ],
        note: '<b>Bieg eine Zunge nie zur Seite oder nach oben.</b> Sie ist Federstahl und behält den Knick, und danach schnarrt diese Zunge für immer. Eine zu weit herausgetriebene Zunge fängt außerdem an zu klappern oder fällt heraus — steht eine hinten deutlich weiter vor als ihre Nachbarn, klopf sie zurück.',
      },
      {
        id: 'diatonic',
        title: 'Die Töne, die sie nicht hat',
        paras: [
          'Eine normale Kalimba hat die <b>weißen Tasten eines Klaviers und sonst nichts</b>. Es gibt darauf kein Fis — nicht an einer unbequemen Stelle, sondern nirgends, in keiner Oktave. Dasselbe gilt für Cis, Dis, Gis und B.',
          'Ein Lied in der falschen Tonart liegt hier also nicht ungünstig; es <b>verliert Töne</b>. Eine Melodie in D-Dur braucht Fis und Cis und käme voller Löcher heraus.',
          'Die Lösung ist, das <b>ganze Lied</b> in eine Tonart zu schieben, die das Instrument hat. Dieselbe Melodie in D, zwei Halbtöne tiefer nach C, braucht überhaupt keine Kreuze. Auf der Lieder-Seite gibt es dafür den Knopf <b>Passende Tonart suchen</b>, und sie sagt dir, wie viele Töne vorher und nachher fehlen.',
          'Lieder in <b>C-Dur</b> und <b>a-Moll</b> passen so, wie sie notiert sind — und das ist sehr viel Musik. Es ist auch der Grund, warum so viel für Kalimba Geschriebene in genau diesen zwei Tonarten steht.',
        ],
        note: 'Man kann einzelne Zungen umstimmen, um an ein Kreuz zu kommen, und viele Spieler stimmen für ein bestimmtes Stück eine Zunge um. Das ist eine echte Möglichkeit und kein Pfusch — aber es ist eine Änderung am Instrument, und allem anderen, was du spielst, fehlt danach der Ton, den du verschoben hast.',
      },
      {
        id: 'habits',
        title: 'Fünf Gewohnheiten, die du lieber nicht lernst',
        paras: [
          '<b>Den Korpus fest umklammern.</b> Das dämpft das Instrument und ermüdet die Hände. Lass es in den Handflächen liegen.',
          '<b>Mit der Daumenbeere anschlagen.</b> Weich und stumpf. Nimm die Nagelecke.',
          '<b>Den Daumen auf der Zunge liegen lassen.</b> Anschlagen und abheben. Die Hälfte aller „meine Kalimba klingt tot“ ist genau das.',
          '<b>Nur die Mitte spielen.</b> Das Instrument ist symmetrisch, und beide Daumen sollen gleich viel tun. Wenn dein rechter Daumen alles macht, kämpfst du gegen die Anordnung, statt sie zu nutzen.',
          '<b>Sich zum Ablesen der Zahlen darüberbeugen.</b> Heb das Instrument hoch, statt dich zu ihm hinunterzubeugen — und fang früh an, die Zungen zu ertasten, denn sie fühlen sich alle gleich an, außer in Länge und Lage.',
        ],
      },
      {
        id: 'practice',
        title: 'So üben, dass es hängen bleibt',
        paras: [
          '<b>Wenig und oft schlägt viel und selten.</b> Fünfzehn Minuten am Tag schlagen zwei Stunden am Sonntag.',
          '<b>Lern die Tonleiter als Zickzack.</b> Spiel 1 bis 8 langsam und laut mitgezählt und merk, wie sie die Daumen abwechselt. Sobald der Wechsel automatisch geht, wird das meiste Einfache vom Blatt spielbar.',
          '<b>Such die Orientierungspunkte über das Gefühl.</b> Die mittlere Zunge und die beiden äußersten sind die einzigen drei, die du ohne Hinsehen erkennst; alles andere zählst du von dort ab. Üb, sie mit geschlossenen Augen zu finden.',
          '<b>Langsam genug, um jedes Mal richtig zu sein.</b> Tempo ist ein Nebenprodukt von Genauigkeit, nie umgekehrt.',
          '<b>Hör mit etwas auf, das du kannst.</b> Mit einem Misserfolg aufzuhören ist die Art, wie ein Hobby stirbt.',
        ],
      },
      {
        id: 'start',
        title: 'Wenn das deine erste Woche ist',
        paras: [
          'Prüf die Stimmung, bevor du entscheidest, dass irgendetwas falsch klingt. Kalimbas kommen nur grob gestimmt an und vertragen den Transport schlecht, und eine einzige um einen Viertelton danebenliegende Zunge lässt alles sauer klingen.',
          'Spiel die Tonleiter von der Mitte nach außen und zurück, langsam, bis der Links-rechts-Wechsel kein Nachdenken mehr braucht.',
          'Lern dann <b>C</b>, <b>F</b> und <b>G</b> als Dreiklänge. Zwei Daumen treffen keine drei Zungen gleichzeitig, also roll sie ab — eine kurz nach der anderen, zügig. Dieser gerollte Klang ist typisch und kein Kompromiss.',
          'Die Daumen ziehen in der ersten Woche ein wenig. Das geht vorbei. Schmerz im Daumengelenk selbst zählt nicht als Ziehen — dann lass nach und prüf, ob du den Korpus umklammerst.',
          'Ein Schnarren ist fast nie ein kaputtes Instrument. Drück die Zunge am Steg fest herunter und versuch es noch einmal.',
        ],
      },
    ],
  },
};

export const LEARN = { guitar: GUITAR, piano: PIANO, lyre: LYRE, kalimba: KALIMBA };
