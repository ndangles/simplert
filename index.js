const path = require("path");
const Discord = require("discord.js");
const discord_client = new Discord.Client();
const { google } = require("googleapis");

let user_config = {};
let discordLoggedIn = false;
let gmailAuth = "";

exports.configure = function(file) {
  try {
    user_config = require(path.resolve(`${__dirname}/../../${file}`));
    template_config = require(__dirname + "/simplert.json");

    user_keys = getAllKeys(user_config);
    template_keys = getAllKeys(template_config);

    if (user_keys.join() !== template_keys.join())
      throw "Your simplert config file is not up to date, use the generate command to get the most up to date version";

    if (user_config.email.gmail.enabled) {
      const {
        client_secret,
        client_id,
        redirect_uris
      } = user_config.email.gmail.credentials.installed;
      const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
      );
      oAuth2Client.setCredentials(user_config.email.gmail.token);
      gmailAuth = oAuth2Client;
    }
  } catch (e) {
    if (e.code === "MODULE_NOT_FOUND") {
      throw new Error(
        `Could not file specified. Make sure file path is correct. ${path.resolve(
          __dirname + "/../../" + file
        )}`
      );
    } else {
      throw new Error(e);
    }
  }
};

exports.discord = function(message, send_to = user_config.discord.send_to) {
  return new Promise((resolve, reject) => {
    let error;

    if (!user_config.discord.enabled)
      error =
        "Discord alert is not enabled. You need to enable it in your simplert config file";
    else if (!message)
      error =
        ".discord() requires at least 1 argument. Pass it a message to send to Discord";
    else if (!send_to)
      error =
        "You need to specify a Discord channel either in your simplert config file or passed into .discord()";

    if (error) reject(new Error(error));

    if (!discordLoggedIn) {
      discordLoggedIn = true;
      discord_client.login(user_config.discord.token).catch(error => {
        reject(error);
      });

      discord_client.on("ready", () => {
        const channel = discord_client.channels.find(
          channel => channel.name === send_to
        );
        discord_client.channels.get(channel.id).send(message);
        resolve();
      });
    } else {
      const channel = discord_client.channels.find(
        channel => channel.name === send_to
      );
      discord_client.channels.get(channel.id).send(message);
      resolve();
    }
  });
};

exports.email = function(
  body,
  send_to = user_config.email.gmail.send_to,
  subject = user_config.email.gmail.subject,
  send_from = user_config.email.gmail.send_from
) {
  return new Promise(async (resolve, reject) => {
    let error;

    if (!user_config.email.gmail.enabled)
      error =
        "Gmail alert is not enabled. You need to enable it in your simplert config file";
    else if (!body)
      error =
        ".email() requires at least 1 argument. Pass it a message to send in the email body";
    else if (!send_to)
      error =
        "You need to specify a receipient email either in your simplert config file or passed into .email()";
    else if (!subject)
      error =
        "You need to specify an email subject either in your simplert config file or passed into .email()";
    else if (!send_from)
      error =
        "You need to specify a sender email either in your simplert config file or passed into .email()";

    if (error) reject(new Error(error));

    const gmail = google.gmail({ version: "v1", auth: gmailAuth });

    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString(
      "base64"
    )}?=`;
    const messageParts = [
      `From: ${send_from}`,
      `To: ${send_to}`,
      "Content-Type: text/html; charset=utf-8",
      "MIME-Version: 1.0",
      `Subject: ${utf8Subject}`,
      "",
      `${body}`
    ];
    const message = messageParts.join("\n");

    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const email = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage
      }
    });

    resolve(email);
  });
};

function getAllKeys(data) {
  const parent_keys = Object.keys(data);
  let child_keys = [];

  for (pkey of parent_keys)
    child_keys = child_keys.concat(Object.keys(data[pkey]));
  return parent_keys.concat(child_keys).sort();
}
