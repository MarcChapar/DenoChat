let ws;
let chatUsersContainer = document.querySelector('#chatUsers')
let chatUsersCount = document.querySelector('#chatUsersCount')
let messageForm = document.querySelector('#messageForm')
let messageInput = document.querySelector('#messageInput')
let chatMessages = document.querySelector('#chatMessages')
let chatHeader = document.querySelector('#chatHeader')
let leaveButton = document.querySelector('#leaveButton')
var connectedUsersColors = {}

window.addEventListener('DOMContentLoaded', () => {
    let protocol = window.location.protocol === "http:" ? "ws" : "wss";
    ws = new WebSocket(`${protocol}://${window.location.host}/ws`);
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
        url: params.get("url"),
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
        url: queryParams.url
    }

    ws.send(JSON.stringify(event))
}


function onMessageReceived(event) {
    const parsedData = JSON.parse(event.data);
    console.log(parsedData);
    switch (parsedData.event) {
        case 'users':
            chatUsersContainer.innerHTML = '';
            chatUsersCount.innerHTML = parsedData.data.length;
            parsedData.data.forEach(user => {
                connectedUsersColors[user.username] = getRandomColor();
                const userElement = document.createElement('div')
                userElement.classList.add('user')
                userElement.innerHTML = `<img class="user-pic" src="${user.url ? user.url : 'images/user-placeholder.jpg'}">${user.username}`;
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
    ${data.sender === 'me' ? '' : `<span class="username-title" style="color: ${this.connectedUsersColors[data.username] ?? getRandomColor()}">${data.username}</span>`}
    ${data.message}
    `
    chatMessages.appendChild(messageElement);
}

function getRandomColor() {
    return '#'+(Math.random()*0xFFFFFF<<0).toString(16);
  }