#!/bin/bash

# ignore build step for all non stage/main branches

echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

if [[ "$VERCEL_GIT_COMMIT_REF" == "stage" || "$VERCEL_GIT_COMMIT_REF" == "main"  ]] ; then  
  echo "✅ - Build can proceed"
  exit 1;
else
  echo "🛑 - Build cancelled"
  exit 0;
fi