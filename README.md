# Simplert
Simple way to send alerts via Slack, Email, Discord, SMS, etc. Simplert is currently geared towards personal and smaller apps where you just want a simple way to alert on some event like when a new user signs up. I would advise against using this in any critical production apps as of now.

## Getting Started
1. Install simplert: `npm install simplert`
2. Generate simplert configuration file: `npx simplert generate-config`

## Simplert Configuration File
    {
      "discord": {
        "enabled": false,
        "token": "",
        "send_to": ""
      }
    }

***enabled*** - whether you want this type of alerting enabled or not
***token*** - the token of your discord bot
***send_to*** -  the name of the discord channel you want to send your alerts too. Make sure your bot has permission on the server to send messages

## Usage
*Note: Make sure you have setup your configuration file*

### Web Server
    const express = require("express")
    const app = express();
    const simplert = require("simplert");
    simplert.configure("simplert.cfg.json")
    
    app.get("/test", async (req, res) => {
      simplert.discord("server test")
      res.send("alert sent")
    })

    app.listen(8849, "127.0.0.1", (req, res) => {
      console.log("listening at localhost:8849")
    })



### Script
    const simplert = require("simplert");
    simplert.configure("simplert.cfg.json")
    
    async function run() {
      await simplert.discord("some event")
      await simplert.discord("some other event")
    }
    
    run();
    
## Supported Alerts
- #### [Discord](https://discordapp.com/)
*Email, Slack, SMS coming eventually*

## Bugs and Improvements
Please open an issue on the repo to report any bugs or improvements as I am sure there are. I would consider this still in beta and not to be used in any critical production apps rather used for personal projects that you just want some simple alerting on.

