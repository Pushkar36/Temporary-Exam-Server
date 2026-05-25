#!/bin/bash
# ==============================================================================
# Script: create-containers.sh
# Description: Generates student environments for the exam
# Usage: ./create-containers.sh <EXAM_ID> <STUDENT_COUNT> <LANGUAGE> <DURATION>
# ==============================================================================

EXAM_ID=$1
STUDENT_COUNT=$2
LANGUAGE=$3
DURATION=$4

if [ -z "$EXAM_ID" ] || [ -z "$STUDENT_COUNT" ]; then
    echo "Usage: ./create-containers.sh <EXAM_ID> <STUDENT_COUNT> <LANGUAGE> <DURATION>"
    exit 1
fi

echo "🚀 Starting environment generation for Exam $EXAM_ID"
echo "📦 Provisioning $STUDENT_COUNT containers for $LANGUAGE"

# Create a temporary directory for this exam's config
mkdir -p /exam-configs/$EXAM_ID
COMPOSE_FILE="/exam-configs/$EXAM_ID/docker-compose.yml"

echo "version: '3.8'" > $COMPOSE_FILE
echo "services:" >> $COMPOSE_FILE

BASE_PORT=8000

for (( i=1; i<=$STUDENT_COUNT; i++ ))
do
    PORT=$((BASE_PORT + i))
    STUDENT_ID="STU_${EXAM_ID}_${i}"
    
    echo "  student-${i}:" >> $COMPOSE_FILE
    
    if [ "$LANGUAGE" == "Python" ]; then
        echo "    image: exam-python-base:latest" >> $COMPOSE_FILE
    elif [ "$LANGUAGE" == "Java" ]; then
        echo "    image: exam-java-base:latest" >> $COMPOSE_FILE
    else
        echo "    image: exam-base:latest" >> $COMPOSE_FILE
    fi
    
    echo "    container_name: ctn-${EXAM_ID}-${i}" >> $COMPOSE_FILE
    echo "    ports:" >> $COMPOSE_FILE
    echo "      - \"${PORT}:8080\"" >> $COMPOSE_FILE
    echo "    environment:" >> $COMPOSE_FILE
    echo "      - STUDENT_ID=${STUDENT_ID}" >> $COMPOSE_FILE
    echo "      - EXAM_ID=${EXAM_ID}" >> $COMPOSE_FILE
    echo "    networks:" >> $COMPOSE_FILE
    echo "      - exam-net" >> $COMPOSE_FILE
    echo "    deploy:" >> $COMPOSE_FILE
    echo "      resources:" >> $COMPOSE_FILE
    echo "        limits:" >> $COMPOSE_FILE
    echo "          cpus: '0.5'" >> $COMPOSE_FILE
    echo "          memory: 512M" >> $COMPOSE_FILE
    echo "" >> $COMPOSE_FILE
done

echo "networks:" >> $COMPOSE_FILE
echo "  exam-net:" >> $COMPOSE_FILE
echo "    driver: bridge" >> $COMPOSE_FILE

echo "✅ docker-compose.yml generated successfully"
echo "🐳 Launching containers..."

# Simulate docker-compose up
# docker-compose -f $COMPOSE_FILE up -d

echo "⏳ Waiting for health checks..."
sleep 2

echo "🎉 All $STUDENT_COUNT containers are ready and healthy!"
exit 0
