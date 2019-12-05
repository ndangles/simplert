#!/usr/bin/env node

const path = require("path");
const DEFAULT_CONFIG_NAME = "simplert.json";
let config_name = DEFAULT_CONFIG_NAME;

const fs = require("fs");
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question("Path to your simplert configuration file: ", filename => {
  const user_config = require(path.resolve(process.cwd() + "/" + filename));
  const default_config = require(path.resolve(__dirname + "/..") +
    `/${DEFAULT_CONFIG_NAME}`);

  const user_keys = Object.keys(user_config);
  const default_keys = Object.keys(default_config);

  const missing_keys = default_keys.filter(key => !user_keys.includes(key));

  if (missing_keys.length === 0) {
    console.log("Your configuration file is already up to date!");
    process.exit();
  }

  for (key of missing_keys) {
    user_config[key] = default_config[key];
  }

  const ordered_user_config = {};

  Object.keys(user_config)
    .sort()
    .forEach(function(key) {
      ordered_user_config[key] = user_config[key];
    });

  fs.writeFile(filename, JSON.stringify(ordered_user_config, null, 2), function(
    err
  ) {
    if (err) return console.error(err);
    console.log("Simplert config file updated!");
  });

  readline.close();
});
