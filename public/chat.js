const net = require('net');
const dns = require('dns');

const $ = require('jquery');

const { ipcRenderer } = require('electron');

let $chatWindow = $('#messages');

let me = "";
let nicks = {};

ipcRenderer.on('authdata', (e, data) => {
    try {
        console.log(new TextDecoder("utf-8").decode(data));
        let data2 = JSON.parse(new TextDecoder("utf-8").decode(data).trim());
        me = data2.id;
        nicks[me] = data.username;
        ipcRenderer.send('sendchatdata', JSON.stringify({
            intent: "claim",
            data: data2.id
        }));
    } catch (error) {
        throw error
    }
});

ipcRenderer.on('chatdata', (e, data) => {
    try {
        let data2 = JSON.parse(new TextDecoder("utf-8").decode(data).toString().trim()).data;
        if(!data2.from) {
            printMessage("server", data2.content);
        } else {
            printMessage(data2.from, data2.content);
        }
    } catch (error) {
        throw error;  
    }
});

// Terra made this is pretty ebic
function printMessage(fromUser, message) {
    var $user = $('<a class="username">').text(`[${nicks[fromUser] ? nicks[fromUser] : fromUser}]`);
    $user.on('contextmenu', () => {
        dialogs.prompt(`Set nickname for ${fromUser}`, "", (nick) => {
            nicks[fromUser] = nick;
        });
    })

    let mentions  = message.match(/<@(.*)>/gi);
    const get_nick = (n) => {return nicks[n] ? nicks[n] : n; }
    
    if(mentions) {                    
        mentions.forEach((m) => {
            message = message.replace(m, `<span class="mention">@${get_nick(m.slice(2, -1))}</span>`);
            if(get_nick(m) == me && fromUser !== me) {
                var notify = new Notification(get_nick(m), {
                    body: message
                });
            }
        });
    }

    if (fromUser === me) {
        $user.addClass('me');
    } else if(fromUser === "server") {
        $user.addClass('server');
    }

    var $message = $('<span class="message">').append(message);
    var $container = $('<div class="message-container">');
    $container.append($user).append($message);
    $chatWindow.append($container);
    $chatWindow.scrollTop($chatWindow[0].scrollHeight);
}

$("#chat-input").on('keyup', function (e) {
    if (e.keyCode === 13) {
        ipcRenderer.send('sendchatdata', JSON.stringify({
            intent: "message",
            data: e.target.value
        }));
        e.target.value = "";
    }
});

(()=>{
    ipcRenderer.send('win2ready');
})();
