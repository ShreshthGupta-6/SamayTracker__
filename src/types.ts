export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  durationMinutes?: number;
}

export interface RecoveryStep {
  id: string;
  title: string;
  durationMinutes: number;
  description: string;
  completed: boolean;
}

export interface RecoveryPlan {
  steps: RecoveryStep[];
  expectedCompletionTime: string;
  advice: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO String or date string
  estimatedHours: number;
  progress: number; // 0 to 100
  priority: 'low' | 'medium' | 'high';
  category: 'work' | 'study' | 'personal' | 'bills' | 'finance';
  status: 'todo' | 'in_progress' | 'completed';
  
  // AI Predicted Metrics
  riskScore: number; // 0 to 100
  completionProbability: number; // 0 to 100
  riskReasoning?: string;
  
  // Subtasks and recovery
  subtasks: Subtask[];
  recoveryPlan?: RecoveryPlan;
  
  // Postponement tracking
  postponementCount: number;
  lastPostponedReason?: string;
  interventionPlan?: string;
  
  createdAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  week: number;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  targetDate: string;
  progress: number; // 0 to 100
  milestones: Milestone[];
  weeklyRoadmap?: {
    week: number;
    focus: string;
    tasks: string[];
  }[];
  createdAt: string;
}

export interface FocusSession {
  id: string;
  taskId?: string;
  taskTitle?: string;
  durationMinutes: number;
  date: string; // ISO date
  type: 'focus' | 'break';
}

export interface HabitInsight {
  id: string;
  title: string;
  metric: string;
  trend: 'up' | 'down' | 'neutral';
  description: string;
  category: 'focus' | 'productivity' | 'sleep' | 'anti-procrastination';
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
