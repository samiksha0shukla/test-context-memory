import sys
import os

# Add the backend directory to sys.path so that imports within backend/main.py work
sys.path.append(os.path.join(os.path.dirname(__file__), '../backend'))

from main import app
