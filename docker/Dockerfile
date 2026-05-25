# =============================================================================
# Temporary Exam Server Generator — Student Exam Container
# =============================================================================
# Base image: Python 3.11 slim (debian-based, minimal footprint)
# Purpose   : Isolated exam environment per student
# =============================================================================

FROM python:3.11-slim

# -----------------------------------------------------------------------------
# Image Metadata Labels
# -----------------------------------------------------------------------------
LABEL maintainer="exam-system@institution.edu" \
      version="1.0.0" \
      exam-system="Temporary Exam Server Generator" \
      description="Isolated Python exam environment for students" \
      org.opencontainers.image.title="exam-student-env" \
      org.opencontainers.image.description="Student exam sandbox container" \
      org.opencontainers.image.vendor="Institution Exam Portal" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.created="2026-05-20"

# -----------------------------------------------------------------------------
# Build Arguments (passed from docker-compose or build command)
# -----------------------------------------------------------------------------
ARG STUDENT_ID=student_001
ARG EXAM_ID=EXAM-2026-XXXX
ARG EXAM_LANGUAGE=python
ARG DEBIAN_FRONTEND=noninteractive

# -----------------------------------------------------------------------------
# Environment Variables
# -----------------------------------------------------------------------------
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/exam/workspace \
    STUDENT_ID=${STUDENT_ID} \
    EXAM_ID=${EXAM_ID} \
    EXAM_LANGUAGE=${EXAM_LANGUAGE} \
    EXAM_HOME=/exam \
    WORKSPACE=/exam/workspace \
    SUBMISSIONS_DIR=/exam/submissions \
    LOGS_DIR=/exam/logs \
    PORT=8080 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# -----------------------------------------------------------------------------
# Install System Dependencies
# -----------------------------------------------------------------------------
# gcc       : For compiling Python C extensions (numpy, etc.)
# git       : Allow students to init repos (if exam allows)
# curl      : Health checks + downloading test data
# wget      : Backup download tool
# procps    : ps, kill — for monitoring/cleanup
# vim       : Emergency in-container editing
# jq        : JSON processing in shell scripts
# build-essential : Full compilation toolchain
# -----------------------------------------------------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        git \
        curl \
        wget \
        procps \
        vim \
        jq \
        build-essential \
        libffi-dev \
        libssl-dev \
        ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --upgrade pip

# -----------------------------------------------------------------------------
# Create Non-Root User: 'student'
# (Security best practice: containers should not run as root)
# -----------------------------------------------------------------------------
RUN groupadd --gid 1001 student \
    && useradd --uid 1001 --gid 1001 \
               --shell /bin/bash \
               --create-home \
               --home-dir /home/student \
               --comment "Exam Student User" \
               student

# -----------------------------------------------------------------------------
# Set Up Directory Structure
# -----------------------------------------------------------------------------
RUN mkdir -p \
        /exam/workspace \
        /exam/submissions \
        /exam/logs \
        /exam/templates \
        /exam/tests \
    && chown -R student:student /exam \
    && chmod 755 /exam \
    && chmod 700 /exam/submissions

# Set working directory
WORKDIR /exam/workspace

# -----------------------------------------------------------------------------
# Install Python Packages for Exam
# -----------------------------------------------------------------------------
# Core scientific + data packages commonly needed in exams:
#   numpy      : Numerical computing, arrays, math operations
#   pandas     : Data manipulation and analysis (CSV, DataFrames)
#   matplotlib : Plotting and visualization
#   requests   : HTTP client library for API-based questions
#   scipy      : Scientific computing (algorithms, signal processing)
#   pytest     : Auto-grading test framework
#   flask      : Lightweight web framework for web-dev exam questions
#   sqlalchemy : ORM for database exam questions
# -----------------------------------------------------------------------------
COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt \
    || pip install --no-cache-dir \
        numpy==1.26.4 \
        pandas==2.2.1 \
        matplotlib==3.8.3 \
        requests==2.31.0 \
        scipy==1.12.0 \
        pytest==8.1.1 \
        flask==3.0.2 \
        sqlalchemy==2.0.29 \
        psutil==5.9.8 \
        tabulate==0.9.0

# -----------------------------------------------------------------------------
# Copy Starter Code Templates and Exam Bootstrap Scripts
# -----------------------------------------------------------------------------
COPY --chown=student:student templates/ /exam/templates/
COPY --chown=student:student scripts/entrypoint.sh /exam/entrypoint.sh
COPY --chown=student:student scripts/health_check.py /exam/health_check.py
COPY --chown=student:student scripts/submit.sh /exam/submit.sh

RUN chmod +x /exam/entrypoint.sh /exam/submit.sh

# -----------------------------------------------------------------------------
# Switch to Non-Root User
# -----------------------------------------------------------------------------
USER student

# -----------------------------------------------------------------------------
# Resource Limits Note:
# These are controlled at docker-compose / docker run level via:
#   --memory="512m"        → Max 512 MB RAM
#   --memory-swap="512m"   → Disable swap (same as memory = no swap)
#   --cpus="0.5"           → Max 50% of 1 CPU core
#   --pids-limit=100       → Max 100 processes (prevents fork bombs)
#   --read-only            → Read-only root filesystem (workspace is rwx)
#   --no-new-privileges    → Prevent privilege escalation
#
# tmpfs mounts for /tmp are set in docker-compose.yml
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Expose Application Port
# -----------------------------------------------------------------------------
EXPOSE 8080

# -----------------------------------------------------------------------------
# Health Check
# Verifies the exam web shell is responsive every 30 seconds.
# Allows 3 retries with a 10s timeout before marking unhealthy.
# -----------------------------------------------------------------------------
HEALTHCHECK --interval=30s \
            --timeout=10s \
            --start-period=15s \
            --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# -----------------------------------------------------------------------------
# Entrypoint & Default Command
# entrypoint.sh initializes the workspace, copies starter templates,
# sets up the student's environment, and launches the web shell server.
# -----------------------------------------------------------------------------
ENTRYPOINT ["/exam/entrypoint.sh"]
CMD ["--port", "8080", "--mode", "exam"]
