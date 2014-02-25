#!/usr/bin/env node

var tracer = require('./client');

var input = process.argv[2];
if(!input){ 
	console.error("Usage: test.js [input file]"); 
	process.exit(); 
}

var start = Date.now();
tracer.trace(input, {
	// getLocals: false,
	onstep: function(data, next){
		console.log(data);

		next();
	},
	onclose: function(){
		console.log('closed');
		console.log((Date.now() - start) / 1000);
	}
});