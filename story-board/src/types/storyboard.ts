export interface StoryboardPanel {
  _id: string;
  panelNumber: number;
  imageUrl?: string;
  description: string;
  dialogue?: string;
  cameraAngle?: 'wide' | 'medium' | 'close-up' | 'extreme-close-up' | 'overhead' | 'low-angle' | 'high-angle';
  shotType?: 'establishing' | 'master' | 'two-shot' | 'over-shoulder' | 'insert' | 'cutaway';
  duration?: number; // in seconds
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Scene {
  _id: string;
  sceneNumber: number;
  title: string;
  description: string;
  location?: string;
  timeOfDay?: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
  interior: boolean;
  panels: StoryboardPanel[];
  estimatedDuration?: number;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSceneData {
  sceneNumber: number;
  title: string;
  description: string;
  location?: string;
  timeOfDay?: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
  interior?: boolean;
  estimatedDuration?: number;
}

export interface CreatePanelData {
  panelNumber: number;
  description: string;
  dialogue?: string;
  cameraAngle?: string;
  shotType?: string;
  duration?: number;
  notes?: string;
}

export interface GenerateImageRequest {
  sceneId: string;
  panelId: string;
  prompt: string;
  provider?: 'openai' | 'stability' | 'replicate';
  style?: 'realistic-sketch' | 'cartoon-sketch' | 'detailed-realistic' | 'minimalist' | 'dramatic';
  mood?: 'neutral' | 'dramatic' | 'bright' | 'dark' | 'vintage';
  enhancePrompt?: boolean;
  shotType?: string;
  cameraMovement?: string;
  aspectRatio?: string;
}