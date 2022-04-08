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

const token  = process.env.BOT_TOKEN
const PORT = process.env.PORT || 3003

if (!token) throw new Error('"BOT_TOKEN" env var is required!')

const bot = new Telegraf(token)
const app = fastify()

const SECRET_PATH = `/sec/${bot.secretPathComponent()}`

app.post(SECRET_PATH, (req, rep) => bot.handleUpdate(req.body, rep.raw))

const isNumeric = (str) => {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}
const convertImage = async (args) => {
    const { ctx, type } = args
    if (ctx.scene.session.imageData.fileId && ctx.scene.session.imageData.img_width && ctx.scene.session.imageData.img_height) {
        ctx.telegram.getFileLink(ctx.scene.session.imageData.fileId).then(  async (url) => {
            try {
                const inputBuffer = (axios({ url: url.href, responseType: "arraybuffer" })).data
                switch (type) {
                    case "png":
                        sharp(inputBuffer)
                        .resize(ctx.scene.session.imageData.img_width, ctx.scene.session.imageData.img_height)
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
                        .resize(ctx.scene.session.imageData.img_width, ctx.scene.session.imageData.img_height)
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
                        .resize(ctx.scene.session.imageData.img_width, ctx.scene.session.imageData.img_height)
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
                        .resize(ctx.scene.session.imageData.img_width, ctx.scene.session.imageData.img_height)
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
        type: "png"
    }
    return await convertImage(args)
})
resizeStepHandler.action('jpg', async (ctx) => {    
    args = {
        ctx,
        type: "jpg"
    }
    return await convertImage(args)
})
resizeStepHandler.action('gif', async (ctx) => {    
    args = {
        ctx,
        type: "gif"
    }
    return await convertImage(args)
})
resizeStepHandler.action('bmp', async (ctx) => {    
    args = {
        ctx,
        type: "bmp"
    }
    return await convertImage(args)
})

const resizeWizard = new Scenes.WizardScene('resize-wizard',
    async (ctx) => {
        ctx.reply(i18n.__('send_image'))
        ctx.scene.session.imageData = {}
        return ctx.wizard.next()
    },
    async (ctx) => {
        console.log('step img: ', ctx.message)
        //Validate the photo
        if (ctx.message.media_group_id) {
            ctx.reply(`We will use your last  🖼️ :`)
        } else {
            if (ctx.message.photo) {
                const files = ctx.message.photo
                if (files) {
                    ctx.scene.session.imageData.fileId =  files[files.length - 1].file_id
                }
                ctx.reply(i18n.__('input_image_width'))
                return ctx.wizard.next()
            } else if (ctx.message.document) {

                ctx.scene.session.imageData.fileId = ctx.message.document.file_id
                ctx.reply(i18n.__('input_image_width'))
                return ctx.wizard.next()
            } else {
                ctx.reply(i18n.__('send_image'))
                console.log(
                    'no image'
                )
            }
        }
    },
    (ctx) => {
        //Validate width
        if (isNumeric(ctx.message.text)) {
            ctx.scene.session.imageData.img_width = Number(ctx.message.text)
            ctx.reply(i18n.__('input_image_height'))
            return ctx.wizard.next()
        } else {
            ctx.reply(i18n.__('input_image_width_note'))
        }
        
    },
    async (ctx) => {
        if (isNumeric(ctx.update.message.text)) {
            ctx.scene.session.imageData.img_height = Number(ctx.update.message.text)
            ctx.reply(i18n.__('input_image_type'), {
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
            ctx.reply(i18n.__('input_image_height_note'))
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
    return ctx.wizard.next()
})
languageChangeHandler.action('langvn', async (ctx) => {    
    i18n.setLocale('vn')
    ctx.reply(i18n.__('saved_language'))
    return ctx.wizard.next()
})
languageChangeHandler.action('langfr', async (ctx) => {    
    i18n.setLocale('fr')
    ctx.reply(i18n.__('saved_language'))
    return ctx.wizard.next()
})
languageChangeHandler.action('langjp', async (ctx) => {    
    i18n.setLocale('jp')
    ctx.reply(i18n.__('saved_language'))
    return ctx.wizard.next()
})
const languageWizard = new Scenes.WizardScene('language-wizard',
    async (ctx) => {
        ctx.reply(i18n.__('choose_language'),
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
    languageChangeHandler,
    (ctx) => {
        return ctx.scene.leave() //<- Leaving a scene will clear the session automatically
    }
)

const stage = new Scenes.Stage([resizeWizard, languageWizard])

bot.use(session())
bot.use(stage.middleware())
bot.command('/resize', (ctx) => ctx.scene.enter('resize-wizard'))
bot.command('/language', (ctx) => ctx.scene.enter('language-wizard'))
bot.action('resize', (ctx) => ctx.scene.enter('resize-wizard') )

bot.launch()

app.listen(PORT).then(() => {
    console.log('Listening on port', PORT)
})