const {Client, Emoji, formatEmoji, Guild, SlashCommandBuilder, Interaction, CommandInteractionOptionResolver, GuildMember, BaseInteraction, InteractionCollector,  Role, RoleManager, GuildMemberRoleManager, DataManager, Message, ModalBuilder, TextInputStyle, TextInputBuilder, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder, CommandInteraction, MentionableSelectMenuBuilder, StringSelectMenuOptionBuilder, UserSelectMenuBuilder, RoleSelectMenuBuilder, GuildChannel, ButtonBuilder, ButtonStyle, ThreadAutoArchiveDuration} = require('discord.js')
const fs = require('fs')
// const { Canvas } = require('canvas');
module.exports = {
  data: new SlashCommandBuilder()
  .setName('test')
  .setDescription("Тестовая команда для проверки новых алгоритмов")
  ,

  /**
   * 
   * @param {Client} client 
   * @param {CommandInteraction} interaction 
   */
  async execute(client, interaction) {
    try {
      interaction.reply({
        content: "Здарова раки"
      })
    } catch(e) {
      console.error(`[ERROR]:${e.stack}`) 
    }
  }
}