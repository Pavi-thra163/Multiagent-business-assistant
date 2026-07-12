package com.example.multiagent.service;

import com.example.multiagent.agent.GeminiService;
import com.example.multiagent.dto.TaskDto;
import com.example.multiagent.entity.Task;
import com.example.multiagent.entity.User;
import com.example.multiagent.repository.TaskRepository;
import com.example.multiagent.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GeminiService geminiService;

    // Agent instructions constants mirroring backend roles
    private static final String RESEARCH_INSTRUCTION = "You are an expert Research Agent. Recommend tech stack, project scope, and estimated complexity.";
    private static final String PLANNING_INSTRUCTION = "You are an expert Planning Agent. Generate project timelines, milestones, milestones breakdowns, and risk analysis.";
    private static final String CODING_INSTRUCTION = "You are an expert Coding Agent. Detail modular folder structures, SQL database schemas, and clean REST APIs.";
    private static final String TESTING_INSTRUCTION = "You are an expert Quality Assurance and Testing Agent. Generate test cases, possible bugs, boundaries, and security rules.";
    private static final String DOCUMENTATION_INSTRUCTION = "You are an expert Documentation Agent. Author README.md contents, install steps, and deployment guides.";
    private static final String MANAGER_INSTRUCTION = "You are the Manager Agent. orchestrate specialized agents and compile a comprehensive corporate final report.";

    public List<TaskDto> getTasksByUserId(String userId) {
        return taskRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public TaskDto getTaskById(String id, String userId) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        if (!task.getUser().getId().equals(userId)) {
            throw new SecurityException("Unauthorized access to task logs");
        }
        return mapToDto(task);
    }

    @Transactional
    public void deleteTask(String id, String userId) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        if (!task.getUser().getId().equals(userId)) {
            throw new SecurityException("Unauthorized access to delete task logs");
        }
        taskRepository.delete(task);
    }

    @Transactional
    public TaskDto executeMultiAgentWorkflow(String userId, String prompt) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User session not found"));

        // Initialize Task entity
        String taskId = "task-" + UUID.randomUUID().toString();
        Task task = Task.builder()
                .id(taskId)
                .user(user)
                .prompt(prompt)
                .status("researching")
                .build();
        
        task = taskRepository.save(task);

        try {
            // 1. Research Agent
            String researchResult = geminiService.generateContent(RESEARCH_INSTRUCTION, prompt);
            task.setResearchResult(researchResult);
            task.setStatus("planning");
            taskRepository.save(task);

            // 2. Planning Agent
            String planningResult = geminiService.generateContent(PLANNING_INSTRUCTION, prompt);
            task.setPlanningResult(planningResult);
            task.setStatus("coding");
            taskRepository.save(task);

            // 3. Coding Agent
            String codingResult = geminiService.generateContent(CODING_INSTRUCTION, prompt);
            task.setCodingResult(codingResult);
            task.setStatus("testing");
            taskRepository.save(task);

            // 4. Testing Agent
            String testingResult = geminiService.generateContent(TESTING_INSTRUCTION, prompt);
            task.setTestingResult(testingResult);
            task.setStatus("documenting");
            taskRepository.save(task);

            // 5. Documentation Agent
            String documentationResult = geminiService.generateContent(DOCUMENTATION_INSTRUCTION, prompt);
            task.setDocumentationResult(documentationResult);
            task.setStatus("completed");
            taskRepository.save(task);

            // 6. Manager Agent Compilation
            String managerPrompt = "Original Request: " + prompt + 
                    "\n\nResearch outputs:\n" + researchResult +
                    "\n\nPlanning outputs:\n" + planningResult +
                    "\n\nCoding outputs:\n" + codingResult +
                    "\n\nTesting outputs:\n" + testingResult +
                    "\n\nDocumentation outputs:\n" + documentationResult;
            
            String finalReport = geminiService.generateContent(MANAGER_INSTRUCTION, managerPrompt);
            task.setFinalReport(finalReport);
            taskRepository.save(task);

        } catch (Exception e) {
            task.setStatus("failed");
            task.setFinalReport("### Pipeline Orchestration Failed\nReason: " + e.getMessage());
            taskRepository.save(task);
        }

        return mapToDto(task);
    }

    private TaskDto mapToDto(Task task) {
        return TaskDto.builder()
                .id(task.getId())
                .prompt(task.getPrompt())
                .status(task.getStatus())
                .createdAt(task.getCreatedAt())
                .researchResult(task.getResearchResult())
                .planningResult(task.getPlanningResult())
                .codingResult(task.getCodingResult())
                .testingResult(task.getTestingResult())
                .documentationResult(task.getDocumentationResult())
                .finalReport(task.getFinalReport())
                .build();
    }
}
