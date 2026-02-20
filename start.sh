#!/bin/bash
# start.sh

# Start the app in the background
npm run preview --host &

# Wait a few seconds for the app to start
sleep 5

# Keep the container running
tail -f /dev/null
