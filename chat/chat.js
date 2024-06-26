const socket = io('https://m00nserver.onrender.com'); // replace with your actual Render app URL

const chat = document.getElementById('chat');
const nicknameInput = document.getElementById('nicknameInput');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const chatLinkContainer = document.getElementById('chatLink');
const copyLinkButton = document.getElementById('copyLinkButton');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const userCount = document.getElementById('userCount');

let messages = [];
let participants = new Set();
let roomId = null;
let nickname = null;
let isConnected = false; // Track connection status

const moonPhases = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];

const getMoonPhase = () => {
    const today = new Date();
    const lp = 2551443;
    const new_moon = new Date(2021, 0, 13, 5, 0, 0);
    const phase = ((today.getTime() - new_moon.getTime()) / 1000) % lp;
    const phaseIndex = Math.floor(phase / (lp / 8));
    return moonPhases[phaseIndex];
};

document.getElementById('moonPhase').textContent = getMoonPhase();

copyLinkButton.addEventListener('click', async () => {
    const link = chatLinkContainer.textContent;
    try {
        await navigator.clipboard.writeText(link);
        alert('Link copied to clipboard!');
    } catch (err) {
        console.error('Error copying link: ', err);
        alert('Failed to copy the link. Please try again.');
    }
});

const renderMessages = () => {
    chat.innerHTML = '';
    messages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.textContent = `${message.nickname}: ${message.text}`;
        chat.appendChild(messageDiv);
    });
    chat.scrollTop = chat.scrollHeight;
};

const renderParticipants = () => {
    userCount.textContent = participants.size;
};

const sendMessage = () => {
    const message = messageInput.value.trim();
    if (nickname && message) {
        const newMessage = { nickname, text: message };
        socket.emit('sendMessage', newMessage);
        messageInput.value = '';
    } else if (!nickname) {
        alert('Please enter a nickname to send a message.');
    }
};

sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

const getQueryParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        id: urlParams.get('id')
    };
};

socket.on('connect', () => {
    statusIndicator.className = 'connected';
    statusText.textContent = 'Connected';
});

socket.on('disconnect', () => {
    statusIndicator.className = 'disconnected';
    statusText.textContent = 'Disconnected';
    isConnected = false;
});

const initializeSocketListeners = () => {
    socket.off('loadMessages');
    socket.on('loadMessages', (loadedMessages) => {
        messages = loadedMessages;
        renderMessages();
    });

    socket.off('newMessage');
    socket.on('newMessage', (message) => {
        messages.push(message);
        renderMessages();
    });

    socket.off('updateParticipants');
    socket.on('updateParticipants', (newParticipants) => {
        participants = new Set(newParticipants);
        renderParticipants();
    });
};

const joinRoom = () => {
    if (roomId && !isConnected) {
        socket.emit('joinRoom', roomId, nickname);
        isConnected = true; // Prevent multiple connections
    }
};

window.onload = () => {
    const params = getQueryParams();
    roomId = params.id || Math.random().toString(36).substr(2, 9);
    chatLinkContainer.textContent = `${window.location.origin}${window.location.pathname}?id=${roomId}`;

    initializeSocketListeners();
    joinRoom(); // Automatically join room on load to view chat history

    nicknameInput.addEventListener('change', () => {
        nickname = nicknameInput.value.trim();
        if (nickname) {
            joinRoom();
        }
    });
};
