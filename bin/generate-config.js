#!/usr/bin/env node

const path = require("path");
const DEFAULT_CONFIG_NAME = "simplert.cfg.json"
let config_name = DEFAULT_CONFIG_NAME;

const fs = require('fs');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})

readline.question(`Name your config file (${DEFAULT_CONFIG_NAME}) `, (filename) => {
	if(filename) config_name = filename;

	fs.copyFile(path.resolve(__dirname + "/..")`/${DEFAULT_CONFIG_NAME}`, config_name, fs.constants.COPYFILE_EXCL, (err) => {
		if (err) throw err;
		console.log(`${config_name} was successfully generated`);
	});

  readline.close()
})

