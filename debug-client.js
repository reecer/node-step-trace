#!/usr/bin/env node

var DebuggerClient = require('_debugger').Client,
	spawn = require('child_process').spawn;
var CONNECT_DELAY = 200;

module.exports = ClientManager;
/**
 * Manages
 */
function ClientManager(){
	this.clients = [];
	this.port = 5858;
};
ClientManager.prototype.addClient = function(script, frameStep){
	var x = new Client(++this.port, script, frameStep);
	this.clients.push(x);
	return x;
}
ClientManager.prototype.removeClient = function(client){
	var removed = null;
	for(var i = 0; i < this.clients.length; i++){
		if(this.clients[i] == client){
			removed = this.clients[i];
			delete this.clients[i];
			break;
		}
	}
	return removed;
}



/**
 * Spawns child process
 * @param {Integer} port
 * @param {String} script
 * @param {Function} frameStep
 */
function Client(port, script, frameStep){ 
	DebuggerClient.call(this); 

	this.port = port;
	this.script = script;
	this.frameStep = frameStep;

	this.on('exception', function(exc){
		throw("Exception in client script:\n\t%j", exc);
	});

	this.proc = spawn(process.execPath, ['--debug-brk=' + this.port, this.script],{
		stdio: 'pipe'
	});	
	this.connect = setTimeout.bind(this, this.connect.bind(this, this.port), CONNECT_DELAY);
};
Client.prototype = Object.create(DebuggerClient.prototype);
Client.prototype.cont = function(){
	this.reqContinue(function(){});
};
Client.prototype.step = function(n){
	this.req({
		command: 'continue',
		arguments: {
			stepaction: 'next',
			stepcount: n > 0 ? n : 1,
		}
	}, function(){});
};
Client.prototype.getFrameLocals = function(f, cb){
	var refs = [],
		refNames = [],
		loces  	= {};

	f.locals.forEach(function(l, i){ 
		refs.push(l.value.ref); 
		refNames.push(l.name);
	});
	// Lookup locals
	this.reqLookup(refs, function(e, ctx){
		if(e) throw("Error on lookup: \n\t%s", e);
		refs.forEach(function(ref, i){
			var loc = ctx[ref];
			var val = null;
			switch(loc.className){
				case 'Object':
				case 'Array':
				case 'Function':
					val = loc;
					break;
				default:
					val = ctx[ref].value;
			}
			loces[refNames[i]] = val;
		});
		cb(loces);
	});
};