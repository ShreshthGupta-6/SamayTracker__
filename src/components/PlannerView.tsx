import React, { useState } from 'react';
import { Task } from '../types';
import { Calendar, User, Check, Clock, ShieldCheck, Sparkles, Sliders, CalendarDays, AlertCircle, Sunrise, Sun, Moon } from 'lucide-react';

interface PlannerViewProps {
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
}

export default function PlannerView({ tasks, onUpdateTask }: PlannerViewProps) {
  const [activeTab, setActiveTab] = useState<'blocks' | 'optimizer'>('blocks');
  const [connectedCalendar, setConnectedCalendar] = useState<'google' | 'outlook' | null>('google');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationLogs, setOptimizationLogs] = useState<string[]>([]);
  
  const activeTasks = tasks.filter(t => t.status !== 'completed');

  // Simulated Time Blocks assigned by AI
  const [timeBlocks, setTimeBlocks] = useState([
    { id: '1', title: 'Deep Work: Machine Learning Assignment', time: 'Today, 06:00 PM - 08:00 PM', duration: '120m', status: 'scheduled', window: 'Evening' },
    { id: '2', title: 'Tactical Review: Prepare for Data Structures', time: 'Tomorrow, 09:00 AM - 10:30 AM', duration: '90m', status: 'scheduled', window: 'Morning' },
    { id: '3', title: 'Focus Sprint: Submit Resume', time: 'Wednesday, 02:00 PM - 03:00 PM', duration: '60m', status: 'tentative', window: 'Afternoon' }
  ]);

  // Run AI Scheduling Assistant Optimizer
  const triggerCalendarOptimization = () => {
    setIsOptimizing(true);
    setOptimizationLogs([]);
    
    setTimeout(() => {
      setOptimizationLogs(prev => [...prev, "Scanning Google Calendar for empty slots..."]);
    }, 400);

    setTimeout(() => {
      setOptimizationLogs(prev => [...prev, "Analyzing active task priorities & risk scores..."]);
    }, 1200);

    setTimeout(() => {
      setOptimizationLogs(prev => [...prev, "Calculating optimal productivity windows (Evening priority matches historical data)..."]);
    }, 2000);

    setTimeout(() => {
      // Allocate active tasks to slots
      const newBlocks = activeTasks.map((t, idx) => {
        const hour = 18 + (idx * 2); // evening work blocks
        const dateOffset = idx === 0 ? "Today" : idx === 1 ? "Tomorrow" : `In ${idx} days`;
        return {
          id: `opt-${t.id}-${Date.now()}`,
          title: `AI Work Block: ${t.title}`,
          time: `${dateOffset}, 06:00 PM - 07:30 PM`,
          duration: "90m",
          status: 'scheduled',
          window: 'Evening'
        };
      });

      if (newBlocks.length > 0) {
        setTimeBlocks(newBlocks);
      }
      
      setOptimizationLogs(prev => [...prev, "Calendar Optimized! 3 deep work events successfully synced back to Google Calendar."]);
      setIsOptimizing(false);
    }, 3000);
  };

  return (
    <div className="space-y-6" id="planner-viewport">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white mb-1">AI Smart Scheduling Assistant</h2>
          <p className="text-xs text-slate-400">Map out concrete execution time-blocks, auto-resolve conflicts, and lock down deep work slots.</p>
        </div>

        {/* Integration Status badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs w-full xl:w-auto">
          <button
            id="google-cal-sync-badge"
            onClick={() => setConnectedCalendar(connectedCalendar === 'google' ? null : 'google')}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer text-left shrink-0 ${
              connectedCalendar === 'google' 
                ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-300' 
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Google Calendar {connectedCalendar === 'google' ? 'Synced' : 'Offline'}</span>
          </button>
          
          <button
            id="outlook-cal-sync-badge"
            onClick={() => setConnectedCalendar(connectedCalendar === 'outlook' ? null : 'outlook')}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer text-left shrink-0 ${
              connectedCalendar === 'outlook' 
                ? 'bg-purple-600/10 border-purple-500/20 text-purple-300' 
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>Outlook Calendar {connectedCalendar === 'outlook' ? 'Synced' : 'Offline'}</span>
          </button>
        </div>
      </div>

      {/* Main Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workload Balancer & Productivity Windows */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-base font-display font-semibold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Sliders className="text-cyan-400 w-5 h-5" />
            Workload Balancing
          </h3>

          <div className="space-y-4 text-xs">
            {/* Morning Window */}
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/60 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-medium text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-cyan/20 to-brand-cyan/5 border border-brand-cyan/35 shadow-inner group">
                    <span className="absolute -inset-0.5 rounded-xl bg-brand-cyan/15 blur-xs opacity-75 group-hover:opacity-100 transition-opacity"></span>
                    <Sunrise className="relative w-4 h-4 text-brand-cyan" />
                  </span>
                  <span>Morning Window (8 AM - 12 PM)</span>
                </span>
                <span className="font-mono text-slate-500">1.5h Allocated</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full rounded-full" style={{ width: '35%' }}></div>
              </div>
              <p className="text-[10px] text-slate-400 italic">Ideal for lightweight tactical task management.</p>
            </div>

            {/* Afternoon Window */}
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/60 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-medium text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-indigo/20 to-brand-indigo/5 border border-brand-indigo/35 shadow-inner group">
                    <span className="absolute -inset-0.5 rounded-xl bg-brand-indigo/15 blur-xs opacity-75 group-hover:opacity-100 transition-opacity"></span>
                    <Sun className="relative w-4 h-4 text-brand-indigo" />
                  </span>
                  <span>Afternoon Window (1 PM - 5 PM)</span>
                </span>
                <span className="font-mono text-slate-500">1h Allocated</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: '25%' }}></div>
              </div>
              <p className="text-[10px] text-slate-400 italic">Mid-level cognitive load window.</p>
            </div>

            {/* Evening Peak Window */}
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/60 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-medium text-indigo-300">
                <span className="flex items-center gap-2">
                  <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-violet/20 to-brand-violet/5 border border-brand-violet/35 shadow-inner group">
                    <span className="absolute -inset-0.5 rounded-xl bg-brand-violet/15 blur-xs opacity-75 group-hover:opacity-100 transition-opacity"></span>
                    <Moon className="relative w-4 h-4 text-brand-violet" />
                  </span>
                  <span className="flex items-center gap-1">
                    Evening Peak Window (6 PM - 10 PM)
                    <Sparkles className="w-3 h-3 text-brand-indigo animate-pulse" />
                  </span>
                </span>
                <span className="font-mono text-indigo-300 font-semibold">2h Allocated</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full" style={{ width: '75%' }}></div>
              </div>
              <p className="text-[10px] text-indigo-300 italic">Your historical peak focus zone (35% faster completion pace!).</p>
            </div>
          </div>
        </div>

        {/* Dynamic Schedule Time Blocks */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <h3 className="text-base font-display font-semibold text-white flex items-center gap-2">
              <CalendarDays className="text-indigo-400 w-5 h-5" />
              Active Time Blocks
            </h3>

            <button
              id="calendar-optimize-btn"
              onClick={triggerCalendarOptimization}
              disabled={isOptimizing}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-display text-xs font-semibold rounded-lg shadow-lg shadow-indigo-500/20 flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer w-full sm:w-auto justify-center"
            >
              {isOptimizing ? (
                <>
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  Optimize Calendar Slots
                </>
              )}
            </button>
          </div>

          {/* Loader display logs */}
          {optimizationLogs.length > 0 && (
            <div className="bg-slate-950 p-3 rounded-xl border border-indigo-500/10 space-y-1.5 font-mono text-[10px]">
              {optimizationLogs.map((log, idx) => (
                <div key={idx} className="flex items-center gap-2 text-slate-400">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>{log}</span>
                </div>
              ))}
            </div>
          )}

          {/* Schedulers */}
          <div className="space-y-3">
            {activeTasks.length === 0 && timeBlocks.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                <Clock className="w-8 h-8 text-slate-600 mb-1 animate-pulse" />
                <span>Add tasks in the Backlog view to generate predictive time blocks.</span>
              </div>
            ) : (
              timeBlocks.map(block => (
                <div 
                  key={block.id} 
                  className="glass-card p-4 rounded-xl border border-slate-800/80 hover:bg-slate-800/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                >
                  <div className="space-y-1.5 w-full sm:w-auto">
                    <h4 className="font-display font-medium text-xs text-white">{block.title}</h4>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {block.time}
                      </span>
                      <span className="text-slate-700 hidden sm:inline">•</span>
                      <span className="shrink-0">Duration: {block.duration}</span>
                      <span className="text-slate-700 hidden sm:inline">•</span>
                      <span className="text-slate-500 shrink-0">{block.window} Window</span>
                    </div>
                  </div>

                  <span className={`text-[9px] font-mono tracking-wider font-semibold uppercase p-1.5 px-2.5 rounded shrink-0 w-fit ${
                    block.status === 'scheduled' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {block.status}
                  </span>
                </div>
              ))
            )}
          </div>
          
          {activeTasks.length > 0 && (
            <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 flex items-start gap-2.5 text-xs text-indigo-300">
              <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                You have {activeTasks.length} unscheduled tasks. Running the <strong>AI Optimizer</strong> will find available time-slots in your calendar and allocate dedicated blocks for them automatically.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
