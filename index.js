
const http = require('http');
const TelegramBot = require("node-telegram-bot-api");
const fs = require('fs');

const token = "1802821128:AAHTsDcqYisWhwyzXnnaNO04_5zCnFwyXCU";
const port = 8000 || process.env.port;
// const host = 'localhost';

// const server = http.createServer((req, res) => {
//     res.write("server!!!");
//     res.end();
// }).listen(port);

const options = {
    webHook: {
        port: port
      }
}
const url = process.env.APP_URL || 'https://cyberbunker.herokuapp.com:443';
const bot = new TelegramBot(token, options);

bot.setWebHook(`${url}/bot${token}`);
// bot.setWebHook(`http://localhost:8000/bot${token}`)


let rooms = {}
let state = '';
const access = [];

// let rooms = {
//     code: {
//         players: [
//             player: {
//                 id: ''
//                 card: ''
//             }
//         ]
//     }
// }

// Object.defineProperty(rooms, {
//     set (target, prop, val) {

//     }
// })

const generateCode = () => {
    var text = "";
    var possible = "abcdefghijklmnopqrstuvwxyz1234567890";
    
    for( var i=0; i < 6; i++ ) 
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    // return String(text);
    return '5lp801';
}


bot.on('message', (msg) => {
    switch(state) {
        case 'create':
                let count = parseInt(msg.text);
                if (count < 1 || isNaN(count) || count > 20) {
                    bot.sendMessage(msg.from.id, "Ошибка! Не верно указанно количество человек");
                    return;
                }
                else {
                    let code = String(generateCode());
                    
                    rooms[code] = {
                        length: count,
                        players: [],
                        admin: msg.from.id
                    };
                    
                    bot.sendMessage(msg.from.id, `Комната на ${count} человек созданна, код - ${code}`);
                    bot.sendMessage(msg.from.id, `Чтобы начать игру отправьте /play`);
                    access.push(String(msg.from.id));
                    console.log(access);
                    (async () => {
                        await getDisaster(code);
                    })();
                }
                state = '';
            break;
        
        case "join":
            let enterCode = String(msg.text);
            
                if (rooms.hasOwnProperty(enterCode) && rooms[enterCode].players.length >= rooms[enterCode].length) {
                    bot.sendMessage(msg.from.id, "Слишком много человек");
                    return;
                }
            
                if (!rooms.hasOwnProperty(enterCode)) {
                    bot.sendMessage(msg.from.id, "Неверный код");
                    return;
                }
            
                if (rooms.hasOwnProperty(enterCode)) {

                    if (rooms[enterCode].players.includes(msg.from.id)) {
                        bot.sendMessage(msg.from.id, "Вы уже добавлены");
                        return;
                    }
                    else {
                        rooms[enterCode].players.push({"id": msg.from.id, "card": ""});
                        bot.sendMessage(msg.from.id, `Вы добавлены в комнату`);
                    }
                }  
                state = '';
                break;   
        default: return;
    }
})


bot.on('callback_query', (query) => {
  
    switch (query.data) {
        case 'create':
            state = 'create';
            bot.sendMessage(query.from.id, 'Введите количество участников');
            break;
        case 'join':
            state = 'join';
            bot.sendMessage(query.from.id, 'Введите пароль от комнаты');
        break;

        default: return;
    }
  })


// Send Disaster
const getDisaster = async (room) => {
    // console.log(rooms[room])
    const disasters = JSON.parse(fs.readFileSync('./disasters.json'));
    let newDisaster = '';

    await Object.keys(disasters).forEach((item, index) => {
        // console.log(item)
        let random = Math.floor(Math.random() * disasters[item].length);

        // let variable = [3, 4, 5]

        // if (index == 4) {
        //     for (let i = 0; i < 3; i++) {
        //         // console.log(newDisaster[item]);
        //         // newDisaster[item] = [];
        //         newDisaster[index].push(disasters[item][Math.floor(Math.random() * disasters[item].length)]);
        //     }
        // }

        newDisaster += item + ' - ' + (disasters[item][random]).toLowerCase() + "\n\n";
    });
    return rooms[room].disaster = newDisaster;
}

const check = (prop) => {
    Object.keys(rooms).forEach(item => {
        if (rooms[item] == prop) {
            return true;
        }
        else {
            return false;
        }
    })
}

// Send Cards
const getCard =  async (player) => {

    const data = JSON.parse(fs.readFileSync('./data.json'));
    let card = '';

        await Object.keys(data).forEach((item, index) => {
            let random = Math.floor(Math.random() * data[item].length);
            
            card += index + 1 + ") " + item + ' - ' + (data[item][random]).toLowerCase() + "\n\n";
        })
        
        player.card = await String(card);
        return card;
}

const sendAll = async (room) => {

    await room.players.map(async player => {
        let myCard = await getCard(player);
        
        await bot.sendMessage(player.id, "Игра началась!!!");  
        await bot.sendMessage(player.id, `Катастрофа \n\n ${room.disaster}`);

        bot.sendMessage(player.id, `Твой персонаж \n\n ${String(myCard)}`);
        return player;

    })
    return;
}

const deleteRoom = async (msg) => {
    let room;

    await Object.keys(rooms).map(item => {
        console.log(item, msg.from.id)
        if (rooms[item].admin == msg.from.id) {
            return room = rooms[item];
        }
        return;
    })

    if (room) {

        await room.players.forEach(item => {
            bot.sendMessage(item.id, "Комната удалена");
        })
        await delete room;
        return room;
    }
    else {
        bot.sendMessage(msg.from.id, 'Вы не админ');
        console.log('delte')
    }
}


bot.onText(/\/(.+)/, async (msg, match) => {

    console.log("start on text");
    switch(match[1]) {  
        case 'start':
            console.log("start");
            let buttons = {
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [{ text: 'Создать комнату', callback_data: 'create' }],
                        [{ text: 'Войти в комнату', callback_data: 'join' }]
                    ]
                })
            }
            bot.sendMessage(msg.from.id, "Выберите пункт:", buttons); 
            break;  
            
        case 'play':
            console.log("play");
            
            await Object.keys(rooms).forEach(async item => {
                if (rooms[item].admin == msg.from.id) {
                    await sendAll(rooms[String(item)]);
                }
                else {
                    bot.sendMessage(msg.from.id, "Вы не админ"); 
                    console.log('play')
                }
            });
            break;  
        
        case 'end':
            console.log("delete");
            await deleteRoom(msg);
            break;
            
        default: return;
        }  
    });

// bot.onText(/\/end/, (msg) => {
    
//     Object.keys(rooms).forEach(async item => {
//         if (rooms[item].admin == msg.from.id) {
            
//             await delete rooms[item];
//             bot.sendMessage(msg.from.id, "Комната удалена");   
//             console.log(rooms);
//             return;
//         }
//         else {
//             bot.sendMessage(msg.from.id, "Вы не админ");   
//             return;
//         }
//     });
//     return;
// });

// Tests
bot.onText(/\/check/, (msg) => {
    bot.sendMessage(msg.from.id, 'check console');
    console.log(rooms);
});

// pooling errors
bot.on("polling_error", console.log);

