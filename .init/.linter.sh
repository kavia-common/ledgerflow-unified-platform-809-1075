#!/bin/bash
cd /home/kavia/workspace/code-generation/ledgerflow-unified-platform-809-1075/ledgerflow_backend_api
npm run lint
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi

