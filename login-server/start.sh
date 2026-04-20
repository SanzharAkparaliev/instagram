#!/bin/bash
# Start virtual display
Xvfb :99 -screen 0 1280x720x24 &
sleep 1

# Start VNC server (no password)
x11vnc -display :99 -forever -nopw -shared -rfbport 5900 &
sleep 1

# Start noVNC web client (websocket proxy)
websockify --web /usr/share/novnc 6080 localhost:5900 &

# Start login server
exec node login-server.js
