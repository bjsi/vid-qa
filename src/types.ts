export interface Word {
  text: string;
  start: number;
  end: number;
  confidence: number;
}

export interface Segment {
  start: number;
  end: number;
  text: string;
  confidence: number;
  words: Word[];
}

export interface Transcript {
  text: string;
  segments: Segment[];
  language: string;
}
