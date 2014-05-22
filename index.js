
var Client = require('./debug-client'),
	fs     = require('fs'),
    async  = require('async');

exports.trace = startScript;
exports.SCOPE = {
    GLOBAL:  0,
    LOCAL:   1,
    WITH:    2,
    CLOSURE: 3,
    CATCH:   4
};

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
    var dbg  = new Client(options.PORT || 5859, src);
    var kill = dbg.proc.kill.bind(dbg.proc, "SIGKILL");
    var step = dbg.step.bind(dbg, 1);
    var cont = dbg.cont.bind(dbg);

    // callbacks
    if(typeof options.onclose === 'function') 
        dbg.proc.on('close', options.onclose.bind(dbg));

    process.on('exit',   kill);
    process.on('SIGINT', kill);

    if(typeof options.onerror === 'function')
        dbg.on('exception', options.onerror.bind(dbg))

    // Break event -- happens after stepping
    dbg.on('break', function(brk){
        // Explore frames if told
        dbg.getNextFrame(function(frame) {
            var script = dbg.scripts[frame.func.scriptId];
            if(!script || (script.isNative && !options.getNative)) step();
            else{
                var data = {};
                var next;

                if(typeof options.onstep === 'function')
                    next = options.onstep.bind(dbg, data, step, cont);
                else 
                    next = step;
                
                data.script = script.name;
                data.line   = frame.line;
                data.text   = frame.sourceLineText;
                data.args   = frame.arguments;

                async.parallel({
                    scopes: function(callback){
                        async.parallel(frame.scopes.map(function(s){
                            return function(done){
                                dbg.getScope(s.index, done.bind(null, null));
                            }
                        }), callback.bind(null));
                    },
                    locals: function(callback){
                        if(options.getLocals)
                            dbg.getFrameLocals(frame, callback.bind(null, null));
                        else callback();
                    }
                }, 
                function(err, res){
                    if(err) throw err;
                    data.scopes = res.scopes;
                    data.locals = res.locals;
                    next();
                });
            }
        });
    }); 
    dbg.once('ready', step);
    dbg.start();
    return kill;
}


Object.prototype.extend = function(o){ 
    for(i in o)
        if(!this.hasOwnProperty(i))
            this[i] = o[i]; 
};