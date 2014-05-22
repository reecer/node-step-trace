var assert = require('assert');

var tracer = require('../index');
var input = 'tests/binarySearch.js'

describe('Stepping', function(){
	this.timeout(0);

	// Data object's properties
	it('should contain frame data', function(done){
		var props = ['script', 'line', 'text', 'scopes', 'locals'];
		var steps = 0;

		tracer.trace(input, {
			onstep: function(data, next, cont){
				props.forEach(function(prop){
					it('should have property ' + prop, function(){
						assert.ok(data.hasOwnProperty(prop));
						assert.ok(data[prop]);						
					})
				});
				steps++;
				next();
			},
			onclose: function(){
				it('should have stepped 39 times', assert.equal.bind(assert, steps, 39));
				done();
			}
		});
	});

});

describe('Continuing', function(){
	this.timeout(0);

	it('should only step once', function(done){
		var steps = 0;
		tracer.trace(input, {
			onstep: function(data, next, cont){
				assert.equal(typeof cont, 'function');
				steps++;
				cont();
			},
			onclose: function(){
				assert.strictEqual(steps, 1);
				done();
			}
		});
	});
});
