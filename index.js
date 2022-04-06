const fastify = require('fastify')
const { Telegraf } = require('telegraf')
const axios = require('axios')
const sharp = require('sharp')
const fs = require('fs')
require('dotenv').config()
const { BOT_TOKEN, WEBHOOK_URL } = process.env
const PORT = process.env.PORT || 3000

//if (!WEBHOOK_URL) throw new Error('"WEBHOOK_URL" env var is required!')
if (!BOT_TOKEN) throw new Error('"BOT_TOKEN" env var is required!')

const bot = new Telegraf(BOT_TOKEN)
const app = fastify()

const SECRET_PATH = `/sec/${bot.secretPathComponent()}`

app.post(SECRET_PATH, (req, rep) => bot.handleUpdate(req.body, rep.raw))

let current_step = 0
let img_width, img_height, img_type, img_id, list_img_id
const replyMarkup = {
    reply_markup: {
        inline_keyboard: [
            /* Inline buttons. 2 side-by-side */
            [ { text: "Start Resize", callback_data: "resize" } ],
            
            [ { text: "Premium", callback_data: "premium" } ]
        ]
    }
}

bot.start((ctx) => {
    bot.telegram.getChat(ctx.message.chat.id)
    .then(chat => console.log(chat))
    .catch(err => console.error(err))

    ctx.reply('Welcome to 💗 Resize Image Bot 🔥 \nYou can use this bot to resize any image you want.', replyMarkup)
})

bot.command('help', (ctx) => {
    ctx.reply(`1. Using /resize to start resizing process.\n2. Input your Image.\n3. Input your desired size.\n4. Input your output type.`)
})
bot.action('resize', (ctx) =>  {
    current_step = 1
    ctx.reply(`Please send your image 🖼️ :`)
})
bot.action('premium', (ctx) => {
    ctx.reply(`We are working on premium feature 👷`)
})

bot.action('PNG', (ctx) =>  {
    if (current_step === 4) {
        current_step = 0
        args = {
            ctx,
            fileId: img_id,
            width: img_width,
            height: img_height,
            type: "png"
        }
    
        convertImage(args)
    } else {
        ctx.reply(`Do you want to resize more 🔥 ? /resize`)
    }
})
bot.action('JPG', (ctx) =>  {
    if (current_step === 4) {
        current_step = 0
        args = {
            ctx,
            fileId: img_id,
            width: img_width,
            height: img_height,
            type: "jpg"
        }
    
        convertImage(args)
    } else {
        ctx.reply(`Do you want to resize more 🔥 ? /resize`)
    }
})
bot.action('GIF', (ctx) =>  {
    if (current_step === 4) {
        current_step = 0
        args = {
            ctx,
            fileId: img_id,
            width: img_width,
            height: img_height,
            type: "gif"
        }
    
        convertImage(args)
    } else {
        ctx.reply(`Do you want to resize more 🔥 ? /resize`)
    }
})
bot.action('BMP', (ctx) =>  {
    if (current_step === 4) {
        current_step = 0
        args = {
            ctx,
            fileId: img_id,
            width: img_width,
            height: img_height,
            type: "bmp"
        }
    
        convertImage(args)
    } else {
        ctx.reply(`Do you want to resize more 🔥 ? /resize`)
    }
})

bot.command('resize', (ctx) => {
    current_step = 1
    ctx.reply(`Please send your image 🖼️ :`)
})
bot.on('message', (ctx) => {
    
    console.log(ctx.update.message)
    switch (current_step) {
        case 1:
            if (ctx.update.message.media_group_id) {
                ctx.reply(`We will use your last  🖼️ :`)
            } else {
                if (ctx.update.message.photo) {
                    const files = ctx.update.message.photo
                    if (files) {
                        // I am getting the bigger image
                        img_id = files[files.length - 1].file_id
                        // Proceed downloading
                    }
                    current_step = 2
                    ctx.reply(`
                        Your desired Image Width (px) 📐: 
                    `)
                } else if (ctx.update.message.document) {
                    current_step = 2
                    img_id = ctx.update.message.document.file_id
                    ctx.reply(`
                        Your desired Image Width (px) 📐: 
                    `)
                } else {
                    ctx.reply(`Please send your image 🖼️ :`)
                }
            }
            break
        case 2:
            if (isNumeric(ctx.update.message.text)) {
                img_width = Number(ctx.update.message.text)
                current_step = 3
                ctx.reply(`
                    Your desired Image Height (px) 📏 : 
                `)
            } else {
                ctx.reply(`
                    Your desired Image Width (px) (Number only) 📐: 
                `)
            }
            break
        case 3:
            if (isNumeric(ctx.update.message.text)) {
                img_height = Number(ctx.update.message.text)
                current_step = 4
                ctx.reply(`
                    Your desired Image type 📏 : 
                `, {
                    reply_markup: {
                        inline_keyboard: [
                            /* Inline buttons. 2 side-by-side */
                            [ { text: "PNG", callback_data: "PNG" } ],                        
                            [ { text: "JPG", callback_data: "JPG" } ],
                            [ { text: "GIF", callback_data: "GIF" } ],
                            [ { text: "BMP", callback_data: "BMP" } ]
                        ]
                    }
                })
            } else {
                ctx.reply(`
                    Your desired Image Height (px) (Number only) 📏 : 
                `)
            }
            break
        case 4:      
            
            break
    
        default:
            ctx.reply('Welcome to 💗 Resize Image Bot 🔥 \nYou can use this bot to resize any image you want.', replyMarkup)
            break
    }
})

bot.on('callback_query', (ctx) => {
    // Explicit usage
    ctx.telegram.answerCbQuery(ctx.callbackQuery.id)

    // Using context shortcut
    ctx.answerCbQuery()
})
bot.on('inline_query', (ctx) => {
    const result = []
    // Explicit usage
    ctx.telegram.answerInlineQuery(ctx.inlineQuery.id, result)

    // Using context shortcut
    ctx.answerInlineQuery(result)
})
const isNumeric = (str) => {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}
const convertImage = (args) => {
    const { ctx, fileId, width, height, type } = args
    if (fileId && height && height) {
        ctx.telegram.getFileLink(fileId).then(  async (url) => {
            try {
                const inputBuffer = (await axios({ url: url.href, responseType: "arraybuffer" })).data
                switch (type) {
                    case "png":
                        sharp(inputBuffer)
                        .resize(width, height)
                        .toFile(`./public/images/profiles/${ctx.update.update_id}.${type}`, (err, info) => {
                            if (!err) {
                                current_step = 0
                                ctx.replyWithPhoto({ source: `./public/images/profiles/${ctx.update.update_id}.${type}` }, { caption: "Here is your photo." }).then(() => {
                                    ctx.reply(`Do you want to resize more 🔥 ? /resize`)
                                }).then(() => {
                                    fs.unlinkSync(`./public/images/profiles/${ctx.update.update_id}.${type}`)
                                })
                            } else {
                                ctx.reply(`Error, please try another output 😣`)
                            }
                        })
                        break
                    case "jpg":
                        sharp(inputBuffer)
                        .resize(width, height)
                        .jpeg({ mozjpeg: true })
                        .toFile(`./public/images/profiles/${ctx.update.update_id}.${type}`, (err, info) => {
                            if (!err) {
                                current_step = 0
                                ctx.replyWithPhoto({ source: `./public/images/profiles/${ctx.update.update_id}.${type}` }, { caption: "Here is your photo." }).then(() => {
                                    ctx.reply(`Do you want to resize more 🔥 ? /resize`)
                                }).then(() => {
                                    fs.unlinkSync(`./public/images/profiles/${ctx.update.update_id}.${type}`)
                                })
                            } else {
                                ctx.reply(`Error, please try another output 😣`)
                            }
                        })
                        break
                    case "gif":
                        sharp(inputBuffer)
                        .resize(width, height)
                        .toFile(`./public/images/profiles/${ctx.update.update_id}.${type}`, (err, info) => {
                            if (!err) {
                                current_step = 0
                                ctx.replyWithPhoto({ source: `./public/images/profiles/${ctx.update.update_id}.${type}` }, { caption: "Here is your photo." }).then(() => {
                                    ctx.reply(`Do you want to resize more 🔥 ? /resize`)
                                }).then(() => {
                                    fs.unlinkSync(`./public/images/profiles/${ctx.update.update_id}.${type}`)
                                })
                            } else {
                                ctx.reply(`Error, please try another output 😣`)
                            }
                        })
                        break
                    case "bmp":
                        sharp(inputBuffer)
                        .resize(width, height)
                        .toFile(`./public/images/profiles/${ctx.update.update_id}.${type}`, (err, info) => {
                            if (!err) {
                                current_step = 0
                                ctx.replyWithPhoto({ source: `./public/images/profiles/${ctx.update.update_id}.${type}` }, { caption: "Here is your photo." }).then(() => {
                                    ctx.reply(`Do you want to resize more 🔥 ? /resize`)
                                }).then(() => {
                                    fs.unlinkSync(`./public/images/profiles/${ctx.update.update_id}.${type}`)
                                })
                            } else {
                                ctx.reply(`Error, please try another output 😣`)
                            }
                            
                        })
                        break
                    default:
                        break
                }

            } catch (error) {
               console.log('err: ', error)
               ctx.reply(`Can not convert your Image ! Please try again 😫`)
            }
           
        })
    }
}

bot.launch()

/* bot.telegram.setWebhook(WEBHOOK_URL + SECRET_PATH).then(() => {
  console.log('Webhook is set on', WEBHOOK_URL)
}) */

app.listen(PORT).then(() => {
  console.log('Listening on port', PORT)
})