/**
 * Module dependencies.
 */

var fs = require('fs'),
    _ = require('lodash'),
    filename = process.env.MOCHA_JSON_OUTPUT_FILE;

/**
 * Mocha tree json reporter reporter.
 *
 * @param {Runner} runner
 * @api public
 */
module.exports = function(runner) {

    var stack = [],
        timing = [];

    runner.on('suite', function(suite) {

        log(suite.title);

        var node = createSuiteNode(suite);

        if (stack.length) {
            _.last(stack).nodes.push(node);
        }

        timing.push(process.hrtime());
        stack.push(node);

    });

    runner.on('suite end', function(suite) {

        _.last(stack).data.duration = process.hrtime(_.last(timing));

        // save root for output
        if (suite.root) {
            return;
        }

        // remove node from stack
        stack.pop();
        timing.pop();

    });

    runner.on('test', function(test) {
        log(test.title);
    });

    runner.on('test end', function(test) {
        _.last(stack).nodes.push(createTestNode(test));
    });

    runner.on('end', function() {

        var json = JSON.stringify(_.last(stack), null, 2);

        fs.writeFileSync(filename, json, 'utf8');

    });

    runner.on('pass', function() {
        stat('passed');
    });

    runner.on('fail', function() {
        stat('failed');
    });

    runner.on('pending', function() {
        stat('pending');
    });

    /**
     * Increments prop in all nodes
     * @param {String} prop - property to increment
     * @param {Mixed} value - increment value
     */
    function stat(prop, value) {
        value = value || 1;
        _.forEach(stack, function(node) {
            node.data[prop] += value;
        });
    }

    function log() {
        arguments[0] = indent() + arguments[0];
        console.log.apply(console, arguments);
    }

    function indent() {
        return Array(stack.length).join('    ');
    }

};

/**
 * Create node from suite
 * @param {Object} suite - mocha's suite object
 * @returns {Object} node
 */
function createSuiteNode(suite) {
    return {
        type: 'suite',
        data: _.defaults(clean(suite), {
            passed: 0,
            pending: 0,
            failed: 0
        }),
        nodes: []
    };
}

/**
 * Create node from test
 * @param {Object} test - mocha's test object
 * @returns {Object} node
 */
function createTestNode(test) {
    return {
        type: 'test',
        data: clean(test)
    };
}

const GARBAGE_FIELDS = [
    'parent', 'ctx', 'events', 'callback', '_timeout', '_slow', '_trace', '_events', '_enableTimeouts',
    'fn', 'suites', 'tests', 'async', 'sync'
];

function clean(obj) {

    obj = _.clone(obj);

    _.forEach(Object.keys(obj), function(key) {
        if (_.includes(GARBAGE_FIELDS, key) || key.indexOf('_') === 0) {
            delete obj[key];
        }
    });

    return obj;

}
