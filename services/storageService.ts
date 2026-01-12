
import { VideoRecord } from '../types';

const STORAGE_KEY = 'flux_metadata_v1';

export const storageService = {
  getRecordings: (): VideoRecord[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  getRecordById: (id: string): VideoRecord | undefined => {
    const recordings = storageService.getRecordings();
    return recordings.find(r => r.id === id);
  },

  saveRecording: (record: VideoRecord): void => {
    const recordings = storageService.getRecordings();
    // Prevent duplicates
    const filtered = recordings.filter(r => r.id !== record.id);
    filtered.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  incrementView: (id: string): void => {
    const recordings = storageService.getRecordings();
    const index = recordings.findIndex(r => r.id === id);
    if (index !== -1) {
      recordings[index].views += 1;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recordings));
    }
  },

  updateCompletion: (id: string, rate: number): void => {
    const recordings = storageService.getRecordings();
    const index = recordings.findIndex(r => r.id === id);
    if (index !== -1) {
      // Keep the highest completion rate recorded
      recordings[index].completionRate = Math.max(recordings[index].completionRate, rate);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recordings));
    }
  }
};
