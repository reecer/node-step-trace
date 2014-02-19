#!/usr/bin/env node

var ClientManager = require('./debug-client'),
	fs = require('fs');

var clientPool = new ClientManager();

startScript('search.js', function(fname, frame, locals){
	console.log('FRAME %d:', frame.index);
	console.log('\tLine %d of script %s:', frame.line, fname);
	console.log('\tLOCALS: %j\n', locals);
	// console.log(frame.locals);
	// console.log('\tGLOBALS:, %j', globals);
});



function startScript(src, frameStep){
	var frames = {};
	var rawFrames = [];
	var steps = [];
	
	var dbg = clientPool.addClient(src, frameStep);
	process.on('exit', 	function(){ dbg.proc.kill()	});
	dbg.proc.on('close', 	function(){ 
		writeObj('frames.json', frames);
		writeObj('raw_frames.json', rawFrames);
		writeObj('steps.json', steps);
		// process.exit();
 	});

	dbg.on('break', function(brk){
		dbg.reqBacktrace(function(err, res) {
			if(err) throw("Error requesting backtrace: \n\t%s", err);
			console.log('Frames %d - %d', res.fromFrame, res.toFrame);
			res.frames.forEach(function(frame){
				var script = dbg.scripts[frame.func.scriptId];
				if(script.isNative !== true){
					rawFrames.push(frame);
					dbg.getFrameLocals(frame, function(loces){
						frames[frame.index] = loces;
						frameStep(script.name, frame, loces);
					});
					steps.push({
						name: script.name,
						line: frame.line
					});
				}					
			});
			dbg.step();
			// dbg.cont();
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
				line: 1,
				column: 0
			}, function(err, res){
				if(err) throw ("Error setting breakpoint:\n\t" + err);
				// Step
				dbg.cont();
			});
		});
	});
	dbg.connect();	
}

function writeObj(fname, obj){
	console.log('Writing to ' + fname);
	fs.writeFileSync(fname, JSON.stringify(obj));
}