// ============================================================
// Domain types for the whole app
// ============================================================

export type ID = string;

/** Gradient/colour key shared by the design system. */
export type AccentKey = 'move' | 'time' | 'habit' | 'goal' | 'review' | 'accent';

/** "What I did" + time spent live in one entity. */
export interface Activity {
  id: ID;
  title: string;
  category: string;
  minutes: number;
  /** ISO datetime */
  at: string;
}

export interface Todo {
  id: ID;
  text: string;
  done: boolean;
  createdAt: string;
  /** ISO date (YYYY-MM-DD) */
  due?: string;
  priority: 'low' | 'med' | 'high';
}

export interface Habit {
  id: ID;
  name: string;
  emoji: string;
  color: AccentKey;
  createdAt: string;
  /** ISO dates (YYYY-MM-DD) the habit was completed */
  done: string[];
}

export interface Goal {
  id: ID;
  title: string;
  /** 'YYYY-MM' */
  month: string;
  target: number;
  progress: number;
  unit: string;
  color: AccentKey;
  createdAt: string;
}

export interface Review {
  id: ID;
  /** 'YYYY-MM-DD' — also the id */
  date: string;
  mood: 1 | 2 | 3 | 4 | 5;
  wins: string;
  improve: string;
  notes: string;
}

export interface DB {
  activities: Activity[];
  todos: Todo[];
  habits: Habit[];
  goals: Goal[];
  reviews: Review[];
}
