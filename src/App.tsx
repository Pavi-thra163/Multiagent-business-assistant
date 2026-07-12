import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Briefcase, 
  Cpu, 
  Terminal, 
  ShieldCheck, 
  FileText, 
  Sparkles, 
  History, 
  User as UserIcon, 
  FolderGit, 
  LogOut, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Plus, 
  Trash2, 
  Download, 
  FileCode, 
  Play, 
  ExternalLink,
  ChevronRight,
  Database,
  Lock,
  Mail,
  UserCheck,
  Moon,
  Sun,
  LayoutDashboard
} from "lucide-react";
import { jsPDF } from "jspdf";
import { Task, PROMPT_TEMPLATES, User } from "./types";

// Static contents of Java code reference files for display in our visual codebase viewer
const JAVA_FILES: { [key: string]: { name: string; path: string; language: string; content: string } } = {
  "pom": {
    name: "pom.xml",
    path: "/spring-boot-project/pom.xml",
    language: "xml",
    content: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" ...>
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.4</version>
    </parent>
    <artifactId>multi-agent-business-assistant</artifactId>
    <properties>
        <java.version>21</java.version>
        <langchain4j.version>0.30.0</langchain4j.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>dev.langchain4j</groupId>
            <artifactId>langchain4j-google-ai-gemini</artifactId>
            <version>\${langchain4j.version}</version>
        </dependency>
    </dependencies>
</project>`
  },
  "config": {
    name: "WebSecurityConfig.java",
    path: "/src/main/java/.../config/WebSecurityConfig.java",
    language: "java",
    content: `package com.example.multiagent.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class WebSecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/register", "/api/auth/login", "/static/**").permitAll()
                .anyRequest().authenticated()
            );
        return http.build();
    }
}`
  },
  "gemini": {
    name: "GeminiService.java",
    path: "/src/main/java/.../agent/GeminiService.java",
    language: "java",
    content: `package com.example.multiagent.agent;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;

@Service
public class GeminiService {

    @Value("\${gemini.api.key}")
    private String apiKey;

    public String generateContent(String systemInstruction, String prompt) {
        // High-performance robust HTTP Client connecting directly with 
        // Google's generative language API using custom parameters
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;
        ...
    }
}`
  },
  "service": {
    name: "TaskService.java",
    path: "/src/main/java/.../service/TaskService.java",
    language: "java",
    content: `package com.example.multiagent.service;

import com.example.multiagent.entity.Task;
import com.example.multiagent.agent.GeminiService;
import org.springframework.stereotype.Service;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;
    @Autowired
    private GeminiService geminiService;

    public TaskDto executeMultiAgentWorkflow(String userId, String prompt) {
        // Sequentially orchestrates agents: Research, Planning, Coding, Testing, Documentation
        String research = geminiService.generateContent(RESEARCH_PROMPT, prompt);
        String planning = geminiService.generateContent(PLANNING_PROMPT, prompt);
        String coding = geminiService.generateContent(CODING_PROMPT, prompt);
        String testing = geminiService.generateContent(TESTING_PROMPT, prompt);
        String doc = geminiService.generateContent(DOCUMENTATION_PROMPT, prompt);

        // Manager compiles reports
        String summary = geminiService.generateContent(MANAGER_PROMPT, combinedPrompts);
        ...
    }
}`
  },
  "controller": {
    name: "TaskController.java",
    path: "/src/main/java/.../controller/TaskController.java",
    language: "java",
    content: `package com.example.multiagent.controller;

import com.example.multiagent.service.TaskService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class TaskController {

    @Autowired
    private TaskService taskService;

    @PostMapping("/tasks/create")
    public ResponseEntity<TaskDto> createMultiAgentTask(
            @RequestBody Map<String, String> body,
            @RequestHeader("Authorization") String token) {
        String userId = getUserIdFromToken(token);
        TaskDto task = taskService.executeMultiAgentWorkflow(userId, body.get("prompt"));
        return ResponseEntity.accepted().body(task);
    }
}`
  }
};

export default function App() {
  // Auth state
  const [token, setToken] = useState<string>(localStorage.getItem("jwt_token") || "");
  const [user, setUser] = useState<User | null>(null);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  
  // Auth forms
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sidebar / view navigation state
  const [activeView, setActiveView] = useState<"dashboard" | "workspace" | "history" | "codebase" | "profile">("dashboard");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailTab, setDetailTab] = useState<"report" | "research" | "planning" | "coding" | "testing" | "documentation">("report");
  const [codeFileTab, setCodeFileTab] = useState<string>("pom");

  // Core application lists
  const [tasks, setTasks] = useState<Task[]>([]);
  const [promptInput, setPromptInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"info" | "success" | "error">("info");

  // Multi-Agent active timeline visual tracking state
  const [activeWorkflowTaskId, setActiveWorkflowTaskId] = useState<string | null>(null);
  const [timelineStatus, setTimelineStatus] = useState<string>("idle");

  // Dark Mode
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Sync profile details and tasks on mount
  useEffect(() => {
    if (token) {
      fetchProfile();
      fetchTasks();
    }
  }, [token]);

  // Synchronize HTML element dark class for Tailwind v4 compatibility
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Periodic task polling to keep dashboard counters and histories updated
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      fetchTasks();
    }, 5000);
    return () => clearInterval(interval);
  }, [token]);

  // Re-fetch tasks when user navigates to dashboard or history view for immediate data refresh
  useEffect(() => {
    if (token && (activeView === "dashboard" || activeView === "history")) {
      fetchTasks();
    }
  }, [activeView, token]);

  // Toast Utility
  const triggerToast = (msg: string, type: "info" | "success" | "error" = "info") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch Tasks
  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Failed fetching task metrics:", err);
    }
  };

  // Fetch User profile
  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/auth/profile", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        // Token expired/invalid
        handleLogout();
      }
    } catch (err) {
      console.error("Profile sync exception:", err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return triggerToast("Fill all credentials", "error");

    setLoading(true);
    setLoadingText("Signing in securely...");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("jwt_token", data.token);
        setToken(data.token);
        setUser(data.user);
        triggerToast(`Welcome back, ${data.user.name}!`, "success");
      } else {
        triggerToast(data.error || "Login credentials failed", "error");
      }
    } catch (err) {
      triggerToast("Backend connection failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return triggerToast("Fill all registration details", "error");

    setLoading(true);
    setLoadingText("Creating account secure logs...");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("jwt_token", data.token);
        setToken(data.token);
        setUser(data.user);
        triggerToast("Account registered successfully!", "success");
      } else {
        triggerToast(data.error || "Registration rejected", "error");
      }
    } catch (err) {
      triggerToast("Backend connection failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("jwt_token");
    setToken("");
    setUser(null);
    setTasks([]);
    setActiveView("dashboard");
    setSelectedTask(null);
    triggerToast("Logged out successfully", "info");
  };

  // Launch multi-agent pipeline workflow
  const submitWorkflowTask = async () => {
    if (!promptInput.trim()) {
      triggerToast("Input a project idea prompt", "error");
      return;
    }

    setLoading(true);
    setLoadingText("Launching AI Multi-Agent pipeline...");
    setTimelineStatus("researching");

    try {
      const res = await fetch("/api/tasks/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: promptInput })
      });
      const data = await res.json();

      if (res.ok) {
        setActiveWorkflowTaskId(data.taskId);
        
        // Mock timeline progress changes visually since it compiles sequentially
        setTimeout(() => setTimelineStatus("planning"), 4000);
        setTimeout(() => setTimelineStatus("coding"), 8000);
        setTimeout(() => setTimelineStatus("testing"), 12000);
        setTimeout(() => setTimelineStatus("documenting"), 16000);
        setTimeout(() => {
          setTimelineStatus("completed");
          setLoading(false);
          setPromptInput("");
          triggerToast("All agents completed orchestration successfully!", "success");
          fetchTasks();
          setActiveView("history");
        }, 20000);

      } else {
        setLoading(false);
        setTimelineStatus("failed");
        triggerToast(data.error || "Pipeline run rejected", "error");
      }
    } catch (err) {
      setLoading(false);
      setTimelineStatus("failed");
      triggerToast("Network error running multi-agent workflow.", "error");
    }
  };

  // Helper to compute visual status markers for each agent in the matrix based on latest task
  const getAgentStatusProps = (agent: "research" | "planning" | "coding" | "testing" | "documentation") => {
    if (tasks.length === 0) {
      return { label: "IDLE", dotClass: "bg-slate-300 dark:bg-slate-700" };
    }
    const latest = tasks[0];
    const status = latest.status;

    if (status === "failed") {
      return { label: "FAILED", dotClass: "bg-rose-500 animate-pulse" };
    }

    const order = ["researching", "planning", "coding", "testing", "documenting", "completed"];
    const currentIdx = order.indexOf(status);

    let agentIdx = 0;
    if (agent === "research") agentIdx = 0;
    else if (agent === "planning") agentIdx = 1;
    else if (agent === "coding") agentIdx = 2;
    else if (agent === "testing") agentIdx = 3;
    else if (agent === "documentation") agentIdx = 4;

    if (currentIdx === -1) {
      return { label: "IDLE", dotClass: "bg-slate-300 dark:bg-slate-700" };
    }

    if (currentIdx === agentIdx) {
      return { label: "RUNNING", dotClass: "bg-blue-500 animate-ping" };
    } else if (currentIdx > agentIdx) {
      return { label: "COMPLETED", dotClass: "bg-emerald-500 animate-pulse" };
    } else {
      return { label: "QUEUED", dotClass: "bg-slate-400 dark:bg-slate-600 animate-pulse" };
    }
  };

  // Navigate to and open the specific compiled specification on the history tab
  const handleAgentMatrixClick = (tab: "research" | "planning" | "coding" | "testing" | "documentation", agentName: string) => {
    if (tasks.length > 0) {
      const latestTask = tasks[0];
      setSelectedTask(latestTask);
      setDetailTab(tab);
      setActiveView("history");
      triggerToast(`Opened latest task ${agentName} specification report`, "success");
    } else {
      triggerToast("No compiled project specs found. Let's create a new task!", "info");
      setActiveView("workspace");
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm("Delete historical task logs?")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        triggerToast("Task deleted", "success");
        fetchTasks();
        if (selectedTask?.id === taskId) {
          setSelectedTask(null);
        }
      } else {
        triggerToast("Failed deleting log", "error");
      }
    } catch (err) {
      triggerToast("Connection error", "error");
    }
  };

  // PDF Export
  const exportPDF = (task: Task) => {
    const doc = new jsPDF();
    doc.setFont("Helvetica");
    
    // Cover Banner style
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, 210, 45, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("Helvetica", "bold");
    doc.text("AI MULTI-AGENT BUSINESS WORKSPACE", 14, 18);
    
    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(191, 219, 254);
    doc.text("Executive Multi-Agent Specification Report", 14, 26);
    doc.text(`Compiled on: ${new Date(task.createdAt).toLocaleString()}`, 14, 33);

    // Business Prompt
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont("Helvetica", "bold");
    doc.text("ORIGINAL BUSINESS REQUEST PROMPT:", 14, 60);

    doc.setFontSize(10);
    doc.setFont("Helvetica", "italic");
    doc.setTextColor(71, 85, 105);
    const splitPrompt = doc.splitTextToSize(task.prompt, 182);
    doc.text(splitPrompt, 14, 68);

    // Manager summary
    doc.setTextColor(37, 99, 235); // blue-600
    doc.setFontSize(12);
    doc.setFont("Helvetica", "bold");
    doc.text("I. EXECUTIVE SUMMARY (MANAGER AGENT)", 14, 90);

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9.5);
    doc.setFont("Helvetica", "normal");
    const summary = task.finalReport ? task.finalReport.substring(0, 900) + "..." : "Summary pending.";
    const splitSummary = doc.splitTextToSize(summary, 182);
    doc.text(splitSummary, 14, 98);

    // Page 2: Research Details
    doc.addPage();
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(12);
    doc.setFont("Helvetica", "bold");
    doc.text("II. SYSTEM ARCHITECTURE & SCOPE (RESEARCH AGENT)", 14, 20);

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9.5);
    doc.setFont("Helvetica", "normal");
    const research = task.researchResult ? task.researchResult.substring(0, 1600) : "Details pending.";
    const splitResearch = doc.splitTextToSize(research, 182);
    doc.text(splitResearch, 14, 28);

    doc.save(`Business_Specification_${task.id.substring(0, 8)}.pdf`);
    triggerToast("PDF generated and downloaded!", "success");
  };

  // Filter and Search results
  const filteredTasks = tasks.filter(task => 
    task.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Parse custom raw Markdown string representation for React view
  const renderFormattedText = (text: string | undefined) => {
    if (!text) return <p className="text-slate-400 dark:text-slate-500 text-xs">Waiting for agent compilation...</p>;
    
    return (
      <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
        {text.split("\n").map((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith("###")) {
            return (
              <h4 key={idx} className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mt-5 border-l-4 border-blue-500 pl-2">
                {trimmed.replace("###", "").trim()}
              </h4>
            );
          }
          if (trimmed.startsWith("##")) {
            return (
              <h3 key={idx} className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1 mt-6">
                {trimmed.replace("##", "").trim()}
              </h3>
            );
          }
          if (trimmed.startsWith("#")) {
            return (
              <h2 key={idx} className="text-base font-bold text-blue-600 mt-8">
                {trimmed.replace("#", "").trim()}
              </h2>
            );
          }
          if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-4">
                <span className="text-blue-500 mt-1">•</span>
                <p>{trimmed.substring(2)}</p>
              </div>
            );
          }
          if (trimmed.startsWith("```")) {
            return null; // Skip markdown block signs
          }
          if (trimmed.length > 0) {
            return <p key={idx}>{trimmed}</p>;
          }
          return <div key={idx} className="h-2" />;
        })}
      </div>
    );
  };

  // Auth Card screen view
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full relative overflow-hidden"
        >
          {/* Decorative bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 text-xl mb-4">
              <Cpu className="animate-pulse" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight font-display">Multi-Agent Business Assistant</h1>
            <p className="text-gray-400 text-xs mt-1">Enterprise Multi-Agent Orchestration Portal</p>
          </div>

          <div className="flex border-b border-gray-100 mb-6">
            <button 
              onClick={() => setAuthTab("login")} 
              className={`flex-1 pb-3 text-center text-xs font-semibold uppercase tracking-wider ${authTab === "login" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-400"}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setAuthTab("register")} 
              className={`flex-1 pb-3 text-center text-xs font-semibold uppercase tracking-wider ${authTab === "register" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-400"}`}
            >
              Register
            </button>
          </div>

          {authTab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <Mail size={16} />
                  </span>
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required 
                    placeholder="name@company.com" 
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition text-xs text-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <Lock size={16} />
                  </span>
                  <input 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required 
                    placeholder="••••••••" 
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition text-xs text-slate-900"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-xs tracking-wide uppercase hover:bg-blue-700 transition shadow-lg shadow-blue-600/15"
              >
                Sign In Session
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <UserIcon size={16} />
                  </span>
                  <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required 
                    placeholder="Jane Doe" 
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition text-xs text-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <Mail size={16} />
                  </span>
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required 
                    placeholder="name@company.com" 
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition text-xs text-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <Lock size={16} />
                  </span>
                  <input 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required 
                    placeholder="••••••••" 
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition text-xs text-slate-900"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-xs tracking-wide uppercase hover:bg-blue-700 transition shadow-lg shadow-blue-600/15"
              >
                Create Account
              </button>
            </form>
          )}
        </motion.div>
      </div>
    );
  }

  // Loaded full dashboard UI
  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans transition-colors duration-200 ${darkMode ? "dark bg-slate-950 text-slate-100" : "bg-gray-50 text-gray-800"}`}>
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-white text-slate-900 border border-slate-100 shadow-xl rounded-xl text-xs font-medium animate-bounce">
          {toastType === "success" ? <CheckCircle className="text-emerald-500" size={16} /> : toastType === "error" ? <AlertCircle className="text-rose-500" size={16} /> : <Sparkles className="text-blue-500" size={16} />}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Loading overlay for pipeline execution */}
      {loading && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center max-w-sm w-full border border-slate-100">
            <div className="relative w-12 h-12 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
              <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
            </div>
            <p className="text-slate-900 font-bold text-sm tracking-wide">{loadingText}</p>
            <p className="text-slate-400 text-[10px] mt-1 text-center">We are sequentially calling Gemini agents. This may take up to 20 seconds.</p>
          </div>
        </div>
      )}

      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Cpu size={18} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white tracking-wide font-display">Multi-Agent AI</h2>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Executive Suite</span>
            </div>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className="text-slate-400 hover:text-white transition">
            {darkMode ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
          </button>
        </div>

        <nav className="flex-grow p-4 space-y-1">
          <button 
            onClick={() => { setActiveView("dashboard"); setSelectedTask(null); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition uppercase ${activeView === "dashboard" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}
          >
            <LayoutDashboard size={14} className="text-blue-500" /> Dashboard
          </button>
          <button 
            onClick={() => { setActiveView("workspace"); setSelectedTask(null); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition uppercase ${activeView === "workspace" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}
          >
            <Sparkles size={14} className="text-purple-500" /> Create Task
          </button>
          <button 
            onClick={() => { setActiveView("history"); setSelectedTask(null); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition uppercase ${activeView === "history" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}
          >
            <History size={14} className="text-emerald-500" /> Task History
          </button>
          <button 
            onClick={() => { setActiveView("codebase"); setSelectedTask(null); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition uppercase ${activeView === "codebase" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}
          >
            <FolderGit size={14} className="text-indigo-500" /> Java Code Reference
          </button>
          <button 
            onClick={() => { setActiveView("profile"); setSelectedTask(null); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition uppercase ${activeView === "profile" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}
          >
            <UserIcon size={14} className="text-slate-400" /> Profile Space
          </button>
        </nav>

        {/* Sidebar Footer User detail */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold uppercase">
              {user?.name.substring(0, 2) || "JD"}
            </div>
            <div className="overflow-hidden">
              <p className="text-[11px] font-bold text-white truncate">{user?.name || "User Admin"}</p>
              <span className="text-[9px] text-slate-500 block truncate">{user?.email || "admin@example.com"}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="text-slate-500 hover:text-rose-400 transition" title="Log Out">
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full flex flex-col">
        
        {/* VIEW HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl font-bold tracking-tight font-display text-slate-900 dark:text-white uppercase">
              {activeView === "dashboard" && "Dashboard Monitoring"}
              {activeView === "workspace" && "Sequential Agent Builder"}
              {activeView === "history" && "Execution Log Registry"}
              {activeView === "codebase" && "Spring Boot Portfolio Reference"}
              {activeView === "profile" && "Profile Parameters"}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-400/80">
              {activeView === "dashboard" && "Monitor real-time task triggers, success rate parameters, and system agents."}
              {activeView === "workspace" && "Input a software or product scope. Watch Google Gemini agents coordinate answers."}
              {activeView === "history" && "Browse, filter, inspect, and export finished business specification reports."}
              {activeView === "codebase" && "Explore compiles and detailed directory tree mappings for the Spring Boot Maven project."}
              {activeView === "profile" && "Manage session parameters and administrative user profiles."}
            </p>
          </div>
          {activeView !== "workspace" && (
            <button 
              onClick={() => setActiveView("workspace")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition shadow-lg shadow-blue-600/10 flex items-center gap-1.5 self-start cursor-pointer"
            >
              <Plus size={14} /> New Agent Run
            </button>
          )}
        </div>

        {/* ---------------------------------------------------- */}
        {/* VIEW CONTENT ROUTER */}
        {/* ---------------------------------------------------- */}

        {/* 1. DASHBOARD VIEW */}
        {activeView === "dashboard" && !selectedTask && (
          <div className="space-y-6 animate-fade-in">
            {/* Stat widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bento-card flex-row items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Runs</span>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 font-display">{tasks.length}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center"><Terminal size={18} /></div>
              </div>
              <div className="bento-card flex-row items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Success Runs</span>
                  <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 font-display">{tasks.filter(t => t.status === "completed").length}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><CheckCircle size={18} /></div>
              </div>
              <div className="bento-card flex-row items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active Agents</span>
                  <h3 className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 font-display">5</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center"><Cpu size={18} /></div>
              </div>
              <div className="bento-card flex-row items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Integrity Rating</span>
                  <h3 className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 font-display">100%</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center"><ShieldCheck size={18} /></div>
              </div>
            </div>

            {/* Main panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent task logs */}
              <div className="bento-card lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white font-display">Recent Executions</h3>
                  <button onClick={() => setActiveView("history")} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-semibold cursor-pointer">View Registry</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                        <th className="py-2.5">Prompt Request</th>
                        <th className="py-2.5">Date</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {tasks.slice(0, 4).map(task => (
                        <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition">
                          <td className="py-3 font-semibold text-slate-900 dark:text-slate-200 max-w-xs truncate">{task.prompt}</td>
                          <td className="py-3 text-slate-400 dark:text-slate-500 font-mono">{new Date(task.createdAt).toLocaleDateString()}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/50 rounded-full">
                              {task.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button 
                              onClick={() => { setSelectedTask(task); setActiveView("history"); }}
                              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-[10px] font-semibold transition cursor-pointer"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                      {tasks.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400 dark:text-slate-500">No project requests compiled yet. Click &quot;Create Task&quot; to begin.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Agent status display */}
              <div className="bento-card">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-2 font-display">Agent Matrix Logs</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-4">Click an agent to view its specific compiled output from the latest project specification report.</p>
                <div className="agent-grid">
                  {/* Research Agent */}
                  {(() => {
                    const { label, dotClass } = getAgentStatusProps("research");
                    return (
                      <div 
                        onClick={() => handleAgentMatrixClick("research", "Research")}
                        className="agent-item cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200"
                        title="Click to open Research Specification"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <span className={`status-dot ${dotClass}`} />
                            <div>
                              <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100">Research Agent</p>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 block tracking-wide leading-none mt-1">Tech stack</span>
                            </div>
                          </div>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${label === "RUNNING" ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50" : label === "COMPLETED" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/50" : label === "FAILED" ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/50" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                            {label}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Planning Agent */}
                  {(() => {
                    const { label, dotClass } = getAgentStatusProps("planning");
                    return (
                      <div 
                        onClick={() => handleAgentMatrixClick("planning", "Planning")}
                        className="agent-item cursor-pointer hover:border-purple-500 dark:hover:border-purple-500 transition-all duration-200"
                        title="Click to open Planning Specification"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <span className={`status-dot ${dotClass}`} />
                            <div>
                              <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100">Planning Agent</p>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 block tracking-wide leading-none mt-1">Sprint steps</span>
                            </div>
                          </div>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${label === "RUNNING" ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50" : label === "COMPLETED" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/50" : label === "FAILED" ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/50" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                            {label}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Coding Agent */}
                  {(() => {
                    const { label, dotClass } = getAgentStatusProps("coding");
                    return (
                      <div 
                        onClick={() => handleAgentMatrixClick("coding", "Coding")}
                        className="agent-item cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-200"
                        title="Click to open Coding Specification"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <span className={`status-dot ${dotClass}`} />
                            <div>
                              <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100">Coding Agent</p>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 block tracking-wide leading-none mt-1">Java &amp; SQL</span>
                            </div>
                          </div>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${label === "RUNNING" ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50" : label === "COMPLETED" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/50" : label === "FAILED" ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/50" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                            {label}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Testing Agent */}
                  {(() => {
                    const { label, dotClass } = getAgentStatusProps("testing");
                    return (
                      <div 
                        onClick={() => handleAgentMatrixClick("testing", "Testing")}
                        className="agent-item cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-200"
                        title="Click to open Testing Specification"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <span className={`status-dot ${dotClass}`} />
                            <div>
                              <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100">Testing Agent</p>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 block tracking-wide leading-none mt-1">QA metrics</span>
                            </div>
                          </div>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${label === "RUNNING" ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50" : label === "COMPLETED" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/50" : label === "FAILED" ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/50" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                            {label}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. CREATE WORKSPACE VIEW */}
        {activeView === "workspace" && (
          <div className="space-y-6">
            <div className="bento-card">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider mb-2 font-display">Multi-Agent Request Prompt</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-6">Describe your business task or required software system. The Manager Agent will coordinate the Research, Planning, Coding, Testing, and Documentation agents sequentially to design the full specification.</p>

              <div className="space-y-4">
                <textarea 
                  value={promptInput}
                  onChange={e => setPromptInput(e.target.value)}
                  rows={4}
                  placeholder="Example: Build a school enrollment dashboard with student schedules, attendance logs, teacher details, and grade analytics..."
                  className="w-full p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 transition text-xs leading-relaxed text-slate-900 dark:text-slate-100"
                />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Prompt templates quick select */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest self-center mr-1">QUICK PRESETS:</span>
                    {PROMPT_TEMPLATES.map((tmpl, idx) => (
                      <button 
                        key={idx}
                        onClick={() => { setPromptInput(tmpl.prompt); triggerToast(`Loaded preset: ${tmpl.title}`, "info"); }}
                        className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/40 dark:hover:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold rounded-lg transition cursor-pointer"
                      >
                        {tmpl.title}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={submitWorkflowTask}
                    disabled={loading}
                    className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition shadow-lg shadow-blue-600/15 flex items-center gap-1.5 self-end disabled:opacity-50 cursor-pointer"
                  >
                    <Play size={12} /> Launch Pipeline
                  </button>
                </div>
              </div>
            </div>

            {/* Active sequential timeline visual during progress */}
            {loading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bento-card"
              >
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-6 font-display">Active Pipeline Execution</h3>
                <div className="relative pl-8 space-y-6 before:absolute before:inset-y-1 before:left-3 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                  
                  {/* Step 1 */}
                  <div className="relative flex items-start gap-4">
                    <span className={`absolute -left-8 w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center border transition ${timelineStatus === "researching" ? "bg-blue-50 border-blue-500 text-blue-600 animate-pulse" : (["planning", "coding", "testing", "documenting", "completed"].includes(timelineStatus) ? "bg-emerald-500 border-emerald-500 text-white" : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400")}`}>
                      {["planning", "coding", "testing", "documenting", "completed"].includes(timelineStatus) ? "✓" : "1"}
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">Research Agent Stack Recommendation</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Selecting perfect technology frameworks, architectural structure, and scope parameters.</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative flex items-start gap-4">
                    <span className={`absolute -left-8 w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center border transition ${timelineStatus === "planning" ? "bg-blue-50 border-blue-500 text-blue-600 animate-pulse" : (["coding", "testing", "documenting", "completed"].includes(timelineStatus) ? "bg-emerald-500 border-emerald-500 text-white" : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400")}`}>
                      {["coding", "testing", "documenting", "completed"].includes(timelineStatus) ? "✓" : "2"}
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">Planning Agent Project Timeline</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Authoring development phases, agile sprint milestones, and technical risk mitigations.</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative flex items-start gap-4">
                    <span className={`absolute -left-8 w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center border transition ${timelineStatus === "coding" ? "bg-blue-50 border-blue-500 text-blue-600 animate-pulse" : (["testing", "documenting", "completed"].includes(timelineStatus) ? "bg-emerald-500 border-emerald-500 text-white" : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400")}`}>
                      {["testing", "documenting", "completed"].includes(timelineStatus) ? "✓" : "3"}
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">Coding Agent Database Schema &amp; REST APIs</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Modeling directories map, index constraints, standard REST endpoints, and attributes.</p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="relative flex items-start gap-4">
                    <span className={`absolute -left-8 w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center border transition ${timelineStatus === "testing" ? "bg-blue-50 border-blue-500 text-blue-600 animate-pulse" : (["documenting", "completed"].includes(timelineStatus) ? "bg-emerald-500 border-emerald-500 text-white" : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400")}`}>
                      {["documenting", "completed"].includes(timelineStatus) ? "✓" : "4"}
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">Testing Agent Quality Validation suite</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Designing key validation requirements, edge cases, vulnerabilities, and sanitization tests.</p>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="relative flex items-start gap-4">
                    <span className={`absolute -left-8 w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center border transition ${timelineStatus === "documenting" ? "bg-blue-50 border-blue-500 text-blue-600 animate-pulse" : (timelineStatus === "completed" ? "bg-emerald-500 border-emerald-500 text-white" : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400")}`}>
                      {timelineStatus === "completed" ? "✓" : "5"}
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">Documentation Agent Manual Composer</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Drafting clean installation steps, cloud deployment parameters, and modular README files.</p>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* 3. TASK HISTORY VIEW */}
        {activeView === "history" && !selectedTask && (
          <div className="bento-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white font-display">Task Execution Registry</h3>
              <div className="relative max-w-xs w-full">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Search size={14} />
                </span>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search logs..." 
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950/45 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 transition text-xs text-slate-900 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                    <th className="py-2.5 px-4">Registry ID</th>
                    <th className="py-2.5 px-4">Original Business Prompt</th>
                    <th className="py-2.5 px-4">Date Compiled</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredTasks.map(task => (
                    <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition">
                      <td className="py-4 px-4 font-mono font-semibold text-slate-400 dark:text-slate-500">{task.id.substring(0, 8)}</td>
                      <td className="py-4 px-4 font-semibold text-slate-950 dark:text-slate-200 max-w-sm truncate">{task.prompt}</td>
                      <td className="py-4 px-4 font-mono text-slate-400 dark:text-slate-500">{new Date(task.createdAt).toLocaleString()}</td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/50 rounded-full">
                          {task.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right flex gap-2 justify-end">
                        <button 
                          onClick={() => setSelectedTask(task)}
                          className="px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer"
                        >
                          Open Spec
                        </button>
                        <button 
                          onClick={() => deleteTask(task.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-slate-100 dark:border-slate-800 transition cursor-pointer"
                          title="Delete Log"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTasks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500 font-medium">No execution logs matched query parameters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. TASK DETAILS SPACE */}
        {activeView === "history" && selectedTask && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setSelectedTask(null)}
                className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
              >
                ← Back to Registry
              </button>
              <button 
                onClick={() => exportPDF(selectedTask)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-850 dark:hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow cursor-pointer border border-slate-800/80 dark:border-slate-700/80"
              >
                <Download size={13} /> Download PDF Report
              </button>
            </div>

            {/* Scope card */}
            <div className="bento-card bento-card-accent p-6">
              <span className="text-[9px] uppercase font-bold tracking-widest text-blue-400">BUSINESS PROJECT ASSIGNMENT</span>
              <h2 className="text-sm font-bold mt-1 font-display text-white">{selectedTask.prompt}</h2>
              <span className="text-[10px] text-slate-400 block mt-2 font-mono">Registry ID: {selectedTask.id} • Compiled: {new Date(selectedTask.createdAt).toLocaleString()}</span>
            </div>

            {/* Results workspace tabs */}
            <div className="bento-card">
              <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
                <button 
                  onClick={() => setDetailTab("report")}
                  className={`pb-3 px-4 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap transition cursor-pointer ${detailTab === "report" ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400" : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"}`}
                >
                  Executive Report
                </button>
                <button 
                  onClick={() => setDetailTab("research")}
                  className={`pb-3 px-4 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap transition cursor-pointer ${detailTab === "research" ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400" : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"}`}
                >
                  Research Stack
                </button>
                <button 
                  onClick={() => setDetailTab("planning")}
                  className={`pb-3 px-4 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap transition cursor-pointer ${detailTab === "planning" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"}`}
                >
                  Planning Timeline
                </button>
                <button 
                  onClick={() => setDetailTab("coding")}
                  className={`pb-3 px-4 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap transition cursor-pointer ${detailTab === "coding" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"}`}
                >
                  Coding Specs
                </button>
                <button 
                  onClick={() => setDetailTab("testing")}
                  className={`pb-3 px-4 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap transition cursor-pointer ${detailTab === "testing" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"}`}
                >
                  QA Matrix
                </button>
                <button 
                  onClick={() => setDetailTab("documentation")}
                  className={`pb-3 px-4 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap transition cursor-pointer ${detailTab === "documentation" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"}`}
                >
                  Documentation
                </button>
              </div>

              <div className="py-6 px-2 min-h-[250px] text-slate-800 dark:text-slate-200">
                {detailTab === "report" && renderFormattedText(selectedTask.finalReport)}
                {detailTab === "research" && renderFormattedText(selectedTask.researchResult)}
                {detailTab === "planning" && renderFormattedText(selectedTask.planningResult)}
                {detailTab === "coding" && renderFormattedText(selectedTask.codingResult)}
                {detailTab === "testing" && renderFormattedText(selectedTask.testingResult)}
                {detailTab === "documentation" && renderFormattedText(selectedTask.documentationResult)}
              </div>
            </div>
          </div>
        )}

        {/* 5. VISUAL PORTFOLIO CODEBASE VIEW */}
        {activeView === "codebase" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left selector directory tree */}
            <div className="bento-card p-4 lg:col-span-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2 font-display">
                <Database size={13} className="text-blue-500" /> Project Modules
              </h3>
              <div className="space-y-1">
                {Object.keys(JAVA_FILES).map(key => (
                  <button 
                    key={key}
                    onClick={() => setCodeFileTab(key)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition cursor-pointer ${codeFileTab === key ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800/40 dark:hover:text-slate-300"}`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <FileCode size={13} className="text-indigo-500" />
                      {JAVA_FILES[key].name}
                    </span>
                    <ChevronRight size={12} className="text-slate-300 dark:text-slate-600" />
                  </button>
                ))}
              </div>
              
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 space-y-2">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                  This explorer previews the fully compilable **Java 21 / Spring Boot 3** project files written and stored directly inside the root workspace folder.
                </p>
                <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block"><CheckCircle size={10} className="inline mr-1" /> Verified Compilable</span>
              </div>
            </div>

            {/* Right code editor panel */}
            <div className="bento-card bg-slate-950 dark:bg-slate-950 border-slate-800 text-slate-100 p-6 lg:col-span-3 flex flex-col h-[500px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">PATH: {JAVA_FILES[codeFileTab].path}</span>
                  <h4 className="text-xs font-bold text-white font-mono mt-0.5">{JAVA_FILES[codeFileTab].name}</h4>
                </div>
                <button 
                  onClick={() => { navigator.clipboard.writeText(JAVA_FILES[codeFileTab].content); triggerToast("Code copied to clipboard!", "success"); }}
                  className="px-2.5 py-1.5 border border-slate-700 hover:bg-slate-800 rounded-lg text-[10px] font-semibold transition cursor-pointer"
                >
                  Copy File Content
                </button>
              </div>
              <pre className="flex-grow font-mono text-[11px] leading-relaxed overflow-auto bg-slate-950 p-4 rounded-xl border border-slate-800/80 scrollbar-thin">
                <code>{JAVA_FILES[codeFileTab].content}</code>
              </pre>
            </div>

          </div>
        )}

        {/* 6. PROFILE VIEW */}
        {activeView === "profile" && (
          <div className="bento-card max-w-md">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-6 font-display">User Parameters</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <div className="w-14 h-14 rounded-full bg-blue-600 text-white text-base font-bold flex items-center justify-center uppercase">
                  {user?.name.substring(0, 2) || "JD"}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{user?.name || "User Administrator"}</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{user?.email || "admin@example.com"}</p>
                </div>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400 dark:text-slate-500">Account ID:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{user?.id || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400 dark:text-slate-500">Role Authority:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">Enterprise AI Architect</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400 dark:text-slate-500">Workspace Status:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" /> Live Server Connected</span>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full mt-4 py-2.5 border border-rose-100 dark:border-rose-950 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut size={13} /> Exit Current Session
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
