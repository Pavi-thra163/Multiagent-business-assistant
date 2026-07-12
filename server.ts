import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON parse parsing
app.use(express.json());

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// ----------------------------------------------------
// LOCAL JSON DATABASE SETUP (Simulating MySQL server-side)
// ----------------------------------------------------
const DB_PATH = path.join(process.cwd(), "db.json");

interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}

interface Task {
  id: string;
  userId: string;
  prompt: string;
  status: "pending" | "researching" | "planning" | "coding" | "testing" | "documenting" | "completed" | "failed";
  createdAt: string;
  researchResult?: string;
  planningResult?: string;
  codingResult?: string;
  testingResult?: string;
  documentationResult?: string;
  finalReport?: string;
}

interface Database {
  users: User[];
  tasks: Task[];
}

function initDb(): Database {
  if (!fs.existsSync(DB_PATH)) {
    const defaultDb: Database = {
      users: [],
      tasks: [
        {
          id: "task-sample-1",
          userId: "sample-user-id",
          prompt: "Create an Inventory Management System",
          status: "completed",
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
          researchResult: `### Technology Recommendation
* **Frontend**: React 19 + Tailwind CSS for a modern, fluid user experience.
* **Backend**: Node.js + Express + TypeScript, leveraging a RESTful design.
* **Database**: PostgreSQL for robust transactional inventory records.
* **Cache**: Redis for rapid lookup of frequent item queries.

### Project Scope & Requirements
1. **Real-time Inventory Tracking**: Direct alerts on stock depletion.
2. **Supplier Directory**: Relational linkage between items and providers.
3. **Analytics Dashboard**: Weekly usage trends and shrinkage metrics.

### Estimated Complexity
* **Rating**: Medium
* **Effort**: 3-4 Weeks for single developer core milestone release.`,
          planningResult: `### Project Timeline (4-Week Agile plan)
* **Phase 1: Database & API Setup (Week 1)**: Provision PostgreSQL, set up core Express routes, design schema for Items, Orders, and Suppliers.
* **Phase 2: Authentication & Core Inventory UI (Week 2)**: Standard JWT login, dashboard statistics, item creation/update forms.
* **Phase 3: Search, Alerts & Report Exports (Week 3)**: Implement full-text search, automatic email alerts for low-stock items, export CSV reports.
* **Phase 4: QA, Testing, & Production Deployment (Week 4)**: Run integration test suites, configure Docker container files, deploy to Cloud Run.

### Risk Analysis
* **Risk 1 (Data loss on high concurrency)**: Mitigation: Add locking mechanism to transactions.
* **Risk 2 (Supply chain delays)**: Mitigation: Mock supplier alerts for offline fallback.`,
          codingResult: `### Folder Structure
\`\`\`
/src
  /controllers     # Request handers
  /models          # Database schema models
  /routes          # API endpoints router
  /middleware      # JWT auth, validation
  /config          # DB connections
  server.ts        # Express entry
\`\`\`

### Database Schema Design
* **users**: id (PK), email, password_hash, role
* **items**: id (PK), name, sku (unique), quantity, min_limit, supplier_id (FK)
* **suppliers**: id (PK), name, contact_email

### Core REST API
* \`GET /api/inventory\` - List all inventory items
* \`POST /api/inventory\` - Add new item to stock
* \`PUT /api/inventory/:id\` - Modify stock levels
* \`GET /api/suppliers\` - List supplier directory`,
          testingResult: `### Core Test Cases
1. **Verify Stock Depletion Threshold**:
   * *Input*: Stock item reduced to 2 (limit is 5).
   * *Expected Result*: low-stock alert triggered immediately.
2. **Ensure SKU Uniqueness**:
   * *Input*: Try creating two items with SKU \`INV-001\`.
   * *Expected Result*: API rejects with 409 Conflict.

### Vulnerability & Edge Cases
* **SQL Injection**: Use query parameterized inputs or ORM.
* **Negative Stock Level**: Reject input values < 0 at schema validator level.`,
          documentationResult: `# Inventory Management System README
## Installation Setup
1. Clone repository: \`git clone ...\`
2. Install dependencies: \`npm install\`
3. Set environment variables: \`PORT=3000\`, \`DATABASE_URL=...\`
4. Start development server: \`npm run dev\`

## Deployment Guide
* Build Docker Image: \`docker build -t inventory-app .\`
* Push to registry and release on Cloud Run.`,
          finalReport: `# EXECUTIVE SUMMARY REPORT: Inventory Management System
**Prepared by**: Manager Agent

## Project Overview
This report contains the aggregated planning, architectural guidelines, development roadmaps, and testing specifications for the **Inventory Management System**. By distributing key tasks across specialized agents (Research, Planning, Coding, Testing, and Documentation), we ensure a highly cohesive, secure, and modern design framework.

## Key Outcomes
* **Architecture**: A secure multi-tier REST API architecture leveraging PostgreSQL.
* **Project Roadmap**: A 4-week Agile development sprint split into clean milestones.
* **Security & Testing**: Built-in protection against SQL injection, parameterized input validation, and automatic threshold notifications.
* **Operational readiness**: Complete guide for developers with pre-packaged documentation and installation instructions.`
        }
      ]
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2), "utf-8");
    return defaultDb;
  }
  try {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database file, resetting database:", error);
    return { users: [], tasks: [] };
  }
}

function writeDb(db: Database) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing to database file:", error);
  }
}

// ----------------------------------------------------
// PASSWORD UTILITIES & SECURITY
// ----------------------------------------------------
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "salt123").digest("hex");
}

function generateToken(user: User): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ id: user.id, email: user.email, name: user.name, exp: Date.now() + 3600000 * 24 })).toString("base64url");
  const signature = crypto.createHmac("sha256", "my-agent-secret").update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

function verifyToken(token: string): { id: string; email: string; name: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expectedSignature = crypto.createHmac("sha256", "my-agent-secret").update(`${header}.${payload}`).digest("base64url");
    if (signature !== expectedSignature) return null;
    
    const decodedPayload = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    if (Date.now() > decodedPayload.exp) return null; // Token expired
    return { id: decodedPayload.id, email: decodedPayload.email, name: decodedPayload.name };
  } catch {
    return null;
  }
}

// Authentication Middleware
function authenticate(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token" });
  }
  const token = authHeader.substring(7);
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: "Invalid or expired session token" });
  }
  req.user = user;
  next();
}

// ----------------------------------------------------
// AUTHENTICATION APIs
// ----------------------------------------------------
app.post("/api/auth/register", (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "All fields (email, password, name) are required" });
  }
  
  const db = initDb();
  if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: "Email already registered" });
  }

  const newUser: User = {
    id: "user-" + crypto.randomUUID(),
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    name,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  writeDb(db);

  const token = generateToken(newUser);
  res.status(201).json({
    message: "Registration successful",
    token,
    user: { id: newUser.id, email: newUser.email, name: newUser.name }
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const db = initDb();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = generateToken(user);
  res.json({
    message: "Login successful",
    token,
    user: { id: user.id, email: user.email, name: user.name }
  });
});

app.get("/api/auth/profile", authenticate, (req: any, res) => {
  res.json({ user: req.user });
});

// ----------------------------------------------------
// AGENT EXECUTION LOGIC (GEMINI CALLS)
// ----------------------------------------------------

async function runAgent(prompt: string, roleInstruction: string, taskDescription: string): Promise<string> {
  if (!ai) {
    // Return a beautiful mock description if GEMINI_API_KEY is not configured yet
    return `### [Offline Mode - Key Not Configured]
AI response is simulated because the Google Gemini API Key is missing from secrets. Add GEMINI_API_KEY to your Secrets panel for real-time live generation.

### Simulation of ${taskDescription} Output
* **Summary**: Standard template output for prompt: "${prompt}".
* **Key Guidelines**:
  1. Adhere to modular architecture.
  2. Implement proper logging and authentication mechanisms.
  3. Validate input streams to avoid code vulnerabilities.
  
* **Recommended Next Steps**: Register an API key in Google AI Studio to unlock full, automated multi-agent reasoning.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Subject Project Focus: "${prompt}"\n\nTask: ${taskDescription}`,
      config: {
        systemInstruction: roleInstruction,
        temperature: 0.2,
      },
    });
    return response.text || "No response received from agent.";
  } catch (error: any) {
    console.error(`Error in Gemini Agent execution [${taskDescription}]:`, error);
    return `### Error executing agent
Failed to reach Gemini API. Details: ${error.message || error}`;
  }
}

// Prompts definitions for LangChain4j-style specialized agents
const RESEARCH_INSTRUCTION = `You are an expert Research Agent. Your sole responsibility is to analyze business project requests and provide complete architectural recommendations.
For any project requested:
1. Recommend the complete technology stack (Frontend, Backend, Database, Caching).
2. Outline the Project Scope and key functional modules.
3. Assess the Estimated Technical Complexity and development effort required.
Format your response using clear Markdown with professional typography headings. No general greeting text, write only the structured technical response.`;

const PLANNING_INSTRUCTION = `You are an expert Planning Agent. Your sole responsibility is to design standard project timelines and project roadmaps.
For any project requested:
1. Provide a detailed Project Timeline split into logical phases (e.g., Week-by-Week or Month-by-Month).
2. Define core Milestones and deliverables.
3. List explicit task breakdowns.
4. Perform a Risk Analysis detailing potential technical challenges and mitigation strategies.
Format your response using clear Markdown with professional headings. No general greeting text.`;

const CODING_INSTRUCTION = `You are an expert Software Architecture and Coding Agent. Your sole responsibility is to suggest the software codebase structure and design details.
For any project requested:
1. Provide a clean, modular folder directory structure suited for the recommended stack.
2. Design the database schema (SQL table structure with relationships, Primary Keys, Foreign Keys, index strategies).
3. Outline the key REST APIs (HTTP method, endpoint path, description, request/response structures).
4. Outline coding standards and development guidelines.
Format your response using clear Markdown. Use code blocks for directories and tables for schema/APIs where possible. No greeting text.`;

const TESTING_INSTRUCTION = `You are an expert Quality Assurance and Testing Agent. Your sole responsibility is to compile testing plans and edge case reviews.
For any project requested:
1. Generate exhaustive Test Cases with inputs, preconditions, and expected outcomes.
2. Outline potential software bugs and performance bottlenecks.
3. Detail critical validation rules and input boundaries.
4. Highlight security validation checks (e.g., OWASP top 10 controls, sanitizations).
Format your response using clean Markdown. No greeting text.`;

const DOCUMENTATION_INSTRUCTION = `You are an expert Technical Writer and Documentation Agent. Your sole responsibility is to author final software manuals and installation guides.
For any project requested:
1. Create a detailed README.md outline.
2. Provide precise, step-by-step installation instructions for developers.
3. Include standard API usage summaries.
4. Write a deployment guide suited for cloud scaling (Docker, environments, etc).
Format your response using clean Markdown. No greeting text.`;

const MANAGER_INSTRUCTION = `You are the Manager Agent. Your role is to orchestrate specialized agents and compile a comprehensive, final executive business summary.
You will receive the original project request and the compiled technical recommendations from the Research, Planning, Coding, Testing, and Documentation agents.
Your task is to:
1. Write a professional executive project summary of the compiled business plan.
2. Consolidate the main highlights from each of the specialized agents into a unified, executive-ready master project report.
Format your response as a pristine, cohesive, and structured corporate specification document using clear Markdown headings.`;

// ----------------------------------------------------
// INDIVIDUAL AGENT ENDPOINTS
// ----------------------------------------------------
app.post("/api/agent/research", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });
  const result = await runAgent(prompt, RESEARCH_INSTRUCTION, "Researching technical specifications and stack recommendations");
  res.json({ result });
});

app.post("/api/agent/planning", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });
  const result = await runAgent(prompt, PLANNING_INSTRUCTION, "Developing timeline, milestones, and risk mitigations");
  res.json({ result });
});

app.post("/api/agent/coding", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });
  const result = await runAgent(prompt, CODING_INSTRUCTION, "Creating folder structure, database schema, and REST API specification");
  res.json({ result });
});

app.post("/api/agent/testing", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });
  const result = await runAgent(prompt, TESTING_INSTRUCTION, "Compiling test cases, QA validation boundaries, and security rules");
  res.json({ result });
});

app.post("/api/agent/documentation", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });
  const result = await runAgent(prompt, DOCUMENTATION_INSTRUCTION, "Authoring user manual, deployment guides, and installation docs");
  res.json({ result });
});

// Full Process Agent Execution (Sequential chain)
app.post("/api/agent/full-process", authenticate, async (req: any, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  try {
    const research = await runAgent(prompt, RESEARCH_INSTRUCTION, "Research Agent Stack & Scope analysis");
    const planning = await runAgent(prompt, PLANNING_INSTRUCTION, "Planning Agent Sprint Timeline & Risk analysis");
    const coding = await runAgent(prompt, CODING_INSTRUCTION, "Coding Agent Architecture & Database schemas");
    const testing = await runAgent(prompt, TESTING_INSTRUCTION, "Testing Agent Quality Assurance & Input validations");
    const documentation = await runAgent(prompt, DOCUMENTATION_INSTRUCTION, "Documentation Agent Manuals & Guides");

    // Manager combines them
    const managerPrompt = `Project Request: "${prompt}"\n\n=== RESEARCH AGENT OUTPUT ===\n${research}\n\n=== PLANNING AGENT OUTPUT ===\n${planning}\n\n=== CODING AGENT OUTPUT ===\n${coding}\n\n=== TESTING AGENT OUTPUT ===\n${testing}\n\n=== DOCUMENTATION AGENT OUTPUT ===\n${documentation}`;
    const finalReport = await runAgent(managerPrompt, MANAGER_INSTRUCTION, "Manager Agent Final Executive Report Compilation");

    res.json({
      researchResult: research,
      planningResult: planning,
      codingResult: coding,
      testingResult: testing,
      documentationResult: documentation,
      finalReport
    });
  } catch (error: any) {
    res.status(500).json({ error: "Full process orchestration failed", details: error.message });
  }
});

// ----------------------------------------------------
// TASK HISTORY & CREATION APIs
// ----------------------------------------------------
app.get("/api/tasks", authenticate, (req: any, res) => {
  const db = initDb();
  // Return user's tasks
  const userTasks = db.tasks.filter(t => t.userId === req.user.id || t.userId === "sample-user-id");
  res.json({ tasks: userTasks });
});

app.get("/api/tasks/:id", authenticate, (req: any, res) => {
  const db = initDb();
  const task = db.tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  // Authorization check (allow access to own tasks or sample ones)
  if (task.userId !== req.user.id && task.userId !== "sample-user-id") {
    return res.status(403).json({ error: "Access denied" });
  }
  res.json({ task });
});

app.delete("/api/tasks/:id", authenticate, (req: any, res) => {
  const db = initDb();
  const taskIdx = db.tasks.findIndex(t => t.id === req.params.id);
  if (taskIdx === -1) return res.status(404).json({ error: "Task not found" });
  
  const task = db.tasks[taskIdx];
  if (task.userId !== req.user.id) {
    return res.status(403).json({ error: "Access denied" });
  }

  db.tasks.splice(taskIdx, 1);
  writeDb(db);
  res.json({ message: "Task deleted successfully" });
});

app.post("/api/tasks/create", authenticate, async (req: any, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  const db = initDb();
  const taskId = "task-" + crypto.randomUUID();

  // Create temporary empty record so user knows it started
  const newTask: Task = {
    id: taskId,
    userId: req.user.id,
    prompt,
    status: "researching",
    createdAt: new Date().toISOString()
  };

  db.tasks.push(newTask);
  writeDb(db);

  // Send status update endpoint using basic polling/state matching.
  // We will run the entire multi-agent sequential pipeline in background.
  // Since Express holds connection open or can run async, we run it and update db.json
  // The client can query task status via GET /api/tasks/:id
  runFullPipelineInBackground(taskId, prompt, req.user.id);

  res.status(202).json({
    message: "Multi-Agent task execution initialized",
    taskId,
    status: "researching"
  });
});

async function runFullPipelineInBackground(taskId: string, prompt: string, userId: string) {
  const updateStatus = (status: Task["status"], fields: Partial<Task> = {}) => {
    const db = initDb();
    const t = db.tasks.find(tk => tk.id === taskId);
    if (t) {
      t.status = status;
      Object.assign(t, fields);
      writeDb(db);
    }
  };

  try {
    // 1. Research Agent
    updateStatus("researching");
    const researchResult = await runAgent(prompt, RESEARCH_INSTRUCTION, "Researching Technical Architecture");

    // 2. Planning Agent
    updateStatus("planning", { researchResult });
    const planningResult = await runAgent(prompt, PLANNING_INSTRUCTION, "Designing Timelines & Risks");

    // 3. Coding Agent
    updateStatus("coding", { planningResult });
    const codingResult = await runAgent(prompt, CODING_INSTRUCTION, "Drafting Code Specifications");

    // 4. Testing Agent
    updateStatus("testing", { codingResult });
    const testingResult = await runAgent(prompt, TESTING_INSTRUCTION, "Compiling Test Framework");

    // 5. Documentation Agent
    updateStatus("documenting", { testingResult });
    const documentationResult = await runAgent(prompt, DOCUMENTATION_INSTRUCTION, "Authoring Guides and Manuals");

    // 6. Manager Compilation
    const managerPrompt = `Project Request: "${prompt}"\n\n=== RESEARCH AGENT OUTPUT ===\n${researchResult}\n\n=== PLANNING AGENT OUTPUT ===\n${planningResult}\n\n=== CODING AGENT OUTPUT ===\n${codingResult}\n\n=== TESTING AGENT OUTPUT ===\n${testingResult}\n\n=== DOCUMENTATION AGENT OUTPUT ===\n${documentationResult}`;
    const finalReport = await runAgent(managerPrompt, MANAGER_INSTRUCTION, "Consolidating Agent Deliverables");

    // Final Completion
    updateStatus("completed", {
      researchResult,
      planningResult,
      codingResult,
      testingResult,
      documentationResult,
      finalReport
    });
  } catch (error: any) {
    console.error(`Pipeline execution failed for task ${taskId}:`, error);
    updateStatus("failed", {
      finalReport: `### Executive Execution Failed\nAn error occurred while coordinating agents. Error: ${error.message || error}`
    });
  }
}

// ----------------------------------------------------
// VITE DEV SERVER & PRODUCTION HOSTING CONFIG
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Multi-Agent Business Assistant Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
