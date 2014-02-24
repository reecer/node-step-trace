#!/usr/bin/env node

var Client = require('./debug-client'),
	fs = require('fs');

var script = 'search.js', port = 5859;

startScript(port, 'search.js', function(fname, ln, locals){
	console.log('%s:%d\n\t%j', fname, ln, locals);
});

function startScript(port, src, frameStep){
    var tStart = Date.now();
	var dbg = new Client(port, src, frameStep);
    
	process.on('exit', 	function(){ dbg.proc.kill()	});
	dbg.proc.on('close', 	function(){ 
        console.log('Elapsed:', (Date.now()-tStart)/1000);
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
                    if(script.lineCount-1 > frame.line) dbg.step(1, 'in');
                    else dbg.cont();
                });
            }else dbg.step();
		});
	});	
	dbg.once('ready', dbg.step.bind(dbg));
	dbg.connect();
}

function writeObj(fname, obj){
	console.log('Writing to ' + fname);
	fs.writeFileSync(fname, JSON.stringify(obj));
}