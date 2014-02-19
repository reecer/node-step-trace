#!/usr/bin/env node

var Client = require('_debugger').Client,
	spawn = require('child_process').spawn,
	fs = require('fs'),


	SCRIPT = 'search.js',
	PORT = 5859;
startScript(PORT, SCRIPT);



function startScript(port, src){
	console.log('*Starting child process %s on port %d', src, port);
	
	var child = spawn(process.execPath, ['--debug-brk=' + port, src]);
	
	process.on('exit', 	function(){ child.kill() 	});
	child.on('close', 	function(){ process.exit() 	});

	child.stderr.on('data', function(data){
		console.error('ERR: %s', data.toString());
	});
	child.stdout.on('data', function(data){
		console.log('LOG: %s', data.toString());
	});
	

	setTimeout(function(){
		console.log('*Starting client port='+port+' src='+src);

		var dbg = new Client();
		
		dbg.on('exception', function(err, exc){
			writeObj('exception.json', exc);
		});

		dbg.on('break', function(brk){
			writeObj('break.json', brk);

			dbg.reqBacktrace(function(err, res) {
				writeObj('frames.json', res.frames);
			});
			dbg.reqScopes(function(s){
				writeObj('scope'+f.index.toString()+'.json', s);
			});
		});	


		dbg.once('ready', function(){
			
			dbg.setBreakpoint({
				type: "script",
				target: "search.js",
				line: 25,
				column: 0
			}, function(err, res){
				if(err) throw ("Error setting breakpoint:\n\t" + err);
				// else writeObj('breakpoint.json', res);
			});
			dbg.reqContinue(function(){});

			dbg.reqScripts(function(err, resp){
				if(err) throw ("Error requesting scripts: \n\t" + err);
				else if(resp) writeObj('scripts.json', resp);
			});
			// console.log(dbg);
		});

		dbg.connect(port);		
	}, 200);
}

function writeObj(fname, obj){
	console.log('Writing to ' + fname);
	fs.writeFileSync(fname, JSON.stringify(obj));
}