import React, { useState, useEffect, useRef } from 'react';
import { Task, RecoveryPlan } from '../types';
import { ShieldAlert, Play, Pause, RotateCcw, AlertOctagon, Sparkles, Brain, CheckSquare, Zap, Loader2, Smile, Lightbulb } from 'lucide-react';

interface RescueViewProps {
  tasks: Task[];
  activeRescueTask: Task | null;
  onUpdateTask: (task: Task) => void;
  onSelectRescueTask: (task: Task | null) => void;
}

export default function RescueView({ tasks, activeRescueTask, onUpdateTask, onSelectRescueTask }: RescueViewProps) {
  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const highRiskTasks = activeTasks.filter(t => t.riskScore >= 60);

  // Focus Clock state
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // AI Rescue Plan Loader
  const [loadingPlan, setLoadingPlan] = useState(false);

  // Procrastination survey state
  const [postponedTask, setPostponedTask] = useState<Task | null>(null);
  const [surveyReason, setSurveyReason] = useState<'difficult' | 'time' | 'motivation' | 'forgot' | null>(null);
  const [aiIntervention, setAiIntervention] = useState<string | null>(null);
  const [loadingIntervention, setLoadingIntervention] = useState(false);

  // Trigger countdown timer
  useEffect(() => {
    if (timerActive) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            // Timer finished
            clearInterval(timerIntervalRef.current!);
            setTimerActive(false);
            const nextMode = timerMode === 'focus' ? 'break' : 'focus';
            setTimerMode(nextMode);
            return nextMode === 'focus' ? 25 * 60 : 5 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerActive, timerMode]);

  // Clock Actions
  const toggleTimer = () => setTimerActive(!timerActive);
  const resetTimer = () => {
    setTimerActive(false);
    setTimerSeconds(timerMode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate real AI Rescue Plan from server
  const generateRescuePlan = async (task: Task) => {
    setLoadingPlan(true);
    try {
      const response = await fetch('/api/ai/analyze-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          deadline: task.deadline,
          estimatedHours: task.estimatedHours,
          progress: task.progress,
          totalTasksCount: activeTasks.length
        })
      });

      const data = await response.json();
      if (data.rescuePlan) {
        onUpdateTask({
          ...task,
          riskScore: data.riskScore ?? task.riskScore,
          completionProbability: data.completionProbability ?? task.completionProbability,
          riskReasoning: data.riskReasoning ?? task.riskReasoning,
          recoveryPlan: {
            steps: data.rescuePlan.steps.map((s: any, idx: number) => ({
              id: `rec-step-${Date.now()}-${idx}`,
              title: s.title,
              durationMinutes: s.durationMinutes,
              description: s.description,
              completed: false
            })),
            expectedCompletionTime: data.rescuePlan.expectedCompletionTime,
            advice: data.rescuePlan.advice
          }
        });
        onSelectRescueTask({
          ...task,
          recoveryPlan: {
            steps: data.rescuePlan.steps.map((s: any, idx: number) => ({
              id: `rec-step-${Date.now()}-${idx}`,
              title: s.title,
              durationMinutes: s.durationMinutes,
              description: s.description,
              completed: false
            })),
            expectedCompletionTime: data.rescuePlan.expectedCompletionTime,
            advice: data.rescuePlan.advice
          }
        });
      }
    } catch (error) {
      console.error("Failed to generate AI rescue plan:", error);
    } finally {
      setLoadingPlan(false);
    }
  };

  // Toggle step completion inside recovery plan
  const handleToggleRecoveryStep = (stepId: string) => {
    if (!activeRescueTask || !activeRescueTask.recoveryPlan) return;

    const updatedSteps = activeRescueTask.recoveryPlan.steps.map(step =>
      step.id === stepId ? { ...step, completed: !step.completed } : step
    );

    const updatedTask = {
      ...activeRescueTask,
      recoveryPlan: {
        ...activeRescueTask.recoveryPlan,
        steps: updatedSteps
      }
    };

    onUpdateTask(updatedTask);
    onSelectRescueTask(updatedTask);
  };

  // Submit Anti-Procrastination Survey
  const submitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postponedTask || !surveyReason) return;

    setLoadingIntervention(true);
    setAiIntervention(null);

    try {
      const systemInstruction = "You are the Anti-Procrastination Intervention bot. Your task is to provide immediate, highly practical, and actionable instructions to break resistance and jumpstart work.";
      
      const reasonsMap = {
        difficult: "The user finds the task too complex, confusing, or feels out of their depth.",
        time: "The user is overwhelmed and feels they have zero time due to schedule overcrowding.",
        motivation: "The user is unmotivated, bored, or dreading the effort involved.",
        forgot: "The user is distracted and simply kept losing track of the task."
      };

      const prompt = `Formulate an anti-procrastination intervention plan for:
      - Task: "${postponedTask.title}"
      - Reason: ${reasonsMap[surveyReason]}
      
      Provide exactly 3 bulletproof step-by-step instructions. Keep your suggestions extremely direct (e.g. "Do a 5-minute typing warmup", "Draft only bullet points in a text editor", "Mute your phone and hide it in a drawer").`;

      // Make call to coach endpoint to generate intervention
      const response = await fetch('/api/ai/coaching-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ sender: 'user', text: prompt }],
          currentTasks: [postponedTask]
        })
      });

      const data = await response.json();
      if (data.responseText) {
        setAiIntervention(data.responseText);
        
        // Update postponement metric
        onUpdateTask({
          ...postponedTask,
          postponementCount: (postponedTask.postponementCount || 0) + 1,
          lastPostponedReason: surveyReason
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingIntervention(false);
    }
  };

  return (
    <div className="space-y-6" id="rescue-viewport">
      {/* Risk Alert Panel */}
      <div className="glass-panel p-6 rounded-2xl glow-purple">
        <h2 className="text-2xl font-display font-bold text-white mb-1 flex items-center gap-2">
          <AlertOctagon className="text-rose-500 w-7 h-7 animate-pulse shrink-0" />
          Active Rescue Center
        </h2>
        <p className="text-xs text-slate-400">
          This hub identifies tasks hovering at near-deadline risk and coordinates hyper-intensity action schedules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: High Risk selection & survey */}
        <div className="space-y-6">
          {/* Risk Backlog */}
          <div className="glass-panel p-5 rounded-2xl border-slate-800 space-y-4">
            <h3 className="text-sm font-display font-semibold text-white border-b border-slate-800 pb-2.5 flex items-center gap-1.5">
              <ShieldAlert className="text-rose-400 w-4 h-4" />
              High Risk Backlog ({highRiskTasks.length})
            </h3>

            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {highRiskTasks.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                  <Smile className="w-8 h-8 text-brand-success/70" />
                  <span>Fantastic! No critical high-risk deadlines detected right now.</span>
                </div>
              ) : (
                highRiskTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => {
                      onSelectRescueTask(task);
                      if (!task.recoveryPlan) {
                        generateRescuePlan(task);
                      }
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                      activeRescueTask?.id === task.id
                        ? 'bg-purple-600/10 border-purple-500/40 text-purple-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-2 mb-1">
                      <span className="font-display font-semibold truncate max-w-[160px] sm:max-w-none">{task.title}</span>
                      <span className="font-mono text-rose-400 font-bold shrink-0">{task.riskScore}% Risk</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Due: {task.deadline}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Anti-Procrastination Intervention Tool */}
          <div className="glass-panel p-5 rounded-2xl border-slate-800 space-y-4">
            <h3 className="text-sm font-display font-semibold text-white border-b border-slate-800 pb-2.5 flex items-center gap-1.5">
              <Brain className="text-cyan-400 w-4 h-4" />
              Anti-Procrastination System
            </h3>

            <form onSubmit={submitSurvey} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">What are you struggling to start?</label>
                <select
                  id="procrastinate-task-select"
                  value={postponedTask?.id || ''}
                  onChange={e => setPostponedTask(tasks.find(t => t.id === e.target.value) || null)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-400 p-2.5 rounded-lg focus:outline-none"
                  required
                >
                  <option value="">-- Choose Task --</option>
                  {activeTasks.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>

              {postponedTask && (
                <div className="space-y-3">
                  <label className="text-[10px] text-slate-400 block">Why are you putting this off?</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      id="reason-difficult-btn"
                      type="button"
                      onClick={() => setSurveyReason('difficult')}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        surveyReason === 'difficult' ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400'
                      }`}
                    >
                      Too complex
                    </button>
                    <button
                      id="reason-time-btn"
                      type="button"
                      onClick={() => setSurveyReason('time')}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        surveyReason === 'time' ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400'
                      }`}
                    >
                      No time
                    </button>
                    <button
                      id="reason-motivation-btn"
                      type="button"
                      onClick={() => setSurveyReason('motivation')}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        surveyReason === 'motivation' ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400'
                      }`}
                    >
                      Low motivation
                    </button>
                    <button
                      id="reason-forgot-btn"
                      type="button"
                      onClick={() => setSurveyReason('forgot')}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        surveyReason === 'forgot' ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400'
                      }`}
                    >
                      Forgot / Distracted
                    </button>
                  </div>

                  <button
                    id="submit-intervention-btn"
                    type="submit"
                    disabled={loadingIntervention || !surveyReason}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 font-display text-xs font-semibold text-white rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {loadingIntervention ? (
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                        Trigger AI Coping Plan
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>

            {/* AI Coping Response block */}
            {aiIntervention && (
              <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/10 text-xs space-y-2 mt-4 animate-fadeIn">
                <div className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  AI Coach Intervention Strategy:
                </div>
                <div className="text-slate-300 whitespace-pre-line leading-relaxed italic text-[11px]">
                  {aiIntervention}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Columns: Active Recovery Plan & Clock */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Recovery Plan checklist */}
            <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-4 min-h-[380px]">
              <div className="border-b border-slate-800 pb-2.5">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-purple-400 block mb-0.5">TARGET ACTIVE PLAN</span>
                <h3 className="text-base font-display font-semibold text-white">
                  {activeRescueTask ? activeRescueTask.title : "No Rescue Selected"}
                </h3>
              </div>

              {loadingPlan ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-xs text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                  Generating custom recovery schedule with Gemini...
                </div>
              ) : activeRescueTask && activeRescueTask.recoveryPlan ? (
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-300 leading-relaxed italic flex items-start gap-2">
                    <Lightbulb className="w-4.5 h-4.5 text-brand-indigo shrink-0 mt-0.5" />
                    <div>
                      <strong>Advisor Advice:</strong> {activeRescueTask.recoveryPlan.advice}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {activeRescueTask.recoveryPlan.steps.map(step => (
                      <div
                        key={step.id}
                        onClick={() => handleToggleRecoveryStep(step.id)}
                        className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 hover:bg-slate-800/40 transition-all cursor-pointer group"
                      >
                        {step.completed ? (
                          <CheckSquare className="w-4.5 h-4.5 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-4.5 h-4.5 border border-slate-700 rounded group-hover:border-slate-500 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-0.5">
                          <span className={`font-semibold font-display text-[11px] ${step.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                            {step.title}
                          </span>
                          <p className="text-[10px] text-slate-400 leading-relaxed">{step.description}</p>
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono ml-auto shrink-0 pt-0.5">
                          {step.durationMinutes}m
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="text-right text-[10px] text-slate-500 font-mono">
                    Expected Completion: <span className="text-purple-400 font-semibold">{activeRescueTask.recoveryPlan.expectedCompletionTime}</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-20 text-slate-500 text-xs gap-3">
                  <Smile className="w-10 h-10 text-slate-600" />
                  <p>Choose an upcoming high-risk task from the backlog on the left to activate emergency recovery structures.</p>
                </div>
              )}
            </div>

            {/* Pomodoro Focus Clock */}
            <div className="glass-panel p-6 rounded-2xl border-slate-800 flex flex-col justify-between text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-cyan-500/10 transition-all"></div>
              
              <div className="border-b border-slate-800 pb-2.5 mb-4 text-left">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-cyan-400 block">COMMITMENT ENGINE</span>
                <h3 className="text-xs font-display text-slate-400">High-Velocity Pomodoro Timer</h3>
              </div>

              {/* Timer Dial Display */}
              <div className="space-y-2 py-4">
                <div className="text-5xl font-mono font-bold text-white tracking-widest block tabular-nums">
                  {formatTime(timerSeconds)}
                </div>
                <span className={`text-[10px] font-mono tracking-wider font-semibold uppercase px-2.5 py-0.5 rounded ${
                  timerMode === 'focus' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {timerMode === 'focus' ? 'Focus Sprint Session' : 'Active Brain Break'}
                </span>
              </div>

              {/* Timer Controls */}
              <div className="flex justify-center items-center gap-4 mt-4">
                <button
                  id="timer-reset-btn"
                  onClick={resetTimer}
                  className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl transition-all cursor-pointer"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  id="timer-play-pause-btn"
                  onClick={toggleTimer}
                  className={`p-4 rounded-full text-white shadow-lg transition-all cursor-pointer ${
                    timerActive 
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20' 
                      : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
                  }`}
                  title={timerActive ? "Pause Timer" : "Start Focus Block"}
                >
                  {timerActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed mt-6">
                Enforcing 25-minute extreme focus intervals locks down cognitive drift and reduces procrastination rates by up to 60%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
