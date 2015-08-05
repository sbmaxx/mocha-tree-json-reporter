/**
 * Module dependencies.
 */

var fs = require('fs'),
    _ = require('lodash'),
    prettyHrtime = require('pretty-hrtime'),
    filename = process.env.MOCHA_JSON_OUTPUT_FILE;

/**
 * Mocha tree json reporter reporter.
 *
 * @param {Runner} runner
 * @api public
 */
module.exports = function(runner) {

    var stack = [],
        start;

    runner.on('suite', function(suite) {

        var node = createSuiteNode(suite);

        if (hasCurrent()) {
            getCurrent().nodes.push(node);
        }

        stack.push(node);

    });

    runner.on('suite end', function(suite) {
        // save root for output
        if (suite.root) {
            return;
        }
        // remove node from stack
        stack.pop();
    });

    runner.on('test end', function(test) {
        getCurrent().nodes.push(createTestNode(test));
    });

    runner.on('start', function() {
        start = process.hrtime();
    });

    runner.on('end', function() {

        var root = getCurrent();

        root.data.duration = prettyHrtime(process.hrtime(start), { precise: true });
        root = JSON.stringify(root, null, 2);

        if (filename) {
            fs.writeFileSync(filename, root, 'utf8');
        } else {
            console.log(root);
        }

    });

    runner.on('pass', function(test) {
        stat('duration', test.duration);
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

    function hasCurrent() {
        return stack.length !== 0;
    }

    function getCurrent() {
        return _.last(stack);
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
            failed: 0,
            duration: 0
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
