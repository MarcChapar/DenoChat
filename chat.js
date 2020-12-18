import { v4 } from "https://deno.land/std@0.81.0/uuid/mod.ts";
import { isWebSocketCloseEvent } from "https://deno.land/std@0.81.0/ws/mod.ts";

const usersMap = new Map();
const groupsMap = new Map()
const messagesMap = new Map()

export default async function chat(ws) {
    const userId = v4.generate();

    for await (let data of ws) {
        const event = typeof data === 'string' ? JSON.parse(data) : data;
        if (isWebSocketCloseEvent(data)) {
            console.log(data)
            leaveGroup(userId)
            break;
        }

        let userObject;
        switch (event.event) {
            case 'join':
                userObject = {
                    userId: userId,
                    username: event.username,
                    groupName: event.groupName,
                    ws
                }
                usersMap.set(userId, userObject);
                const users = groupsMap.get(event.groupName) || []
                users.push(userObject);
                groupsMap.set(event.groupName, users);
                
                emitUserList(event.groupName);
                emitPreviousMessages(event.groupName, ws);
                break;
            case 'message':
                userObject = usersMap.get(userId);
                const message = {
                    userId,
                    username: userObject.username,
                    message: event.data,
                }

                const messages = messagesMap.get(userObject.groupName) || []
                messages.push(message);
                messagesMap.set(userObject.groupName, messages);
                emitMessage(userObject.groupName, message, userId);
                break;
        }
    }
}

function emitUserList(groupName) {
    const users = groupsMap.get(groupName) || [];
    for (const user of users) {
        const event = {
            event: 'users',
            data: getDisplayUsers(groupName, users),
        }

        user.ws.send(JSON.stringify(event));
    }
};

function emitMessage(groupName, message, userId) {
    const users = groupsMap.get(groupName) || [];
    for (const user of users) {
        const tmpMessage = {
            ...message,
            sender: user.userId === userId ? 'me' : userId
        }
        const event = {
            event: 'message',
            data: tmpMessage,
        }

        user.ws.send(JSON.stringify(event));
    }
}

function emitPreviousMessages(groupName, ws) {
    const messages = messagesMap.get(groupName) || []

    const event = {
        event: 'previousMessages',
        data: messages
    }

    ws.send(JSON.stringify(event))
}

function getDisplayUsers(groupName, users) {
    return users.map(u => {
        return {userId: u.userId, username: u.username}
    })
}

function leaveGroup(userId) {
    const userObject = usersMap.get(userId);
    if (!userObject){
        return;
    }
    let users = groupsMap.get(userObject.groupName) || [];
    users = users.filter(u => u.userId !== userId);
    groupsMap.set(userObject.groupName, users)
    usersMap.delete(userId);
    emitUserList(userObject.groupName);
}