console.log('\u001b[33;1m✴ Hello, anomaly world! ✴\u001b[0m')

const beginTime = new Date()
const fs = require('fs')
const { Client, GatewayIntentBits, Collection, EmbedBuilder, Message, GuildMember, UserSelectMenuInteraction, time} = require('discord.js')
const roles = require('./rolesid.json')
const pg = require('pg')
const ws = require('ws')
const Model = require('./models/base_model')
const { log } = require('console')
const { channel } = require('diagnostics_channel')
const client = new Client({intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildModeration,
  GatewayIntentBits.GuildEmojisAndStickers,
  GatewayIntentBits.GuildIntegrations,
  GatewayIntentBits.GuildWebhooks,
  GatewayIntentBits.GuildInvites,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.GuildMessageReactions,
  GatewayIntentBits.GuildMessageTyping,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildScheduledEvents,
  GatewayIntentBits.GuildPresences,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.DirectMessageReactions,
  GatewayIntentBits.DirectMessageTyping,
  GatewayIntentBits.DirectMessages
]})
config = require('./config.json')
client.login(config.token).then(async () =>
  {
    try {
      client.pg = new pg.Pool(require('./pg.json'))
      await client.pg.connect(err => {
        if (err) {console.error(err); return undefined }
      })
      let guildId = require('./config.json').guildId
      Model.pg = client.pg
      Model.guild = client.guilds.cache.find(guild => guild.id == guildId)
      Model.client = client
      log(`\x1b[32mSuccesfully\x1b[0m connected to Discord API and database in ${new Date() - beginTime}ms`)
    } catch (e) {
      console.error(`\u001b[31mFailed\u001b[0m connection to Discord API and database: ${e.stack}`)
    }
  }
)
console.group('Attachment custom discord modules to client:')
// Сохранение команд в клиенте
client.commands = new Collection()
const commandFiles = fs.readdirSync(`${__dirname}/commands`).filter(file => file.endsWith('js'))
console.log(`\u001b[30m${commandFiles.length} commands found.`)
commandFiles.forEach((value, index) => {
  const command = require(`./commands/${value}`)
  if ('data' in command && 'execute' in command){ ``
    client.commands.set(command.data.name, command)
  } else {
    console.error(`The command at './command/${value}' is missing a required "data" or "execute" property.`)
  }
})

// Сохранение модальных окон в клиенте
client.modals = new Collection()
const modalFiles = fs.readdirSync(`${__dirname}/modals`).filter(file => file.endsWith('js'))
console.log(`${modalFiles.length} modals found.`)
modalFiles.forEach((value) => {
  const modal = require(`./modals/${value}`);
  if ('name' in modal && 'execute' in modal) {
    client.modals.set(modal.name, modal)
  } else {
    console.error(`The command at './modals/${value}' is missing a required "name" and "execute" property.`)
  }
})

// Сохранение кнопок в клиенте
client.buttons = new Collection()
const buttonFiles = fs.readdirSync(`${__dirname}/buttons`).filter(file => file.endsWith('js'))
console.log(`${buttonFiles.length} buttons found.`)
buttonFiles.forEach(value => {
  const button = require(`./buttons/${value}`)
  if ('name' in button && 'execute' in button) {
    client.buttons.set(button.name, button)
  } else {
    console.error(`The command at './buttons/${value}' is missing a required "name" and "execute" property.`)
  }
}) 

// Сохранение StringSelectMenu в клиенте
client.stringSelectMenus = new Collection()
const stringSelectMenusFiles = fs.readdirSync(`${__dirname}/stringSelectMenus`).filter(file => file.endsWith('js'))
console.log(`${stringSelectMenusFiles.length} string select menus found.`)
stringSelectMenusFiles.forEach(value => {
  const stringSelectMenu = require(`./stringSelectMenus/${value}`)
  if ('name' in stringSelectMenu && 'execute' in stringSelectMenu) {
    client.stringSelectMenus.set(stringSelectMenu.name, stringSelectMenu)
  } else {
    console.error(`The command at './stringSelectMenus/${value}' is missing a required "name" and "execute" property.`)
  }
})

// Сохранение StringSelectMenu в клиенте

client.userSelectMenus = new Collection()
const userSelectMenusFiles = fs.readdirSync(`${__dirname}/userSelectMenus`).filter(file => file.endsWith('js'))
console.log(`${userSelectMenusFiles.length} user select menus found.\u001b[0m`)
userSelectMenusFiles.forEach(value => {
  const userSelectMenus = require(`./userSelectMenus/${value}`)
  if ('name' in userSelectMenus && 'execute' in userSelectMenus) {
    client.userSelectMenus.set(userSelectMenus.name, userSelectMenus)
  } else {
    console.error(`The command at './userSelectMenus/${value}' is missing a required "name" and "execute" property.`)
  }
})
console.groupEnd()
// Сохранение ролей в клиенте
client.roles = require('./rolesid.json')

// Генератор embed для сообщения об ошибке
client.generateErrorMessage = content => 
{
  return {
    ephemeral: false,
    embeds: [
      new EmbedBuilder()
      .setTitle('Ошибка')
      .setThumbnail('https://media.discordapp.net/attachments/940732872350924800/1080284864105938984/free-icon-error-1008930.png')
      .setColor(0xff0000)
      .setDescription(content)
    ]
  }
}

/**
 * 
 * @param {GuildMember} member 
 */
client.calcClearanceLevel = (member) => {
  const roles = require('./rolesid.json')
  var clearance_level = 0
  for (const [role_name, role_specs] of Object.entries(roles)) {
    const found = member.roles.cache.find(role => role.id == role_specs.id)
    clearance_level = (found && role_specs.cl > clearance_level) ? role_specs.cl : clearance_level
  }
  return clearance_level
}

// tic_tac_toe  
global.tic_tac_toe = new Map()

client.anomaliesCategoryId = '852138601034809348'
require('./events')(client, roles)


// Ивенты process
process
.on('SIGINT', async code => {
  console.log(`ThaumielOS \u001b[34mstopped\u001b[0m.\nWork time: ${formatDuration(new Date() - beginTime)}\n⸜(｡˃ ᵕ ˂ )⸝♡`)
  
  // await client.guilds.cache.at(0).channels.cache.find(channel => channel.id == "951572654534582362").send({
  //   embeds: [
  //     new EmbedBuilder()
  //     .setDescription(`Thaumiel OS отключён.`)
  //     .setColor(0x0000ff)
  //   ]
  // })
  process.exit(0)
})
.on('uncaughtException', code => {
  console.log(`ThaumielOS \u001b[31mcrashed\u001b[0m.\nWork time: ${formatDuration(new Date() - beginTime)}\n¯\\_(ツ)_/¯\nError: ${code.stack}\n`)
  client.guilds.cache.at(0).channels.cache.find(channel => channel.id == "951572654534582362").send({
    embeds: [
      new EmbedBuilder()
      .setDescription(`Thaumiel OS запущен.`)
      .setColor(0xFF0000)
    ]
  })
  process.exit(1)
})
function formatDuration(ms) {
  let seconds = Math.floor(ms / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  let days = Math.floor(hours / 24);

  seconds = seconds % 60;
  minutes = minutes % 60;
  hours = hours % 24;

  let formatted = "";
  if (days > 0) formatted += `${days}d`;
  if (hours > 0) formatted += `${formatted.length > 0 ? " " : ""}${hours}h`;
  if (minutes > 0) formatted += `${formatted.length > 0 ? " " : ""}${minutes}m`;
  if (seconds > 0 || formatted.length === 0) formatted += `${formatted.length > 0 ? " " : ""}${seconds}s`;

  return formatted;
}
