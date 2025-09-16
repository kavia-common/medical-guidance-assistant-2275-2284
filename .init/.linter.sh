#!/bin/bash
cd /home/kavia/workspace/code-generation/medical-guidance-assistant-2275-2284/disease_medicine_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

