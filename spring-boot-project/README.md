# AI Multi-Agent Business Assistant (Spring Boot Reference)

An enterprise-ready **AI Multi-Agent Business Assistant** built with **Java 21**, **Spring Boot 3**, **Spring Security**, **Spring Data JPA (MySQL)**, and **LangChain4j**.

This package contains the complete, production-grade source code for the backend and its associated **Vanilla JS Single Page Application** frontend served directly via Spring Boot static resources.

---

## 🛠️ Tech Stack & Dependencies

*   **Java Runtime**: JDK 21 (Supports virtual threads & modern patterns)
*   **Framework**: Spring Boot 3.2.4
*   **Database**: MySQL (Durable schema persistence)
*   **Security**: Spring Security + Stateless JSON Web Tokens (JWT) + BCrypt
*   **AI Integration**: LangChain4j + Google Gemini API (`gemini-2.5-flash`)
*   **Build Tool**: Maven

---

## 📂 Project Architecture Layers

The code follows highly modular Enterprise Layer standards:

*   `config`: Security chains, CORS configs, password encoders, and custom JWT claim parsers.
*   `controller`: Exposes secure REST endpoints for user authentication and multi-agent workflow triggers.
*   `service`: Coordinates the execution sequence of specialized agents and persists logs.
*   `repository`: Relational interface mapping with JPA for `User` and `Task` logs.
*   `entity`: Relational database table schemas.
*   `dto`: Request/Response wrappers for login payloads and task records.
*   `agent`: Directly connects and queries the Google Gemini API.

---

## 🚀 Getting Started (How to Run)

### 1. Database Provisioning
Configure and run your local MySQL instance, then create the database schema:
```sql
CREATE DATABASE IF NOT EXISTS agent_business_db;
```

### 2. Configure Environment Secrets
Ensure the following variables are present in your local system environment or configured directly in `src/main/resources/application.properties`:

```env
# Google Gemini API key used for LangChain4j calls
GEMINI_API_KEY="YOUR_ACTUAL_GOOGLE_GEMINI_KEY"

# Database credentials
DB_USERNAME="your_mysql_username"
DB_PASSWORD="your_mysql_password"
```

### 3. Build & Package (Maven)
In the `/spring-boot-project` root directory, execute:
```bash
# Clean previous builds and run compilations
mvn clean package -DskipTests
```

### 4. Boot Application
Run the packaged JAR file:
```bash
java -jar target/multi-agent-business-assistant-1.0.0-SNAPSHOT.jar
```
The application will boot on **port `8080`**.

### 5. Access Frontend UI
Open your web browser and navigate to:
```
http://localhost:8080/index.html
```
This serves the highly responsive, styled Vanilla JS SaaS workspace directly from the static resources directory!

---

## 🧪 REST Endpoints Summary

### Authentication APIs
*   `POST /api/auth/register` - Submit new user parameters (email, password, name) to register.
*   `POST /api/auth/login` - Authenticate credentials and retrieve a stateless JWT token.
*   `GET /api/auth/profile` - Verify current active JWT token and retrieve account settings.

### Agent Workflow APIs
*   `POST /api/tasks/create` - Trigger the sequential **Multi-Agent** orchestration. Spawns tasks to **Research**, **Planning**, **Coding**, **Testing**, and **Documentation** agents, compiles the master summary via the **Manager Agent**, and logs the completed metrics.
*   `GET /api/tasks` - Fetch complete logs of tasks executed by the current authenticated user.
*   `GET /api/tasks/{id}` - Deep-dive details of specific outputs compiled by specialized agents.
*   `DELETE /api/tasks/{id}` - Permanently delete a task log from database history.

---

## 📁 Project Directory Map
```
/spring-boot-project
  ├── pom.xml                                     # Maven settings & libraries
  ├── AI_Multi_Agent_Business_Assistant.json      # Postman collections
  └── src
      └── main
          ├── java/com/example/multiagent
          │     ├── agent/GeminiService.java      # Direct Gemini API wrapper
          │     ├── config                        # Security & JWT keys setup
          │     ├── controller                    # REST entry controllers
          │     ├── dto                           # JSON body maps
          │     ├── entity                        # MySQL DB schemas
          │     ├── repository                    # JPA data access interfaces
          │     └── service                       # Agents execution pipeline
          └── resources
                ├── application.properties        # App & DB parameters
                ├── schema.sql                    # Database table setups
                └── static/index.html             # Vanilla JS SaaS UI
```
---
*Developed for Engineering Portfolios and Professional Deployment.*
