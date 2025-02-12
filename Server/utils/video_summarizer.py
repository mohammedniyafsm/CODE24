#!/usr/bin/env python3
import sys
import os
from pathlib import Path
import requests
import time
from openai import OpenAI
import urllib3
import certifi

# Your existing Python code here, modified to accept command line arguments
def main():
    if len(sys.argv) < 2:
        print("Error: Video URL is required")
        sys.exit(1)
        
    video_url = sys.argv[1]
    try:
        result = video_to_summary(video_url)
        print(result["summary"])
    except Exception as e:
        print(f"Error processing video: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main() 