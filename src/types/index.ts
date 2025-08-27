export interface CalorieRecord {
  id: string;
  date: string;
  time: string;
  timestamp: number;
  foodName: string;
  calorie: number;
  imagePath?: string;
  confidence?: number;
  healthTips?: string;
}

export interface RecognitionResult {
  food_name: string;
  calorie_estimate: number;
  confidence: number;
  health_tips: string;
}