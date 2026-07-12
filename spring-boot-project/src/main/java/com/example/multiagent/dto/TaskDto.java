package com.example.multiagent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskDto {
    private String id;
    private String prompt;
    private String status;
    private LocalDateTime createdAt;
    private String researchResult;
    private String planningResult;
    private String codingResult;
    private String testingResult;
    private String documentationResult;
    private String finalReport;
}
