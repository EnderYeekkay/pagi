const { Interaction, Client, StringSelectMenuInteraction, ButtonInteraction, ModalSubmitInteraction, UserSelectMenuInteraction, CommandInteraction } = require('discord.js')

/**
 * @param {Client} client
 * @param {Interaction} interaction 
 */
module.exports = async (client, interaction) => {
  if (interaction?.customId?.includes('collector')) {
    console.log('The interaction is handled by the collector');
    return 0;
  }
  var ftime = new Date()
  if (interaction.isChatInputCommand()) {
    let logstr = `[${interaction.user.username}]: ${interaction.commandName}`
    if (interaction.options.getSubcommandGroup(false)) logstr = `${logstr}, \u001b[1mSubcommandGroup\u001b[22m: ${interaction.options.getSubcommandGroup()}`
    if (interaction.options.getSubcommand(false)) logstr = `${logstr}, \u001b[1mSubcommand\u001b[22m: ${interaction.options.getSubcommand()}`
    console.log(logstr)
    slashCommand(client, interaction).then(afterReplied)
  } else

  if (interaction.isModalSubmit()) {
    console.log(`[${interaction.user.username}]: ${interaction.customId}`)
    modalMenu(client, interaction).then(afterReplied)
  } else

  if (interaction.isButton())
  {
    console.log(`[${interaction.user.username}]: ${interaction.customId}`)
    button(client, interaction).then(afterReplied)
  } else

  if (interaction.isStringSelectMenu())
  {
    console.log(`[${interaction.user.username}]: ${interaction.customId}`)
    stringSelectMenu(client, interaction).then(afterReplied)
  }
  if (interaction.isUserSelectMenu())
  {
    console.log(`[${interaction.user.username}]: ${interaction.customId}`)
    userSelectMenu(client, interaction).then(afterReplied)
  }
  function afterReplied() {
    console.groupEnd()
    console.log(`Completed in \u001b[1m${Date.now() - ftime}ms\u001b[22m.\n`)
  }
}

/**
 * @param {Client} client
 * @param {CommandInteraction} interaction 
 */
const slashCommand = async (client, interaction) => {
  const command = interaction.client.commands.get(interaction.commandName)
  if (!command) {
    console.error(`[ERROR]: ${interaction.commandName} not found`)
    return
  }

  try {
    await command.execute(client, interaction);
  } catch (error) {
    console.error(`[ERROR]: ${error.stack}`)
  }
}
/**
 * 
 * @param {Client} client 
 * @param {ModalSubmitInteraction} interaction 
 */
const modalMenu = async (client, interaction) => {
  const modal = interaction.client.modals.get(interaction.customId)
  if (!modal) {
    console.error(`[ERROR]: ${interaction.customId} not found`)
    return
  }

  try {
    await modal.execute(client, interaction)
  } catch (error) {
    console.error(`[ERROR]: ${error.stack}`)
  }
}
/**
 * @param {Client} client
 * @param {ButtonInteraction} interaction 
 */
const button = async (client, interaction) => {
  const button = client.buttons.get(interaction.customId)
  if (!button) {
    console.error(`[ERROR]: ${interaction.customId} not found`)
    return
  }
  try {
    await button.execute(client, interaction)
  } catch (error) {
    console.error(`[ERROR]: ${error.stack}`)
  }
}
/**
 * @param {Client} client
 * @param {StringSelectMenuInteraction} interaction 
 */
const stringSelectMenu = async (client, interaction) => {
  const stringSelectMenu = client.stringSelectMenus.get(interaction.customId)
  if (!stringSelectMenu) {
    console.error(`[ERROR]: ${interaction.customId} not found`)
    return
  }

  try {
    await stringSelectMenu.execute(client, interaction)
  } catch (error) {
    console.error(`[ERROR]: ${error.stack}`)

  }
}

/**
 * @param {Client} client
 * @param {UserSelectMenuInteraction} interaction 
 */
const userSelectMenu = async (client, interaction) => {
  const userSelectMenu = client.userSelectMenus.get(interaction.customId)
  if (!userSelectMenu) {
    console.error(`[ERROR]: ${interaction.customId} not found`)
    return
  }

  try {
    await userSelectMenu.execute(client, interaction)
  } catch (error) {
    console.error(`[ERROR]: ${error.stack}`)

  }
}
