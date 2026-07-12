export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Task {
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

export interface PromptTemplate {
  title: string;
  description: string;
  prompt: string;
  category: "E-Commerce" | "SaaS" | "Utility" | "System";
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    title: "E-Commerce Platform",
    description: "Multi-vendor store with shopping cart, Stripe checkouts, and custom analytics.",
    prompt: "Build an enterprise-grade multi-vendor E-Commerce Platform with real-time stock notifications, Stripe payment integration, order tracking, and a merchant analytics dashboard.",
    category: "E-Commerce"
  },
  {
    title: "Inventory Management",
    description: "Real-time stock depletion tracker, supplier links, and automatic low-stock alerts.",
    prompt: "Create an Inventory Management System featuring low-stock automatic alerts, supply chain supplier catalog integrations, and dynamic PDF report exports.",
    category: "SaaS"
  },
  {
    title: "SaaS CRM System",
    description: "Customer relationship workspace with lead pipelines, email logs, and reminders.",
    prompt: "Develop a secure CRM SaaS platform containing sales pipelines, lead status updates, auto-reminders, and team interaction logs.",
    category: "SaaS"
  },
  {
    title: "School Management System",
    description: "Student enrollments, attendance logs, grade books, and fee summaries.",
    prompt: "Build a School Management System supporting student enrollments, teacher schedules, grade records, and automatic term fee receipts.",
    category: "System"
  }
];
