step-trace
==========

Node module for handling v8 step-by-step debugging

# Getting Started


## Installing 
```npm install step-trace```

## Usage
	var tracer = require('step-trace');
	var kill   = tracer.trace(script, options);


### kill (function)
> A function is returned from the trace function, to allow the child process to be killed.

### script (string)
> Location of node script to debug.

### options (object)
- getLocals (boolean) -- *default: true*
> Flag determining if each frame's locals should be looked up -- takes longer.

- getNative (boolean) -- *default: false*
> Flag determining if frames originating from a native script are stepped into.

- onerror (function)
> Callback for an **exception** event.

- onstep (function) -- _function(**data**, **next**, **cont**)_
> Callback for each step passing the following as arguments.
 
- **data** (object) -- *Object with the following details about each frame:*
	* script (string)
	* line	 (int)
	* text	 (string)
	* locals (object)
	* args   (object)
	* scopes (object)
- **next** (function) -- *Function to step once. Optionally takes a string argument:*
	* "in"
	* "out"
	* "next" (default)
- **cont** (function) -- *Function to continue execution. The only callback after calling this will be **onclose***

- onclose (function)
> Callback for catching when the script being debugged exits.

## Example
	var tracer = require('step-trace');
	tracer.trace('binarySearch.js', {
		onstep: function(data, next, cont){
			console.log(data);
			next();
		}
	});
	
