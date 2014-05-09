#!/usr/bin/env node

var tracer = require('../index');

var input = 'binarySearch.js'


exports.continuing = function(test){		
	var steps = 0;

	tracer.trace(input, {
		onstep: function(data, next, cont){
			steps++;
			cont();
		},
		onclose: function(){
			test.equal(steps, 2, "Stepped more than once");
			test.done();
		}
	});
};

exports.stepping = function(test){
	var steps = 0;

	tracer.trace(input, {
		onstep: function(data, next){
			steps++;
			next();
		},
		onclose: function(){
			test.equal(steps, 39, "Did not step 39 times");
			test.done();
		}
	});
};
