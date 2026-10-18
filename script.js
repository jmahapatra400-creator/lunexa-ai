const API_BASE = "http://127.0.0.1:8001";

const homePage = document.getElementById("homePage");
const assistantPage = document.getElementById("assistantPage");
const studyPage = document.getElementById("studyPage");
const homeNav = document.getElementById("homeNav");
const assistantNav = document.getElementById("assistantNav");
const studyNav = document.getElementById("studyNav");
const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");
const homeInput = document.getElementById("homeInput");
const homeSendBtn = document.getElementById("homeSendBtn");
const homeVoiceBtn = document.getElementById("homeVoiceBtn");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const voiceBtn = document.getElementById("voiceBtn");
const messages = document.getElementById("messages");
const typing = document.getElementById("typing");
const newChatBtn = document.getElementById("newChatBtn");
const clearChatBtn = document.getElementById("clearChatBtn");
const studyAskBtn = document.getElementById("studyAskBtn");

let history = [];
try {
	history = JSON.parse(localStorage.getItem("lunexa_history") || "[]");
	if (!Array.isArray(history)) history = [];
} catch (error) {
	history = [];
}

function saveHistory() {
	try {
		localStorage.setItem("lunexa_history", JSON.stringify(history));
	} catch (error) {
		console.log("History save skipped.");
	}
}

function showPage(page) {
	homePage.classList.remove("active");
	assistantPage.classList.remove("active");
	studyPage.classList.remove("active");
	homeNav.classList.remove("active");
	assistantNav.classList.remove("active");
	studyNav.classList.remove("active");

	if (page === "home") {
		homePage.classList.add("active");
		homeNav.classList.add("active");
	}
	if (page === "assistant") {
		assistantPage.classList.add("active");
		assistantNav.classList.add("active");
		renderMessages();
		setTimeout(() => chatInput.focus(), 100);
	}
	if (page === "study") {
		studyPage.classList.add("active");
		studyNav.classList.add("active");
	}
	if (sidebar) sidebar.classList.remove("open");
}

homeNav.addEventListener("click", () => showPage("home"));
assistantNav.addEventListener("click", () => showPage("assistant"));
studyNav.addEventListener("click", () => showPage("study"));
if (menuBtn) menuBtn.addEventListener("click", () => sidebar.classList.toggle("open"));

function addMessage(role, content) {
	history.push({ role, content: String(content) });
	saveHistory();
	renderMessages();
}

function renderMessages() {
	messages.innerHTML = "";
	if (history.length === 0) {
		messages.innerHTML = `
			<div class="message ai">
				<div class="bubble">
					Hey 👋 I'm Lunexa AI.<br><br>
					Ask me anything — study, coding,
					general questions, calculations,
					planning, writing, or just talk with me.
				</div>
			</div>`;
		return;
	}
	history.forEach(item => {
		const wrapper = document.createElement("div");
		wrapper.className = item.role === "user" ? "message user" : "message ai";
		const bubble = document.createElement("div");
		bubble.className = "bubble";
		bubble.textContent = item.content;
		wrapper.appendChild(bubble);
		messages.appendChild(wrapper);
	});
	messages.scrollTop = messages.scrollHeight;
}

let sending = false;
async function sendMessage(text) {
	text = String(text || "").trim();
	if (!text || sending) return;
	showPage("assistant");
	const previousHistory = history.slice(-10).map(item => ({
		role: item.role,
		content: item.content
	}));
	addMessage("user", text);
	chatInput.value = "";
	typing.classList.add("show");
	sending = true;
	sendBtn.disabled = true;
	homeSendBtn.disabled = true;

	try {
		const response = await fetch(`${API_BASE}/chat`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ message: text, history: previousHistory })
		});
		if (!response.ok) throw new Error(`Backend error: ${response.status}`);
		const data = await response.json();
		const answer = data.reply || data.response || "Sorry bhai, abhi response nahi mila.";
		addMessage("assistant", answer);
	} catch (error) {
		console.error("Lunexa error:", error);
		addMessage("assistant", "Bhai, Lunexa backend se connection nahi ho raha. Check karo ki Ollama aur server dono running hain.");
	} finally {
		typing.classList.remove("show");
		sending = false;
		sendBtn.disabled = false;
		homeSendBtn.disabled = false;
		chatInput.focus();
	}
}

homeSendBtn.addEventListener("click", () => {
	const text = homeInput.value;
	homeInput.value = "";
	sendMessage(text);
});
sendBtn.addEventListener("click", () => sendMessage(chatInput.value));

homeInput.addEventListener("keydown", event => {
	if (event.key === "Enter" && !event.shiftKey) {
		event.preventDefault();
		const text = homeInput.value;
		homeInput.value = "";
		sendMessage(text);
	}
});
chatInput.addEventListener("keydown", event => {
	if (event.key === "Enter" && !event.shiftKey) {
		event.preventDefault();
		sendMessage(chatInput.value);
	}
});

document.querySelectorAll(".quick-card").forEach(button => {
	button.addEventListener("click", () => {
		const prompt = button.dataset.prompt;
		if (prompt) sendMessage(prompt);
	});
});
document.querySelectorAll(".study-card").forEach(button => {
	button.addEventListener("click", () => {
		const prompt = button.dataset.prompt;
		if (prompt) sendMessage(prompt);
	});
});

studyAskBtn.addEventListener("click", () => {
	showPage("assistant");
	setTimeout(() => chatInput.focus(), 100);
});

function clearChat() {
	history = [];
	saveHistory();
	renderMessages();
}
newChatBtn.addEventListener("click", clearChat);
clearChatBtn.addEventListener("click", clearChat);

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
function setupVoice(button, input) {
	if (!button || !input) return;
	if (!SpeechRecognition) {
		button.title = "Voice input is not supported in this browser";
		return;
	}
	const recognition = new SpeechRecognition();
	recognition.continuous = false;
	recognition.interimResults = false;
	recognition.maxAlternatives = 1;

	function chooseLanguage() {
		recognition.lang = /[\u0900-\u097F]/.test(input.value.trim()) ? "hi-IN" : "en-IN";
	}
	button.addEventListener("click", () => {
		if (button.classList.contains("listening")) {
			try { recognition.stop(); } catch (error) {}
			return;
		}
		chooseLanguage();
		button.classList.add("listening");
		button.textContent = "⏹";
		try {
			recognition.start();
		} catch (error) {
			console.log("Voice start error:", error);
			button.classList.remove("listening");
			button.textContent = "🎙";
		}
	});
	recognition.onstart = () => {
		button.classList.add("listening");
		button.textContent = "⏹";
	};
	recognition.onresult = event => {
		const transcript = event.results[0][0].transcript.trim();
		if (!transcript) return;
		const oldText = input.value.trim();
		input.value = oldText ? oldText + " " + transcript : transcript;
		input.dispatchEvent(new Event("input", { bubbles: true }));
	};
	recognition.onerror = event => {
		console.log("Voice error:", event.error);
		button.classList.remove("listening");
		button.textContent = "🎙";
	};
	recognition.onend = () => {
		button.classList.remove("listening");
		button.textContent = "🎙";
	};
}

setupVoice(homeVoiceBtn, homeInput);
setupVoice(voiceBtn, chatInput);

function autoResize(textarea) {
	textarea.style.height = "auto";
	textarea.style.height = Math.min(textarea.scrollHeight, 140) + "px";
}
homeInput.addEventListener("input", () => autoResize(homeInput));
chatInput.addEventListener("input", () => autoResize(chatInput));

renderMessages();
showPage("home");
