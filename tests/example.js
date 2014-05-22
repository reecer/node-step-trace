var tracer = require('../index');
var input = 'tests/binarySearch.js'

tracer.trace(input, {
	onstep: function(data, next, cont){
		console.log(this);
		cont();
	},
	onclose: function(){
		console.log('FINISHED');
	}
});