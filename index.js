
var Client = require('./debug-client'),
	fs = require('fs');

exports.trace = startScript;

// options = {
//      onerror:    Function
//      onstep:     Function
//      onclose:    Function
//      getLocals:  Boolean (true)
//      getNative:  Boolean (false)
// }


function startScript(src, options){
    options.extend({
        getLocals: true,
        getNative: false
    });

    // Init client
    var dbg = new Client(options.PORT || 5859, src);
    var kill = dbg.proc.kill.bind(dbg.proc);
    // callbacks
    if(typeof options.onclose === 'function') 
        dbg.proc.on('close', options.onclose.bind(dbg));
    process.on('exit', kill);

    if(typeof options.onerror === 'function')
        dbg.on('exception', options.onerror.bind(dbg))

    // Break event -- happens after stepping
    dbg.on('break', function(brk){
        // Explore frames if told
        dbg.getNextFrame(function(frame) {
            var script = dbg.scripts[frame.func.scriptId];         
            if(script && (options.getNative || script.isNative !== true) ){
                var callback = script.lineCount-1 > frame.line ? dbg.step.bind(dbg, 1, 'in') : dbg.cont.bind(dbg);
                var next;
                
                var data = {
                    script: script.name,
                    line: frame.line,
                    text: frame.sourceLineText
                };

                if(typeof options.onstep === 'function')
                    next = options.onstep.bind(dbg, data, callback, dbg.cont.bind(dbg));
                else next = callback;

                if(options.getLocals){
                    dbg.getFrameLocals(frame, function(loces){
                        data.locals = loces;
                        next();
                    });                    
                }else next();
            }else dbg.step();
        });
    }); 
    dbg.once('ready', dbg.step.bind(dbg));
    dbg.connect();
    return kill;
}


Object.prototype.extend = function(o){ 
    for(i in o)
        if(!this.hasOwnProperty(i))
            this[i] = o[i]; 
};