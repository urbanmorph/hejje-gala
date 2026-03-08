#!/bin/bash

# Script to run api.py continuously with configurable sleep interval and CLI options
# Usage: ./cron.sh [--sleep INTERVAL] [--options "OPTIONS"]

# Default values
SLEEP_INTERVAL=300  # 5 minutes default
CLI_OPTIONS="--generate-stats --generate-registration-stats --generate-leaderboards --upload"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --sleep)
            SLEEP_INTERVAL="$2"
            shift 2
            ;;
        --options)
            CLI_OPTIONS="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--sleep INTERVAL] [--options \"OPTIONS\"]"
            exit 1
            ;;
    esac
done

# Generate timestamp when script was initiated
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="api.py.log.$TIMESTAMP"

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Starting cron.sh at $(date)"
echo "Sleep interval: ${SLEEP_INTERVAL} seconds"
echo "CLI options: ${CLI_OPTIONS:-none}"
echo "Log file: ${LOG_FILE}"
echo "========================================" | tee -a "$LOG_FILE"

# Function to handle script termination
cleanup() {
    echo "" | tee -a "$LOG_FILE"
    echo "Script terminated at $(date)" | tee -a "$LOG_FILE"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Main loop
ITERATION=1
while true; do
    echo "" | tee -a "$LOG_FILE"
    echo "========================================" | tee -a "$LOG_FILE"
    echo "Iteration $ITERATION - $(date)" | tee -a "$LOG_FILE"
    echo "========================================" | tee -a "$LOG_FILE"
    
    # Run api.py with the specified options and log all output
    python3 api.py $CLI_OPTIONS 2>&1 | tee -a "$LOG_FILE"
    
    EXIT_CODE=${PIPESTATUS[0]}
    
    echo "" | tee -a "$LOG_FILE"
    echo "api.py exited with code: $EXIT_CODE" | tee -a "$LOG_FILE"
    echo "Sleeping for ${SLEEP_INTERVAL} seconds..." | tee -a "$LOG_FILE"
    
    sleep "$SLEEP_INTERVAL"
    ITERATION=$((ITERATION + 1))
done

