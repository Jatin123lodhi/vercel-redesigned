#! /bin/bash
echo "Hello World from main.sh"
# export GIT="$GIT"
export GIT_REPO_URL=$GIT_REPO_URL

git clone "$GIT_REPO_URL" /home/app/output
 
exec node script.js

