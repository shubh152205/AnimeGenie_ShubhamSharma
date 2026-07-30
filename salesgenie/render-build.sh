#!/usr/bin/env bash
# exit on error
set -o errexit

# Install Python dependencies
pip install -r backend/requirements.txt

# Download and install a static build of ffmpeg for audio processing on Render
echo "Downloading ffmpeg..."
wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
tar -xf ffmpeg-release-amd64-static.tar.xz
mkdir -p $HOME/bin
cp ffmpeg-*-amd64-static/ffmpeg $HOME/bin/
cp ffmpeg-*-amd64-static/ffprobe $HOME/bin/
export PATH=$HOME/bin:$PATH
echo "ffmpeg installed successfully"
