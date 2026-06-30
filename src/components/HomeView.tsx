import React from 'react';
import { Task, Goal } from '../types';
import { ShieldAlert, AlertTriangle, CheckCircle, TrendingUp, Zap, Clock, Trophy, ArrowRight, Sparkles } from 'lucide-react';

interface HomeViewProps {
  tasks: Task[];
  goals: Goal[];
  onNavigate: (tab: string) => void;
  onTriggerRescue: (task: Task) => void;
}

export default function HomeView({ tasks, goals, onNavigate, onTriggerRescue }: HomeViewProps) {
  // Compute key stats
  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  
  // High risk tasks are active tasks with riskScore >= 60
  const highRiskTasks = activeTasks.filter(t => t.riskScore >= 60);
  
  // Sort active tasks by proximity of deadline (due soonest first)
  const sortedUpcoming = [...activeTasks].sort((a, b) => {
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  // Productivity Score Calculation
  // Formula: Base 65 + (completed % * 20) - (high risk count * 5) - (postponements * 3), bounded 0-100
  const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 75;
  const postponementPenalty = tasks.reduce((sum, t) => sum + (t.postponementCount || 0), 0) * 3;
  const riskPenalty = highRiskTasks.length * 5;
  const calculatedScore = Math.min(100, Math.max(10, Math.round(60 + (completionRate * 0.3) - riskPenalty - postponementPenalty)));

  // Generate dynamic AI Recommendations based on task state
  const getAiRecommendation = () => {
    if (highRiskTasks.length > 0) {
      const highestRisk = [...highRiskTasks].sort((a, b) => b.riskScore - a.riskScore)[0];
      return {
        type: 'danger',
        title: "High Priority Rescue Action Required",
        message: `Your task "${highestRisk.title}" has a predicted risk rating of ${highestRisk.riskScore}%. Procrastinating now will make completion nearly impossible. Click below to initiate Deadline Rescue Mode.`,
        actionText: "Trigger Rescue Strategy",
        action: () => onTriggerRescue(highestRisk),
        color: "from-brand-violet/15 to-brand-indigo/10 border-brand-violet/30 text-brand-violet"
      };
    }
    
    if (activeTasks.length > 3) {
      return {
        type: 'warning',
        title: "Workload Imbalance Detected",
        message: `You currently have ${activeTasks.length} concurrent active commitments. Research shows multitasking reduces cognitive capacity by 40%. Focus on one high-impact priority block right now.`,
        actionText: "Open AI Planner",
        action: () => onNavigate('planner'),
        color: "from-brand-indigo/15 to-brand-violet/10 border-brand-indigo/30 text-brand-indigo"
      };
    }

    return {
      type: 'success',
      title: "System Performance Optimal",
      message: "Excellent pacing! Your active deadlines are well-distributed. Continue maintaining consistent 45-minute focus session intervals to build momentum.",
      actionText: "Log Focus Block",
      action: () => onNavigate('insights'),
      color: "from-brand-success/15 to-brand-cyan/10 border-brand-success/30 text-brand-success"
    };
  };

  const recommendation = getAiRecommendation();

  return (
    <div className="space-y-6" id="home-viewport">
      {/* Top Banner Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productivity Score Ring */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-indigo-500/20 transition-all"></div>
          
          <h3 className="text-app-text-secondary font-display text-xs font-semibold tracking-wider uppercase mb-4">Overall Score</h3>
          
          <div className="relative flex items-center justify-center w-36 h-36">
            {/* SVG Circle Gauge */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="rgba(255, 200, 1, 0.1)"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="url(#indigoGrad)"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * calculatedScore) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="indigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFC801" />
                  <stop offset="100%" stopColor="#FF9932" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute text-center">
              <span className="text-4xl font-display font-bold text-app-text-primary font-mono">{calculatedScore}</span>
              <span className="text-[10px] text-app-text-secondary block font-sans tracking-wide">PRODUCTIVITY</span>
            </div>
          </div>

          <p className="text-[11px] text-app-text-secondary mt-4 leading-relaxed">
            Updated based on completion rate, deadline risks, and focus patterns.
          </p>
        </div>

        {/* AI Recommendations Banner */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-glow opacity-50"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-brand-indigo/20 to-brand-indigo/5 border border-brand-indigo/35">
                <span className="absolute -inset-0.5 rounded-lg bg-brand-indigo/20 blur-xs animate-pulse"></span>
                <Sparkles className="relative w-3.5 h-3.5 text-brand-indigo" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-brand-indigo">
                AI Active Recommendation
              </span>
            </div>
            
            <div className={`mt-4 p-4 rounded-xl border bg-gradient-to-br ${recommendation.color} flex gap-4 items-start shadow-md`}>
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-app-surface/90 border border-app-border/30 shadow-lg mt-0.5">
                <span className="absolute inset-0.5 bg-radial-glow opacity-30 rounded-lg"></span>
                {recommendation.type === 'danger' && <ShieldAlert className="relative w-5 h-5 text-brand-violet shrink-0" />}
                {recommendation.type === 'warning' && <AlertTriangle className="relative w-5 h-5 text-brand-indigo shrink-0" />}
                {recommendation.type === 'success' && <CheckCircle className="relative w-5 h-5 text-brand-success shrink-0" />}
              </span>
              <div>
                <h4 className="font-display font-semibold text-sm mb-1">{recommendation.title}</h4>
                <p className="text-xs opacity-90 leading-relaxed">{recommendation.message}</p>
              </div>
            </div>
          </div>
          <div className="relative mt-4 flex justify-end">
            <button
              id="action-btn-recommendation"
              onClick={recommendation.action}
              className="px-4 py-2 bg-app-surface border border-app-border text-brand-indigo hover:text-brand-violet font-display text-xs font-semibold rounded-xl flex items-center gap-2 hover:bg-app-elevated transition-all cursor-pointer shadow-sm"
            >
              {recommendation.actionText}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Urgent Priorities vs Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Deadlines Block */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-app-border pb-3">
            <h3 className="text-base font-display font-semibold text-app-text-primary flex items-center gap-2">
              <Clock className="text-brand-indigo w-5 h-5" />
              Active Backlog & Impending Deadlines
            </h3>
            <button 
              id="nav-to-tasks"
              onClick={() => onNavigate('tasks')}
              className="text-xs text-brand-indigo hover:text-brand-violet transition-all cursor-pointer"
            >
              Manage Tasks
            </button>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {sortedUpcoming.length === 0 ? (
              <div className="text-center py-12 text-app-text-secondary text-xs flex flex-col items-center justify-center gap-3">
                <CheckCircle className="w-8 h-8 text-brand-success/70" />
                <span>No active deadlines! Click 'Manage Tasks' to add some goals.</span>
              </div>
            ) : (
              sortedUpcoming.map((task) => {
                const isHighRisk = task.riskScore >= 60;
                return (
                  <div 
                    key={task.id} 
                    className="glass-card p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-app-elevated/50 border border-app-border/60 transition-all group"
                  >
                    <div className="space-y-1.5 w-full sm:w-auto">
                      <div className="flex flex-wrap items-center gap-2">
                        {isHighRisk ? (
                          <ShieldAlert className="w-4 h-4 text-brand-danger animate-pulse shrink-0" />
                        ) : (
                          <AlertTriangle className={`w-4 h-4 shrink-0 ${task.priority === 'high' ? 'text-brand-warning' : 'text-app-text-secondary'}`} />
                        )}
                        <span className="font-display font-semibold text-xs text-app-text-primary group-hover:text-brand-indigo transition-colors break-words max-w-[200px] sm:max-w-none">
                          {task.title}
                        </span>
                        <span className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded shrink-0 ${
                          task.category === 'study' ? 'bg-cyan-500/10 text-cyan-400' : 
                          task.category === 'work' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-purple-500/10 text-purple-400'
                        }`}>
                          {task.category}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-app-text-secondary font-mono">
                        <span className="shrink-0">Due: {task.deadline}</span>
                        <span className="text-app-border hidden sm:inline">•</span>
                        <span className="shrink-0">Hours Required: {task.estimatedHours}h</span>
                        <span className="text-app-border hidden sm:inline">•</span>
                        <span className="shrink-0">Completed: {task.progress}%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t border-app-border/20 pt-3 sm:pt-0 sm:border-0">
                      {/* Risk Score Pill */}
                      <div className="text-left sm:text-right">
                        <span className={`text-xs font-mono font-bold block ${
                          isHighRisk ? 'text-brand-danger' : 'text-brand-success'
                        }`}>
                          {task.riskScore}%
                        </span>
                        <span className="text-[9px] text-app-text-secondary uppercase tracking-wider opacity-80">Predictive Risk</span>
                      </div>

                      {isHighRisk && (
                        <button
                          id={`rescue-btn-${task.id}`}
                          onClick={() => onTriggerRescue(task)}
                          className="px-3.5 py-1.5 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white text-[10px] font-display font-bold rounded-lg border border-rose-500/20 hover:border-transparent transition-all cursor-pointer shrink-0"
                        >
                          Rescue
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Analytics Column */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-base font-display font-semibold text-app-text-primary flex items-center gap-2 border-b border-app-border pb-3">
            <Trophy className="text-brand-warning w-5 h-5" />
            Performance Insights
          </h3>

          <div className="space-y-4 text-xs">
            {/* Stat Item 1 */}
            <div className="bg-app-elevated/40 p-4 rounded-xl border border-app-border flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-app-text-secondary block font-display">Completion Pacing</span>
                <span className="text-lg font-display font-bold text-app-text-primary font-mono">
                  {Math.round(completionRate)}%
                </span>
              </div>
              <CheckCircle className="text-brand-success w-6 h-6" />
            </div>

            {/* Stat Item 2 */}
            <div className="bg-app-elevated/40 p-4 rounded-xl border border-app-border flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-app-text-secondary block font-display">High-Risk Backlogs</span>
                <span className="text-lg font-display font-bold text-brand-danger font-mono">
                  {highRiskTasks.length}
                </span>
              </div>
              <ShieldAlert className="text-brand-danger w-6 h-6" />
            </div>

            {/* Stat Item 3 */}
            <div className="bg-app-elevated/40 p-4 rounded-xl border border-app-border flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-app-text-secondary block font-display">Focus Velocity Trend</span>
                <span className="text-sm font-display font-semibold text-brand-cyan flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +14% this week
                </span>
              </div>
              <Zap className="text-brand-cyan w-6 h-6" />
            </div>

            {/* Active Goals block */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-app-text-secondary mb-2">
                <span>Active Goals Tracking</span>
                <span className="font-mono">{goals.length}</span>
              </div>
              {goals.length === 0 ? (
                <div className="text-app-text-secondary/70 text-center py-2 bg-app-surface/20 rounded border border-app-border/40">
                  No active long-term goals.
                </div>
              ) : (
                <div className="space-y-2">
                  {goals.slice(0, 2).map(goal => (
                    <div key={goal.id} className="bg-app-surface/40 p-2.5 rounded-lg border border-app-border">
                      <div className="flex justify-between text-[11px] mb-1 text-app-text-primary">
                        <span className="truncate max-w-[120px] font-medium">{goal.title}</span>
                        <span className="font-mono text-brand-indigo">{goal.progress}%</span>
                      </div>
                      <div className="w-full bg-app-elevated h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-brand-indigo to-brand-violet h-full rounded-full transition-all duration-500"
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
