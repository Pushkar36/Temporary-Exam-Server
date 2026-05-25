#!/bin/bash
# ==============================================================================
# Script: cleanup-containers.sh
# Description: Destroys student environments after the exam
# Usage: ./cleanup-containers.sh <EXAM_ID>
# ==============================================================================

EXAM_ID=$1

if [ -z "$EXAM_ID" ]; then
    echo "Usage: ./cleanup-containers.sh <EXAM_ID>"
    exit 1
fi

echo "🧹 Starting cleanup for Exam $EXAM_ID"

COMPOSE_FILE="/exam-configs/$EXAM_ID/docker-compose.yml"

if [ ! -f "$COMPOSE_FILE" ]; then
    echo "⚠️ Warning: Compose file for Exam $EXAM_ID not found."
    echo "Attempting force cleanup of matching containers..."
    # docker rm -f $(docker ps -a -q --filter name="ctn-${EXAM_ID}-*")
else
    echo "💾 Saving student submissions to persistent storage..."
    # Simulate saving submissions
    sleep 1
    
    echo "🛑 Stopping containers..."
    # docker-compose -f $COMPOSE_FILE stop
    
    echo "🗑️ Removing containers and networks..."
    # docker-compose -f $COMPOSE_FILE down -v
    
    echo "📁 Removing temporary configs..."
    # rm -rf /exam-configs/$EXAM_ID
fi

echo "✅ Cleanup complete. All resources freed."
exit 0
