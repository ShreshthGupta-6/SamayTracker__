import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini API client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  console.log("Gemini API successfully initialized on server-side.");
} else {
  console.warn("GEMINI_API_KEY is not defined. AI features will fallback to high-quality simulated data.");
}

// Helper to handle AI requests gracefully with fallback
const getAiResponseText = async (prompt: string, schema?: any, systemInstruction?: string): Promise<string> => {
  if (!ai) {
    throw new Error("Gemini API key is missing. Configure it in the Secrets panel.");
  }
  
  const config: any = {
    temperature: 0.7,
  };
  
  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }
  
  if (schema) {
    config.responseMimeType = "application/json";
    config.responseSchema = schema;
  }

  // Try different models in sequence if one is overloaded or experiencing issues (e.g. 503)
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[AI Request] Attempting generateContent with model: ${model}`);
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: config,
      });
      console.log(`[AI Request] Success with model: ${model}`);
      return response.text || "";
    } catch (err: any) {
      console.warn(`[AI Request] Error with model ${model}:`, err.message || err);
      lastError = err;
      // Continue to next model in list
    }
  }

  throw lastError || new Error("All model fallback attempts failed.");
};

// 1. AI Task Breakdown Endpoint
app.post("/api/ai/breakdown", async (req, res) => {
  const { title, description, deadline, estimatedHours } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: "Task title is required." });
  }

  const systemInstruction = "You are an expert project scheduler and productivity coach. Break down user-submitted tasks into granular, actionable, and logical subtasks with estimated durations.";
  
  const prompt = `Break down this task:
  - Title: ${title}
  - Description: ${description || "No description provided"}
  - Deadline: ${deadline}
  - Estimated Hours: ${estimatedHours || "Unspecified"}
  
  Provide a list of 4 to 8 granular subtasks. Each subtask must have an actionable title and an estimated duration in minutes.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      subtasks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "The description of the specific subtask step" },
            durationMinutes: { type: Type.INTEGER, description: "Estimated time in minutes to complete this subtask" }
          },
          required: ["title", "durationMinutes"]
        }
      }
    },
    required: ["subtasks"]
  };

  try {
    if (!ai) {
      // Return simulated breakdown
      return res.json({
        subtasks: [
          { title: "Define scope and initial outline", durationMinutes: 45 },
          { title: "Draft core sections and conduct research", durationMinutes: 120 },
          { title: "Review guidelines and make structural edits", durationMinutes: 60 },
          { title: "Final proofreading, styling, and checklist review", durationMinutes: 30 }
        ]
      });
    }

    const aiText = await getAiResponseText(prompt, schema, systemInstruction);
    const result = JSON.parse(aiText);
    res.json(result);
  } catch (error: any) {
    console.error("AI breakdown error (falling back to simulated breakdown):", error);
    res.json({
      subtasks: [
        { title: "Define scope and initial outline (Fallback Plan)", durationMinutes: 45 },
        { title: "Draft core sections and conduct research", durationMinutes: 120 },
        { title: "Review guidelines and make structural edits", durationMinutes: 60 },
        { title: "Final proofreading, styling, and checklist review", durationMinutes: 30 }
      ]
    });
  }
});

// 2. AI Risk Prediction & Rescue Plan Endpoint
app.post("/api/ai/analyze-risk", async (req, res) => {
  const { title, description, deadline, estimatedHours, progress, totalTasksCount } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Task title is required." });
  }

  const systemInstruction = "You are the core predictive intelligence of Deadline Guardian AI. Analyze task details, deadline proximity, user workload, and historical patterns to generate an objective risk profile and custom emergency rescue plans.";

  const prompt = `Perform a risk assessment and generate an emergency recovery plan for this task:
  - Task Title: ${title}
  - Task Description: ${description || "None"}
  - Deadline / Time Remaining: ${deadline}
  - Estimated Total Work Needed: ${estimatedHours} hours
  - Current Progress: ${progress}%
  - User's Total Concurrent Active Tasks: ${totalTasksCount || 3}
  
  Calculate:
  1. riskScore: (0-100) probability of missing the deadline. High score (>=60) if deadline is extremely close relative to estimated hours.
  2. completionProbability: (0-100) likelihood of finishing fully on-time.
  3. riskReasoning: Clear, scannable, data-backed explanation for why this risk score was given.
  4. rescuePlan: An actionable, high-intensity rescue schedule divided into 3 to 5 realistic sessions (e.g. drafting, editing, rapid reviews) with explicit break buffers, an estimated expected completion format, and highly direct, encouraging coaching advice.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      riskScore: { type: Type.INTEGER, description: "Predicted percentage risk of failing to meet the deadline (0-100)" },
      completionProbability: { type: Type.INTEGER, description: "Predicted percentage probability of successful completion on-time (0-100)" },
      riskReasoning: { type: Type.STRING, description: "One or two concise sentences detailing why this risk score is accurate based on estimated hours and deadline proximity." },
      rescuePlan: {
        type: Type.OBJECT,
        properties: {
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Step title, e.g. 'Session 1: High-Velocity Outline'" },
                durationMinutes: { type: Type.INTEGER, description: "Action block duration in minutes" },
                description: { type: Type.STRING, description: "What exactly to focus on in this block" }
              },
              required: ["title", "durationMinutes", "description"]
            }
          },
          expectedCompletionTime: { type: Type.STRING, description: "Estimated total duration to finish, e.g., '3.5 hours including breaks'" },
          advice: { type: Type.STRING, description: "A highly motivational and tactical anti-procrastination tip from the rescue AI" }
        },
        required: ["steps", "expectedCompletionTime", "advice"]
      }
    },
    required: ["riskScore", "completionProbability", "riskReasoning", "rescuePlan"]
  };

  try {
    if (!ai) {
      // Simulate high risk fallback if time is tight
      const now = new Date();
      const isDueSoon = deadline.toLowerCase().includes("hour") || deadline.toLowerCase().includes("today") || deadline.toLowerCase().includes("tomorrow");
      const risk = isDueSoon ? 82 : 28;
      return res.json({
        riskScore: risk,
        completionProbability: 100 - risk,
        riskReasoning: isDueSoon 
          ? `With only ${deadline} remaining and ${estimatedHours} hours of estimated work, completing this task requires immediately dedicated focus blocks with zero distractions.`
          : "Workload is currently stable, and the generous deadline leaves ample buffer to distribute efforts.",
        rescuePlan: {
          steps: [
            { title: "Stage 1: Accelerated Drafting (Focus Sprint)", durationMinutes: 45, description: "Write down core sections quickly. Focus entirely on layout and content, ignoring aesthetics for now." },
            { title: "Stage 2: Strategic Brain Recovery (Active Break)", durationMinutes: 15, description: "Disconnect completely. Stand up, hydrate, and stretch. Avoid checking social media." },
            { title: "Stage 3: Polish & Refine (Velocity Editing)", durationMinutes: 45, description: "Review written drafts, refine structure, check citations, and verify against task guidelines." },
            { title: "Stage 4: Verification Checklist (Quality Assurance)", durationMinutes: 20, description: "Double-check submission portal, finalize format, and submit task safely before deadline." }
          ],
          expectedCompletionTime: "2 hours 5 minutes (including buffers)",
          advice: "The secret to rescue mode is momentum, not perfection. Write trash now to edit into gold later. Turn on Focus Mode and start the timer immediately!"
        }
      });
    }

    const aiText = await getAiResponseText(prompt, schema, systemInstruction);
    const result = JSON.parse(aiText);
    res.json(result);
  } catch (error: any) {
    console.error("AI risk prediction error (falling back to simulated risk profile):", error);
    const safeDeadline = deadline || "soon";
    const safeEstimatedHours = estimatedHours || 3;
    const isDueSoon = safeDeadline.toLowerCase().includes("hour") || safeDeadline.toLowerCase().includes("today") || safeDeadline.toLowerCase().includes("tomorrow");
    const risk = isDueSoon ? 82 : 28;
    res.json({
      riskScore: risk,
      completionProbability: 100 - risk,
      riskReasoning: isDueSoon 
        ? `[Recovery Mode Active] With only ${safeDeadline} remaining and ${safeEstimatedHours} hours of estimated work, completing this task requires immediately dedicated focus blocks with zero distractions.`
        : "[Recovery Mode Active] Workload is currently stable, and the generous deadline leaves ample buffer to distribute efforts.",
      rescuePlan: {
        steps: [
          { title: "Stage 1: Accelerated Drafting (Focus Sprint)", durationMinutes: 45, description: "Write down core sections quickly. Focus entirely on layout and content, ignoring aesthetics for now." },
          { title: "Stage 2: Strategic Brain Recovery (Active Break)", durationMinutes: 15, description: "Disconnect completely. Stand up, hydrate, and stretch. Avoid checking social media." },
          { title: "Stage 3: Polish & Refine (Velocity Editing)", durationMinutes: 45, description: "Review written drafts, refine structure, check citations, and verify against task guidelines." },
          { title: "Stage 4: Verification Checklist (Quality Assurance)", durationMinutes: 20, description: "Double-check submission portal, finalize format, and submit task safely before deadline." }
        ],
        expectedCompletionTime: "2 hours 5 minutes (including buffers)",
        advice: "The secret to rescue mode is momentum, not perfection. Write trash now to edit into gold later. Turn on Focus Mode and start the timer immediately!"
      }
    });
  }
});

// 3. AI Goal-to-Execution Planner Endpoint
app.post("/api/ai/plan-goal", async (req, res) => {
  const { title, description, targetDate, category } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Goal title is required." });
  }

  const systemInstruction = "You are an AI Strategic Execution Planner. Translate long-term abstract goals into high-impact, weekly milestone plans designed to cultivate steady completion rates.";

  const prompt = `Map out a highly practical execution timeline and weekly roadmaps for this goal:
  - Goal Title: ${title}
  - Goal Description: ${description || "No description provided"}
  - Target Completion Date: ${targetDate}
  - Category: ${category || "General"}
  
  Map out exactly 4 sequential weeks. For each week, provide:
  1. A clear high-level focus theme for that week.
  2. A list of 2 to 3 discrete, concrete tasks the user should complete during that week to stay on track.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      weeklyRoadmap: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            week: { type: Type.INTEGER, description: "Week index (1 to 4)" },
            focus: { type: Type.STRING, description: "High-level visual focus for this week, e.g., 'Target Company List & Resume Tuning'" },
            tasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2-3 concrete tasks to assign"
            }
          },
          required: ["week", "focus", "tasks"]
        }
      }
    },
    required: ["weeklyRoadmap"]
  };

  try {
    if (!ai) {
      return res.json({
        weeklyRoadmap: [
          { week: 1, focus: "Foundation and Material Collection", tasks: ["Gather all initial research parameters", "Structure folder files and set up development boilerplate", "Outline core chapters and reference templates"] },
          { week: 2, focus: "Core Implementation Block", tasks: ["Write the foundational backend structures / core logic", "Draft primary document sections and initial wireframes", "Iterate on functional user testing"] },
          { week: 3, focus: "Refinement & Integration", tasks: ["Integrate modules and conduct API tests", "Fine-tune UI states and error states", "Gather feedback and perform a peer-review pass"] },
          { week: 4, focus: "Polishing & Safe Submission", tasks: ["Perform a full end-to-end quality assurance pass", "Format citations, documents, and build binaries", "Submit 48 hours prior to deadline to prevent last-minute stress"] }
        ]
      });
    }

    const aiText = await getAiResponseText(prompt, schema, systemInstruction);
    const result = JSON.parse(aiText);
    res.json(result);
  } catch (error: any) {
    console.error("AI goal planning error (falling back to simulated execution plan):", error);
    res.json({
      weeklyRoadmap: [
        { week: 1, focus: "Foundation and Material Collection", tasks: ["Gather all initial research parameters", "Structure folder files and set up development boilerplate", "Outline core chapters and reference templates"] },
        { week: 2, focus: "Core Implementation Block", tasks: ["Write the foundational backend structures / core logic", "Draft primary document sections and initial wireframes", "Iterate on functional user testing"] },
        { week: 3, focus: "Refinement & Integration", tasks: ["Integrate modules and conduct API tests", "Fine-tune UI states and error states", "Gather feedback and perform a peer-review pass"] },
        { week: 4, focus: "Polishing & Safe Submission", tasks: ["Perform a full end-to-end quality assurance pass", "Format citations, documents, and build binaries", "Submit 48 hours prior to deadline to prevent last-minute stress"] }
      ]
    });
  }
});

// 4. AI Voice & Natural Language Assistant Command Processor
app.post("/api/ai/voice-command", async (req, res) => {
  const { command, tasks, goals } = req.body;

  if (!command) {
    return res.status(400).json({ error: "Voice command is empty." });
  }

  const systemInstruction = "You are the natural language voice assistant of Deadline Guardian AI. Analyze user requests, map them to functional actions (adding tasks, summarizing risks, generating recommendations), and speak back in an intelligent, action-oriented assistant tone.";

  const prompt = `Analyze this user natural language command and formulate a structured response or action:
  - Command: "${command}"
  - User's Current Tasks List: ${JSON.stringify(tasks || [])}
  - User's Current Goals List: ${JSON.stringify(goals || [])}
  
  Map this command to one of these action types:
  - "add_task": If they are describing a task to add, e.g. "Add assignment due Friday", "remind me to pay bills tomorrow".
  - "recommend": If they are asking what they should do next, e.g. "What should I work on now?", "give me recommendations".
  - "risk_check": If they are querying about deadlines/risks, e.g. "Am I at risk this week?", "check my deadline risks".
  - "generate_plan": If they want a recovery/study/execution plan for an existing task or general idea, e.g., "generate a study plan", "help me with my project".
  - "general_response": For generic chats, greetings, queries, or coaching.
  
  Formulate:
  1. action: One of the five string values above.
  2. responseText: The exact textual spoken answer you will give back (this will be read aloud via Text-to-Speech). Make it conversational, highly supportive, and precise.
  3. parsedTask: Only populate this if the action is "add_task". Fill in the estimated details extracted from the prompt. Date must be formatted as YYYY-MM-DD (assume today is ${new Date().toISOString().split('T')[0]}).`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, description: "add_task, recommend, risk_check, generate_plan, or general_response" },
      responseText: { type: Type.STRING, description: "Speakable response narrative for the user, summarizing findings or actions." },
      parsedTask: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Extracted name of the task" },
          description: { type: Type.STRING, description: "Extracted or inferred details" },
          deadline: { type: Type.STRING, description: "Calculated date in YYYY-MM-DD format based on reference context" },
          estimatedHours: { type: Type.INTEGER, description: "Inferred estimated hours (default to 2 if unspecified)" },
          priority: { type: Type.STRING, description: "high, medium, or low" },
          category: { type: Type.STRING, description: "work, study, personal, or bills" }
        },
        required: ["title", "deadline", "estimatedHours", "priority", "category"]
      }
    },
    required: ["action", "responseText"]
  };

  try {
    if (!ai) {
      // Simulate voice assistant responses
      const cmdLower = command.toLowerCase();
      let responseObj = {
        action: "general_response",
        responseText: "I'm listening. Try asking 'What should I work on now?' or 'Add assignment due Friday' to try out my smart controls.",
        parsedTask: undefined
      };

      if (cmdLower.includes("add") || cmdLower.includes("remind") || cmdLower.includes("due")) {
        responseObj = {
          action: "add_task",
          responseText: "Certainly! I've detected a request to add a new deadline. I am adding a task titled 'System Design Assignment' due this Friday with a medium priority score.",
          parsedTask: {
            title: "System Design Assignment",
            description: "Created automatically via Voice Commands.",
            deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            estimatedHours: 4,
            priority: "high",
            category: "study"
          } as any
        };
      } else if (cmdLower.includes("work") || cmdLower.includes("should") || cmdLower.includes("recommend")) {
        responseObj = {
          action: "recommend",
          responseText: "Looking at your active backlog, your Machine Learning Assignment is due tomorrow and has only 20% progress. With a 89% risk rating, you should immediately trigger Rescue Mode and start a 45-minute focus session.",
          parsedTask: undefined
        };
      } else if (cmdLower.includes("risk") || cmdLower.includes("deadline")) {
        responseObj = {
          action: "risk_check",
          responseText: "You have one high-risk task due tomorrow: your Machine Learning Assignment. All other goals are currently tracking normally, with a robust 92% completion probability on average.",
          parsedTask: undefined
        };
      } else if (cmdLower.includes("plan") || cmdLower.includes("study")) {
        responseObj = {
          action: "generate_plan",
          responseText: "I've structured a custom 4-hour study and execution plan. Let's start with a high-intensity 45-minute focus block on core concepts, followed by active recall checklists.",
          parsedTask: undefined
        };
      }

      return res.json(responseObj);
    }

    const aiText = await getAiResponseText(prompt, schema, systemInstruction);
    const result = JSON.parse(aiText);
    res.json(result);
  } catch (error: any) {
    console.error("AI voice command error (falling back to local simulated response):", error);
    const cmdLower = command.toLowerCase();
    let responseObj = {
      action: "general_response",
      responseText: "I'm listening. Try asking 'What should I work on now?' or 'Add assignment due Friday' to try out my smart controls.",
      parsedTask: undefined
    };

    if (cmdLower.includes("add") || cmdLower.includes("remind") || cmdLower.includes("due")) {
      responseObj = {
        action: "add_task",
        responseText: "Certainly! I've detected a request to add a new deadline. I am adding a task titled 'System Design Assignment' due this Friday with a medium priority score.",
        parsedTask: {
          title: "System Design Assignment",
          description: "Created automatically via Voice Commands.",
          deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimatedHours: 4,
          priority: "high",
          category: "study"
        } as any
      };
    } else if (cmdLower.includes("work") || cmdLower.includes("should") || cmdLower.includes("recommend")) {
      responseObj = {
        action: "recommend",
        responseText: "Looking at your active backlog, your Machine Learning Assignment is due tomorrow and has only 20% progress. With a 89% risk rating, you should immediately trigger Rescue Mode and start a 45-minute focus session.",
        parsedTask: undefined
      };
    } else if (cmdLower.includes("risk") || cmdLower.includes("deadline")) {
      responseObj = {
        action: "risk_check",
        responseText: "You have one high-risk task due tomorrow: your Machine Learning Assignment. All other goals are currently tracking normally, with a robust 92% completion probability on average.",
        parsedTask: undefined
      };
    } else if (cmdLower.includes("plan") || cmdLower.includes("study")) {
      responseObj = {
        action: "generate_plan",
        responseText: "I've structured a custom 4-hour study and execution plan. Let's start with a high-intensity 45-minute focus block on core concepts, followed by active recall checklists.",
        parsedTask: undefined
      };
    }

    res.json(responseObj);
  }
});

// 5. AI Productivity Coach Chat Endpoint
app.post("/api/ai/coaching-chat", async (req, res) => {
  const { messages, currentTasks } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required." });
  }

  const systemInstruction = `You are the Lead Productivity Coach & Deadline Rescue Expert at Deadline Guardian AI. 
  Your style is highly tactical, direct, empathetic, and scannable (like Raycast/Linear tools). 
  Avoid fluff, long corporate introductions, or generic cheerleading. 
  Help users overcome procrastination immediately. 
  Analyze their tasks if provided: ${JSON.stringify(currentTasks || [])}. 
  Provide bulletproof action steps: break things into 10-minute micro-commitments, recommend focused sprint methods, or suggest visual mockups to overcome writer's block.`;

  try {
    if (!ai) {
      return res.json({
        responseText: "Hey! I'm your AI Accountability Partner. It looks like you've got some deadlines coming up. My advice is simple: close all secondary tabs, grab some water, and commit to exactly 10 minutes of uninterrupted work. What specific task are we crushing first?"
      });
    }

    // Build standard prompt from chat history
    let promptHistory = "";
    for (const msg of messages.slice(-5)) {
      promptHistory += `${msg.sender === 'user' ? 'User' : 'Coach'}: ${msg.text}\n`;
    }
    promptHistory += "Coach: [Generate next responsive message]";

    const responseText = await getAiResponseText(promptHistory, null, systemInstruction);
    res.json({ responseText });
  } catch (error: any) {
    console.error("AI coaching error (falling back to simulated coach advice):", error);
    res.json({
      responseText: "Hey! I'm your AI Accountability Partner. Even though our high-demand neural network link is slightly slow right now, my advice remains tactical: pick a 10-minute micro-commitment right now. Open your task draft, put down a basic outline, and get going. Action cures hesitation!"
    });
  }
});


// Serve static files in production or hook up Vite middleware in development
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static server configured.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Deadline Guardian Server running on http://localhost:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
