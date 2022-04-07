const fastify = require('fastify')
const { Composer, Markup, session, Scenes, Telegraf } = require('telegraf')
const axios = require('axios')
const sharp = require('sharp')
const { I18n } = require('i18n')
const fs = require('fs')
const path = require('path')

require('dotenv').config()

const i18n  = new I18n({
    locales: ['en', 'fr', 'ja', 'vn'],
    directory: path.join(__dirname, '/locales'),
    register: global,
    defaultLocale: 'en'
})

const { BOT_TOKEN, WEBHOOK_URL } = process.env
const PORT = process.env.PORT || 3003

//if (!WEBHOOK_URL) throw new Error('"WEBHOOK_URL" env var is required!')
if (!BOT_TOKEN) throw new Error('"BOT_TOKEN" env var is required!')

const bot = new Telegraf(BOT_TOKEN)
const app = fastify()

const SECRET_PATH = `/sec/${bot.secretPathComponent()}`

app.post(SECRET_PATH, (req, rep) => bot.handleUpdate(req.body, rep.raw))

let current_step = 0
let img_width, img_height, img_type, img_id, list_img_id


/* bot.start((ctx) => {
    bot.telegram.getChat(ctx.message.chat.id)
    .then(chat => {
        //console.log(chat)
    })
    .catch(err => console.error(err))

    ctx.reply('Welcome to 💗 Resize Image Bot 🔥 \nYou can use this bot to resize any image you want.', replyMarkup)
}) */
/* 
bot.command('help', (ctx) => {
    ctx.reply(`1. Using /resize to start resizing process.\n2. Input your Image.\n3. Input your desired size.\n4. Input your output type.`)
})

bot.command('language', async (ctx) => {
    return await ctx.reply('Please choose your language', 
        {
            reply_markup: {
                inline_keyboard: [
                    
                    [ { text: '🇬🇧 English', callback_data: 'langus' }, { text: '🇻🇳 VietNam', callback_data: 'langvn' } ],
                    
                    [ { text: "🇫🇷 Français", callback_data: "langfr" }, { text: '🇯🇵 Feedback', callback_data: 'langjp' } ]
                ]
            }
        }
    )
})
bot.command('resize', (ctx) => {
    current_step = 1
    ctx.reply(`Please send your image 🖼️ :`)
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
        ctx.reply(i18n.__('resize_more'))
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
        ctx.reply(i18n.__('resize_more'))
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
        ctx.reply(i18n.__('resize_more'))
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
        ctx.reply(i18n.__('resize_more'))
    }
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

bot.on('inline_query', (ctx) => {
    const result = []
    // Explicit usage
    ctx.telegram.answerInlineQuery(ctx.inlineQuery.id, result)

    // Using context shortcut
    ctx.answerInlineQuery(result)
})

bot.on('callback_query', (ctx) => {
    // Explicit usage
    ctx.telegram.answerCbQuery(ctx.callbackQuery.id)
    console.log(ctx.callbackQuery)
    // Using context shortcut
    ctx.answerCbQuery()
})
*/
const isNumeric = (str) => {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}
const convertImage = async (args) => {
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
                                ctx.replyWithPhoto({ source: `./public/images/profiles/${ctx.update.update_id}.${type}` }, { caption: i18n.__('resized_caption') }).then(() => {
                                    ctx.reply(i18n.__('resize_more'))
                                }).then(() => {
                                    fs.unlinkSync(`./public/images/profiles/${ctx.update.update_id}.${type}`)
                                })
                                return ctx.wizard.next()
                            } else {
                                ctx.reply(i18n.__('resize_output_error'))
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
                                ctx.replyWithPhoto({ source: `./public/images/profiles/${ctx.update.update_id}.${type}` }, { caption: i18n.__('resized_caption') }).then(() => {
                                    ctx.reply(i18n.__('resize_more'))
                                }).then(() => {
                                    fs.unlinkSync(`./public/images/profiles/${ctx.update.update_id}.${type}`)
                                })
                                return ctx.wizard.next()
                            } else {
                                ctx.reply(i18n.__('resize_output_error'))
                            }
                        })
                        break
                    case "gif":
                        sharp(inputBuffer)
                        .resize(width, height)
                        .toFile(`./public/images/profiles/${ctx.update.update_id}.${type}`, (err, info) => {
                            if (!err) {
                                current_step = 0
                                ctx.replyWithPhoto({ source: `./public/images/profiles/${ctx.update.update_id}.${type}` }, { caption: i18n.__('resized_caption') }).then(() => {
                                    ctx.reply(i18n.__('resize_more'))
                                }).then(() => {
                                    fs.unlinkSync(`./public/images/profiles/${ctx.update.update_id}.${type}`)
                                })
                                return ctx.wizard.next()
                            } else {
                                ctx.reply(i18n.__('resize_output_error'))
                            }
                        })
                        break
                    case "bmp":
                        sharp(inputBuffer)
                        .resize(width, height)
                        .toFile(`./public/images/profiles/${ctx.update.update_id}.${type}`, (err, info) => {
                            if (!err) {
                                current_step = 0
                                ctx.replyWithPhoto({ source: `./public/images/profiles/${ctx.update.update_id}.${type}` }, { caption: i18n.__('resized_caption') }).then(() => {
                                    ctx.reply(i18n.__('resize_more'))
                                }).then(() => {
                                    fs.unlinkSync(`./public/images/profiles/${ctx.update.update_id}.${type}`)
                                })
                                return ctx.wizard.next()
                            } else {
                                ctx.reply(i18n.__('resize_output_error'))
                            }
                            
                        })
                        break
                    default:
                        break
                }

            } catch (error) {
               console.log('err: ', error)
               ctx.reply(i18n.__('resize_error'))
               return ctx.wizard.next()
            }
           
        })
    } else {
        return ctx.wizard.next()
    }
} 
bot.start((ctx) => {
    bot.telegram.getChat(ctx.message.chat.id)
    .then(chat => {
        //console.log(chat)
    })
    .catch(err => console.error(err))

    ctx.reply(i18n.__('welcome_message'), {
        reply_markup: {
            inline_keyboard: [
                [{ text: i18n.__('start_resize'), callback_data: "resize" }],
                [{ text: i18n.__('premium'), callback_data: "premium" }]
            ]
        }
    })
})



const resizeStepHandler = new Composer()
resizeStepHandler.action('png', async (ctx) => {    
    args = {
        ctx,
        fileId: img_id,
        width: img_width,
        height: img_height,
        type: "png"
    }
    return await convertImage(args)
})
resizeStepHandler.action('jpg', async (ctx) => {    
    args = {
        ctx,
        fileId: img_id,
        width: img_width,
        height: img_height,
        type: "jpg"
    }
    return await convertImage(args)
})
resizeStepHandler.action('gif', async (ctx) => {    
    args = {
        ctx,
        fileId: img_id,
        width: img_width,
        height: img_height,
        type: "gif"
    }
    return await convertImage(args)
})
resizeStepHandler.action('bmp', async (ctx) => {    
    args = {
        ctx,
        fileId: img_id,
        width: img_width,
        height: img_height,
        type: "bmp"
    }
    return await convertImage(args)
})

const resizeWizard = new Scenes.WizardScene('resize-wizard',
    async (ctx) => {
        await ctx.reply(i18n.__('send_image'))
        /* //Necessary for store the input
        ctx.scene.session.user = {}
        //Store the telegram user id
        ctx.scene.session.user.userId = ctx.from.id */
        return ctx.wizard.next()
    },
    async (ctx) => {
        console.log('step img: ', ctx.message)
        //Validate the photo
        if (ctx.message.media_group_id) {
            await ctx.reply(`We will use your last  🖼️ :`)
        } else {
            if (ctx.message.photo) {
                const files = ctx.message.photo
                if (files) {
                    img_id = files[files.length - 1].file_id
                }
                await ctx.reply(i18n.__('input_image_width'))
                return ctx.wizard.next()
            } else if (ctx.message.document) {

                img_id = ctx.message.document.file_id
                await ctx.reply(i18n.__('input_image_width'))
                return ctx.wizard.next()
            } else {
                await ctx.reply(i18n.__('send_image'))
                console.log(
                    'no image'
                )
            }
        }
    },
    (ctx) => {
        //Validate width
        if (isNumeric(ctx.message.text)) {
            img_width = Number(ctx.message.text)
            ctx.reply(i18n.__('input_image_height'))
            return ctx.wizard.next()
        } else {
            ctx.reply(i18n.__('input_image_width_note'))
        }
        
    },
    async (ctx) => {
        if (isNumeric(ctx.update.message.text)) {
            img_height = Number(ctx.update.message.text)
            await ctx.reply(i18n.__('input_image_type'), {
                reply_markup: {
                    inline_keyboard: [

                        [{ text: "PNG", callback_data: "png" }],
                        [{ text: "JPG", callback_data: "jpg" }],
                        [{ text: "GIF", callback_data: "gif" }],
                        [{ text: "BMP", callback_data: "bmp" }]
                    ]
                }
            })
            return ctx.wizard.next()
        } else {
            await ctx.reply(i18n.__('input_image_height_note'))
        }
        
    },
    resizeStepHandler,
    (ctx) => {
        return ctx.scene.leave() //<- Leaving a scene will clear the session automatically
    }
)


const languageChangeHandler = new Composer()
languageChangeHandler.action('langus', async (ctx) => {    
    i18n.setLocale('en')
    ctx.reply(i18n.__('saved_language'))
    return ctx.scene.leave()
})
languageChangeHandler.action('langvn', async (ctx) => {    
    i18n.setLocale('vn')
    ctx.reply(i18n.__('saved_language'))
    return ctx.scene.leave()
})
languageChangeHandler.action('langfr', async (ctx) => {    
    i18n.setLocale('fr')
    ctx.reply(i18n.__('saved_language'))
    return ctx.scene.leave()
})
languageChangeHandler.action('langjp', async (ctx) => {    
    i18n.setLocale('jp')
    ctx.reply(i18n.__('saved_language'))
    return ctx.scene.leave()
})
const languageWizard = new Scenes.WizardScene('language-wizard',
    async (ctx) => {
        await ctx.reply(i18n.__('choose_language'), 
        /* Markup.keyboard(
            [
                [ Markup.button.callback('🇬🇧 English', 'langus'), Markup.button.callback('🇻🇳 Tiếng Việt', 'langvn') ],
                [ Markup.button.callback('🇫🇷 Français', 'langfr'), Markup.button.callback('🇯🇵 日本', 'langjp') ]
            ]
        ) */
            {
                reply_markup: {
                    inline_keyboard: [
                        [ { text: '🇬🇧 English', callback_data: 'langus' }, { text: '🇻🇳 Tiếng Việt', callback_data: 'langvn' } ],
                        [ { text: "🇫🇷 Français", callback_data: "langfr" }, { text: '🇯🇵 日本', callback_data: 'langjp' } ]
                    ]
                }
            }
        )
        return ctx.wizard.next()
    },
    languageChangeHandler
)



const stage = new Scenes.Stage([resizeWizard, languageWizard])
bot.use(session())
bot.use(stage.middleware())
bot.command('/resize', (ctx) => ctx.scene.enter('resize-wizard'))
bot.command('/language', (ctx) => ctx.scene.enter('language-wizard'))
bot.action('resize', (ctx) => ctx.scene.enter('resize-wizard') )

bot.launch()

/* bot.telegram.setWebhook(WEBHOOK_URL + SECRET_PATH).then(() => {
  console.log('Webhook is set on', WEBHOOK_URL)
}) */

app.listen(PORT).then(() => {
    console.log('Listening on port', PORT)
})