package com.example.multiagent.agent;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    /**
     * Executes a prompt call to Google Gemini 3.5 Flash model
     *
     * @param systemInstruction The systemic agent instruction role.
     * @param prompt The prompt details for the business task.
     * @return Markdown-formatted response from Gemini.
     */
    public String generateContent(String systemInstruction, String prompt) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("${GEMINI_API_KEY}")) {
            return "### [Offline Mode]\nGemini API key is not configured on the Spring Boot server. Simulated agent output for: " + prompt;
        }

        try {
            // Reusable HttpClient
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(15))
                    .build();

            // JSON Body for Gemini v1beta API / v2 API
            String requestBody = """
            {
              "contents": [
                {
                  "parts": [
                    {
                      "text": "%s\\n\\nSubject Request: %s"
                    }
                  ]
                }
              ],
              "generationConfig": {
                "temperature": 0.2
              }
            }
            """.formatted(escapeJson(systemInstruction), escapeJson(prompt));

            // Gemini API endpoint
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .header("User-Agent", "aistudio-build")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .timeout(Duration.ofSeconds(30))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                // Parse response.text equivalent in Java
                return extractTextFromResponse(response.body());
            } else {
                return "### Error contacting Gemini API\nStatus Code: " + response.statusCode() + "\nDetails: " + response.body();
            }

        } catch (Exception e) {
            e.printStackTrace();
            return "### Orchestration Exception\nFailed to invoke Gemini Agent. Detail: " + e.getMessage();
        }
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private String extractTextFromResponse(String responseJson) {
        try {
            // Simple robust JSON parsing for Gemini generateContent response
            // Searches for "text": "..." within candidates content parts
            int textIdx = responseJson.indexOf("\"text\": \"");
            if (textIdx != -1) {
                int start = textIdx + 9;
                // Find matching closing quote, respecting escaped quotes
                StringBuilder sb = new StringBuilder();
                for (int i = start; i < responseJson.length(); i++) {
                    char c = responseJson.charAt(i);
                    if (c == '"' && responseJson.charAt(i - 1) != '\\') {
                        break;
                    }
                    sb.append(c);
                }
                // Unescape JSON string
                return sb.toString()
                        .replace("\\n", "\n")
                        .replace("\\\"", "\"")
                        .replace("\\\\", "\\")
                        .replace("\\t", "\t");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "### Content Parsing Failed\nCould not extract text from Gemini response json structure.";
    }
}
