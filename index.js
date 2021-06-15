const http = require('http');
const TelegramBot = require("node-telegram-bot-api");
const fs = require('fs');

const token = "1802821128:AAHTsDcqYisWhwyzXnnaNO04_5zCnFwyXCU";
const port = process.env.port || 3000;

const server = http.createServer((req, res) => {
    res.end('server worked');
}).listen(port);

// const options = {
//     webHook: {
//       port: port
//     }
// }
// const url = 'https://cyber-bunker.herokuapp.com:443';
const bot = new TelegramBot(token, {polling: true});
// bot.setWebHook(`${url}/bot${token}`);



let rooms = [];
let state = '';
const access = [];

// let rooms = [
//     {
//         id: "25ddj2",
//         players: [
//             {
//                 id: '',
//                 card: ''
//             }
//         ],
//         admin: 2453235,
//         length: 2,
//         disaster: 'sadsads'
//     }
// ]


const generateCode = () => {
    var text = "";
    var possible = "abcdefghijklmnopqrstuvwxyz1234567890";
    
    for( var i=0; i < 6; i++ ) 
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    // return String(text);
    return '5lp801';
}


bot.on('message', async (msg) => {
    switch(state) {
        case 'create':
            console.log('create');
            let count = parseInt(msg.text);
            if (count < 1 || isNaN(count) || count > 20) {
                    bot.sendMessage(msg.from.id, "Ошибка! Не верно указанно количество человек");
                    return;
                }
                else {
                    let code = String(generateCode());
                    let disaster = await getDisaster();

                    rooms.push({
                        id: code,
                        length: count,
                        players: [],
                        disaster: disaster,
                        admin: String(msg.from.id)
                    })
                    // [code] = {
                    //     length: count,
                    //     players: [],
                    //     admin: msg.from.id
                    // };
                    
                    bot.sendMessage(msg.from.id, `Комната на ${count} человек созданна, код - ${code}`);
                    bot.sendMessage(msg.from.id, `Чтобы начать игру отправьте /play`);

                    access.push(String(msg.from.id));
                    console.log(access);
                    // (async () => {
                    //     await getDisaster(code);
                    // })();
                }
                state = '';
                break;
                
        case "join":
            console.log('join');
            let enterCode = await String(msg.text);
            
            let check = await rooms.find(e => e.id === enterCode);
            
            if (check !== undefined && check.length > 0) {
                if (check.players.length >= check.length) {
                    bot.sendMessage(msg.from.id, "Слишком много человек");
                    return;
                }
                if (check.players.find(e => e.id === msg.from.id)) {
                    bot.sendMessage(msg.from.id, "Вы уже добавлены");
                    return;
                }
                else {
                    check.players.push({"id": msg.from.id, "card": "", "username": msg.from.username});
                    bot.sendMessage(msg.from.id, `Вы добавлены в комнату`);
                    bot.sendMessage(check.admin, `Пользователь @${msg.from.username} подключился`)
                    state = '';
                }
            }
            else {
                bot.sendMessage(msg.from.id, "Неверный код");
                return;
            }
    
            state = '';
            break;   

        default: return;
    }
})


bot.on('callback_query', async (query) => {
  
    switch (query.data) {
        case 'create':
            let check = await access.find(e => e == query.from.id);

            if (check) {
                bot.sendMessage(query.from.id, `Вы уже создали комнату \n Если вы хотите создать новую комнату, выйдете из прошлой командой /end`);
                return;
            }
            else {
                state = 'create';
                bot.sendMessage(query.from.id, 'Введите количество участников');
            }
            break;
        case 'join':
            state = 'join';
            bot.sendMessage(query.from.id, 'Введите пароль от комнаты');
        break;

        default: return;
    }
  })


// Send Disaster
const getDisaster = async () => {
    const disasters = JSON.parse(fs.readFileSync('./disasters.json'));
    let newDisaster = '';

    await Object.keys(disasters).forEach(item => {
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
    return newDisaster;
}

// const check = (prop) => {
//     Object.keys(rooms).forEach(item => {
//         if (rooms[item] == prop) {
//             return true;
//         }
//         else {
//             return false;
//         }
//     })
// }

// Send Cards
const getCard = async (player) => {

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

const deleteRoom = (id) => {

    rooms.map(async (item, index) => {
        console.log(item.admin, id)
        if (item.admin == id) {
            await rooms.splice(index, 1);
            bot.sendMessage(id, "Комната удалена");
        }
        else {
            bot.sendMessage(id, 'Вы не админ');
        }
        return;
    })

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
            await deleteRoom(msg.from.id);
            // await access.
            let elem = access.indexOf(msg.from.id);
            access.splice(elem, 1);
            break;
            
        case "polls":
            let check = await rooms.find(e => e.admin == msg.from.id);

            if (check && check.length >= 2) {
                let players = [];
                await check.players.forEach(item => {
                    players.push(`@${item.username}`);
                })
                console.log(players);
                bot.sendPoll(msg.from.id, 'Кого ?', players)
            }
            else {
                console.log('Не хватает человек для опроса')
                return;
            }
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

