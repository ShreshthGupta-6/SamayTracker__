import React, { useState } from 'react';
import { Goal, Milestone } from '../types';
import { Target, Plus, CheckCircle, Award, Compass, CompassIcon, Calendar, Loader2, Sparkles, Trash2 } from 'lucide-react';

interface GoalsViewProps {
  goals: Goal[];
  onAddGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'progress'>) => void;
  onUpdateGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
}

export default function GoalsView({ goals, onAddGoal, onUpdateGoal, onDeleteGoal }: GoalsViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(goals[0] || null);
  const [loadingRoadmaps, setLoadingRoadmaps] = useState<{ [goalId: string]: boolean }>({});

  // Goal Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newCategory, setNewCategory] = useState('Career');

  // Create Goal
  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;

    onAddGoal({
      title: newTitle,
      description: newDesc,
      targetDate: newDate,
      category: newCategory,
      milestones: [],
      weeklyRoadmap: []
    });

    // Reset Form
    setNewTitle('');
    setNewDesc('');
    setNewDate('');
    setShowAddForm(false);
  };

  // Trigger Gemini AI Goal Planner
  const handleTriggerGoalPlanner = async (goal: Goal) => {
    setLoadingRoadmaps(prev => ({ ...prev, [goal.id]: true }));
    try {
      const response = await fetch('/api/ai/plan-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: goal.title,
          description: goal.description,
          targetDate: goal.targetDate,
          category: goal.category
        })
      });

      const data = await response.json();
      if (data.weeklyRoadmap && Array.isArray(data.weeklyRoadmap)) {
        // Construct checkable milestones out of the weekly tasks
        const generatedMilestones: Milestone[] = [];
        data.weeklyRoadmap.forEach((weekBlock: any) => {
          weekBlock.tasks.forEach((taskName: string, idx: number) => {
            generatedMilestones.push({
              id: `milestone-${Date.now()}-${weekBlock.week}-${idx}`,
              title: `[Week ${weekBlock.week}] ${taskName}`,
              completed: false,
              week: weekBlock.week
            });
          });
        });

        const updatedGoal = {
          ...goal,
          milestones: generatedMilestones,
          weeklyRoadmap: data.weeklyRoadmap.map((w: any) => ({
            week: w.week,
            focus: w.focus,
            tasks: w.tasks
          })),
          progress: 0
        };

        onUpdateGoal(updatedGoal);
        setSelectedGoal(updatedGoal);
      }
    } catch (err) {
      console.error("Failed to plan goal:", err);
    } finally {
      setLoadingRoadmaps(prev => ({ ...prev, [goal.id]: false }));
    }
  };

  // Toggle individual Milestone check state
  const handleToggleMilestone = (goal: Goal, milestoneId: string) => {
    const updatedMilestones = goal.milestones.map(ms =>
      ms.id === milestoneId ? { ...ms, completed: !ms.completed } : ms
    );

    const completedCount = updatedMilestones.filter(m => m.completed).length;
    const computedProgress = updatedMilestones.length > 0
      ? Math.round((completedCount / updatedMilestones.length) * 100)
      : goal.progress;

    const updatedGoal = {
      ...goal,
      milestones: updatedMilestones,
      progress: computedProgress
    };

    onUpdateGoal(updatedGoal);
    setSelectedGoal(updatedGoal);
  };

  return (
    <div className="space-y-6" id="goals-viewport">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white mb-1">Goal-to-Execution Planner</h2>
          <p className="text-xs text-slate-400">Map long-term ambitions to granular weekly checkpoints, generated dynamically by artificial intelligence.</p>
        </div>

        <button
          id="open-add-goal-btn"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 font-display text-xs font-semibold text-white rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Long-Term Goal
        </button>
      </div>

      {/* Add Goal Slide Form */}
      {showAddForm && (
        <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 max-w-xl animate-fadeIn" id="add-goal-form-panel">
          <h3 className="text-base font-display font-semibold text-white mb-4">Set Strategic Milestone Target</h3>
          <form onSubmit={handleCreateGoal} className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Goal / Ambition *</label>
              <input
                id="goal-title-input"
                type="text"
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. Land Summer Software Engineering Internship"
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Ambition Details</label>
              <textarea
                id="goal-desc-input"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Why do you want to accomplish this? What is the core outcome?"
                rows={3}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Target Achievement Date *</label>
                <input
                  id="goal-date-input"
                  type="date"
                  required
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Classification Category</label>
                <select
                  id="goal-category-select"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="Career">Career Development</option>
                  <option value="Academics">Academic Success</option>
                  <option value="Fitness">Fitness & Health</option>
                  <option value="Finance">Financial Security</option>
                  <option value="Ventures">Entrepreneurship</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
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
                Launch Goal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Grid: Goal Selector vs Strategic Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List of Goals */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800 space-y-4">
          <h3 className="text-sm font-display font-semibold text-white border-b border-slate-800 pb-2.5 flex items-center gap-1.5">
            <Target className="text-indigo-400 w-4 h-4" />
            Target Active Aims
          </h3>

          <div className="space-y-2.5 max-h-[350px] overflow-y-auto">
            {goals.length === 0 ? (
              <div className="text-center py-12 text-app-text-secondary text-xs flex flex-col items-center justify-center gap-3">
                <Compass className="w-8 h-8 text-brand-indigo opacity-60 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Create a long-term goal above to trigger your weekly AI planner.</span>
              </div>
            ) : (
              goals.map(goal => (
                <div
                  key={goal.id}
                  onClick={() => setSelectedGoal(goal)}
                  className={`p-4 rounded-xl border text-xs cursor-pointer transition-all space-y-2 group ${
                    selectedGoal?.id === goal.id
                      ? 'bg-indigo-600/10 border-indigo-500/40'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-display font-semibold text-xs text-white group-hover:text-indigo-300 transition-colors">{goal.title}</h4>
                      <span className="text-[9px] text-slate-500 font-mono">Category: {goal.category}</span>
                    </div>

                    {/* Delete Icon */}
                    <button
                      id={`delete-goal-${goal.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteGoal(goal.id);
                        if (selectedGoal?.id === goal.id) setSelectedGoal(null);
                      }}
                      className="text-slate-600 hover:text-rose-400 p-1 rounded hover:bg-slate-950 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Progress Tracker bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>Execution Pace</span>
                      <span className="text-indigo-400 font-semibold">{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full" style={{ width: `${goal.progress}%` }}></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Weekly Roadmap visualizer */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border-slate-800 space-y-6">
          {selectedGoal ? (
            <div className="space-y-6">
              {/* Goal Title Detail */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-800 pb-4 gap-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-display font-bold text-white">{selectedGoal.title}</h3>
                  <p className="text-xs text-slate-400">{selectedGoal.description || "Establish consistent pacing to clear milestones."}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-600" />
                    <span>Target Date: {selectedGoal.targetDate}</span>
                  </div>
                </div>

                {/* Generate Planner Button */}
                <button
                  id={`ai-plan-roadmap-btn-${selectedGoal.id}`}
                  onClick={() => handleTriggerGoalPlanner(selectedGoal)}
                  disabled={loadingRoadmaps[selectedGoal.id]}
                  className="px-3.5 py-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white text-xs font-semibold rounded-xl border border-indigo-500/20 hover:border-transparent transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {loadingRoadmaps[selectedGoal.id] ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  )}
                  Generate AI Execution Roadmap
                </button>
              </div>

              {/* Weekly execution timeline */}
              {selectedGoal.weeklyRoadmap && selectedGoal.weeklyRoadmap.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedGoal.weeklyRoadmap.map(weekBlock => (
                    <div key={weekBlock.week} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/80 space-y-3 relative group">
                      <div className="absolute top-3 right-3 bg-indigo-600/10 text-indigo-400 font-mono font-bold text-[9px] px-2 py-0.5 rounded border border-indigo-500/10">
                        WEEK {weekBlock.week}
                      </div>

                      <div className="space-y-1 pr-14">
                        <span className="text-[9px] font-mono tracking-wider text-slate-500 uppercase">Focus Zone</span>
                        <h4 className="font-display font-bold text-xs text-slate-200">{weekBlock.focus}</h4>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-800/40">
                        {selectedGoal.milestones
                          .filter(ms => ms.week === weekBlock.week)
                          .map(milestone => (
                            <div
                              key={milestone.id}
                              onClick={() => handleToggleMilestone(selectedGoal, milestone.id)}
                              className="flex items-center gap-2 p-1.5 px-2 rounded hover:bg-slate-950 transition-colors cursor-pointer text-[11px]"
                            >
                              <CheckCircle className={`w-4 h-4 shrink-0 ${
                                milestone.completed ? 'text-emerald-400' : 'text-slate-700'
                              }`} />
                              <span className={`truncate ${milestone.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                                {milestone.title.replace(/^\[Week \d+\] /, '')}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-16 text-slate-500 text-xs gap-3">
                  <Compass className="w-12 h-12 text-slate-600 animate-pulse" />
                  <p className="max-w-md">
                    This goal currently has no structured weekly timeline. Click <strong>Generate AI Execution Roadmap</strong> above and let Gemini formulate a 4-week checkpoint roadmap.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-24 text-slate-500 text-xs gap-3">
              <Award className="w-12 h-12 text-slate-700" />
              <p>Choose an ambition target from the left list or launch a new long-term target block above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
