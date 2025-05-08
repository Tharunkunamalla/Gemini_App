const typingForm = document.querySelector(".typing-form");
const chatlist = document.querySelector(".chat-list");
const suggestionItems = document.querySelectorAll(
  ".suggestion-list .suggestion"
);
const toggleButton = document.querySelector("#Toggle_button");
const deleteButton = document.querySelector("#delete_button");

let UserMessage = null;
let isResponseGenerating = false;

const API_KEY = `AIzaSyD3_tPErYNZPIH3QPyE3gdVugIynonimPI`;
let API_url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// Creating messages
const createMessage = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Show Typing Effects
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
  const words = text.split(" ");
  let currentWordIndex = 0;

  const typingInterval = setInterval(() => {
    textElement.innerText +=
      (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex++];
    incomingMessageDiv.querySelector(".icon").classList.add("hide");
    if (currentWordIndex === words.length) {
      clearInterval(typingInterval);
      isResponseGenerating = false;
      localStorage.setItem("savedChats", chatlist.innerHTML);
      incomingMessageDiv.querySelector(".icon").classList.remove("hide");
      chatlist.scrollTo(0, chatlist.scrollHeight);
    }
  }, 75);
};

// API Responses
const generateAPIresponse = async (incomingMessageDiv) => {
  const textElement = incomingMessageDiv.querySelector(".text");
  try {
    const response = await fetch(API_url, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{text: UserMessage}],
          },
        ],
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error.messageText);

    const apiResponse = data?.candidates[0]?.content.parts[0]?.text.replace(
      /\*\*(.*?)\*\*/g,
      "$1"
    );
    showTypingEffect(apiResponse, textElement, incomingMessageDiv);
  } catch (error) {
    isResponseGenerating = false;
    textElement.innerText = error.messageText;
    textElement.classList.add("error");
  } finally {
    incomingMessageDiv.classList.remove("loading");
  }
};

// Loading Animation
const showLoadingAnimation = () => {
  const outgoing = `
    <div class="message-content">
                    <img src="assets/img/gemini.jpg" alt="gemini image"
                        class="avatar">
                    <p class="text"></p>
                    <div class="loading-indicator">
                        <div class="loading-bar"></div>
                        <div class="loading-bar"></div>
                        <div class="loading-bar"></div>
                    </div>
                </div>
                <span onclick="copyMessage(this)" class="icon material-symbols-rounded">
                    content_copy
                </span>
            </div>`;

  const incomingMessageDiv = createMessage(outgoing, "incoming", "loading");
  chatlist.appendChild(incomingMessageDiv);
  chatlist.scrollTo(0, chatlist.scrollHeight);

  generateAPIresponse(incomingMessageDiv);
};

// Copying the Text in Given by the AI
const copyMessage = (copyIcon) => {
  const messageText = copyIcon.parentElement.querySelector(".text").innerText;

  navigator.clipboard.writeText(messageText);
  copyIcon.innerText = "done";
  setTimeout(() => (copyIcon.innerText = "content_copy"), 1000);
};

// Outgoing Chat
const handleOutgoingChat = () => {
  UserMessage =
    typingForm.querySelector(".typing-input").value.trim() || UserMessage;
  if (!UserMessage || isResponseGenerating) return;

  isResponseGenerating = true;

  const userChat = `
                <div class="message-content">
                    <img src="assets/img/user.jpg" alt="avatar" class="avatar">
                    <p class="text"></p>
                </div>`;

  const outgoingMessageDiv = createMessage(userChat, "outgoing");
  outgoingMessageDiv.querySelector(".text").innerText = UserMessage;
  chatlist.appendChild(outgoingMessageDiv);

  typingForm.reset();
  chatlist.scrollTo(0, chatlist.scrollHeight);
  document.body.classList.add("hide-header");
  setTimeout(showLoadingAnimation, 500);
};

// Suggestion List
suggestionItems.forEach((suggestionItem) => {
  suggestionItem.addEventListener("click", () => {
    UserMessage = suggestionItem.querySelector(".text").innerText;
    handleOutgoingChat();
  });
});

// Toggle Theme Button
document.addEventListener("DOMContentLoaded", () => {
  loadLocalStorage();
});

toggleButton.addEventListener("click", () => {
  const light = document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", light ? "light_mode" : "dark_mode");
  toggleButton.innerText = light ? "dark_mode" : "light_mode";
});

// Delete Button
deleteButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all messages?")) {
    localStorage.removeItem("savedChats");
    loadLocalStorage();
  }
});

// Creating a Local storage to keep data of light and dark theme when we refresh the page
const loadLocalStorage = () => {
  const savedChats = localStorage.getItem("savedChats");
  const light = localStorage.getItem("themeColor") === "light_mode";
  document.body.classList.toggle("light_mode", light);
  toggleButton.innerText = light ? "dark_mode" : "light_mode";

  chatlist.innerHTML = savedChats || "";

  document.body.classList.toggle("hide-header", !!savedChats);
  chatlist.scrollTo(0, chatlist.scrollHeight);
};

// Submit Button
typingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  handleOutgoingChat();
});
