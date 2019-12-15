const fs = require("fs");
const path = require("path");
const Discord = require("discord.js");
const discord_client = new Discord.Client();
const { google } = require("googleapis");
const { WebClient } = require("@slack/web-api");

let user_config = {};
let discordLoggedIn = false;
let gmailAuth = "";
let slack = "";
let twilio = "";
let writeStream = "";
let numOfFiles = 0;

exports.configure = function(file) {
  try {
    user_config = require(path.resolve(`${__dirname}/../../${file}`));
    template_config = require(__dirname + "/simplert.json");

    user_keys = getAllKeys(user_config);
    template_keys = getAllKeys(template_config);

    if (user_keys.join() !== template_keys.join())
      throw "Your simplert config file is not up to date, use the 'npx update-config' command to get the most up to date version";

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

    if (user_config.file.enabled) {
      const filename = user_config.file.filename;
      writeStream = fs.createWriteStream(filename, { flags: "a" });
      if (fs.existsSync(filename)) numOfFiles = 1;
      for (let i = 0; i < user_config.file.maxfiles; i++) {
        const num = i + 1;
        if (
          fs.existsSync(
            path.dirname(filename) +
              "/" +
              path.basename(filename, path.extname(filename)) +
              num +
              path.extname(filename)
          )
        ) {
          numOfFiles++;
        }
      }
    }

    if (user_config.slack.enabled) {
      slack = new WebClient(user_config.slack.token);
    }

    if (user_config.sms.twilio.enabled) {
      twilio = require("twilio")(
        user_config.sms.twilio.sid,
        user_config.sms.twilio.token
      );
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
  if (!user_config.discord.enabled) return;
  return new Promise((resolve, reject) => {
    let error;

    if (!message)
      error =
        ".discord() requires at least 1 argument. Pass it a message to send to Discord";
    else if (!send_to)
      error =
        "You need to specify a Discord channel either in your simplert config file or passed into .discord()";

    if (error) return reject(new Error(error));

    if (!discordLoggedIn) {
      discordLoggedIn = true;
      discord_client.login(user_config.discord.token).catch(error => {
        return reject(error);
      });

      discord_client.on("ready", () => {
        const channel = discord_client.channels.find(
          channel => channel.name === send_to
        );
        discord_client.channels.get(channel.id).send(message);
        return resolve();
      });
    } else {
      const channel = discord_client.channels.find(
        channel => channel.name === send_to
      );
      discord_client.channels.get(channel.id).send(message);
      return resolve();
    }
  });
};

exports.email = function(
  body,
  send_to = user_config.email.gmail.send_to,
  subject = user_config.email.gmail.subject,
  send_from = user_config.email.gmail.send_from
) {
  if (!user_config.email.gmail.enabled) return;
  return new Promise(async (resolve, reject) => {
    let error;

    if (!body)
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

    if (error) return reject(new Error(error));

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

    return resolve(email);
  });
};

exports.file = function(text) {
  if (!user_config.file.enabled) return;
  return new Promise((resolve, reject) => {
    let error;

    if (!user_config.file.filename)
      error =
        "You need to specify the absolute file path and file name you want to write to";
    else if (!user_config.file.filesize)
      error =
        "You need to specifiy the max file size before files rotate in your simplert config file";
    else if (!user_config.file.maxfiles)
      error =
        "You need to specify the max amount of log files you want in your simplert config file before they are rotated out";

    if (error) return reject(new Error(error));

    const filename = user_config.file.filename;
    const stats = fs.statSync(filename);
    const filesizeMB = stats["size"] / 1000000.0;

    if (numOfFiles > 0 && filesizeMB >= user_config.file.filesize) {
      for (let i = numOfFiles; i > 0; i--) {
        if (i == 1) {
          fs.renameSync(
            filename,
            path.dirname(filename) +
              "/" +
              path.basename(filename, path.extname(filename)) +
              i +
              path.extname(filename)
          );
        } else if (i > 1) {
          fs.renameSync(
            path.dirname(filename) +
              "/" +
              path.basename(filename, path.extname(filename)) +
              (i - 1) +
              path.extname(filename),
            path.dirname(filename) +
              "/" +
              path.basename(filename, path.extname(filename)) +
              i +
              path.extname(filename)
          );
          if (i >= user_config.file.maxfiles) {
            fs.unlinkSync(
              path.dirname(filename) +
                "/" +
                path.basename(filename, path.extname(filename)) +
                i +
                path.extname(filename)
            );
          }
        }
      }

      fs.writeFile(filename, formatText(text), err => {
        if (err) return reject(err);
      });
    } else {
      writeStream.write(formatText(text));
    }
  });
};

exports.slack = function(message, send_to = user_config.slack.send_to) {
  if (!user_config.slack.enabled) return;
  return new Promise(async (resolve, reject) => {
    let error;

    if (!message)
      error =
        ".slack() requires at least 1 argument. Pass it a message to send to Slack";
    else if (!send_to)
      error =
        "You need to specify a Slack channel or user either in your simplert config file or passed into .slack()";

    if (error) return reject(new Error(error));

    const slack_message = await slack.chat.postMessage({
      text: message,
      channel: send_to
    });
    return resolve(slack_message);
  });
};

exports.sms = function(
  message,
  send_to = user_config.sms.twilio.send_to,
  send_from = user_config.sms.twilio.send_from
) {
  if (!user_config.sms.twilio.enabled) return;
  return new Promise(async (resolve, reject) => {
    let error;

    if (!message)
      error =
        ".sms() requires at least 1 argument. Pass it a message to send via SMS";
    else if (!send_to)
      error =
        "You need to specify a phone number to send to in your simplert config file or passed into .sms()";
    else if (!send_from)
      error =
        "You need to specify a phone number to send from in your simplert config file or passed into .sms()";

    if (error) return reject(new Error(error));

    const sms = await twilio.messages.create({
      body: message,
      from: send_from,
      to: send_to
    });

    return resolve(sms);
  });
};

function getAllKeys(data) {
  const parent_keys = Object.keys(data);
  let child_keys = [];

  for (pkey of parent_keys)
    child_keys = child_keys.concat(Object.keys(data[pkey]));
  return parent_keys.concat(child_keys).sort();
}

function formatText(text) {
  let formattedText = text;
  if (typeof text === "object") {
    formattedText = JSON.stringify(text);
  }

  if (user_config.file.newline) {
    formattedText += "\n";
  }

  return formattedText;
}
