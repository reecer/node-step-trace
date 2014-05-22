var assert = require('assert');

var tracer = require('../index');
var input = 'tests/binarySearch.js'

describe('Stepping', function(){
	this.timeout(0);

	// Data object's properties
	var props = ['script', 'line', 'text', 'scopes', 'locals'];
	var steps = 0;
	var stepFn;

	it('should contain frame data', function(done){
		tracer.trace(input, {
			onstep: function(data, next, cont){
				props.forEach(function(prop){
					assert(data.hasOwnProperty(prop));
					assert(!!data[prop]);
				});
				steps++;
				stepFn = next;
				next('in');
			},
			onclose: function(){
				done();
			}
		});
	});
	
	it('should have stepped 39 times', function(){
		assert.equal(steps, 39)
	});
	it("shouldn't allow post-mortem stepping", function(){
		assert.throws(stepFn);
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
