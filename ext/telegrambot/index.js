/* eslint-disable operator-linebreak */ // TelegramBot extension for KittenBlock
// Browser-compatible: uses fetch() API - works in kblock.kittenbot.cc AND KittenBlock desktop
// No require() / no bundling needed
const $6fe381f644bc7361$var$_Scratch = typeof Scratch !== 'undefined' ? Scratch : {};
const $6fe381f644bc7361$var$_BT = $6fe381f644bc7361$var$_Scratch.BlockType || {};
const $6fe381f644bc7361$var$_AT = $6fe381f644bc7361$var$_Scratch.ArgumentType || {};
// Merge Scratch constants with fallbacks to guarantee ALL properties exist
// (Scratch online may have BlockType but without KittenBlock-specific DIVLABEL etc.)
const $6fe381f644bc7361$var$ArgumentType = {
    ANGLE: $6fe381f644bc7361$var$_AT.ANGLE || 'angle',
    BOOLEAN: $6fe381f644bc7361$var$_AT.BOOLEAN || 'Boolean',
    COLOR: $6fe381f644bc7361$var$_AT.COLOR || 'color',
    IMAGE: $6fe381f644bc7361$var$_AT.IMAGE || 'image',
    MATRIX: $6fe381f644bc7361$var$_AT.MATRIX || 'matrix',
    NOTE: $6fe381f644bc7361$var$_AT.NOTE || 'note',
    NUMBER: $6fe381f644bc7361$var$_AT.NUMBER || 'Number',
    STRING: $6fe381f644bc7361$var$_AT.STRING || 'String'
};
const $6fe381f644bc7361$var$BlockType = {
    BOOLEAN: $6fe381f644bc7361$var$_BT.BOOLEAN || 'Boolean',
    COMMAND: $6fe381f644bc7361$var$_BT.COMMAND || 'command',
    CONDITIONAL: $6fe381f644bc7361$var$_BT.CONDITIONAL || 'conditional',
    DIVLABEL: $6fe381f644bc7361$var$_BT.DIVLABEL || 'label',
    EVENT: $6fe381f644bc7361$var$_BT.EVENT || 'event',
    HAT: $6fe381f644bc7361$var$_BT.HAT || 'hat',
    LOOP: $6fe381f644bc7361$var$_BT.LOOP || 'loop',
    REPORTER: $6fe381f644bc7361$var$_BT.REPORTER || 'reporter'
};
const $6fe381f644bc7361$var$formatMessage = $6fe381f644bc7361$var$_Scratch.formatMessage || function(obj) {
    if (typeof obj === 'string') return obj;
    return obj.default || obj.id || '';
};
const $6fe381f644bc7361$var$log = ($6fe381f644bc7361$var$_Scratch.log || console.log).bind(console);
const $6fe381f644bc7361$var$TELEGRAM_API = 'https://api.telegram.org';
const $6fe381f644bc7361$var$menuIconURI = "data:image/png;base64,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";
const $6fe381f644bc7361$var$blockIconURI = "data:image/png;base64,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";
class $6fe381f644bc7361$var$TelegramBotExtension {
    constructor(runtime){
        this.runtime = runtime;
        // registerPeripheralExtension may not exist in online kblock.kittenbot.cc
        if (runtime && typeof runtime.registerPeripheralExtension === 'function') try {
            runtime.registerPeripheralExtension('TelegramBot', this);
        } catch (e) {}
        this.bot = undefined; // {token, received_message, last_*_message, commands}
        this._pollingActive = false;
        this._pollOffset = 0;
    }
    // ─── Core: Telegram API via fetch ──────────────────────────────────────────
    _request(method, params) {
        const token = this.bot && this.bot.token;
        if (!token) return Promise.reject(new Error('Please set the bot first.'));
        return fetch(`${$6fe381f644bc7361$var$TELEGRAM_API}/bot${token}/${method}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params || {})
        }).then((r)=>r.json()).then((json)=>{
            if (json.ok) return json.result;
            throw new Error(json.description || `Telegram error in ${method}`);
        });
    }
    _requestForm(method, formData) {
        const token = this.bot && this.bot.token;
        if (!token) return Promise.reject(new Error('Please set the bot first.'));
        return fetch(`${$6fe381f644bc7361$var$TELEGRAM_API}/bot${token}/${method}`, {
            method: 'POST',
            body: formData
        }).then((r)=>r.json()).then((json)=>{
            if (json.ok) return json.result;
            throw new Error(json.description || `Telegram error in ${method}`);
        });
    }
    _dataURLtoBlob(dataURL) {
        const parts = dataURL.split(',');
        const mime = parts[0].match(/:(.*?);/)[1];
        const binary = atob(parts[1]);
        const arr = new Uint8Array(binary.length);
        for(let i = 0; i < binary.length; i++)arr[i] = binary.charCodeAt(i);
        return new Blob([
            arr
        ], {
            type: mime
        });
    }
    // ─── Polling ───────────────────────────────────────────────────────────────
    _getUpdates() {
        const token = this.bot && this.bot.token;
        if (!token) return Promise.resolve([]);
        const offset = this._pollOffset || 0;
        return fetch(`${$6fe381f644bc7361$var$TELEGRAM_API}/bot${token}/getUpdates?offset=${offset}&timeout=20&allowed_updates=%5B%22message%22%5D`).then((r)=>r.json()).then((json)=>json.ok ? json.result : []).catch(()=>[]);
    }
    async _pollLoop() {
        console.log('[TelegramBot] Poll loop started, offset=', this._pollOffset);
        while(this._pollingActive)try {
            const updates = await this._getUpdates();
            for (const update of updates){
                this._pollOffset = update.update_id + 1;
                if (update.message) {
                    console.log('[TelegramBot] Message received:', update.message);
                    if (this.bot) this.bot.received_message = update.message;
                    this.runtime.startHats('telegrambot_block_whenmessagereceived', {});
                }
            }
        } catch (e) {
            if (this._pollingActive) {
                console.error('[TelegramBot] Poll error:', e.message || e);
                await new Promise((r)=>setTimeout(r, 3000));
            }
        }
        console.log('[TelegramBot] Poll loop stopped');
    }
    // ─── Helper Getters ────────────────────────────────────────────────────────
    getBot() {
        if (!this.bot) return Promise.reject(new Error('Please set the bot first.'));
        return Promise.resolve(this.bot);
    }
    getReceivedMessage() {
        return this.getBot().then((bot)=>{
            if (bot.received_message) return bot.received_message;
            throw new Error('No received message from polling.');
        });
    }
    getReceivedTextMessageEntity(index) {
        return this.getReceivedMessage().then((message)=>{
            if (message.entities && index < message.entities.length) return message.entities[index];
            throw new Error('No entity at that index.');
        });
    }
    getLastTextMessage() {
        return this.getBot().then((bot)=>{
            if (bot.last_text_message) return bot.last_text_message;
            throw new Error('No sent text message.');
        });
    }
    getLastPhotoMessage() {
        return this.getBot().then((bot)=>{
            if (bot.last_photo_message) return bot.last_photo_message;
            throw new Error('No sent photo message.');
        });
    }
    getLastAudioMessage() {
        return this.getBot().then((bot)=>{
            if (bot.last_audio_message) return bot.last_audio_message;
            throw new Error('No sent audio message.');
        });
    }
    getLastVideoMessage() {
        return this.getBot().then((bot)=>{
            if (bot.last_video_message) return bot.last_video_message;
            throw new Error('No sent video message.');
        });
    }
    getLastAnimationMessage() {
        return this.getBot().then((bot)=>{
            if (bot.last_animation_message) return bot.last_animation_message;
            throw new Error('No sent animation message.');
        });
    }
    getLastVoiceMessage() {
        return this.getBot().then((bot)=>{
            if (bot.last_voice_message) return bot.last_voice_message;
            throw new Error('No sent voice message.');
        });
    }
    getLastDocumentMessage() {
        return this.getBot().then((bot)=>{
            if (bot.last_document_message) return bot.last_document_message;
            throw new Error('No sent document message.');
        });
    }
    getCommands() {
        return this.getBot().then((bot)=>{
            if (bot.commands) return Promise.resolve(bot.commands);
            return this._request('getMyCommands', {}).then((commands)=>{
                bot.commands = commands;
                return commands;
            });
        });
    }
    setCommands(commands) {
        return this._request('setMyCommands', {
            commands: commands
        }).then((res)=>{
            if (this.bot) delete this.bot.commands;
            return res;
        });
    }
    // ─── Media helper ──────────────────────────────────────────────────────────
    _sendMedia(method, mediaParam, mediaValue, chatid, extra, storeKey) {
        const params = Object.assign({
            chat_id: chatid
        }, extra);
        if (mediaValue && mediaValue.startsWith('data:')) {
            const ext = (mediaValue.split(';')[0].split('/')[1] || 'bin').replace('jpeg', 'jpg');
            const blob = this._dataURLtoBlob(mediaValue);
            const formData = new FormData();
            formData.append('chat_id', String(chatid));
            formData.append(mediaParam, blob, `file.${ext}`);
            for (const [k, v] of Object.entries(extra))formData.append(k, String(v));
            return this._requestForm(method, formData).then((res)=>{
                if (this.bot) this.bot[storeKey] = res;
            });
        } else {
            params[mediaParam] = mediaValue;
            return this._request(method, params).then((res)=>{
                if (this.bot) this.bot[storeKey] = res;
            });
        }
    }
    noop() {}
    getInfo() {
        return {
            id: 'telegrambot',
            name: 'TelegramBot',
            color1: '#33CCFF',
            color2: '#33CCFF',
            color3: '#FFFFFF',
            menuIconURI: $6fe381f644bc7361$var$menuIconURI,
            blockIconURI: $6fe381f644bc7361$var$blockIconURI,
            blocks: [
                {
                    opcode: 'block_setbot',
                    blockType: $6fe381f644bc7361$var$BlockType.COMMAND,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_setbot',
                        default: 'Set the bot token [TOKEN]'
                    }),
                    arguments: {
                        TOKEN: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            defaultValue: ''
                        }
                    },
                    func: 'block_setbot',
                    sepafter: 36
                },
                {
                    opcode: 'block_getname',
                    blockType: $6fe381f644bc7361$var$BlockType.REPORTER,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_getname',
                        default: 'Bot name'
                    }),
                    func: 'block_getname'
                },
                {
                    opcode: 'block_getusername',
                    blockType: $6fe381f644bc7361$var$BlockType.REPORTER,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_getusername',
                        default: 'Bot username'
                    }),
                    func: 'block_getusername',
                    sepafter: 36
                },
                {
                    func: 'noop',
                    blockType: $6fe381f644bc7361$var$BlockType.DIVLABEL,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_receive',
                        default: 'Receive'
                    })
                },
                // {
                //     opcode: 'block_getupdates',
                //     blockType: BlockType.COMMAND,
                //     text: formatMessage({
                //         id: 'TelegramBot.block_getupdates',
                //         default: 'Get updates: offset [OFFSET] limit [LIMIT] (1~100) timeout [TIMEOUT] s'
                //     }),
                //     arguments: {
                //         OFFSET: {
                //             type: ArgumentType.NUMBER,
                //             defaultValue: 0
                //         },
                //         LIMIT: {
                //             type: ArgumentType.NUMBER,
                //             defaultValue: 100
                //         },
                //         TIMEOUT: {
                //             type: ArgumentType.NUMBER,
                //             defaultValue: 0
                //         }
                //     },
                //     func: 'block_getupdates'
                // },
                // {
                //     opcode: 'block_getnumofmessages',
                //     blockType: BlockType.REPORTER,
                //     text: formatMessage({
                //         id: 'TelegramBot.block_getnumofmessages',
                //         default: 'Number of messages'
                //     }),
                //     func: 'block_getnumofmessages'
                // },
                // {
                //     opcode: 'block_messageis',
                //     blockType: BlockType.BOOLEAN,
                //     text: formatMessage({
                //         id: 'TelegramBot.block_messageis',
                //         default: 'Message [INDEX] is [TYPE] ?'
                //     }),
                //     arguments: {
                //         INDEX: {
                //             type: ArgumentType.NUMBER,
                //             defaultValue: 1
                //         },
                //         TYPE: {
                //             type: ArgumentType.STRING,
                //             menu: 'messagetypes',
                //             defaultValue: 'text'
                //         }
                //     },
                //     func: 'block_messageis'
                // },
                // {
                //     opcode: 'block_gettextmessagestate',
                //     blockType: BlockType.REPORTER,
                //     text: formatMessage({
                //         id: 'TelegramBot.block_gettextmessagestate',
                //         default: 'Text message [INDEX] [STATE]'
                //     }),
                //     arguments: {
                //         INDEX: {
                //             type: ArgumentType.NUMBER,
                //             defaultValue: 1
                //         },
                //         STATE: {
                //             type: ArgumentType.STRING,
                //             menu: 'textmessagestates',
                //             defaultValue: 'text'
                //         }
                //     },
                //     func: 'block_gettextmessagestate',
                //     sepafter: 36
                // },
                {
                    opcode: 'block_setpolling',
                    blockType: $6fe381f644bc7361$var$BlockType.COMMAND,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_setpolling',
                        default: 'Message polling [SW]'
                    }),
                    arguments: {
                        SW: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            menu: 'switchstates',
                            defaultValue: 'on'
                        }
                    },
                    func: 'block_setpolling'
                },
                {
                    opcode: 'block_whenmessagereceived',
                    blockType: $6fe381f644bc7361$var$BlockType.HAT,
                    isEdgeActivated: false,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_whenmessagereceived',
                        default: 'When message received'
                    }),
                    func: 'block_whenmessagereceived'
                },
                {
                    opcode: 'block_receivedmessageis',
                    blockType: $6fe381f644bc7361$var$BlockType.BOOLEAN,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_receivedmessageis',
                        default: 'Received message is [TYPE] ?'
                    }),
                    arguments: {
                        TYPE: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            menu: 'messagetypes',
                            defaultValue: 'text'
                        }
                    },
                    func: 'block_receivedmessageis'
                },
                {
                    opcode: 'block_getreceivedtextmessagestate',
                    blockType: $6fe381f644bc7361$var$BlockType.REPORTER,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_getreceivedtextmessagestate',
                        default: 'Received text message [STATE]'
                    }),
                    arguments: {
                        STATE: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            menu: 'textmessagestates',
                            defaultValue: 'text'
                        }
                    },
                    func: 'block_getreceivedtextmessagestate'
                },
                {
                    opcode: 'block_getreceivedtextmessageentitiescount',
                    blockType: $6fe381f644bc7361$var$BlockType.REPORTER,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_getreceivedtextmessageentitiescount',
                        default: 'Number of entities in received text message'
                    }),
                    func: 'block_getreceivedtextmessageentitiescount'
                },
                {
                    opcode: 'block_receivedtextmessageentityis',
                    blockType: $6fe381f644bc7361$var$BlockType.BOOLEAN,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_receivedtextmessageentityis',
                        default: 'Received text message entity [INDEX] is [TYPE] ?'
                    }),
                    arguments: {
                        INDEX: {
                            type: $6fe381f644bc7361$var$ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        TYPE: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            menu: 'textmessageentitytypes',
                            defaultValue: 'bot_command'
                        }
                    },
                    func: 'block_receivedtextmessageentityis'
                },
                {
                    opcode: 'block_getreceivedtextmessageentitystate',
                    blockType: $6fe381f644bc7361$var$BlockType.REPORTER,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_getreceivedtextmessageentitystate',
                        default: 'Received text message entity [INDEX] [STATE]'
                    }),
                    arguments: {
                        INDEX: {
                            type: $6fe381f644bc7361$var$ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        STATE: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            menu: 'textmessageentitystates',
                            defaultValue: 'type'
                        }
                    },
                    func: 'block_getreceivedtextmessageentitystate'
                },
                {
                    opcode: 'block_forwardreceivedmessage',
                    blockType: $6fe381f644bc7361$var$BlockType.COMMAND,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_forwardreceivedmessage',
                        default: 'Forward received message to chat id/username/channel [CHATID] , notification [NOTIF]'
                    }),
                    arguments: {
                        CHATID: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            defaultValue: '0'
                        },
                        NOTIF: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            menu: 'switchstates',
                            defaultValue: 'on'
                        }
                    },
                    func: 'block_forwardreceivedmessage',
                    sepafter: 36
                },
                {
                    func: 'noop',
                    blockType: $6fe381f644bc7361$var$BlockType.DIVLABEL,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_send',
                        default: 'Send'
                    })
                },
                {
                    opcode: 'block_sendmessage',
                    blockType: $6fe381f644bc7361$var$BlockType.COMMAND,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_sendmessage',
                        default: 'Send message [TEXT] parsing through [PARSE] to chat id/username/channel [CHATID] , notification [NOTIF] , reply to message id [MSGID]'
                    }),
                    arguments: {
                        TEXT: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            defaultValue: 'Hi'
                        },
                        CHATID: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            defaultValue: '0'
                        },
                        PARSE: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            menu: 'parsemodes',
                            defaultValue: 'none'
                        },
                        NOTIF: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            menu: 'switchstates',
                            defaultValue: 'on'
                        },
                        MSGID: {
                            type: $6fe381f644bc7361$var$ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    },
                    func: 'block_sendmessage',
                    sepafter: 36
                },
                {
                    opcode: 'block_sendphoto',
                    blockType: $6fe381f644bc7361$var$BlockType.COMMAND,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_sendphoto',
                        default: 'Send photo [PHOTO] to chat id/username/channel [CHATID] with caption [CAPTION] parsing through [PARSE] , notification [NOTIF] , reply to message id [MSGID]'
                    }),
                    arguments: {
                        PHOTO: {
                            type: $6fe381f644bc7361$var$ArgumentType.FILEINPUT,
                            defaultValue: 'photo.jpg'
                        },
                        CHATID: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            defaultValue: '0'
                        },
                        CAPTION: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            defaultValue: ''
                        },
                        PARSE: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            menu: 'parsemodes',
                            defaultValue: 'None'
                        },
                        NOTIF: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            menu: 'switchstates',
                            defaultValue: 'on'
                        },
                        MSGID: {
                            type: $6fe381f644bc7361$var$ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    },
                    func: 'block_sendphoto'
                },
                {
                    opcode: 'block_lastphotoid',
                    blockType: $6fe381f644bc7361$var$BlockType.REPORTER,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_lastphotoid',
                        default: 'Sent photo id'
                    }),
                    func: 'block_lastphotoid',
                    sepafter: 36
                },
                {
                    opcode: 'block_sendaudio',
                    blockType: $6fe381f644bc7361$var$BlockType.COMMAND,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_sendaudio',
                        default: 'Send audio [AUDIO] to chat id/username/channel [CHATID] with thumbnail [THUMB], caption [CAPTION] parsing through [PARSE] , notification [NOTIF] , reply to message id [MSGID]'
                    }),
                    arguments: {
                        AUDIO: {
                            type: $6fe381f644bc7361$var$ArgumentType.FILEINPUT,
                            defaultValue: 'audio.mp3'
                        },
                        CHATID: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            defaultValue: '0'
                        },
                        THUMB: {
                            type: $6fe381f644bc7361$var$ArgumentType.FILEINPUT,
                            defaultValue: ''
                        },
                        CAPTION: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            defaultValue: ''
                        },
                        PARSE: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            menu: 'parsemodes',
                            defaultValue: 'None'
                        },
                        NOTIF: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            menu: 'switchstates',
                            defaultValue: 'on'
                        },
                        MSGID: {
                            type: $6fe381f644bc7361$var$ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    },
                    func: 'block_sendaudio'
                },
                {
                    opcode: 'block_lastaudioid',
                    blockType: $6fe381f644bc7361$var$BlockType.REPORTER,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_lastaudioid',
                        default: 'Sent audio id'
                    }),
                    func: 'block_lastaudioid',
                    sepafter: 36
                },
                {
                    opcode: 'block_sendvideo',
                    blockType: $6fe381f644bc7361$var$BlockType.COMMAND,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_sendvideo',
                        default: 'Send video [VIDEO] to chat id/username/channel [CHATID] with thumbnail [THUMB], caption [CAPTION] parsing through [PARSE] , notification [NOTIF] , reply to message id [MSGID]'
                    }),
                    arguments: {
                        VIDEO: {
                            type: $6fe381f644bc7361$var$ArgumentType.FILEINPUT,
                            defaultValue: 'video.mp4'
                        },
                        CHATID: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            defaultValue: '0'
                        },
                        THUMB: {
                            type: $6fe381f644bc7361$var$ArgumentType.FILEINPUT,
                            defaultValue: ''
                        },
                        CAPTION: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            defaultValue: ''
                        },
                        PARSE: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            menu: 'parsemodes',
                            defaultValue: 'None'
                        },
                        NOTIF: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            menu: 'switchstates',
                            defaultValue: 'on'
                        },
                        MSGID: {
                            type: $6fe381f644bc7361$var$ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    },
                    func: 'block_sendvideo'
                },
                {
                    opcode: 'block_lastvideoid',
                    blockType: $6fe381f644bc7361$var$BlockType.REPORTER,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_lastvideoid',
                        default: 'Sent video id'
                    }),
                    func: 'block_lastvideoid',
                    sepafter: 36
                },
                {
                    opcode: 'block_sendanimation',
                    blockType: $6fe381f644bc7361$var$BlockType.COMMAND,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_sendanimation',
                        default: 'Send animation [ANIMATION] to chat id/username/channel [CHATID] with thumbnail [THUMB], caption [CAPTION] parsing through [PARSE] , notification [NOTIF] , reply to message id [MSGID]'
                    }),
                    arguments: {
                        ANIMATION: {
                            type: $6fe381f644bc7361$var$ArgumentType.FILEINPUT,
                            defaultValue: 'animation.gif'
                        },
                        CHATID: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            defaultValue: '0'
                        },
                        THUMB: {
                            type: $6fe381f644bc7361$var$ArgumentType.FILEINPUT,
                            defaultValue: ''
                        },
                        CAPTION: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            defaultValue: ''
                        },
                        PARSE: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            menu: 'parsemodes',
                            defaultValue: 'None'
                        },
                        NOTIF: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            menu: 'switchstates',
                            defaultValue: 'on'
                        },
                        MSGID: {
                            type: $6fe381f644bc7361$var$ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    },
                    func: 'block_sendanimation'
                },
                {
                    opcode: 'block_lastanimationid',
                    blockType: $6fe381f644bc7361$var$BlockType.REPORTER,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_lastanimationid',
                        default: 'Sent animation id'
                    }),
                    func: 'block_lastanimationid',
                    sepafter: 36
                },
                {
                    opcode: 'block_sendvoice',
                    blockType: $6fe381f644bc7361$var$BlockType.COMMAND,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_sendvoice',
                        default: 'Send voice [VOICE] to chat id/username/channel [CHATID] with caption [CAPTION] parsing through [PARSE] , notification [NOTIF] , reply to message id [MSGID]'
                    }),
                    arguments: {
                        VOICE: {
                            type: $6fe381f644bc7361$var$ArgumentType.FILEINPUT,
                            defaultValue: 'voice.ogg'
                        },
                        CHATID: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            defaultValue: '0'
                        },
                        CAPTION: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            defaultValue: ''
                        },
                        PARSE: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            menu: 'parsemodes',
                            defaultValue: 'None'
                        },
                        NOTIF: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            menu: 'switchstates',
                            defaultValue: 'on'
                        },
                        MSGID: {
                            type: $6fe381f644bc7361$var$ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    },
                    func: 'block_sendvoice'
                },
                {
                    opcode: 'block_lastvoiceid',
                    blockType: $6fe381f644bc7361$var$BlockType.REPORTER,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_lastvoiceid',
                        default: 'Sent voice id'
                    }),
                    func: 'block_lastvoiceid',
                    sepafter: 36
                },
                {
                    opcode: 'block_senddocument',
                    blockType: $6fe381f644bc7361$var$BlockType.COMMAND,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_senddocument',
                        default: 'Send document [DOCUMENT] to chat id/username/channel [CHATID] with thumbnail [THUMB], caption [CAPTION] parsing through [PARSE] , notification [NOTIF] , reply to message id [MSGID]'
                    }),
                    arguments: {
                        DOCUMENT: {
                            type: $6fe381f644bc7361$var$ArgumentType.FILEINPUT,
                            defaultValue: 'document.zip'
                        },
                        CHATID: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            defaultValue: '0'
                        },
                        THUMB: {
                            type: $6fe381f644bc7361$var$ArgumentType.FILEINPUT,
                            defaultValue: ''
                        },
                        CAPTION: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            defaultValue: ''
                        },
                        PARSE: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            menu: 'parsemodes',
                            defaultValue: 'None'
                        },
                        NOTIF: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            menu: 'switchstates',
                            defaultValue: 'on'
                        },
                        MSGID: {
                            type: $6fe381f644bc7361$var$ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    },
                    func: 'block_senddocument'
                },
                {
                    opcode: 'block_lastdocumentid',
                    blockType: $6fe381f644bc7361$var$BlockType.REPORTER,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_lastdocumentid',
                        default: 'Sent document id'
                    }),
                    func: 'block_lastdocumentid',
                    sepafter: 36
                },
                {
                    opcode: 'block_sendlocation',
                    blockType: $6fe381f644bc7361$var$BlockType.COMMAND,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_sendlocation',
                        default: 'Send location latitude [LATITUDE] longitude [LONGITUDE] to chat id/username/channel [CHATID]'
                    }),
                    arguments: {
                        LATITUDE: {
                            type: $6fe381f644bc7361$var$ArgumentType.NUMBER,
                            defaultValue: 25.021356
                        },
                        LONGITUDE: {
                            type: $6fe381f644bc7361$var$ArgumentType.NUMBER,
                            defaultValue: 121.525577
                        },
                        CHATID: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            defaultValue: '0'
                        }
                    },
                    func: 'block_sendlocation',
                    sepafter: 36
                },
                {
                    opcode: 'block_sendcontact',
                    blockType: $6fe381f644bc7361$var$BlockType.COMMAND,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_sendcontact',
                        default: 'Send contact first name [FNAME] last name [LNAME] phone number [PHONE] to chat id/username/channel [CHATID]'
                    }),
                    arguments: {
                        FNAME: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            defaultValue: 'Gmii'
                        },
                        LNAME: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            defaultValue: ''
                        },
                        PHONE: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            defaultValue: '0223681604'
                        },
                        CHATID: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            defaultValue: '0'
                        }
                    },
                    func: 'block_sendcontact',
                    sepafter: 36
                },
                {
                    func: 'noop',
                    blockType: $6fe381f644bc7361$var$BlockType.DIVLABEL,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_command',
                        default: 'Command'
                    })
                },
                {
                    opcode: 'block_getcommandcount',
                    blockType: $6fe381f644bc7361$var$BlockType.REPORTER,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_getcommandcount',
                        default: 'Number of commands'
                    }),
                    func: 'block_getcommandcount'
                },
                {
                    opcode: 'block_getcommandstate',
                    blockType: $6fe381f644bc7361$var$BlockType.REPORTER,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_getcommandstate',
                        default: 'Command [INDEX] [STATE]'
                    }),
                    arguments: {
                        INDEX: {
                            type: $6fe381f644bc7361$var$ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        STATE: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            menu: 'commandstates',
                            defaultValue: 'command'
                        }
                    },
                    func: 'block_getcommandstate'
                },
                {
                    opcode: 'block_setcommand',
                    blockType: $6fe381f644bc7361$var$BlockType.COMMAND,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_setcommand',
                        default: 'Set Command [COMMAND] [DESCRIPTION]'
                    }),
                    arguments: {
                        COMMAND: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            defaultValue: 'start'
                        },
                        DESCRIPTION: {
                            type: $6fe381f644bc7361$var$ArgumentType.STRING,
                            defaultValue: 'start bot'
                        }
                    },
                    func: 'block_setcommand'
                },
                {
                    opcode: 'block_removecommand',
                    blockType: $6fe381f644bc7361$var$BlockType.COMMAND,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_removecommand',
                        default: 'Remove Command [INDEX]'
                    }),
                    arguments: {
                        INDEX: {
                            type: $6fe381f644bc7361$var$ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    },
                    func: 'block_removecommand'
                },
                {
                    opcode: 'block_clearcommand',
                    blockType: $6fe381f644bc7361$var$BlockType.COMMAND,
                    text: $6fe381f644bc7361$var$formatMessage({
                        id: 'TelegramBot.block_clearcommand',
                        default: 'Clear Command'
                    }),
                    func: 'block_clearcommand',
                    sepafter: 36
                }
            ],
            menus: {
                switchstates: [
                    'on',
                    'off'
                ],
                messagetypes: [
                    'text',
                    'sticker',
                    'photo',
                    'audio',
                    'video',
                    'animation',
                    'file',
                    'voice',
                    'video note',
                    'location',
                    'venue',
                    'contact',
                    'poll',
                    'dice',
                    'game'
                ],
                textmessagestates: [
                    'id',
                    'text',
                    'date',
                    'chat id',
                    'chat type',
                    'user/bot id',
                    'user/bot name',
                    'user/bot username',
                    'is bot?'
                ],
                textmessageentitytypes: [
                    'mention',
                    'hashtag',
                    'cashtag',
                    'bot_command',
                    'url',
                    'email',
                    'phone_number',
                    'bold',
                    'italic',
                    'underline',
                    'strikethrough',
                    'code',
                    'pre',
                    'text_link',
                    'text_mention'
                ],
                textmessageentitystates: [
                    'type',
                    'offset',
                    'length',
                    'text'
                ],
                parsemodes: [
                    'none',
                    'Markdown',
                    'MarkdownV2',
                    'HTML'
                ],
                commandstates: [
                    'command',
                    'description'
                ]
            },
            translation_map: {
                'zh-tw': {
                    block_setbot: "\u8A2D\u5B9A\u6A5F\u5668\u4EBA token [TOKEN]",
                    block_getname: "\u6A5F\u5668\u4EBA\u540D\u7A31",
                    block_getusername: "\u6A5F\u5668\u4EBA\u4F7F\u7528\u8005\u540D\u7A31",
                    block_receive: "\u63A5\u6536",
                    block_setpolling: "\u8A0A\u606F\u8F2A\u8A62 [SW]",
                    block_whenmessagereceived: "\u7576\u6536\u5230\u8A0A\u606F",
                    block_receivedmessageis: "\u6536\u5230\u7684\u8A0A\u606F\u662F [TYPE] ?",
                    block_getreceivedtextmessagestate: "\u6536\u5230\u7684\u6587\u5B57\u8A0A\u606F\u7684 [STATE]",
                    block_getreceivedtextmessageentitiescount: "\u6536\u5230\u7684\u6587\u5B57\u8A0A\u606F\u4E2D\u7279\u6B8A\u5BE6\u9AD4\u7684\u6578\u91CF",
                    block_receivedtextmessageentityis: "\u6536\u5230\u7684\u6587\u5B57\u8A0A\u606F\u4E2D\u7B2C [INDEX] \u500B\u7279\u6B8A\u5BE6\u9AD4\u662F [TYPE] ?",
                    block_getreceivedtextmessageentitystate: "\u6536\u5230\u7684\u6587\u5B57\u8A0A\u606F\u4E2D\u7B2C [INDEX] \u500B\u7279\u6B8A\u5BE6\u9AD4\u7684 [STATE]",
                    block_forwardreceivedmessage: "\u8F49\u50B3\u6536\u5230\u7684\u8A0A\u606F\u81F3\u804A\u5929\u5BA4ID/\u4F7F\u7528\u8005\u540D\u7A31/\u983B\u9053 [CHATID] , \u63D0\u9192 [NOTIF]",
                    block_send: "\u767C\u9001",
                    block_sendmessage: "\u767C\u9001\u900F\u904E [PARSE] \u89E3\u6790\u7684\u6587\u5B57 [TEXT] \u81F3\u804A\u5929\u5BA4ID/\u4F7F\u7528\u8005\u540D\u7A31/\u983B\u9053 [CHATID] , \u63D0\u9192 [NOTIF] , \u56DE\u8986\u7684\u8A0A\u606FID [MSGID]",
                    block_sendphoto: "\u767C\u9001\u7167\u7247 [PHOTO] \u81F3\u804A\u5929\u5BA4ID/\u4F7F\u7528\u8005\u540D\u7A31/\u983B\u9053 [CHATID] , \u5305\u542B\u900F\u904E [PARSE] \u89E3\u6790\u7684\u6A19\u984C [CAPTION] , \u63D0\u9192 [NOTIF] , \u56DE\u8986\u7684\u8A0A\u606FID [MSGID]",
                    block_lastphotoid: "\u767C\u9001\u7684\u7167\u7247ID",
                    block_sendaudio: "\u767C\u9001\u97F3\u8A0A [AUDIO] \u81F3\u804A\u5929\u5BA4ID/\u4F7F\u7528\u8005\u540D\u7A31/\u983B\u9053 [CHATID] , \u5305\u542B\u7E2E\u5716 [THUMB] , \u900F\u904E [PARSE] \u89E3\u6790\u7684\u6A19\u984C [CAPTION] , \u63D0\u9192 [NOTIF] , \u56DE\u8986\u7684\u8A0A\u606FID [MSGID]",
                    block_lastaudioid: "\u767C\u9001\u7684\u97F3\u8A0AID",
                    block_sendvideo: "\u767C\u9001\u8996\u8A0A [VIDEO] \u81F3\u804A\u5929\u5BA4ID/\u4F7F\u7528\u8005\u540D\u7A31/\u983B\u9053 [CHATID] , \u5305\u542B\u7E2E\u5716 [THUMB] , \u900F\u904E [PARSE] \u89E3\u6790\u7684\u6A19\u984C [CAPTION] , \u63D0\u9192 [NOTIF] , \u56DE\u8986\u7684\u8A0A\u606FID [MSGID]",
                    block_lastvideoid: "\u767C\u9001\u7684\u8996\u8A0AID",
                    block_sendanimation: "\u767C\u9001\u52D5\u756B [ANIMATION] \u81F3\u804A\u5929\u5BA4ID/\u4F7F\u7528\u8005\u540D\u7A31/\u983B\u9053 [CHATID] , \u5305\u542B\u7E2E\u5716 [THUMB] , \u900F\u904E [PARSE] \u89E3\u6790\u7684\u6A19\u984C [CAPTION] , \u63D0\u9192 [NOTIF] , \u56DE\u8986\u7684\u8A0A\u606FID [MSGID]",
                    block_lastanimationid: "\u767C\u9001\u7684\u52D5\u756BID",
                    block_sendvoice: "\u767C\u9001\u8A9E\u97F3 [VOICE] \u81F3\u804A\u5929\u5BA4ID/\u4F7F\u7528\u8005\u540D\u7A31/\u983B\u9053 [CHATID] , \u5305\u542B\u900F\u904E [PARSE] \u89E3\u6790\u7684\u6A19\u984C [CAPTION] , \u63D0\u9192 [NOTIF] , \u56DE\u8986\u7684\u8A0A\u606FID [MSGID]",
                    block_lastvoiceid: "\u767C\u9001\u7684\u8A9E\u97F3ID",
                    block_senddocument: "\u767C\u9001\u6A94\u6848 [DOCUMENT] \u81F3\u804A\u5929\u5BA4ID/\u4F7F\u7528\u8005\u540D\u7A31/\u983B\u9053 [CHATID] , \u5305\u542B\u7E2E\u5716 [THUMB] , \u900F\u904E [PARSE] \u89E3\u6790\u7684\u6A19\u984C [CAPTION] , \u63D0\u9192 [NOTIF] , \u56DE\u8986\u7684\u8A0A\u606FID [MSGID]",
                    block_lastdocumentid: "\u767C\u9001\u7684\u6A94\u6848ID",
                    block_sendlocation: "\u767C\u9001\u4F4D\u7F6E \u7DEF\u5EA6 [LATITUDE] \u7D93\u5EA6 [LONGITUDE] \u81F3\u804A\u5929\u5BA4ID/\u4F7F\u7528\u8005\u540D\u7A31/\u983B\u9053 [CHATID]",
                    block_sendcontact: "\u767C\u9001\u806F\u7D61\u8CC7\u8A0A \u59D3 [LNAME] \u540D [FNAME] \u96FB\u8A71\u865F\u78BC [PHONE] \u81F3\u804A\u5929\u5BA4ID/\u4F7F\u7528\u8005\u540D\u7A31/\u983B\u9053 [CHATID]",
                    block_command: "\u547D\u4EE4",
                    block_getcommandcount: "\u547D\u4EE4\u6578\u91CF",
                    block_getcommandstate: "\u7B2C [INDEX] \u500B\u547D\u4EE4\u7684 [STATE]",
                    block_setcommand: "\u8A2D\u7F6E\u547D\u4EE4 [COMMAND] \u63CF\u8FF0 [DESCRIPTION]",
                    block_removecommand: "\u522A\u9664\u7B2C [INDEX] \u500B\u547D\u4EE4",
                    block_clearcommand: "\u6E05\u9664\u6240\u6709\u547D\u4EE4",
                    switchstates: {
                        'on': "\u958B",
                        'off': "\u95DC"
                    },
                    messagetypes: {
                        'text': "\u6587\u5B57",
                        'sticker': "\u8868\u60C5\u7B26\u865F",
                        'photo': "\u7167\u7247",
                        'audio': "\u97F3\u8A0A",
                        'video': "\u8996\u8A0A",
                        'animation': "\u52D5\u756B",
                        'file': "\u6A94\u6848",
                        'voice': "\u8A9E\u97F3",
                        'video note': "\u8996\u8A0A\u7B46\u8A18",
                        'location': "\u4F4D\u7F6E",
                        'venue': "\u6703\u5834",
                        'contact': "\u806F\u7D61\u8CC7\u8A0A",
                        'poll': "\u6295\u7968",
                        'dice': "\u9AB0\u5B50",
                        'game': "\u904A\u6232"
                    },
                    textmessagestates: {
                        'id': 'ID',
                        'text': "\u6587\u5B57",
                        'date': "\u6642\u9593",
                        'chat id': "\u804A\u5929\u5BA4 ID",
                        'chat type': "\u804A\u5929\u5BA4 \u7A2E\u985E",
                        'user/bot id': "\u4F7F\u7528\u8005/\u6A5F\u5668\u4EBA ID",
                        'user/bot name': "\u4F7F\u7528\u8005/\u6A5F\u5668\u4EBA \u540D\u7A31",
                        'user/bot username': "\u4F7F\u7528\u8005/\u6A5F\u5668\u4EBA \u4F7F\u7528\u8005\u540D\u7A31",
                        'is bot?': "\u662F\u6A5F\u5668\u4EBA?"
                    },
                    textmessageentitystates: {
                        'type': "\u7A2E\u985E",
                        'offset': "\u958B\u59CB\u4F4D\u7F6E",
                        'length': "\u9577\u5EA6",
                        'text': "\u6587\u5B57"
                    },
                    parsemodes: {
                        'none': "\u7121",
                        'Markdown': 'Markdown',
                        'MarkdownV2': 'MarkdownV2',
                        'HTML': 'HTML'
                    },
                    commandstates: {
                        'command': "\u547D\u4EE4",
                        'description': "\u63CF\u8FF0"
                    }
                }
            }
        };
    }
    /****************************************************************************************************/ /****************************************************************************************************/ /****************************************************************************************************/ getTextMessageProperty(message, state) {
        switch(state){
            case 'text':
                return message.text;
            case 'id':
                return message.message_id;
            case 'date':
                return message.date;
            case 'is bot?':
                return message.from.is_bot;
            case 'user/bot id':
                return message.from.id;
            case 'user/bot name':
                let name = message.from.first_name;
                if (message.from.last_name) name += ' ' + message.from.last_name;
                return name;
            case 'user/bot username':
                return message.from.username;
            case 'chat id':
                return message.chat.id;
            case 'chat type':
                return message.chat.type;
            default:
                return undefined;
        }
    }
    checkMessageType(message, type) {
        switch(type){
            case 'text':
                return 'text' in message;
            case 'sticker':
                return 'sticker' in message;
            case 'photo':
                return 'photo' in message;
            case 'audio':
                return 'audio' in message;
            case 'video':
                return 'video' in message;
            case 'animation':
                return 'animation' in message;
            case 'file':
                return 'document' in message;
            case 'voice':
                return 'voice' in message;
            case 'video note':
                return 'video_note' in message;
            case 'location':
                return 'location' in message;
            case 'venue':
                return 'venue' in message;
            case 'contact':
                return 'contact' in message;
            case 'poll':
                return 'poll' in message;
            case 'dice':
                return 'dice' in message;
            case 'game':
                return 'game' in message;
            default:
                return false;
        }
    }
    /****************************************************************************************************/ /****************************************************************************************************/ /****************************************************************************************************/ block_setbot(args, util) {
        const token = args.TOKEN;
        if (!this.bot || this.bot.token !== token) {
            this._pollingActive = false;
            this._pollOffset = 0;
            this.bot = {
                token: token
            };
            return fetch(`${$6fe381f644bc7361$var$TELEGRAM_API}/bot${token}/getMe`).then((r)=>r.json()).then((json)=>{
                if (json.ok && json.result.is_bot) console.log('[TelegramBot] Connected:', json.result.username);
                else {
                    this.bot = undefined;
                    throw new Error(json.description || 'Invalid bot token');
                }
            });
        }
    }
    block_getname(args, util) {
        return this._request('getMe', {}).then((res)=>res.first_name);
    }
    block_getusername(args, util) {
        return this._request('getMe', {}).then((res)=>res.username);
    }
    block_setpolling(args, util) {
        const sw = args.SW;
        if (!this.bot) return;
        if (sw === 'on') {
            if (!this._pollingActive) {
                this._pollingActive = true;
                console.log('[TelegramBot] Starting custom polling...');
                this._pollLoop();
            } else console.log('[TelegramBot] Already polling');
        } else {
            this._pollingActive = false;
            console.log('[TelegramBot] Polling stopped');
        }
    }
    block_whenmessagereceived(args, util) {
        return true;
    }
    block_receivedmessageis(args, util) {
        const type = args.TYPE;
        return this.getReceivedMessage().then((message)=>this.checkMessageType(message, type));
    }
    block_getreceivedtextmessagestate(args, util) {
        const state = args.STATE;
        return this.getReceivedMessage().then((message)=>this.getTextMessageProperty(message, state));
    }
    block_getreceivedtextmessageentitiescount(args, util) {
        return this.getReceivedMessage().then((message)=>{
            if (message.entities) return message.entities.length;
            return 0;
        });
    }
    block_receivedtextmessageentityis(args, util) {
        const index = parseInt(args.INDEX);
        const type = args.TYPE;
        return this.getReceivedTextMessageEntity(index - 1).then((entity)=>entity.type === type);
    }
    block_getreceivedtextmessageentitystate(args, util) {
        const index = parseInt(args.INDEX);
        const state = args.STATE;
        return this.getReceivedTextMessageEntity(index - 1).then((entity)=>{
            if (state === 'text') return this.getReceivedMessage().then((message)=>{
                const text = this.getTextMessageProperty(message, 'text');
                return text.substr(entity.offset, entity.length);
            });
            return entity[state];
        });
    }
    block_forwardreceivedmessage(args, util) {
        const chatid = args.CHATID;
        const notification = args.NOTIF === 'on';
        return this.getReceivedMessage().then((message)=>{
            const fromchatid = this.getTextMessageProperty(message, 'chat id');
            const messageid = this.getTextMessageProperty(message, 'id');
            const params = {
                chat_id: chatid,
                from_chat_id: fromchatid,
                message_id: messageid
            };
            if (!notification) params.disable_notification = true;
            return this._request('forwardMessage', params);
        });
    }
    block_sendmessage(args, util) {
        const params = {
            chat_id: args.CHATID,
            text: args.TEXT
        };
        if (args.PARSE !== 'none') params.parse_mode = args.PARSE;
        if (args.NOTIF !== 'on') params.disable_notification = true;
        if (parseInt(args.MSGID) > 0) params.reply_to_message_id = parseInt(args.MSGID);
        return this._request('sendMessage', params).then((res)=>{
            if (this.bot) this.bot.last_text_message = res;
        });
    }
    block_lasttextmessageid(args, util) {
        return this.getLastTextMessage().then((m)=>m.message_id);
    }
    block_sendphoto(args, util) {
        const extra = {};
        if (args.CAPTION && args.CAPTION.length > 0) extra.caption = args.CAPTION;
        if (args.PARSE !== 'none') extra.parse_mode = args.PARSE;
        if (args.NOTIF !== 'on') extra.disable_notification = true;
        if (parseInt(args.MSGID) > 0) extra.reply_to_message_id = parseInt(args.MSGID);
        return this._sendMedia('sendPhoto', 'photo', args.PHOTO, args.CHATID, extra, 'last_photo_message');
    }
    block_lastphotoid(args, util) {
        return this.getLastPhotoMessage().then((m)=>m.photo[m.photo.length - 1].file_id);
    }
    block_sendaudio(args, util) {
        const extra = {};
        if (args.CAPTION && args.CAPTION.length > 0) extra.caption = args.CAPTION;
        if (args.PARSE !== 'none') extra.parse_mode = args.PARSE;
        if (args.NOTIF !== 'on') extra.disable_notification = true;
        if (parseInt(args.MSGID) > 0) extra.reply_to_message_id = parseInt(args.MSGID);
        return this._sendMedia('sendAudio', 'audio', args.AUDIO, args.CHATID, extra, 'last_audio_message');
    }
    block_lastaudioid(args, util) {
        return this.getLastAudioMessage().then((m)=>m.audio.file_id);
    }
    block_sendvideo(args, util) {
        const extra = {};
        if (args.CAPTION && args.CAPTION.length > 0) extra.caption = args.CAPTION;
        if (args.PARSE !== 'none') extra.parse_mode = args.PARSE;
        if (args.NOTIF !== 'on') extra.disable_notification = true;
        if (parseInt(args.MSGID) > 0) extra.reply_to_message_id = parseInt(args.MSGID);
        return this._sendMedia('sendVideo', 'video', args.VIDEO, args.CHATID, extra, 'last_video_message');
    }
    block_lastvideoid(args, util) {
        return this.getLastVideoMessage().then((m)=>m.video.file_id);
    }
    block_sendanimation(args, util) {
        const extra = {};
        if (args.CAPTION && args.CAPTION.length > 0) extra.caption = args.CAPTION;
        if (args.PARSE !== 'none') extra.parse_mode = args.PARSE;
        if (args.NOTIF !== 'on') extra.disable_notification = true;
        if (parseInt(args.MSGID) > 0) extra.reply_to_message_id = parseInt(args.MSGID);
        return this._sendMedia('sendAnimation', 'animation', args.ANIMATION, args.CHATID, extra, 'last_animation_message');
    }
    block_lastanimationid(args, util) {
        return this.getLastAnimationMessage().then((m)=>m.animation.file_id);
    }
    block_sendvoice(args, util) {
        const extra = {};
        if (args.CAPTION && args.CAPTION.length > 0) extra.caption = args.CAPTION;
        if (args.PARSE !== 'none') extra.parse_mode = args.PARSE;
        if (args.NOTIF !== 'on') extra.disable_notification = true;
        if (parseInt(args.MSGID) > 0) extra.reply_to_message_id = parseInt(args.MSGID);
        return this._sendMedia('sendVoice', 'voice', args.VOICE, args.CHATID, extra, 'last_voice_message');
    }
    block_lastvoiceid(args, util) {
        return this.getLastVoiceMessage().then((m)=>m.voice.file_id);
    }
    block_senddocument(args, util) {
        const extra = {};
        if (args.CAPTION && args.CAPTION.length > 0) extra.caption = args.CAPTION;
        if (args.PARSE !== 'none') extra.parse_mode = args.PARSE;
        if (args.NOTIF !== 'on') extra.disable_notification = true;
        if (parseInt(args.MSGID) > 0) extra.reply_to_message_id = parseInt(args.MSGID);
        return this._sendMedia('sendDocument', 'document', args.DOCUMENT, args.CHATID, extra, 'last_document_message');
    }
    block_lastdocumentid(args, util) {
        return this.getLastDocumentMessage().then((m)=>m.document.file_id);
    }
    block_sendlocation(args, util) {
        return this._request('sendLocation', {
            chat_id: args.CHATID,
            latitude: parseFloat(args.LATITUDE),
            longitude: parseFloat(args.LONGITUDE)
        });
    }
    block_sendcontact(args, util) {
        const params = {
            chat_id: args.CHATID,
            phone_number: args.PHONE,
            first_name: args.FNAME
        };
        if (args.LNAME && args.LNAME.length > 0) params.last_name = args.LNAME;
        return this._request('sendContact', params);
    }
    block_getcommandcount(args, util) {
        return this.getCommands().then((commands)=>commands.length);
    }
    block_getcommandstate(args, util) {
        const index = parseInt(args.INDEX);
        const state = args.STATE;
        return this.getCommands().then((commands)=>{
            const cmd = commands[index - 1];
            if (!cmd) throw new Error('Command index out of range.');
            return cmd[state];
        });
    }
    block_setcommand(args, util) {
        const command = args.COMMAND;
        const description = args.DESCRIPTION;
        return this.getCommands().then((commands)=>{
            const existing = commands.find((c)=>c.command === command);
            if (existing) existing.description = description;
            else commands.push({
                command: command,
                description: description
            });
            return this.setCommands(commands);
        });
    }
    block_removecommand(args, util) {
        const index = parseInt(args.INDEX);
        return this.getCommands().then((commands)=>{
            commands.splice(index - 1, 1);
            return this.setCommands(commands);
        });
    }
    block_clearcommand(args, util) {
        return this.setCommands([]);
    }
}
module.exports = $6fe381f644bc7361$var$TelegramBotExtension;


//# sourceMappingURL=index.js.map
