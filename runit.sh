#!/bin/bash -u
# We use set -e and bash with -u to bail on first non zero exit code of any
# processes launched or upon any unbound variable.
# We use set -x to print commands before running them to help with
# debugging.
set -ex
export CLOUD_SESSION_URL=https://wf9uxwfrnh.execute-api.us-east-1.amazonaws.com/dev/smart-tap
node pn-cloud.js
