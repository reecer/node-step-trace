#!/usr/bin/env node

var Client = require('_debugger').Client,
	spawn = require('child_process').spawn,
	fs = require('fs'),


	SCRIPT = 'search.js',
	PORT = 5859,
	LN = 8;

startScript(PORT, SCRIPT, LN, function(locals, globals){
	console.log('Line %d of script %s:', LN, SCRIPT);
	console.log('\tLOCALS:, %j', locals);
	console.log('\tGLOBALS:, %j', globals);
});



function startScript(port, src, lineno, cb){
	console.log('*Starting child process %s on port %d', src, port);
	var loces  = {}, 
		globes = {},
		child  = spawn(process.execPath, ['--debug-brk=' + port, src]);
	// child.stderr.on('data', function(data){
	// 	console.error('ERR: %s', data.toString());
	// });
	// child.stdout.on('data', function(data){
	// 	console.log('LOG: %s', data.toString());
	// });
	
	process.on('exit', 	function(){ child.kill() 	});
	child.on('close', 	function(){ process.exit() 	});

	setTimeout(function(){
		console.log('*Starting client port='+port+' src='+src);

		var dbg = new Client();
		dbg.on('exception', function(err, exc){
			writeObj('exception.json', exc);
		});

		dbg.on('break', function(brk){
			dbg.reqBacktrace(function(err, res) {
				if(err) throw("Error requesting backtrace: \n\t%s", err);

				var refs = [],
					refNames = [];

				res.frames[0].locals.forEach(function(l, i){ 
					refs.push(l.value.ref); 
					refNames.push(l.name);
				});

				// Lookup locals
				dbg.reqLookup(refs, function(e, ctx){
					if(e) throw("Error on lookup: \n\t%s", e);
					// else writeObj('local_lookups.json', d);

					refs.forEach(function(ref, i){
						loces[refNames[i]] = ctx[ref].value;
					});
					cb(loces, globes);
					dbg.reqContinue(function(){});
				});
				


				// dbg.reqScopes(function(err,s){
				// 	if(err) throw("Error requesting scopes: \n\t%s", err);
				// 	// else writeObj('scopes.json', s);

				// 	dbg.reqContinue(function(){});
				// });
			});
		});	


		dbg.once('ready', function(){
			
			// dbg.reqScripts(function(err, resp){
			// 	if(err) throw ("Error requesting scripts: \n\t" + err);
			// 	else writeObj('scripts.json', dbg.scripts);
			// });
			dbg.setBreakpoint({
				type: "script",
				target: __dirname + "/" + src,
				line: lineno,
				column: 0
			}, function(err, res){
				if(err) throw ("Error setting breakpoint:\n\t" + err);
				// else writeObj('breakpoint.json', res);
			});
			// dbg.reqContinue(function(){});
		});

		dbg.connect(port);		
	}, 20);
}

function writeObj(fname, obj){
	console.log('Writing to ' + fname);
	fs.writeFileSync(fname, JSON.stringify(obj));
}