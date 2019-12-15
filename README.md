# Simplert
Simple way to send alerts via Slack, Email, Discord, SMS, etc. Simplert is currently geared towards personal and smaller apps where you just want a simple way to alert on some event like when a new user signs up. The idea is that you can just drop your simplert config file in any of your projects and quickly start alerting on events through multiple platforms without having to rewrite or copy over platform specific code. I would advise against using this in any critical production apps as of now.

## Getting Started
1. Install simplert: `npm install simplert`
2. Generate simplert configuration file: `npx generate-config`

## Simplert Configuration File
    {
      "discord": {
        "enabled": false,
        "token": "",
        "send_to": ""
      },
      "email": {
        "gmail": {
          "enabled": false,
          "send_to": "",
          "send_from": "",
          "subject": "",
          "token": {},
          "credentials": {}
        }
      },
      "file": {
        "enabled": false,
        "filename": "",
        "filesize": 10,
        "maxfiles": 10,
        "newline": true
      },
      "slack": {
        "enabled": false,
        "send_to": "",
        "token": ""
      },
      "sms": {
        "twilio": {
          "enabled": false,
          "send_to": "",
          "send_from": "",
          "sid": "",
          "token": ""
        }
      }
    }


***enabled*** - whether you want this type of alerting enabled or not. If set to false and a function is called, it will immediately just return. Easy way to disable alerting without having to delete all of your simplert function calls from your code.  
***discord:token*** - the token of your discord bot   
***discord:send_to*** -  the name of the discord channel you want to send your alerts too. Make sure your bot has permission on the server to send messages    
***email:gmail:send_to*** - the default receipient email you want to send to, otherwise passed into the email function  
***email:gmail:send_from*** -  The default email you want to send from. You may have a Gsuite account with multiple aliases that you can specifiy here which one you want to send from. Otherwise passed into the email function  
***email:gmail:subject*** - A default email subject for every alert, otherwise passed into the email function  
***email:gmail:token*** -  Used for authorization, can be generated with `npx generate-gmail` assuming you have your `email:gmail:credentials` populated correctly.  
***email:gmail:credentials*** -  Credentials provided by Google when setting up your project in the [Google Cloud Console](https://console.cloud.google.com/) usually downloaded as `gmail-credentials.json`. Set this key as the contents of that file.  
***file:filename*** - The absolute or relative path to where you want your log file to live. Example: /home/nick/my-app/logs/log.txt or logs/log.txt  
***file:filesize*** - The size of each log file in MegaBytes before rotating to a new log file  
***file:maxfiles*** - The maximum number of logs files to generate during log rotation. Example: a maxfiles of 10 and filesize of 5 would log the most recent 50MB of data across log.txt, log1.txt, log2.txt ... log9.txt  
***file:newline*** - If true, will automatically add a newline to any text written. Default: true  
***slack:send_to*** - The channel or user you want to send the message to. Examples: #some_channel or @some_user  
***slack:token*** - The token of your Slack bot. Make sure it has the right permissions setup to send messages.  
***sms:twilio:send_to*** - The phone number you want to send an alert to including country code.  
***sms:twilio:send_from*** - The Twilio phone number you want to send from on your account  
***sms:twilio:sid*** - The ACCOUNT SID from your Twilio Console  
***sms:twilio:token*** - The AUTH TOKEN from you Twilio Console  


## Usage
*Note: Make sure you have setup your configuration file*  

---
####  **simplert.discord(message,[send_to])**
*Send a message to a discord channel.*  
`send_to` can be optional if it is specified in the configuration file under`discord:send_to` as the default, otherwise it needs to be passed in as the second argument

    const simplert = require("simplert");
    simplert.configure("simplert.json");

    simplert.discord("some event"); //assuming discord:send_to is set in config file
    simplert.discord("some other event", "general"); // send to a different channel
---
#### **simplert.email(body,[send_to, subject, send_from])**
*Send an email message.*  
`send_to, subject, send_from` can be optional if defaults are set under `email:gmail:*` in the configuration file. Otherwise, they need to be passed as arguments to the function.

    const simplert = require("simplert");
    simplert.configure("simplert.json");

    simplert.email("some event"); //assuming all key values are set under email:gmail:* in the config file
    simplert.email("some other event", "email@example.com"); // send to a specific email
    simplert.email("another event", "email@example.com", "Some Email Subject"); // set an email subject
    simplert.email("and another event", "email@example.com", "Some Email Subject", "alias@example.com"); // set a send from alias if you use Gsuite
---
####  **simplert.file(text)**
*Send text to a file*  
All values have to be set under `file:*` in your configuration file. Note: This function will automatically call JSON.stringify on any object passed in.  

    const simplert = require("simplert");
    simplert.configure("simplert.json");

    simplert.file("some event");
    simplert.file({"data": "some data"});
---
####  **simplert.slack(message,[send_to])**
*Send a message to a Slack channel or user.*  
`send_to` can be optional if it is specified in the configuration file under`slack:send_to` as the default, otherwise it needs to be passed in as the second argument

    const simplert = require("simplert");
    simplert.configure("simplert.json");

    simplert.slack("some event"); //assuming slack:send_to is set in config file
    simplert.slack("some other event", "#general"); // send to a different channel
    simplert.slack("some other event", "@johndoe"); // send to a different user 
---
#### **simplert.sms(message,[send_to, send_from])**
*Send an sms message.*  
`send_to, send_from` can be optional if defaults are set under `sms:twilio:*` in the configuration file. Otherwise, they need to be passed as arguments to the function.

    const simplert = require("simplert");
    simplert.configure("simplert.json");

    simplert.sms("some event"); //assuming sms:twilio:send_to and sms:twilio:send_from are set in config file
    simplert.sms("some other event", "+12223334444"); // set a phone number to send to including country code 
    simplert.sms("another event", "+12223334444", "+15556667777"); // set a phone number to send from your Twilio account

## Scripts
#### **generate-config**
`npx generate-config`  

Generates a simplert configuration file. By default, all alert will be set to disabled, you will need to manually configure the necessary values in this file before using simplert.  

#### **update-config**
`npx update-config`  

Updates your current simplert configuration file. This is needed if you download a new version of simplert that supports a new platform.  


#### **generate-gmail**
`npx generate-gmail`  

This will generate an auth token and automatically populate the `email:gmail:token` value in your configuration file. This assumes that you have `email:gmail:credentials` set in your configuration file which should be set to the content in your `gmail-credentials.json` file that was download from Google Cloud Console when setting up a project.

    
## Supported Alerts
#### [Discord](https://discordapp.com/)  
#### [Gmail](https://mail.google.com)  
#### [Slack](https://slack.com)  
#### [Twilio](https://twilio.com/)  
#### [Local File System](https://nodejs.org/api/fs.html)
*Open an issue on the repo if you have other platforms you want to see supported*

## Bugs and Improvements
Please open an issue on the repo to report any bugs or improvements as I am sure there are. I would consider this still in beta and not to be used in any critical production apps rather used for personal projects that you just want some simple alerting on.
