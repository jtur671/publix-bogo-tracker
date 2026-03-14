#!/bin/bash
cd "$(dirname "$0")"
CLIPPER_API_KEY=localtest PORT=10001 node server.js &
SERVER_PID=$!
sleep 3
curl -s -X POST http://localhost:10001/clip \
  -H "Content-Type: application/json" \
  -H "x-api-key: localtest" \
  -d '{"email":"kristinwhitbeck@gmail.com","password":"bonniegoo1"}'
echo ""
kill $SERVER_PID
