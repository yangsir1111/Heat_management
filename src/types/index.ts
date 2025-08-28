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

export interface NutritionInfo {
  protein: string;
  carbs: string;
  fat: string;
  calories: string;
}

export interface RecognitionResult {
  food_name: string;
  calorie_estimate: number | string;
  confidence: number;
  health_tips: string;
  gi_value?: number;
  suitable_for_diabetes?: string;
  nutrition?: NutritionInfo;
}