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
    this.frameIndex = 0;

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
Client.prototype.getNextFrame = function(cb){
    this.reqBacktrace(function(err, resp){
        if(err) throw("Error requesting backtrace: \n\t%s", err);
        cb(resp.frames[0]);
    });
}
Client.prototype.getFrameLocals = function(f, cb){
	var refs = [],
		refNames = [],
		loces  	= {};

	f.locals.forEach(function(l, i){ 
		refs.push(l.value.ref); 
		refNames.push(l.name);
	});
    var self = this;
	// Lookup locals
	this.reqLookup(refs, function(e, ctx){
		if(e) throw("Error on lookup: \n\t%s", e);
		refs.forEach(function(ref, i){
            self.digObject(ctx[ref], function(val){
                loces[refNames[i]] = val;
                if(i == refs.length - 1)
                    cb(loces);                
            });
		});
	});
};
Client.prototype.digObject = function(obj, cb){
    var val = null;
    
    switch(obj.className){
//        case 'Function':
        case 'Object':
        case 'Array':
            var refs = [], refNames = [], count = 0, self = this;
            val = {};
            obj.properties.forEach(function(prop){
                refs.push(prop.ref);
                refNames.push(prop.name);
            });
            this.reqLookup(refs, function(err, resp){
                refs.forEach(function(ref,i){
                   self.digObject(resp[ref], function(v){
                       val[refNames[i]] = v;
                       count++;
                       if(count == refs.length) cb(val);
                   });
                });
            });

            break;
        default:
            val = obj.value;
            cb(val);
    }
}