import { CalorieRecord } from '../types';
const STORAGE_KEY = 'calorie_records';

export const storageService = {
  getRecords(): CalorieRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  },

  saveRecord(record: CalorieRecord): void {
    try {
      const records = this.getRecords();
      records.push(record);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  deleteRecord(id: string): void {
    try {
      const records = this.getRecords();
      const filteredRecords = records.filter(record => record.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRecords));
    } catch (error) {
      console.error('Error deleting from localStorage:', error);
    }
  },

  getTodayRecords(): CalorieRecord[] {
    const today = new Date().toISOString().split('T')[0];
    return this.getRecords().filter(record => record.date === today);
  },

  getRecordsByDateRange(days: number): CalorieRecord[] {
    const now = new Date();
    const startDate = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    
    return this.getRecords().filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate && recordDate <= now;
    });
  },

  getDailyTotals(days: number): { date: string; total: number }[] {
    const records = this.getRecordsByDateRange(days);
    const dailyTotals: { [key: string]: number } = {};
    
    records.forEach(record => {
      dailyTotals[record.date] = (dailyTotals[record.date] || 0) + record.calorie;
    });
    
    return Object.entries(dailyTotals).map(([date, total]) => ({ date, total }));
  }
};