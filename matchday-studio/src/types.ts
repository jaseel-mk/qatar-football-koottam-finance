export interface Player {
  name: string;
  number: number;
  team: 'A' | 'B';
  position: string;
}

export interface Sub {
  name: string;
  number: number;
  team: 'A' | 'B';
}

export interface TeamKit {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
}

export interface Team {
  name: string;
  kit: TeamKit;
  formation: string;
}

export interface MatchData {
  matchNumber: number;
  matchTitle: string;
  dateDay: string;
  startTime: string;
  endTime: string;
  venue: string;
  teamA: Team;
  teamB: Team;
  players: Player[];
  subs: Sub[];
  fee?: string;
  bookingStatus?: string;
  paymentDetails?: string;
  draftStatus: string;
}

export interface Swatch {
  name: string;
  hex: string;
  role: 'dominant' | 'supporting' | 'accent';
}

export interface ColorFamily {
  id: number;
  name: string;
  swatches: Swatch[];
}

export interface DesignSpec {
  id: string;
  themeName: string;
  familyId: number;
  familyName: string;
  palette: Swatch[];
  composition: string;
  lighting: string;
  bgPrompt: string;
  transparentAssets: string[];
  placementPlan: string;
  preview: MatchData;
}

export type ExportFormat = {
  label: string;
  width: number;
  height: number;
  aspect: string;
};
