# SpeechFlow — Real-Time Speech Transcription Platform

## 1. Project Overview

SpeechFlow is a web-based speech transcription application that integrates a React frontend, a Python-based speech processing service, and a Java Spring Boot backend.

The application is designed to capture audio from the user's microphone, send audio data to the speech service through a WebSocket connection, and display recognized speech in the frontend. The Spring Boot backend provides REST API functionality and database integration.

## 2. Live Demo

- **Frontend:** https://speechflow-frontend-eax4ma9rz-thansh-rajan.vercel.app
- **Python Speech Service:** https://speechflow-python.onrender.com
- **Python Health Check:** https://speechflow-python.onrender.com/health
- **Spring Boot Backend:** https://speechflow-backend.onrender.com
- **Spring Boot Health Check:** https://speechflow-backend.onrender.com/api/health

Note: The service root URLs may return HTTP 404 if no root endpoint is configured. Use the health-check endpoints to verify service availability.

## 3. Source Code Repositories

- **Frontend Repository:** https://github.com/THANUSHRAJAN/speechflow-frontend
- **Python Speech Service Repository:** https://github.com/THANUSHRAJAN/speechflow-python
- **Spring Boot Backend Repository:** https://github.com/THANUSHRAJAN/speechflow-backend

## 4. Technology Stack

### Frontend
- React.js
- Vite
- JavaScript
- WebSocket client for live audio communication
- Browser microphone and audio capture APIs

### Python Speech Service
- Python
- FastAPI
- Uvicorn
- faster-whisper
- WebSocket communication
- NumPy for audio processing

### Backend
- Java
- Spring Boot
- REST APIs
- PostgreSQL integration

### Database and Deployment
- Supabase PostgreSQL
- Vercel for frontend hosting
- Render for backend and speech-service hosting
- Git and GitHub for version control

## 5. System Architecture

The application consists of three main services.

1. **React frontend:** Provides the user interface, captures microphone audio, communicates with the speech service, and displays transcription results.
2. **Python speech service:** Receives audio over WebSocket, processes audio data, and uses the faster-whisper model to recognize speech.
3. **Spring Boot backend:** Exposes backend REST endpoints and provides database-related functionality through PostgreSQL integration.

### Request Flow

```text
User
 |
 v
React Frontend (Vercel)
 |
 |-- WebSocket audio stream
 v
Python FastAPI Speech Service (Render)
 |
 v
faster-whisper Model
 |
 v
Transcription Results
 |
 v
React Frontend

React Frontend
 |
 |-- REST API requests
 v
Spring Boot Backend (Render)
 |
 v
Supabase PostgreSQL
```

The speech-transcription flow and the database/API flow are separate communication paths.

## 6. Main Features

- Browser-based user interface
- Microphone audio capture
- WebSocket-based audio streaming
- Speech recognition using faster-whisper
- Automatic language detection when using the `auto` language setting
- Live transcription updates when returned by the speech service
- Python service health endpoint
- Spring Boot backend health endpoint
- PostgreSQL connectivity through the backend
- Cloud deployment of the application services

Only features that have been verified in the deployed application should be marked as fully functional.

## 7. Local Development Setup

### Prerequisites

Install the following software:

- Node.js and npm
- Python
- Java Development Kit compatible with the backend project
- Git
- PostgreSQL access or the configured Supabase database

### A. Frontend Setup

Clone the frontend repository:

```bash
git clone <FRONTEND_REPOSITORY_URL>
cd <FRONTEND_PROJECT_DIRECTORY>
npm install
```

Create a `.env.local` file in the frontend project directory:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_SPEECH_SERVICE_URL=http://localhost:8000
```

Start the development server:

```bash
npm run dev
```

Open the local URL printed by Vite in the terminal.

### B. Python Speech Service Setup

Clone the Python repository:

```bash
git clone <PYTHON_REPOSITORY_URL>
cd <PYTHON_PROJECT_DIRECTORY>
```

Create and activate a virtual environment.

Windows:

```bash
python -m venv .venv
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure the Python service using the environment variables required by the project. For example, the deployed service uses a Whisper model configuration and allowed-origin configuration. Refer to the project's environment settings for the exact variable names.

Start the service using the project's entry point:

```bash
python run.py
```

Verify the service:

```text
http://localhost:8000/health
```

The WebSocket endpoint is:

```text
ws://localhost:8000/ws/transcribe
```

### C. Spring Boot Backend Setup

Clone the backend repository:

```bash
git clone <BACKEND_REPOSITORY_URL>
cd <BACKEND_PROJECT_DIRECTORY>
```

Configure the database connection using local environment variables or the project's supported configuration mechanism.

Set the PostgreSQL connection URL, username, and password securely. Do not commit credentials to GitHub.

Run the application with the Maven wrapper, if included:

Windows:

```bash
mvnw.cmd spring-boot:run
```

Linux/macOS:

```bash
./mvnw spring-boot:run
```

Alternatively, use the build and run instructions already included in the backend repository.

Verify the backend:

```text
http://localhost:8080/api/health
```

## 8. Environment Configuration

The deployed frontend uses these configuration keys:

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base URL for the Spring Boot API |
| `VITE_SPEECH_SERVICE_URL` | Base URL for the Python speech service |

Production values:

```env
VITE_API_BASE_URL=https://speechflow-backend.onrender.com/api
VITE_SPEECH_SERVICE_URL=https://speechflow-python.onrender.com
```

These frontend values are public configuration, not secrets. Any variable prefixed with `VITE_` can be exposed in the browser bundle.

Database credentials and other private settings must remain in backend environment variables or a secure secret-management system. Never publish `.env` files containing secrets.

## 9. Deployment Overview

### Frontend — Vercel
- Connect the frontend GitHub repository to Vercel.
- Configure the production environment variables.
- Build and deploy the Vite application.
- Redeploy after changing production environment variables.

### Python Speech Service — Render
- Connect the Python repository to Render.
- Install dependencies from the project's requirements file.
- Start the service using the configured Python entry point.
- Configure allowed frontend origins and speech-model settings.
- Verify the `/health` endpoint after deployment.

### Spring Boot Backend — Render
- Connect the Java repository to Render.
- Configure the Java build and start commands.
- Add the required PostgreSQL environment variables.
- Verify the `/api/health` endpoint.
- Confirm that the backend can connect to the configured database.

### Database — Supabase
- Configure PostgreSQL access for the backend.
- Use the correct Supabase connection settings for the deployment environment.
- Keep database credentials private.
- Confirm database connectivity through application logs and the relevant API functionality.

## 10. Testing and Verification

Use the following checks when validating a deployment:

1. Open the frontend and confirm that the page loads.
2. Open the Python health endpoint and confirm that the service reports its status.
3. Open the Spring Boot health endpoint and confirm that it returns a healthy status.
4. Test microphone permission and audio capture in the browser.
5. Check the browser's Network panel for the WebSocket connection to `/ws/transcribe`.
6. Confirm that the speech service returns transcription messages.
7. Test the backend API and database-dependent functionality.
8. Inspect Render logs and browser console output if a request fails.

A successful health check confirms service availability, but it does not by itself prove that live transcription or every database operation is working correctly.

## 11. Troubleshooting

### WebSocket Connection Problems
- Confirm that the frontend uses `wss://` for the deployed HTTPS speech service.
- Confirm that the WebSocket endpoint is `/ws/transcribe`.
- Check the browser Network panel for connection status and messages.
- Check the Python service logs for WebSocket connection and transcription errors.

### CORS Problems
- Confirm that the deployed frontend origin is included in the Python service's allowed origins.
- Ensure the configured origin matches the actual Vercel domain.

### Database Connectivity Problems
- Verify PostgreSQL connection settings and credentials.
- Confirm that the backend can reach the database.
- Review the backend logs for connection-pool or authentication errors.

### Slow Initial Response
- A hosted speech service may take time to initialize the model or resume after inactivity.
- Check the hosting logs before concluding that the service is unavailable.

## 12. Security Considerations

- Do not commit credentials, tokens, or private environment files.
- Keep database access restricted to the backend.
- Configure allowed frontend origins explicitly.
- Use HTTPS and secure WebSocket connections in production.
- Validate incoming requests and handle failures without exposing sensitive internal details.

## 13. Future Improvements

Potential improvements include:
- Better handling of interrupted WebSocket connections
- Improved streaming transcription latency
- More comprehensive automated tests
- Stronger monitoring and structured error reporting
- Expanded language-selection options
- Improved deployment and operational documentation
