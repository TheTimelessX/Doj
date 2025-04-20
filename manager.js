const fs = require('fs');
const real = {
    dir: "u65ydfgggggggggg1ggggggggey5667", // Optional
    filename: "users.json", // Optional
    combined: null
}

real.combined = real.dir+"/"+real.filename;

class Manager {
    constructor(){
        if (!fs.existsSync(real.dir)){
            fs.mkdirSync(real.dir);
        }
        if (!fs.existsSync(real.combined)){
            fs.writeFileSync(real.combined, "{}");
        }
    }

    async getAllUsers(callback = () => {}){
        fs.readFile(real.combined, (err, data) => {
            if (err){
                console.log("error while reading:", err);
                callback({
                    status: "ERROR_READING",
                    message: err
                })
            } else {
                let d = JSON.parse(data);
                callback({
                    status: "OK",
                    users: Object.keys(d)
                })
            }
        })
    }

    async getUserById(uid, callback = () => {}){
        await this.getAllUsers(async (users) => {
            if (users.status == "OK"){
                for (let user of users.users){
                    if (user.uid == uid){
                        callback({
                            status: "OK",
                            user: user
                        });
                        return;
                    }
                }
                callback({
                    status: "UID_NOT_FOUND"
                });
                return;
            } 
        })
    }

    async create(
        uid,
        callback = () => {}
    ){
        await this.getUserById(uid, async (user) => {
            if (user.status == "OK"){
                callback({
                    status: "EXISTS_USER"
                });
                return;
            }
            fs.readFile(real.combined, async (err, data) => {
                if (err){
                    callback({
                        status: "ERROR_READING",
                        message: err
                    });
                    return;
                } else {
                    let d = JSON.parse(data);
                    Object.defineProperty(d, Buffer.from(uid.toString()).toString(), {
                        configurable: true,
                        writable: true,
                        enumerable: true,
                        value: {
                            has_port: false,
                            port: {
                                end_at: null,
                                is_ban: false
                            }
                        }
                    })
                }
            })
        })
    }
}