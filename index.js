let config = {}

exports.configure = function(file) {
	config = require(file);
}

exports.discord = function() {
	console.log(config.test)
}

