import React, { useState } from 'react';
import { Task, Subtask } from '../types';
import { Plus, List, Kanban, Calendar as CalendarIcon, CheckSquare, Square, Trash2, Edit3, Loader2, Sparkles, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface TasksViewProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'riskScore' | 'completionProbability' | 'postponementCount'>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onTriggerRescue: (task: Task) => void;
}

export default function TasksView({ tasks, onAddTask, onUpdateTask, onDeleteTask, onTriggerRescue }: TasksViewProps) {
  // Navigation states
  const [currentView, setCurrentView] = useState<'list' | 'kanban' | 'calendar'>('list');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Breakdown loaders
  const [loadingBreakdowns, setLoadingBreakdowns] = useState<{ [taskId: string]: boolean }>({});
  
  // Expanded checklists state
  const [expandedChecklists, setExpandedChecklists] = useState<{ [taskId: string]: boolean }>({});

  // Task creation Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newHours, setNewHours] = useState(3);
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newCategory, setNewCategory] = useState<'work' | 'study' | 'personal' | 'bills' | 'finance'>('work');

  // Submit task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDeadline) return;
    
    onAddTask({
      title: newTitle,
      description: newDesc,
      deadline: newDeadline,
      estimatedHours: Number(newHours),
      priority: newPriority,
      category: newCategory,
      status: 'todo',
      progress: 0,
      subtasks: []
    });

    // Reset Form
    setNewTitle('');
    setNewDesc('');
    setNewDeadline('');
    setNewHours(3);
    setShowAddForm(false);
  };

  // Toggle Subtask Completion
  const handleToggleSubtask = (task: Task, subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map(sub => 
      sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
    );
    
    // Recalculate progress based on subtasks
    const completedCount = updatedSubtasks.filter(s => s.completed).length;
    const computedProgress = updatedSubtasks.length > 0 
      ? Math.round((completedCount / updatedSubtasks.length) * 100) 
      : task.progress;

    onUpdateTask({
      ...task,
      subtasks: updatedSubtasks,
      progress: computedProgress,
      status: computedProgress === 100 ? 'completed' : task.status
    });
  };

  // Trigger Gemini AI Subtask Checklist Generator
  const handleTriggerAIBreakdown = async (task: Task) => {
    setLoadingBreakdowns(prev => ({ ...prev, [task.id]: true }));
    try {
      const response = await fetch('/api/ai/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          deadline: task.deadline,
          estimatedHours: task.estimatedHours
        })
      });
      
      const data = await response.json();
      if (data.subtasks && Array.isArray(data.subtasks)) {
        const parsedSubtasks: Subtask[] = data.subtasks.map((st: any, idx: number) => ({
          id: `sub-${Date.now()}-${idx}`,
          title: st.title,
          completed: false,
          durationMinutes: st.durationMinutes || 30
        }));

        onUpdateTask({
          ...task,
          subtasks: parsedSubtasks,
          progress: 0 // Reset progress to fit new checklist
        });

        // Autoexpand checklist
        setExpandedChecklists(prev => ({ ...prev, [task.id]: true }));
      }
    } catch (error) {
      console.error("Failed to generate breakdown checklist:", error);
    } finally {
      setLoadingBreakdowns(prev => ({ ...prev, [task.id]: false }));
    }
  };

  // Update Task Status directly (for Kanban/List toggles)
  const handleStatusChange = (task: Task, newStatus: 'todo' | 'in_progress' | 'completed') => {
    const nextProgress = newStatus === 'completed' ? 100 : (task.progress === 100 ? 50 : task.progress);
    onUpdateTask({
      ...task,
      status: newStatus,
      progress: nextProgress
    });
  };

  // Simple Month Calendar Generator
  const renderCalendar = () => {
    const today = new Date();
    const daysInMonth = 30; // Approximation for neat layout
    const calendarDays = [];

    for (let i = 0; i < daysInMonth; i++) {
      const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i - 3);
      const dateString = currentDate.toISOString().split('T')[0];
      
      // Filter tasks due on this specific date
      const tasksOnDate = tasks.filter(t => t.deadline.startsWith(dateString));

      calendarDays.push({
        date: currentDate,
        dateString,
        tasks: tasksOnDate
      });
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        {calendarDays.map((day, idx) => (
          <div key={idx} className="glass-card p-3 rounded-xl border border-app-border min-h-[120px] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-app-border pb-1.5 mb-2">
              <span className="font-mono text-xs font-semibold text-app-text-secondary">
                {day.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
              </span>
              {day.date.toDateString() === today.toDateString() && (
                <span className="w-1.5 h-1.5 bg-brand-indigo rounded-full"></span>
              )}
            </div>

            <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[80px]">
              {day.tasks.map(t => (
                <div 
                  key={t.id} 
                  className={`p-1 px-1.5 rounded text-[10px] truncate font-medium border ${
                    t.riskScore >= 60 ? 'bg-brand-danger/15 border-brand-danger/30 text-brand-danger' : 'bg-app-surface border-app-border text-app-text-primary'
                  }`}
                  title={t.title}
                >
                  {t.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6" id="tasks-viewport">
      {/* View Header with Toggle Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border-app-border">
        <div>
          <h2 className="text-2xl font-display font-bold text-app-text-primary mb-1">Active Backlog & Execution Views</h2>
          <p className="text-xs text-app-text-secondary">Manage, organize, and execute your commitments across different structured scopes.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Buttons */}
          <div className="bg-app-elevated/80 p-1 rounded-xl border border-app-border flex items-center">
            <button
              id="view-btn-list"
              onClick={() => setCurrentView('list')}
              className={`p-2 rounded-lg transition-all cursor-pointer ${currentView === 'list' ? 'bg-brand-indigo text-white' : 'text-app-text-secondary hover:text-app-text-primary'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              id="view-btn-kanban"
              onClick={() => setCurrentView('kanban')}
              className={`p-2 rounded-lg transition-all cursor-pointer ${currentView === 'kanban' ? 'bg-brand-indigo text-white' : 'text-app-text-secondary hover:text-app-text-primary'}`}
              title="Kanban Board"
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              id="view-btn-calendar"
              onClick={() => setCurrentView('calendar')}
              className={`p-2 rounded-lg transition-all cursor-pointer ${currentView === 'calendar' ? 'bg-brand-indigo text-white' : 'text-app-text-secondary hover:text-app-text-primary'}`}
              title="Calendar Scope"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            id="open-add-task-form"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-brand-indigo hover:bg-brand-indigo/90 font-display text-xs font-semibold text-white rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Slide-out Add Form */}
      {showAddForm && (
        <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 shadow-xl max-w-2xl animate-fadeIn" id="add-task-form-panel">
          <h3 className="text-base font-display font-semibold text-app-text-primary mb-4">Create New Guarded Task</h3>
          <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-[10px] text-app-text-secondary uppercase tracking-wider block mb-1">Task Title *</label>
              <input
                id="task-title-input"
                type="text"
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. Prepare Data Structures Presentation"
                className="w-full bg-app-surface border border-app-border text-app-text-primary text-xs rounded-xl p-3 focus:outline-none focus:border-brand-indigo transition-colors"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] text-app-text-secondary uppercase tracking-wider block mb-1">Description</label>
              <textarea
                id="task-desc-input"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Details, focus areas, resources needed..."
                rows={3}
                className="w-full bg-app-surface border border-app-border text-app-text-primary text-xs rounded-xl p-3 focus:outline-none focus:border-brand-indigo transition-colors resize-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-app-text-secondary uppercase tracking-wider block mb-1">Deadline Date *</label>
              <input
                id="task-deadline-input"
                type="date"
                required
                value={newDeadline}
                onChange={e => setNewDeadline(e.target.value)}
                className="w-full bg-app-surface border border-app-border text-app-text-primary text-xs rounded-xl p-3 focus:outline-none focus:border-brand-indigo transition-colors"
              />
            </div>

            <div>
              <label className="text-[10px] text-app-text-secondary uppercase tracking-wider block mb-1">Estimated Effort (Hours)</label>
              <input
                id="task-hours-input"
                type="number"
                min={1}
                max={40}
                value={newHours}
                onChange={e => setNewHours(Number(e.target.value))}
                className="w-full bg-app-surface border border-app-border text-app-text-primary text-xs rounded-xl p-3 focus:outline-none focus:border-brand-indigo transition-colors"
              />
            </div>

            <div>
              <label className="text-[10px] text-app-text-secondary uppercase tracking-wider block mb-1">Priority</label>
              <select
                id="task-priority-input"
                value={newPriority}
                onChange={e => setNewPriority(e.target.value as any)}
                className="w-full bg-app-surface border border-app-border text-app-text-primary text-xs rounded-xl p-3 focus:outline-none focus:border-brand-indigo transition-colors"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-app-text-secondary uppercase tracking-wider block mb-1">Category</label>
              <select
                id="task-category-input"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as any)}
                className="w-full bg-app-surface border border-app-border text-app-text-primary text-xs rounded-xl p-3 focus:outline-none focus:border-brand-indigo transition-colors"
              >
                <option value="work">Work (Professional)</option>
                <option value="study">Study (Academics)</option>
                <option value="personal">Personal Goals</option>
                <option value="bills">Bill Payments</option>
                <option value="finance">Finance / Tax</option>
              </select>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Save Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Views Container */}
      <div className="transition-all duration-300">
        {/* LIST VIEW */}
        {currentView === 'list' && (
          <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-4" id="task-list-view">
            <h3 className="text-base font-display font-semibold text-white border-b border-slate-800 pb-3">All Active Commitments</h3>
            
            <div className="space-y-4">
              {tasks.length === 0 ? (
                <div className="text-center py-16 text-app-text-secondary text-xs flex flex-col items-center justify-center gap-3">
                  <CheckSquare className="w-8 h-8 text-brand-indigo opacity-60" />
                  <span>No tasks logged yet. Tap 'Add Task' to initiate your guarded schedule.</span>
                </div>
              ) : (
                tasks.map(task => {
                  const isHighRisk = task.riskScore >= 60;
                  const isExpanded = expandedChecklists[task.id];

                  return (
                    <div 
                      key={task.id} 
                      className={`glass-card rounded-xl border transition-all ${
                        isHighRisk ? 'border-rose-500/20 shadow-lg shadow-rose-500/5' : 'border-slate-800/80'
                      }`}
                    >
                      {/* Top Summary Bar */}
                      <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1 w-full md:w-auto">
                          <div className="flex flex-wrap items-center gap-2">
                            {isHighRisk && <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse shrink-0" />}
                            <h4 className="font-display font-semibold text-xs text-white break-words max-w-[200px] sm:max-w-none">{task.title}</h4>
                            <span className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded shrink-0 ${
                              task.category === 'study' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-indigo-500/10 text-indigo-400'
                            }`}>
                              {task.category}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-2 md:line-clamp-1">{task.description || "No descriptions detailed."}</p>
                        </div>

                        {/* Status / Actions Row */}
                        <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 text-xs font-mono w-full md:w-auto border-t md:border-t-0 border-slate-800/40 pt-3 md:pt-0">
                          {/* Progress slider */}
                          <div className="text-left md:text-right">
                            <span className="text-slate-400 text-[10px] block font-medium">Progress ({task.progress}%)</span>
                            <div className="w-24 bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
                              <div className="bg-indigo-500 h-full" style={{ width: `${task.progress}%` }}></div>
                            </div>
                          </div>

                          {/* Risk Rating */}
                          <div className="text-right">
                            <span className="text-slate-500 text-[9px] block">RISK</span>
                            <span className={`font-bold font-mono text-[11px] ${isHighRisk ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {task.riskScore}%
                            </span>
                          </div>

                          {/* Controls */}
                          <div className="flex items-center gap-2 md:border-l md:border-slate-800 md:pl-3">
                            {/* Expand Checklist Toggle */}
                            <button
                              id={`toggle-checklist-expand-${task.id}`}
                              onClick={() => setExpandedChecklists(p => ({ ...p, [task.id]: !p[task.id] }))}
                              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                              title="Show subtask checklist"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            {/* State Selector */}
                            <select
                              id={`task-status-select-${task.id}`}
                              value={task.status}
                              onChange={e => handleStatusChange(task, e.target.value as any)}
                              className="bg-slate-950 border border-slate-800 text-[10px] text-slate-400 rounded p-1 cursor-pointer"
                            >
                              <option value="todo">To-Do</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>

                            {/* Delete Button */}
                            <button
                              id={`delete-task-btn-${task.id}`}
                              onClick={() => onDeleteTask(task.id)}
                              className="p-1.5 bg-slate-900 hover:bg-red-950/40 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-800 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Section (Checklist & AI helpers) */}
                      {isExpanded && (
                        <div className="border-t border-slate-800/80 p-4 bg-slate-900/10 space-y-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <h5 className="text-[11px] font-mono text-indigo-300 uppercase tracking-wider">Subtask Action Checklist</h5>
                            
                            <div className="flex gap-2">
                              {/* Gemini Breakdown Trigger */}
                              <button
                                id={`trigger-ai-breakdown-btn-${task.id}`}
                                onClick={() => handleTriggerAIBreakdown(task)}
                                disabled={loadingBreakdowns[task.id]}
                                className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white text-[10px] font-display font-semibold rounded-lg border border-indigo-500/20 hover:border-transparent transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                              >
                                {loadingBreakdowns[task.id] ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Sparkles className="w-3 h-3 text-cyan-400" />
                                )}
                                Auto-Generate Checklist via Gemini
                              </button>

                              {isHighRisk && (
                                <button
                                  id={`rescue-trigger-btn-sub-${task.id}`}
                                  onClick={() => onTriggerRescue(task)}
                                  className="px-3 py-1.5 bg-rose-600/15 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/20 text-[10px] font-display font-semibold rounded-lg transition-all cursor-pointer"
                                >
                                  Emergency Rescue Mode
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Checklist Rows */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            {task.subtasks.length === 0 ? (
                              <p className="text-[11px] text-slate-500 py-1 italic md:col-span-2">
                                No checklist steps logged yet. Generate one with the AI smart breakdown helper above!
                              </p>
                            ) : (
                              task.subtasks.map(sub => (
                                <div 
                                  key={sub.id} 
                                  onClick={() => handleToggleSubtask(task, sub.id)}
                                  className="flex items-center gap-3 p-2 px-3 rounded-lg bg-slate-900/60 border border-slate-800/40 hover:bg-slate-800/30 transition-all cursor-pointer group"
                                >
                                  {sub.completed ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400 shrink-0" />
                                  )}
                                  <span className={`text-xs ${sub.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                                    {sub.title}
                                  </span>
                                  {sub.durationMinutes && (
                                    <span className="text-[9px] text-slate-500 ml-auto font-mono">
                                      {sub.durationMinutes}m
                                    </span>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* KANBAN BOARD VIEW */}
        {currentView === 'kanban' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="task-kanban-view">
            {/* Column 1: TO-DO */}
            <div className="glass-panel p-5 rounded-2xl border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-display font-semibold text-xs text-white">Backlog / To-Do</span>
                <span className="bg-slate-900 px-2 py-0.5 rounded text-[10px] text-slate-400 font-mono">
                  {tasks.filter(t => t.status === 'todo').length}
                </span>
              </div>

              <div className="space-y-3 min-h-[400px]">
                {tasks.filter(t => t.status === 'todo').map(task => (
                  <div key={task.id} className="glass-card p-4 rounded-xl space-y-3 border-slate-800/60 hover:border-slate-700 transition-all">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-display font-medium text-xs text-white">{task.title}</span>
                        <span className={`text-[8px] tracking-wider uppercase font-semibold px-1.5 py-0.5 rounded ${
                          task.priority === 'high' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{task.description || "No detail description logged."}</p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Due: {task.deadline}</span>
                      <span>Risk: {task.riskScore}%</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800/60 pt-2.5">
                      <button
                        id={`move-to-progress-${task.id}`}
                        onClick={() => handleStatusChange(task, 'in_progress')}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-display font-medium cursor-pointer"
                      >
                        Start Task →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: IN PROGRESS */}
            <div className="glass-panel p-5 rounded-2xl border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-display font-semibold text-xs text-indigo-300">In Progress</span>
                <span className="bg-slate-900 px-2 py-0.5 rounded text-[10px] text-slate-400 font-mono">
                  {tasks.filter(t => t.status === 'in_progress').length}
                </span>
              </div>

              <div className="space-y-3 min-h-[400px]">
                {tasks.filter(t => t.status === 'in_progress').map(task => (
                  <div key={task.id} className="glass-card p-4 rounded-xl space-y-3 border-slate-800/60 hover:border-slate-700 transition-all">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-display font-medium text-xs text-white">{task.title}</span>
                        <span className={`text-[8px] tracking-wider uppercase font-semibold px-1.5 py-0.5 rounded ${
                          task.riskScore >= 60 ? 'bg-rose-500/15 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'
                        }`}>
                          {task.riskScore >= 60 ? 'HIGH RISK' : 'NORMAL'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Due: {task.deadline}</span>
                      <span>Progress: {task.progress}%</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800/60 pt-2.5">
                      <button
                        id={`move-to-todo-${task.id}`}
                        onClick={() => handleStatusChange(task, 'todo')}
                        className="text-[10px] text-slate-500 hover:text-slate-400 cursor-pointer"
                      >
                        ← Reset
                      </button>
                      <button
                        id={`move-to-complete-${task.id}`}
                        onClick={() => handleStatusChange(task, 'completed')}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 font-display font-medium cursor-pointer"
                      >
                        Complete ✓
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: COMPLETED */}
            <div className="glass-panel p-5 rounded-2xl border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-display font-semibold text-xs text-emerald-400">Completed</span>
                <span className="bg-slate-900 px-2 py-0.5 rounded text-[10px] text-slate-400 font-mono">
                  {tasks.filter(t => t.status === 'completed').length}
                </span>
              </div>

              <div className="space-y-3 min-h-[400px]">
                {tasks.filter(t => t.status === 'completed').map(task => (
                  <div key={task.id} className="glass-card p-4 rounded-xl space-y-2 border-slate-800/40 opacity-75">
                    <span className="font-display font-medium text-xs text-slate-300 line-through">{task.title}</span>
                    <p className="text-[9px] text-slate-500 line-clamp-1">{task.description}</p>
                    <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-slate-900">
                      <span className="text-emerald-400 font-mono text-[9px]">100% Completed</span>
                      <button
                        id={`restore-task-${task.id}`}
                        onClick={() => handleStatusChange(task, 'in_progress')}
                        className="text-[9px] text-slate-500 hover:text-slate-400 cursor-pointer"
                      >
                        Re-open
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CALENDAR VIEW */}
        {currentView === 'calendar' && (
          <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-4" id="task-calendar-scope">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-display font-semibold text-white">Upcoming Month View</h3>
              <p className="text-[10px] text-slate-400 mt-1">Showing 30-day projected workload distributions.</p>
            </div>
            {renderCalendar()}
          </div>
        )}
      </div>
    </div>
  );
}
