#!/usr/bin/env node

var ClientManager = require('./debug-client'),
	fs = require('fs');

var clientPool = new ClientManager();

startScript('search.js', function(fname, ln, locals){
	console.log('%s:%d\n\t%j', fname, ln, locals);
});



function startScript(src, frameStep){
	var steps = [];
    
	var dbg = clientPool.addClient(src, frameStep);
	process.on('exit', 	function(){ dbg.proc.kill()	});
	dbg.proc.on('close', 	function(){ 
		writeObj('steps.json', steps);
		// process.exit();
 	});

	dbg.on('break', function(brk){
		dbg.getNextFrame(function(frame) {
            var script = dbg.scripts[frame.func.scriptId];
            
            if(script && script.isNative !== true){
                
                dbg.getFrameLocals(frame, function(loces){
                    var data = {
                        script: script.name,
                        line: frame.line,
                        text: frame.sourceLineText,
                        locals: loces
                    };
                    frameStep(data.script, data.line, data.locals);
                    steps.push(data);                    
                    dbg.step();
                });
            }else dbg.step();
		});
	});	
	dbg.once('ready', function(){
		// Cache scripts
		dbg.reqScripts(function(err, resp){
			if(err) throw ("Error requesting scripts: \n\t" + err);
			
			// Set breakpoint			
			dbg.setBreakpoint({
				type: "script",
				target: __dirname + "/" + src,
				line: 1
			}, function(err, res){
				if(err) throw ("Error setting breakpoint:\n\t" + err);
				dbg.step();
			});
		});
	});
	dbg.connect();	
}

function writeObj(fname, obj){
	console.log('Writing to ' + fname);
	fs.writeFileSync(fname, JSON.stringify(obj));
}