package com.example.multiagent.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String prompt;

    @Column(nullable = false)
    private String status; // 'pending', 'researching', 'planning', 'coding', 'testing', 'documenting', 'completed', 'failed'

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // We can store agent results in columns directly for easy JPA mapping
    @Column(name = "research_result", columnDefinition = "TEXT")
    private String researchResult;

    @Column(name = "planning_result", columnDefinition = "TEXT")
    private String planningResult;

    @Column(name = "coding_result", columnDefinition = "TEXT")
    private String codingResult;

    @Column(name = "testing_result", columnDefinition = "TEXT")
    private String testingResult;

    @Column(name = "documentation_result", columnDefinition = "TEXT")
    private String documentationResult;

    @Column(name = "final_report", columnDefinition = "TEXT")
    private String finalReport;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
