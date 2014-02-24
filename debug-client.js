#!/usr/bin/env node
/**
    Reece Robinson
    _debugger.js => https://github.com/joyent/node/blob/master/lib/_debugger.js
    debug-client.js
**/

var DebuggerClient = require('_debugger').Client,
	spawn = require('child_process').spawn;
var CONNECT_DELAY = 200;

module.exports = Client;

Client.prototype = Object.create(DebuggerClient.prototype);
function Client(port, script, frameStep){ 
	DebuggerClient.call(this); 

	this.port = port;
	this.script = script;
	this.frameStep = frameStep;
    this.frameIndex = 0;

	this.on('exception', function(exc){
		throw("Exception in client script:\n\t%j", exc);
	});

	this.proc = spawn(process.execPath, ['--debug-brk=' + this.port, this.script]);	
	this.connect = setTimeout.bind(this, this.connect.bind(this, this.port), CONNECT_DELAY);
};
Client.prototype.cont = function(){
	this.reqContinue(function(){});
};
Client.prototype.step = function(n, action){
	this.req({
		command: 'continue',
		arguments: {
			stepaction: action || 'next',
			stepcount: n || 1,
		}
	}, function(){});

};
Client.prototype.getScopes = function(cb){
    this.req({
        command: 'scopes',
        arguments: {
            // number: 1
            // frameNumber: 1
        }
    }, function(err, resp){
        if(err) throw('Error getting scopes:\n\t', err);
        else cb(resp.scopes);        
    });
};
Client.prototype.lookupRefs = function(refs, cb){
    this.req({
       command: 'lookup',
        arguments: {
            handles: refs
        }
    }, function(err, resp){
        if(err) {
            console.error('Error looking up refs %j', refs);
            throw err;
         }else cb(resp);
    });
};
Client.prototype.getNextFrame = function(cb){
    this.req({
        command: 'frame',
        arguments:{
            inlineRefs: true
        }
    },function(err,resp){
        if(err) throw("Error requesting backtrace: \n\t%s", err);
        cb(resp);
    });
};




// Uses LOOKUP
Client.prototype.getFrameLocals = function(f, cb){
    var refs = [], refNames = [], loces = {};
    f.locals.forEach(function(l, i){ 
        refs.push(l.value.ref); 
        refNames.push(l.name);
    });
    // Lookup locals
    var self = this;
    this.lookupRefs(refs, function(ctx){
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
    
    switch(obj.type){
        case 'object':
            var refs = [], refNames = [], count = 0, self = this;
            val = {};
            obj.properties.forEach(function(prop){
                refs.push(prop.ref);
                refNames.push(prop.name);
            });
            this.lookupRefs(refs, function(resp){
                refs.forEach(function(ref,i){
                   self.digObject(resp[ref], function(v){
                       val[refNames[i]] = v;
                       if(++count == refs.length) cb(val);
                   });
                });
            });
            break;
        case 'number':
        case 'string':
            val = obj.value;
            cb(val);
            break;
        case 'function':
        default:
            val = obj.className;
            cb(val);
    }
}
// Uses EVALUATE 
// Client.prototype.getFrameLocals1 = function(f, cb){
//     var loces = {}, self = this;
//     var ctx = f.locals.map(function(l){
//        return {name: l.name, handle: l.value.ref}; 
//     });
    
//     f.locals.forEach(function(local, i){
//         self.req({
//             command: 'evaluate',
//             arguments: {
//                 expression: local.name,
//                 global: false,
//                 additional_context: ctx
//             }
//         }, function(err, resp){
//             if(err){
//                 console.error("Error evaluating %s:\n\t%s", local.name, err);
//                 throw err;
//             }
//             loces[local.name] = resp.value;
//             if(i == f.locals.length-1) cb(loces);
//         });
//     });
// };