#!/usr/bin/env bash
cd "$(dirname "$0")"
/Users/shraddharao/.local/share/virtualenvs/python-IRqLjKkE/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
