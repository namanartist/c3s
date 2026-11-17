import sys
from pathlib import Path

# Add ai-engine directory to sys.path so modules can be imported directly
ai_engine_root = Path(__file__).resolve().parent.parent
if str(ai_engine_root) not in sys.path:
    sys.path.insert(0, str(ai_engine_root))
