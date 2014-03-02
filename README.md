step-trace
==========

Node module for handling v8 step-by-step debugging

---------------
#Getting Started


##Installing 
```npm install step-trace```

##Usage
	var tracer = require('step-trace');
	tracer.trace(script, options);

###script (string)
> Location of node script to debug.

###options (object)
- getLocals (boolean) -- *default: true*
> Flag determining if each frame's locals should be looked up -- takes longer.

- getNative (boolean) -- *default: false*
> Flag determining if frames originating from a native script are stepped into.

- onerror (function)
> Callback for an **exception** event.

- onstep (function) -- *function(**data**, **next**)*
> Callback for each step passing the following as arguments.
 
	- **data** (object)
>  *Object with the following details about each frame:*
		* script (string)
		* line	 (int)
		* text	 (string)
		* locals (object)
> 
	- **next** (function)
> > *Function to be called when callback is finished. Necessary for async operations.*
>

- onclose (function)
> Callback for catching when the script being debugged exits.

##Example
	var tracer = require('step-trace');
	tracer.trace('binarySearch.js', {
		onstep: function(data, next){
			console.log(data);
			next();
		}
	});
	