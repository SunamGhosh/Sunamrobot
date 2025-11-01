// ---------- DOM elements ----------
const inputField = document.querySelector('.ask');
const responseContainer = document.querySelector('.response-container');
const questionAsked = document.querySelector('.question-asked p');
const responseText = document.querySelector('.response-text p');
const historyDiv = document.getElementById('history');
const historyIcon = document.getElementById('history-icon');

let chatHistory = [];

// ---------- History helpers ----------
function saveToHistory(question, response) {
  chatHistory.unshift({ question, response });
  if (chatHistory.length > 10) chatHistory = chatHistory.slice(0, 10);
  updateHistoryDisplay();
}

function updateHistoryDisplay() {
  historyDiv.innerHTML = '';
  chatHistory.forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <div class="question">${item.question}</div>
      <div class="preview">${item.response.substring(0, 80)}...</div>`;
    div.onclick = () => loadChat(item.question, item.response);
    historyDiv.appendChild(div);
  });
}

function loadChat(q, r) {
  questionAsked.textContent = q;
  responseText.innerHTML = r;
  responseContainer.classList.add('show');
  responseContainer.scrollIntoView({ behavior: 'smooth' });
}

// ---------- Markdown → HTML ----------
function formatResponse(text) {
  return text
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    .replace(/^\* (.*)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n/g, '<br>');
}

// ---------- Backend call (FRONTEND VERSION) ----------
async function gemini(prompt) {
  // Show loading
  questionAsked.textContent = prompt;
  responseText.textContent = 'Thinking...';
  responseContainer.classList.add('show');

  try {
    const res = await fetch('https://chatbot-app-m8uw.onrender.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    console.log('Response status:', res.status);  // Debug

    const text = await res.text();

    if (!res.ok) throw new Error(`Server error ${res.status}: ${text}`);
    if (!text.trim()) throw new Error('Empty response from server');

    const data = JSON.parse(text);
    if (!data.reply) throw new Error('No reply in response');

    console.log('Got reply:', data.reply.substring(0, 100));  // Debug

    const html = formatResponse(data.reply);
    responseText.innerHTML = html;
    saveToHistory(prompt, html);

  } catch (err) {
    console.error('Frontend Error:', err);
    responseText.textContent = `Error: ${err.message}. Please check console.`;
    saveToHistory(prompt, `Error: ${err.message}`);
  }
}

// ---------- Input handlers ----------
async function sendMessage() {
  const prompt = inputField.value.trim();
  if (!prompt) return;
  await gemini(prompt);
  inputField.value = '';
}

// Send button
document.querySelector('.send-button').onclick = sendMessage;

// Enter key
inputField.onkeydown = e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

// History toggle
historyIcon.onclick = () => {
  historyDiv.classList.toggle('show');
  if (historyDiv.classList.contains('show')) updateHistoryDisplay();

};




