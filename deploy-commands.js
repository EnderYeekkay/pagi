const {REST, Routes} = require('discord.js')
const { clientId, guildId, token} = require('./config.json')
const fs = require('fs');
const { log } = require('console');

const commands = [];
// Grab all the command files from the commands directory you created earlier
const commandFiles = fs.readdirSync(`${__dirname}/commands`).filter(file => file.endsWith('.js'));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	try {
		commands.push(command.data.toJSON());}
	catch(error) {
		console.log(error)
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(token);

// and deploy your commands!
(async () => {
	try {
		console.group('\nCommand refreshing:')
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log(`\x1b[32mSuccessfully\x1b[0m reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
	console.groupEnd()
})();