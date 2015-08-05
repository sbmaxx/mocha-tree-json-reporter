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

    var root = createSuiteNode({ title: 'root' });

    var stack = [],
        start,
        current = root;

    runner.on('suite', function(suite) {

        // skip mocha's root. we have better root
        if (suite.root) {
            return;
        }

        // each suite is a node
        var node = createSuiteNode(suite);

        // add previous node to stack
        stack.push(current);
        current.childs.push(node);

        // new current node
        current = node;

    });

    runner.on('suite end', function(suite) {
        // restore current node from stack
        current = stack.pop();
    });

    runner.on('test end', function(test) {
        current.childs.push(createTestNode(test));
    });

    runner.on('start', function() {
        start = process.hrtime();
    });

    runner.on('end', function() {
        root.data.duration = prettyHrtime(process.hrtime(start), { precise: true });
        // write results
        console.log(root);
        fs.writeFileSync(filename, JSON.stringify(root, null, 2), 'utf8');
    });

    runner.on('pass', function(test) {
        stat('duration', test.duration);
        stat('passed');
    });

    runner.on('fail', function(test) {
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
        _.chain([current]).concat(stack).forEach(function(node) {
            node.data[prop] += value;
        }).value();
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
        data: _.defaults(cleanSuite(suite), {
            passed: 0,
            pending: 0,
            failed: 0,
            duration: 0
        }),
        childs: []
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
        data: cleanTest(test)
    };
}

function cleanSuite(suite) {

    return {
        title: suite.title,
        file: suite.file
    };

}

function cleanTest(test) {

    var obj = _.clone(test);

    delete obj.parent;
    delete obj.ctx;
    delete obj._events;
    delete obj.callback;

    return obj;
}