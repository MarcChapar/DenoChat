let ws;
let chatUsersContainer = document.querySelector('#chatUsers')
let chatUsersCount = document.querySelector('#chatUsersCount')
let messageForm = document.querySelector('#messageForm')
let messageInput = document.querySelector('#messageInput')
let chatMessages = document.querySelector('#chatMessages')
let chatHeader = document.querySelector('#chatHeader')
let leaveButton = document.querySelector('#leaveButton')

window.addEventListener('DOMContentLoaded', () => {
    ws = new WebSocket('ws://localhost:3000/ws');
    ws.addEventListener('open', onConnectionOpen);
    ws.addEventListener('message', onMessageReceived);

});

messageForm.onsubmit = (ev) => {
    ev.preventDefault();
    if (!messageInput.value || messageInput.value.trim().length === 0) {
        messageInput.value = ''
        return;
    }
    const event = {
        event: 'message',
        data: messageInput.value,
    }

    ws.send(JSON.stringify(event));
    messageInput.value = "";
}

leaveButton.onclick = () => {
    window.location.href = 'index.html'
}

function onConnectionOpen() {
    const params = new URLSearchParams(window.location.search)
    const queryParams = {
        username: params.get("username"),
        group: params.get("group")
    }
    if (!queryParams.username || !queryParams.group) {
        window.location.href = 'index.html'
    } else {
        const groupTitle = document.createElement('h2')
        groupTitle.innerHTML = queryParams.group
        chatHeader.prepend(groupTitle)
    }   
    const event = {
        event: 'join',
        groupName: queryParams.group,
        username: queryParams.username,
    }
    ws.send(JSON.stringify(event))
}


function onMessageReceived(event) {
    const parsedData = JSON.parse(event.data);
    switch (parsedData.event) {
        case 'users':
            chatUsersContainer.innerHTML = '';
            chatUsersCount.innerHTML = parsedData.data.length;
            parsedData.data.forEach(user => {
                const userElement = document.createElement('div')
                userElement.innerHTML = user.username;
                chatUsersContainer.appendChild(userElement);
            });
            break;
        case 'message':
            const isScrollAtBottom = Math.floor(chatMessages.offsetHeight + chatMessages.scrollTop) === chatMessages.scrollHeight;
            appendMessage(parsedData.data)
            if (isScrollAtBottom) {
                chatMessages.scrollTop = 1000000;
            }
            break;
        case 'previousMessages':
            parsedData.data.forEach(m => {
                appendMessage(m)
            })
        }
}

function appendMessage(data) {
    const messageElement = document.createElement('div');
    messageElement.className = `message-card ${data.sender === 'me' ? 'own-message-card' : ''}`
    messageElement.innerHTML = `
    ${data.sender === 'me' ? '' : `<h6>${data.username}</h6><br>`}
    ${data.message}
    `
    chatMessages.appendChild(messageElement);
}