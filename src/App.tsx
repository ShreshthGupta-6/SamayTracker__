import React, { useState, useEffect } from 'react';
import { Task, Goal, FocusSession } from './types';
import HomeView from './components/HomeView';
import TasksView from './components/TasksView';
import PlannerView from './components/PlannerView';
import RescueView from './components/RescueView';
import GoalsView from './components/GoalsView';
import InsightsView from './components/InsightsView';
import ThreeBackground from './components/ThreeBackground';
import VoiceAssistant from './components/VoiceAssistant';
import appIcon from './assets/images/app_icon_1782721078936.jpg';

import { 
  Home, 
  CheckSquare, 
  Calendar, 
  Flame, 
  Target, 
  TrendingUp, 
  Terminal, 
  Mic, 
  User, 
  LogOut, 
  Clock, 
  Sparkles,
  Zap,
  Sun,
  Moon,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Seed Initial Hackathon Demo Data
const initialTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Machine Learning Assignment',
    description: 'Implement backpropagation, evaluate custom SGD models, and compile training loss diagrams.',
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // tomorrow
    estimatedHours: 6,
    progress: 20,
    priority: 'high',
    category: 'study',
    status: 'in_progress',
    riskScore: 89,
    completionProbability: 11,
    riskReasoning: 'Critical proximity. Tomorrow due-date combined with complex neural network coding requirements and limited historical velocity suggests high miss probability.',
    postponementCount: 2,
    subtasks: [
      { id: 'sub-1-1', title: 'Collect SGD and momentum equations', completed: true, durationMinutes: 45 },
      { id: 'sub-1-2', title: 'Draft Python validation functions', completed: false, durationMinutes: 90 },
      { id: 'sub-1-3', title: 'Run baseline epoch simulations', completed: false, durationMinutes: 120 },
      { id: 'sub-1-4', title: 'Plot comparison charts & compile report PDF', completed: false, durationMinutes: 60 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'task-2',
    title: 'Resume Submission (Amazon Portals)',
    description: 'Audit bullet points using STAR format, coordinate portfolio URLs, and check PDF parsing tags.',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // in 3 days
    estimatedHours: 2,
    progress: 10,
    priority: 'high',
    category: 'work',
    status: 'todo',
    riskScore: 72,
    completionProbability: 28,
    riskReasoning: 'Task is currently in To-Do. Approaching portal locking timelines. Fast tracking is advised.',
    postponementCount: 1,
    subtasks: [
      { id: 'sub-2-1', title: 'Review STAR project items', completed: true, durationMinutes: 30 },
      { id: 'sub-2-2', title: 'Incorporate modern metric data points', completed: false, durationMinutes: 60 },
      { id: 'sub-2-3', title: 'Verify parser layout using ATS simulation', completed: false, durationMinutes: 30 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'task-3',
    title: 'Study for Data Structures Final Exam',
    description: 'Review red-black trees, quicksort proofs, and dynamic programming memoization scopes.',
    deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 days out
    estimatedHours: 8,
    progress: 0,
    priority: 'medium',
    category: 'study',
    status: 'todo',
    riskScore: 35,
    completionProbability: 65,
    riskReasoning: 'Ample timeline remaining, but high volume of content makes consistent weekly time-blocking critical to stay normal risk.',
    postponementCount: 0,
    subtasks: [],
    createdAt: new Date().toISOString()
  }
];

const initialGoals: Goal[] = [
  {
    id: 'goal-1',
    title: 'Get Amazon SWE Internship',
    description: 'Secure a summer software engineer intern role by mastering dynamic programming, system architecture, and leadership concepts.',
    category: 'Career',
    targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 months out
    progress: 25,
    milestones: [
      { id: 'ms-1', title: '[Week 1] Align resume with modern recruiter ATS guidelines', completed: true, week: 1 },
      { id: 'ms-2', title: '[Week 1] Curate 3 high-impact project repositories', completed: true, week: 1 },
      { id: 'ms-3', title: '[Week 2] Complete 50 dynamic programming exercises', completed: false, week: 2 },
      { id: 'ms-4', title: '[Week 3] Run 5 behavioral mock sessions', completed: false, week: 3 },
      { id: 'ms-5', title: '[Week 4] Execute direct portal applications', completed: false, week: 4 }
    ],
    weeklyRoadmap: [
      { week: 1, focus: "Tuning Recruiter Materials & Portfolios", tasks: ["Align resume with ATS guidelines", "Curate 3 high-impact project repos"] },
      { week: 2, focus: "LeetCode Grind & Core Algorithmic Velocity", tasks: ["Complete 50 dynamic programming exercises", "Review graph algorithms"] },
      { week: 3, focus: "Mock Interview Drills & Behavioral Prep", tasks: ["Run 5 behavioral mock sessions", "Check standard system designs"] },
      { week: 4, focus: "Safe Portals Application & Referral Inbound", tasks: ["Execute direct portal applications", "Message 10 alumni for referral support"] }
    ],
    createdAt: new Date().toISOString()
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const local = localStorage.getItem('samay_theme');
    return (local as 'dark' | 'light') || 'dark';
  });

  // Handle responsive navigation
  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Handle window resizing to adjust sidebar state dynamically
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync theme with document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('samay_theme', theme);
  }, [theme]);

  // Handle responsive sidebar on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Main client states
  const [tasks, setTasks] = useState<Task[]>(() => {
    const local = localStorage.getItem('guardian_tasks');
    return local ? JSON.parse(local) : initialTasks;
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const local = localStorage.getItem('guardian_goals');
    return local ? JSON.parse(local) : initialGoals;
  });

  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() => {
    const local = localStorage.getItem('guardian_sessions');
    return local ? JSON.parse(local) : [];
  });

  const [activeRescueTask, setActiveRescueTask] = useState<Task | null>(null);

  // Sync state with localStorage
  useEffect(() => {
    localStorage.setItem('guardian_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('guardian_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('guardian_sessions', JSON.stringify(focusSessions));
  }, [focusSessions]);

  // Realtime clock helper
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // CRUD handlers - Tasks
  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'createdAt' | 'riskScore' | 'completionProbability' | 'postponementCount'>) => {
    // Proactively compute a default mock risk score (real analysis can be requested via button)
    const isDueSoon = newTaskData.deadline.includes("Today") || new Date(newTaskData.deadline).getTime() - Date.now() < 36 * 60 * 60 * 1000;
    const defaultRisk = isDueSoon ? 75 : 30;

    const newTask: Task = {
      ...newTaskData,
      id: `task-${Date.now()}`,
      riskScore: defaultRisk,
      completionProbability: 100 - defaultRisk,
      postponementCount: 0,
      createdAt: new Date().toISOString()
    };
    
    setTasks(prev => [newTask, ...prev]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // CRUD handlers - Goals
  const handleAddGoal = (newGoalData: Omit<Goal, 'id' | 'createdAt' | 'progress'>) => {
    const newGoal: Goal = {
      ...newGoalData,
      id: `goal-${Date.now()}`,
      progress: 0,
      createdAt: new Date().toISOString()
    };
    setGoals(prev => [newGoal, ...prev]);
  };

  const handleUpdateGoal = (updatedGoal: Goal) => {
    setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  // CRUD - Focus sessions logging
  const handleAddFocusSession = (newSessionData: Omit<FocusSession, 'id' | 'date'>) => {
    const newSession: FocusSession = {
      ...newSessionData,
      id: `session-${Date.now()}`,
      date: new Date().toISOString()
    };
    setFocusSessions(prev => [newSession, ...prev]);
  };

  // Voice handler to parse new task
  const handleAddTaskViaVoice = (parsed: any) => {
    const newTask: Task = {
       id: `task-voice-${Date.now()}`,
       title: parsed.title,
       description: parsed.description || "Created via voice commands",
       deadline: parsed.deadline,
       estimatedHours: parsed.estimatedHours || 2,
       priority: parsed.priority || 'medium',
       category: parsed.category || 'work',
       status: 'todo',
       progress: 0,
       riskScore: 50,
       completionProbability: 50,
       postponementCount: 0,
       subtasks: [],
       createdAt: new Date().toISOString()
     };

    setTasks(prev => [newTask, ...prev]);
    setActiveTab('tasks');
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-text-primary font-sans flex relative overflow-hidden transition-colors duration-300" id="app-shell">
      {/* Dynamic Interactive 3D Temporal backdrop */}
      <ThreeBackground theme={theme} />

      {/* Decorative ambient radial background */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-radial-glow opacity-30 pointer-events-none z-0"></div>

      {/* Responsive mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden transition-all duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className={`fixed md:sticky top-0 bottom-0 left-0 z-40 border-r border-app-border bg-app-surface/95 md:bg-app-surface/85 backdrop-blur-xl flex flex-col justify-between shrink-0 h-screen transition-all duration-300 ease-in-out ${
        isSidebarOpen 
          ? 'w-64 translate-x-0' 
          : 'w-64 -translate-x-full md:w-0 md:border-r-0 overflow-hidden'
      }`} id="sidebar-panel">
        <div className="space-y-6 pt-6 px-4">
          {/* Logo Brand */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 overflow-hidden rounded-xl shadow-lg shadow-indigo-500/20 border border-brand-indigo/30 shrink-0">
                <img 
                  src={appIcon} 
                  alt="SamayTracker App Icon" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="text-sm font-display font-bold tracking-wider text-app-text-primary uppercase">SamayTracker</h1>
                <span className="text-[10px] uppercase font-mono font-bold text-brand-indigo tracking-widest block">AI Guardian</span>
              </div>
            </div>
            
            {/* Mobile Close Button */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 text-app-text-secondary hover:text-app-text-primary rounded-lg hover:bg-app-elevated/80 md:hidden cursor-pointer focus:outline-none"
              title="Close Sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Active UTC Clock Widget */}
          <div className="p-3 bg-app-elevated/40 rounded-xl border border-app-border flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-app-text-secondary">Live Tracker</span>
            <span className="font-mono text-xs text-brand-indigo font-semibold">{currentTime || '--:--:--'}</span>
          </div>

          {/* Tabs Navigation list */}
          <nav className="space-y-1">
            <button
              id="sidebar-nav-home"
              onClick={() => handleNavigate('home')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-display text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'home' 
                  ? 'bg-gradient-to-r from-brand-indigo to-brand-violet text-white shadow-md shadow-indigo-500/10' 
                  : 'text-app-text-secondary hover:text-app-text-primary hover:bg-app-elevated/60'
              }`}
            >
              <Home className="w-4 h-4" />
              Overview Hub
            </button>

            <button
              id="sidebar-nav-tasks"
              onClick={() => handleNavigate('tasks')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-display text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'tasks' 
                  ? 'bg-gradient-to-r from-brand-indigo to-brand-violet text-white shadow-md shadow-indigo-500/10' 
                  : 'text-app-text-secondary hover:text-app-text-primary hover:bg-app-elevated/60'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              Execution Backlog
            </button>

            <button
              id="sidebar-nav-planner"
              onClick={() => handleNavigate('planner')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-display text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'planner' 
                  ? 'bg-gradient-to-r from-brand-indigo to-brand-violet text-white shadow-md shadow-indigo-500/10' 
                  : 'text-app-text-secondary hover:text-app-text-primary hover:bg-app-elevated/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              AI Scheduler
            </button>

            <button
              id="sidebar-nav-rescue"
              onClick={() => handleNavigate('rescue')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-display text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'rescue' 
                  ? 'bg-gradient-to-r from-brand-indigo to-brand-violet text-white shadow-md shadow-indigo-500/10' 
                  : 'text-app-text-secondary hover:text-app-text-primary hover:bg-app-elevated/60'
              }`}
            >
              <Flame className="w-4 h-4" />
              Rescue Center
            </button>

            <button
              id="sidebar-nav-goals"
              onClick={() => handleNavigate('goals')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-display text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'goals' 
                  ? 'bg-gradient-to-r from-brand-indigo to-brand-violet text-white shadow-md shadow-indigo-500/10' 
                  : 'text-app-text-secondary hover:text-app-text-primary hover:bg-app-elevated/60'
              }`}
            >
              <Target className="w-4 h-4" />
              Strategic Goals
            </button>

            <button
              id="sidebar-nav-insights"
              onClick={() => handleNavigate('insights')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-display text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'insights' 
                  ? 'bg-gradient-to-r from-brand-indigo to-brand-violet text-white shadow-md shadow-indigo-500/10' 
                  : 'text-app-text-secondary hover:text-app-text-primary hover:bg-app-elevated/60'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Habit Analytics
            </button>
          </nav>
        </div>

        {/* User Account & Theme switch Section */}
        <div className="p-4 border-t border-app-border space-y-3.5 bg-app-surface/50">
          {/* Light / Dark Mode Switch */}
          <div className="flex items-center justify-between p-2.5 bg-app-elevated/50 rounded-xl border border-app-border" id="theme-mode-toggle-container">
            <span className="text-[11px] font-semibold text-app-text-secondary flex items-center gap-2">
              {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-brand-indigo" /> : <Sun className="w-3.5 h-3.5 text-brand-warning" />}
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </span>
            <button
              id="theme-mode-toggle-btn"
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-brand-indigo"
              role="switch"
              aria-checked={theme === 'light'}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  theme === 'light' ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center gap-2 px-1">
            <div className="w-7 h-7 rounded-full bg-app-elevated flex items-center justify-center text-xs font-semibold text-app-text-primary">
              U
            </div>
            <div className="overflow-hidden">
              <span className="text-xs text-app-text-primary block font-medium truncate">Beta Account</span>
              <span className="text-[9px] text-app-text-secondary font-mono block">2026-06-29</span>
            </div>
          </div>

          {/* Voice Companion trigger button */}
          <button
            id="open-floating-voice-btn"
            onClick={() => setShowVoiceAssistant(!showVoiceAssistant)}
            className="w-full py-2 bg-brand-indigo/15 hover:bg-brand-indigo text-brand-indigo hover:text-white border border-brand-indigo/25 hover:border-transparent rounded-xl text-xs font-semibold font-display transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5" />
            AI Voice Assistant
          </button>
        </div>
      </aside>

      {/* MAIN VIEW CONTENT CONTAINER */}
      <main className="flex-1 min-w-0 max-h-screen overflow-y-auto p-4 md:p-8 space-y-6 z-10 relative">
        {/* Toggle Bar / Header */}
        <div className="flex items-center justify-between md:justify-start gap-4" id="main-view-responsive-header">
          <button
            id="toggle-sidebar-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 bg-app-surface/80 hover:bg-app-elevated border border-app-border text-app-text-primary rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center group focus:outline-none focus:ring-1 focus:ring-brand-indigo/50"
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <Menu className="w-5 h-5 group-hover:scale-105 transition-transform" />
          </button>
          
          {/* Logo brand shown when sidebar is collapsed/hidden */}
          {!isSidebarOpen && (
            <div className="flex items-center gap-2.5 animate-fadeIn">
              <div className="w-8 h-8 overflow-hidden rounded-lg border border-brand-indigo/20">
                <img 
                  src={appIcon} 
                  alt="SamayTracker App Icon" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="font-display font-bold text-sm tracking-wide text-app-text-primary uppercase">SamayTracker</span>
            </div>
          )}
        </div>

        {activeTab === 'home' && (
          <HomeView 
            tasks={tasks} 
            goals={goals} 
            onNavigate={handleNavigate}
            onTriggerRescue={(task) => {
              setActiveRescueTask(task);
              handleNavigate('rescue');
            }}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksView 
            tasks={tasks} 
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onTriggerRescue={(task) => {
              setActiveRescueTask(task);
              handleNavigate('rescue');
            }}
          />
        )}

        {activeTab === 'planner' && (
          <PlannerView 
            tasks={tasks} 
            onUpdateTask={handleUpdateTask}
          />
        )}

        {activeTab === 'rescue' && (
          <RescueView 
            tasks={tasks}
            activeRescueTask={activeRescueTask}
            onUpdateTask={handleUpdateTask}
            onSelectRescueTask={setActiveRescueTask}
          />
        )}

        {activeTab === 'goals' && (
          <GoalsView 
            goals={goals}
            onAddGoal={handleAddGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        )}

        {activeTab === 'insights' && (
          <InsightsView 
            tasks={tasks}
            focusSessions={focusSessions}
            onAddFocusSession={handleAddFocusSession}
          />
        )}
      </main>

      {/* FLOAT AI VOICE COMPANION VIEW */}
      {showVoiceAssistant && (
        <VoiceAssistant
          tasks={tasks}
          goals={goals}
          onAddTaskViaVoice={handleAddTaskViaVoice}
          onNavigate={handleNavigate}
          onClose={() => setShowVoiceAssistant(false)}
        />
      )}
    </div>
  );
}
