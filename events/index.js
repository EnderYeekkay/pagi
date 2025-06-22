const { Client, Events } = require('discord.js')
/**
 * 
 * @param {Client} client 
 */
module.exports = async (client) => {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            try {
                await command.execute(client, interaction);
            } catch (error) {
            }
        }

    })
}