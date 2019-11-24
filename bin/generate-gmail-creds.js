#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout
});

const { google } = require("googleapis");

const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];

readline.question(
  "Path to your simplert configuration file: ",
  simplertCfgFile => {
    const simplert_config = require(path.resolve(
      __dirname + "/../" + simplertCfgFile
    ));

		const { client_secret, client_id, redirect_uris } = simplert_config.email.gmail.credentials.installed;
		const oAuth2Client = new google.auth.OAuth2(
			client_id,
			client_secret,
			redirect_uris[0]
		);

		const authUrl = oAuth2Client.generateAuthUrl({
			access_type: "offline",
			scope: SCOPES
		});

		console.log("Authorize this app by visiting this url:", authUrl);
		readline.question("Enter the code from that page here: ", code => {
			readline.close();
			oAuth2Client.getToken(code, (err, token) => {
				if (err) {
					console.error("Error retrieving access token", err);
					process.exit(1);
				}

				simplert_config.email.gmail.token = token;
				fs.writeFile(
					simplertCfgFile,
					JSON.stringify(simplert_config, null, 2),
					function(err) {
						if (err) return console.error(err);
						console.log("Simplert config file updated with Gmail token");
					}
				);
			});
		});
  }
);
