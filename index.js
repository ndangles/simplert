const Discord = require('discord.js');
const discord_client = new Discord.Client();

let user_config = {}
let discordLoggedIn = false;

exports.configure = function(file) {
		try {
			user_config = require(file);
			template_config = require("./simplert.cfg.json")

			user_keys = getAllKeys(user_config)
			template_keys = getAllKeys(template_config)

			if(user_keys.join() !== template_keys.join()) throw "Your simplert config file is not up to date, use the generate command to get the most up to date version"

		} catch(e) {
			if(e.code === "MODULE_NOT_FOUND") {
				throw new Error("Could not file specified. Make sure file path is correct.")
			} else {
				throw new Error(e) 
			}
		}
}

exports.discord = function(message, send_to = user_config.discord.send_to) {
	return new Promise((resolve, reject) => {
			let error;

			if(!user_config.discord.enabled) error = "Discord alert is not enabled. You need to enable it in your simplert config file"

			else if(!message) error = ".discord() requires at least 1 argument. Pass it a message to send to Discord"

			else if(!send_to) error = "You need to specify a Discord channel either in your simplert config file or passed into .discord()"

			if(error) reject(new Error(error))

			if(!discordLoggedIn) {
				discordLoggedIn = true
				discord_client.login(user_config.discord.token).catch(error => {
					reject(error)
				});
			}

			discord_client.on('ready', () => {
				const channel = discord_client.channels.find(channel => channel.name === send_to);
				discord_client.channels.get(channel.id).send(message);
				resolve();
			});
		})
}


function getAllKeys(data) {

			const parent_keys = Object.keys(data);
			let child_keys = []

			for(pkey of parent_keys) child_keys = child_keys.concat(Object.keys(data[pkey])) 
			return parent_keys.concat(child_keys).sort()
			
}

