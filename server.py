from typing import List, Dict, Any

import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# =========================================================
# LUNEXA AI
# =========================================================

app = FastAPI(title="Lunexa AI")


app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


# =========================================================
# OLLAMA LOCAL
# =========================================================

OLLAMA_URL = "http://127.0.0.1:11434/api/chat"
MODEL = "qwen2.5:3b"


# =========================================================
# SYSTEM PROMPT
# =========================================================

SYSTEM_PROMPT = """
You are Lunexa AI, a universal AI assistant.

LANGUAGE:
- Understand English, Hindi and natural Hinglish.
- Reply naturally in the user's language.
- Match the user's style.

GENERAL:
Help with:
- General questions
- Normal conversation
- Daily life
- Planning
- Productivity
- Writing
- Rewriting
- Summaries
- Calculations
- Coding
- Debugging
- Brainstorming
- Learning

STUDY:
Help students from:
- School
- College
- University
- NEET
- JEE
- CUET
- Other competitive exams

For study questions:
- Explain clearly.
- Give correct formulas.
- Give correct units.
- Check calculations.
- Create notes, MCQs and quizzes.
- Prefer NCERT-aligned information for NEET when relevant.
- Do not invent scientific facts.

CODING:
- Give practical runnable code.
- Explain errors clearly.
- Preserve the user's existing technology when possible.

CONVERSATION:
- Normal casual conversation is allowed.
- Be friendly and natural.
- Do not sound unnecessarily robotic.

STYLE:
- Be concise for simple questions.
- Give structured answers for complex questions.
- Use headings and bullets when useful.
- Do not add unnecessary conclusions.
- Never claim you performed an action you cannot actually perform.
"""


# =========================================================
# CHAT REQUEST
# =========================================================

class ChatRequest(BaseModel):
	message: str
	history: List[Dict[str, Any]] = []


# =========================================================
# OLLAMA
# =========================================================

def ask_ollama(message: str, history=None):

	messages = [
		{
			"role": "system",
			"content": SYSTEM_PROMPT
		}
	]

	if history:
		for item in history[-10:]:
			role = item.get("role")
			content = item.get("content")

			if role in ["user", "assistant"] and content:
				messages.append({
					"role": role,
					"content": str(content)
				})

	messages.append({
		"role": "user",
		"content": message
	})

	try:
		response = requests.post(
			OLLAMA_URL,
			json={
				"model": MODEL,
				"messages": messages,
				"stream": False
			},
			timeout=120
		)

		response.raise_for_status()

		data = response.json()

		reply = data.get("message", {}).get("content", "")

		if not reply:
			return "Bhai, mujhe response nahi mila."

		return reply.strip()

	except requests.exceptions.ConnectionError:
		return (
			"Bhai, Ollama connect nahi ho raha. "
			"Ollama start karke dobara try karo."
		)

	except requests.exceptions.Timeout:
		return (
			"Bhai, Ollama response dene mein zyada time le raha hai."
		)

	except Exception as e:
		print("OLLAMA ERROR:", e)
		return "Bhai, AI response mein error aa gaya."


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
	return {
		"app": "Lunexa AI",
		"status": "online",
		"provider": "Ollama Local",
		"model": MODEL,
		"version": "v1"
	}


# =========================================================
# CHAT
# =========================================================

@app.post("/chat")
def chat(request: ChatRequest):

	message = request.message.strip()

	if not message:
		return {
			"reply": "Please type something."
		}

	reply = ask_ollama(
		message,
		request.history
	)

	return {
		"reply": reply
	}


# =========================================================
# CHAT STREAM
# =========================================================

@app.post("/chat-stream")
def chat_stream(request: ChatRequest):

	message = request.message.strip()

	if not message:
		return {
			"reply": "Please type something."
		}

	reply = ask_ollama(
		message,
		request.history
	)

	return {
		"reply": reply
	}
