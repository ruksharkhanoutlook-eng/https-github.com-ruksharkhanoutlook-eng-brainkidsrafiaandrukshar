export enum ViewState {
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  SUBJECT_SELECT = 'SUBJECT_SELECT',
  ACTIVITY = 'ACTIVITY',
}

export enum Subject {
  MATH = 'Math',
  ENGLISH = 'English Grammar',
  AI_TECH = 'AI & Technology',
  COMPUTER = 'Computer Science',
}

export interface User {
  username: string;
  gradeLevel: number; // 1-10
  stars: number;
}

export interface Question {
  id: string;
  type: 'quiz' | 'typing';
  prompt: string;
  // For quiz
  options?: string[];
  correctAnswer?: string;
  // For typing
  typingText?: string;
}

export interface LessonContent {
  title: string;
  description: string;
  questions: Question[];
}

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';