import type { DesignSpec } from '@/types';
import { sampleMatch } from '@/data/sampleMatch';

export const qfk001: DesignSpec = {
  id: 'QFK-001',
  themeName: 'Heritage Floodlights',
  familyId: 1,
  familyName: 'QFK Heritage',
  palette: [
    { name: 'Burgundy', hex: '#650D2B', role: 'dominant' },
    { name: 'Ivory', hex: '#F4EBDD', role: 'supporting' },
    { name: 'Gold', hex: '#C9A35B', role: 'accent' },
  ],
  composition:
    'Portrait 2400×3200. A dramatic floodlit night stadium fills the background with deep burgundy atmospheric haze. The upper third holds the QFK crest, match number, and title. The middle two-thirds is split vertically: Team A on the left half, Team B on the right half, each with a formation pitch showing players as jerseyed figures with numbers and positions. A subtle Doha skyline silhouette sits at the horizon line between the pitch and the upper header. The lower band carries date, time, venue, fee, and draft status. Gold thin-line rules separate the zones.',
  lighting:
    'Cinematic floodlight cones from four stadium towers cast warm white light across the pitch. The grass is lush green with visible mowing stripes and accurate pitch markings. Burgundy haze fills the upper atmosphere, fading to near-black at the very top. Light rakes across jerseys from the upper left, producing believable fabric folds and soft contact shadows on the grass. No glow halos, no plastic sheen.',
  bgPrompt:
    'Photorealistic empty football stadium at night under bright floodlights, lush green grass with mowing stripes and white pitch markings, deep burgundy atmospheric haze in the upper stands, a faint silhouette of the Doha skyline on the far horizon, warm white floodlight cones from four tower lights, cinematic depth, natural shadows, no text, no people, no jerseys, no numbers, no logos, portrait composition with clear empty space in the upper third for a header, middle area for lineups, and lower band for match details, 8K quality, broadcast football campaign aesthetic',
  transparentAssets: [
    'Team A burgundy home jersey — short-sleeve with ivory collar, gold piping, visible stitching and fabric folds, transparent background, front-facing, photorealistic fabric',
    'Team B ivory away jersey — short-sleeve with burgundy collar, gold piping, visible stitching and fabric folds, transparent background, front-facing, photorealistic fabric',
    'QFK crest — faithful reproduction, burgundy shield with ivory interior, gold football and laurel, transparent background',
  ],
  placementPlan:
    'Upper third (y 0–1067px): QFK crest centered at top, match number in gold to the left, match title in ivory below crest, "PLAY • SHARE • GROW" in small gold caps beneath title. Middle zone (y 1067–2667px): split vertically at center. Left half — Team A name in burgundy-on-ivory pill, 4-3-3 formation pitch with 11 jerseyed player tokens (number + name + position). Right half — Team B name in ivory-on-burgundy pill, 4-4-2 formation pitch with 11 tokens. Substitutes listed in a compact two-column strip below the pitches. Lower band (y 2667–3200px): date, time, venue in ivory; fee and booking in gold; "MORE THAN A GAME" in small ivory caps; draft status badge bottom-right. Gold 2px hairlines separate all three zones. 5% safe margin on all sides.',
  preview: sampleMatch,
};
