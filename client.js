#!/usr/bin/env node

var ClientManager = require('./debug-client'),
	fs = require('fs');

var clientPool = new ClientManager();

startScript('search.js', function(fname, ln, locals){
	console.log('%s:%d\n\t%j', fname, ln, locals);
});

function startScript(src, frameStep){
    var tStart = Date.now();
	var dbg = clientPool.addClient(src, frameStep);
    
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
                    if(script.lineCount-1 > frame.line)
                        dbg.step(1, 'in');
                    else dbg.cont();
                });
            }else dbg.step();
		});
	});	
	dbg.once('ready', function(){
//        dbg.setBreakpoint({
//            type: "script",
//            target: __dirname + "/" + src,
//            line: 1
//        }, function(err, res){
//            if(err) throw ("Error setting breakpoint:\n\t" + err);
//            dbg.step(1, 'in');
//        });  
        dbg.step(1, 'in');
	});
	dbg.connect();
}

function writeObj(fname, obj){
	console.log('Writing to ' + fname);
	fs.writeFileSync(fname, JSON.stringify(obj));
}