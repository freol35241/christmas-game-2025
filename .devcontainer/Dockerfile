FROM mcr.microsoft.com/devcontainers/base:ubuntu-22.04

# Avoid prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    # X11 and VNC for Godot display
    xvfb \
    x11vnc \
    novnc \
    websockify \
    fluxbox \
    # Audio (for future sound support)
    pulseaudio \
    # OpenGL support
    libgl1-mesa-glx \
    libgl1-mesa-dri \
    libegl1-mesa \
    libgles2-mesa \
    # Godot dependencies
    libxcursor1 \
    libxinerama1 \
    libxrandr2 \
    libxi6 \
    libfontconfig1 \
    libfreetype6 \
    libasound2 \
    libpulse0 \
    # Python dependencies for OpenCV/MediaPipe
    libsm6 \
    libxext6 \
    libxrender1 \
    libglib2.0-0 \
    # Build tools
    wget \
    unzip \
    curl \
    git \
    # Web server
    nginx-light \
    && rm -rf /var/lib/apt/lists/*

# Install Godot 4.2.2 (stable)
ARG GODOT_VERSION=4.2.2
ARG GODOT_RELEASE=stable

RUN wget -q https://github.com/godotengine/godot/releases/download/${GODOT_VERSION}-${GODOT_RELEASE}/Godot_v${GODOT_VERSION}-${GODOT_RELEASE}_linux.x86_64.zip \
    && unzip Godot_v${GODOT_VERSION}-${GODOT_RELEASE}_linux.x86_64.zip \
    && mv Godot_v${GODOT_VERSION}-${GODOT_RELEASE}_linux.x86_64 /usr/local/bin/godot \
    && chmod +x /usr/local/bin/godot \
    && rm Godot_v${GODOT_VERSION}-${GODOT_RELEASE}_linux.x86_64.zip

# Install Godot export templates
RUN mkdir -p /home/vscode/.local/share/godot/export_templates/${GODOT_VERSION}.${GODOT_RELEASE} \
    && wget -q https://github.com/godotengine/godot/releases/download/${GODOT_VERSION}-${GODOT_RELEASE}/Godot_v${GODOT_VERSION}-${GODOT_RELEASE}_export_templates.tpz \
    && unzip Godot_v${GODOT_VERSION}-${GODOT_RELEASE}_export_templates.tpz \
    && mv templates/* /home/vscode/.local/share/godot/export_templates/${GODOT_VERSION}.${GODOT_RELEASE}/ \
    && rm -rf templates Godot_v${GODOT_VERSION}-${GODOT_RELEASE}_export_templates.tpz

# Set up VNC and noVNC
RUN mkdir -p /root/.vnc \
    && x11vnc -storepasswd godot /root/.vnc/passwd

# Configure nginx for serving tablet build
COPY .devcontainer/nginx.conf /etc/nginx/sites-available/default

# Set ownership for vscode user
RUN chown -R vscode:vscode /home/vscode

# Environment
ENV DISPLAY=:1
ENV GODOT_EDITOR=/usr/local/bin/godot

WORKDIR /workspace
