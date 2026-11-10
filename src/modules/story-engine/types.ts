export type ObjectiveType = 'reach' | 'collect' | 'scan' | 'survive' | 'operate' | 'learn';

export interface ObjectiveConfig {
  id: string;
  type: ObjectiveType;
  label: string;
  targetAnchorId?: string;
  targetSpecimenId?: string;
  requiredCount?: number;
  currentCount?: number;
  completed: boolean;
  scoreReward: number;
}

export interface ComicFrame {
  speaker: 'commander' | 'chipi' | 'system';
  avatar: string;
  title: string;
  dialogue: string;
  highlightText?: string;
}

export interface StoryChapter {
  sol: number;
  chapterNumber: number;
  title: string;
  subtitle: string;
  environmentalEvent: string;
  nasaMissionLore: string;
  durationSeconds: number; // 180s standard
  initialWeather: {
    temperature: number;
    dustStormRisk: boolean;
    solarEfficiency: number;
  };
  comicPrologue: ComicFrame[];
  objectives: ObjectiveConfig[];
  unlockedBadge: {
    id: string;
    title: string;
    icon: string;
    description: string;
  };
}

export interface WorldAnchor {
  id: string;
  label: string;
  position: [number, number, number];
  type: 'base' | 'solar' | 'crater' | 'glacier' | 'dune' | 'lab';
  icon: string;
}

export interface SpecimenDrop {
  id: string;
  name: string;
  category: 'mineral' | 'ice' | 'atmosphere' | 'food';
  icon: string;
  anchorId: string;
  position: [number, number, number];
  solAvailable: number;
  quickFact: string;
  capsuleId: string;
  collected?: boolean;
}

export interface NasaComparativeSpec {
  metric: string;
  marsValue: string;
  earthValue: string;
  unit: string;
}

export interface CheckQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface DataCapsule {
  id: string;
  title: string;
  category: 'energy' | 'water' | 'atmosphere' | 'food' | 'geology';
  icon: string;
  quickFact: string;
  explore: string;
  nasaMission: string;
  credit: string;
  nasaData: NasaComparativeSpec[];
  refinementConversion: {
    resourceType: 'water' | 'oxygen' | 'alloy' | 'battery';
    amount: number;
    description: string;
  };
  checkQuestion: CheckQuestion;
  unlocked: boolean;
  media?: {
    heroImage?: string;
    videoUrl?: string;
    gallery?: string[];
  };
}
