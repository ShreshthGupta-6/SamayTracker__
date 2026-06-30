import React, { useState } from 'react';
import { Task, FocusSession, HabitInsight } from '../types';
import { LineChart, BarChart2, Lightbulb, Plus, Zap, Activity, BookOpen, Clock, Check } from 'lucide-react';

interface InsightsViewProps {
  tasks: Task[];
  focusSessions: FocusSession[];
  onAddFocusSession: (session: Omit<FocusSession, 'id' | 'date'>) => void;
}

export default function InsightsView({ tasks, focusSessions, onAddFocusSession }: InsightsViewProps) {
  const [showAddLog, setShowAddLog] = useState(false);
  const [logTaskId, setLogTaskId] = useState('');
  const [logMinutes, setLogMinutes] = useState(25);

  const activeTasks = tasks.filter(t => t.status !== 'completed');

  // Hardcoded Habit Insights based on Product Vision
  const insights: HabitInsight[] = [
    {
      id: '1',
      title: 'Optimal Productivity Window',
      metric: '8:00 PM - 11:00 PM',
      trend: 'up',
      description: 'Your task completion velocity is 35% faster during evening blocks. We recommend scheduling heavy cognitive tasks during this peak window.',
      category: 'focus'
    },
    {
      id: '2',
      title: 'Extreme Procrastination Shield',
      metric: 'Checklist Breakdown Boost',
      trend: 'up',
      description: 'Breaking tasks into granular checklists has decreased postponement rates by 54% this week. Keep utilizing AI Smart Breakdown.',
      category: 'anti-procrastination'
    },
    {
      id: '3',
      title: 'Cognitive Session Fatigue',
      metric: '45m Focus Threshold',
      trend: 'neutral',
      description: 'Analytics show session fatigue triggers after 50 minutes of continuous focus. Stick to the 45/15 pomodoro rescue loops for peak endurance.',
      category: 'productivity'
    }
  ];

  // Grouped Focus minutes per Day (Mock Calendar Graph using CSS bars)
  const focusDistribution = [
    { day: 'Mon', mins: 45 },
    { day: 'Tue', mins: 90 },
    { day: 'Wed', mins: 25 },
    { day: 'Thu', mins: 120 },
    { day: 'Fri', mins: 60 },
    { day: 'Sat', mins: 150 },
    { day: 'Sun', mins: 75 }
  ];

  const handleLogSession = (e: React.FormEvent) => {
    e.preventDefault();
    const task = tasks.find(t => t.id === logTaskId);
    onAddFocusSession({
      taskId: logTaskId || undefined,
      taskTitle: task ? task.title : undefined,
      durationMinutes: Number(logMinutes),
      type: 'focus'
    });

    // Reset Form
    setLogTaskId('');
    setLogMinutes(25);
    setShowAddLog(false);
  };

  // Calculate total focus hours
  const totalFocusMinutes = focusSessions.reduce((sum, s) => sum + s.durationMinutes, 0) + 565; // include mock initial baseline
  const totalFocusHours = Math.round((totalFocusMinutes / 60) * 10) / 10;

  return (
    <div className="space-y-6" id="insights-viewport">
      {/* Header Panel */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white mb-1">Behavioral Habit Intelligence</h2>
          <p className="text-xs text-slate-400">Unlock analytical reviews of your daily study trends, peak efficiency slots, and scheduling patterns.</p>
        </div>

        <button
          id="open-log-session-btn"
          onClick={() => setShowAddLog(!showAddLog)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 font-display text-xs font-semibold text-white rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Log Focus Session
        </button>
      </div>

      {/* Slide form */}
      {showAddLog && (
        <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 max-w-md animate-fadeIn" id="log-session-form-panel">
          <h3 className="text-sm font-display font-semibold text-white mb-4">Log Completed Focus block</h3>
          <form onSubmit={handleLogSession} className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Target Task (Optional)</label>
              <select
                id="log-session-task-select"
                value={logTaskId}
                onChange={e => setLogTaskId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-400 text-xs p-3 rounded-xl focus:outline-none"
              >
                <option value="">-- General Work Block --</option>
                {activeTasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Session Duration (Minutes)</label>
              <input
                id="log-session-duration-input"
                type="number"
                min={5}
                max={300}
                required
                value={logMinutes}
                onChange={e => setLogMinutes(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs p-3 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowAddLog(false)}
                className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Log Session
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Analytics widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Focus Graph (using custom CSS bar styling for robust layout) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4 flex flex-col justify-between min-h-[340px]">
          <div>
            <h3 className="text-base font-display font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <BarChart2 className="text-indigo-400 w-5 h-5" />
              Focus Distribution Patterns
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Showing historical focus session minutes completed daily.</p>
          </div>

          {/* Graphical custom bar chart */}
          <div className="flex items-end justify-between h-[180px] pt-6 px-2 sm:px-4 gap-1">
            {focusDistribution.map((item, index) => {
              // Scale height relative to maximum minutes
              const barHeight = Math.min(100, Math.round((item.mins / 150) * 100));
              return (
                <div key={index} className="flex-1 min-w-0 flex flex-col items-center gap-1 sm:gap-2.5">
                  {/* Hover tooltip minutes */}
                  <span className="font-mono text-[9px] text-indigo-300 font-bold opacity-0 group-hover:opacity-100 sm:hover:opacity-100 transition-opacity">
                    {item.mins}m
                  </span>
                  {/* Rounded visual bar */}
                  <div className="w-5 sm:w-6 md:w-8 bg-slate-900 rounded-lg h-[110px] flex items-end overflow-hidden border border-slate-800/40">
                    <div 
                      className="bg-gradient-to-t from-indigo-600 to-purple-500 w-full rounded-t-lg transition-all duration-1000 ease-out"
                      style={{ height: `${barHeight}%` }}
                    ></div>
                  </div>
                  {/* Day Label */}
                  <span className="font-mono text-[10px] text-slate-400 font-medium">{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Aggregate statistics */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-base font-display font-semibold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Activity className="text-cyan-400 w-5 h-5" />
            Performance Indices
          </h3>

          <div className="space-y-3.5 text-xs">
            {/* Hour Log */}
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
              <Clock className="text-cyan-400 w-8 h-8 shrink-0 bg-cyan-500/10 p-1.5 rounded-lg border border-cyan-500/20" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Total Focus Logged</span>
                <span className="text-lg font-display font-bold text-white font-mono">{totalFocusHours}h</span>
              </div>
            </div>

            {/* Session Count Log */}
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
              <BookOpen className="text-purple-400 w-8 h-8 shrink-0 bg-purple-500/10 p-1.5 rounded-lg border border-purple-500/20" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Focus Blocks</span>
                <span className="text-lg font-display font-bold text-white font-mono">{focusSessions.length + 12} Blocks</span>
              </div>
            </div>

            {/* Completion Velocity */}
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
              <Zap className="text-yellow-400 w-8 h-8 shrink-0 bg-yellow-500/10 p-1.5 rounded-lg border border-yellow-500/20" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Anti-Procrastination Index</span>
                <span className="text-base font-display font-bold text-yellow-400 flex items-center gap-1">
                  Stable (Low Risk)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Habit Insights Banner list */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-base font-display font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Lightbulb className="text-yellow-400 w-5 h-5 animate-bounce" />
          AI Habit Intelligence Insights
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {insights.map(insight => (
            <div key={insight.id} className="glass-card p-5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="bg-indigo-500/10 text-indigo-300 text-[9px] uppercase tracking-wider font-mono font-bold p-1 px-2 rounded">
                  {insight.category}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                  <Check className="w-3.5 h-3.5" /> High Confidence
                </span>
              </div>
              <h4 className="font-display font-bold text-xs text-white leading-tight">{insight.title}</h4>
              <div className="text-indigo-400 font-mono text-sm font-semibold">{insight.metric}</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{insight.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
