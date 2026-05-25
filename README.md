# Temporary Exam Server Generator 🐳

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Jenkins](https://img.shields.io/badge/Jenkins-D24939?style=for-the-badge&logo=jenkins&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

An Automated Container-Based Online Practical Examination System. This DevOps-driven platform automatically provisions isolated programming environments for students during practical exams and destroys them upon completion.

## 🌟 Features

- **Isolated Student Environments:** Every student gets a dedicated, interference-free Docker container.
- **Auto Provisioning:** Exam environments are created in seconds via automated Jenkins pipelines.
- **Auto Cleanup:** Resources are freed immediately after the exam duration ends.
- **Live Monitoring:** Real-time tracking of container health, CPU, and RAM usage.
- **Multi-Language Support:** Run exams in Python, Java, C++, or Node.js.
- **Anti-Cheat Mechanics:** Sandboxed execution with strict resource and network limits.

## 🏗️ Architecture

```text
Admin Dashboard
      │
      ▼
Jenkins CI/CD Pipeline ──► GitHub (Starter Code & Config)
      │
      ▼
Docker Engine (Host)
  ├──► [Container 1] ── Port 8001 (Student A)
  ├──► [Container 2] ── Port 8002 (Student B)
  └──► [Container N] ── Port 800X (Student N)
      │
      ▼
Submissions Database (MySQL)
```

## 📋 Prerequisites

- Docker & Docker Compose
- Jenkins (configured with Docker plugin)
- Node.js (for backend API)
- MySQL

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/temp-exam-server.git
   cd temp-exam-server
   ```

2. **Start the core infrastructure**
   ```bash
   docker-compose up -d
   ```

3. **Access the Application**
   - Admin Dashboard: `http://localhost/admin-login.html`
   - Student Portal: `http://localhost/student-login.html`

## 📁 Folder Structure

| Directory | Description |
|-----------|-------------|
| `/css` | Design system, components, and animations |
| `/js` | Frontend logic, API integration, and charts |
| `/docker` | Dockerfiles and compose templates |
| `/jenkins` | CI/CD pipeline definitions |
| `/scripts` | Bash automation for provisioning/cleanup |
| `/nginx` | Reverse proxy configuration |

## ⚙️ CI/CD Pipeline Flow

1. **Trigger:** Admin creates an exam in the UI.
2. **Pull:** Jenkins pulls the base configs from Git.
3. **Build:** Docker images are built or pulled from cache.
4. **Deploy:** `docker-compose` spins up N isolated containers.
5. **Network:** Nginx routing is configured for student access.
6. **Teardown:** Triggered automatically when the exam timer expires.

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.
