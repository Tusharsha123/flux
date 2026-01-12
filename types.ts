
export interface VideoRecord {
  id: string;
  title: string;
  url: string;
  duration: number;
  createdAt: string;
  views: number;
  completionRate: number;
  size: number;
  mimeType: string;
}

export enum AppState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  EDITING = 'EDITING',
  UPLOADING = 'UPLOADING',
  VIEWING = 'VIEWING'
}
