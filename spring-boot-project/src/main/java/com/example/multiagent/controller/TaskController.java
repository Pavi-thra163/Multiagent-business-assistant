package com.example.multiagent.controller;

import com.example.multiagent.config.JwtUtils;
import com.example.multiagent.dto.TaskDto;
import com.example.multiagent.agent.GeminiService;
import com.example.multiagent.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class TaskController {

    @Autowired
    private TaskService taskService;

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private JwtUtils jwtUtils;

    private String getUserIdFromHeader(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtils.validateJwtToken(token)) {
                return jwtUtils.getUserIdFromJwtToken(token);
            }
        }
        throw new SecurityException("Missing or invalid Authorization credentials");
    }

    // Task History logs APIs
    @GetMapping("/tasks")
    public ResponseEntity<List<TaskDto>> getAllTasks(@RequestHeader("Authorization") String authHeader) {
        String userId = getUserIdFromHeader(authHeader);
        return ResponseEntity.ok(taskService.getTasksByUserId(userId));
    }

    @GetMapping("/tasks/{id}")
    public ResponseEntity<TaskDto> getTaskById(
            @PathVariable String id,
            @RequestHeader("Authorization") String authHeader) {
        String userId = getUserIdFromHeader(authHeader);
        return ResponseEntity.ok(taskService.getTaskById(id, userId));
    }

    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<?> deleteTask(
            @PathVariable String id,
            @RequestHeader("Authorization") String authHeader) {
        String userId = getUserIdFromHeader(authHeader);
        taskService.deleteTask(id, userId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Task log deleted successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/tasks/create")
    public ResponseEntity<TaskDto> createMultiAgentTask(
            @RequestBody Map<String, String> body,
            @RequestHeader("Authorization") String authHeader) {
        String userId = getUserIdFromHeader(authHeader);
        String prompt = body.get("prompt");
        if (prompt == null || prompt.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        TaskDto created = taskService.executeMultiAgentWorkflow(userId, prompt);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(created);
    }

    // Direct Single-Agent Prompt Execution APIs
    @PostMapping("/agent/research")
    public ResponseEntity<?> runResearchAgent(@RequestBody Map<String, String> body) {
        String prompt = body.get("prompt");
        String instruction = "You are an expert Research Agent. Recommend tech stack, project scope, and estimated complexity.";
        String result = geminiService.generateContent(instruction, prompt);
        Map<String, String> response = new HashMap<>();
        response.put("result", result);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/agent/planning")
    public ResponseEntity<?> runPlanningAgent(@RequestBody Map<String, String> body) {
        String prompt = body.get("prompt");
        String instruction = "You are an expert Planning Agent. Generate project timelines, milestones, task breakdowns, and risk analysis.";
        String result = geminiService.generateContent(instruction, prompt);
        Map<String, String> response = new HashMap<>();
        response.put("result", result);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/agent/coding")
    public ResponseEntity<?> runCodingAgent(@RequestBody Map<String, String> body) {
        String prompt = body.get("prompt");
        String instruction = "You are an expert Software Architecture & Coding Agent. Suggest folder structures, database schemas, and clean REST APIs.";
        String result = geminiService.generateContent(instruction, prompt);
        Map<String, String> response = new HashMap<>();
        response.put("result", result);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/agent/testing")
    public ResponseEntity<?> runTestingAgent(@RequestBody Map<String, String> body) {
        String prompt = body.get("prompt");
        String instruction = "You are an expert QA and Testing Agent. Generate test cases, boundaries, validation rules, and security checks.";
        String result = geminiService.generateContent(instruction, prompt);
        Map<String, String> response = new HashMap<>();
        response.put("result", result);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/agent/documentation")
    public ResponseEntity<?> runDocumentationAgent(@RequestBody Map<String, String> body) {
        String prompt = body.get("prompt");
        String instruction = "You are an expert Technical Writer and Documentation Agent. Author README templates, install steps, and cloud deployment guides.";
        String result = geminiService.generateContent(instruction, prompt);
        Map<String, String> response = new HashMap<>();
        response.put("result", result);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/agent/full-process")
    public ResponseEntity<?> runFullProcess(@RequestBody Map<String, String> body, @RequestHeader("Authorization") String authHeader) {
        String userId = getUserIdFromHeader(authHeader);
        String prompt = body.get("prompt");
        if (prompt == null || prompt.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        TaskDto result = taskService.executeMultiAgentWorkflow(userId, prompt);
        return ResponseEntity.ok(result);
    }
}
