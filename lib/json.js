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
function TreeJSON(runner) {

    const defaults = {
        passed: 0,
        pending: 0,
        failed: 0,
        duration: 0
    };

    var root = {
        type: 'suite',
        data: _.defaults({
            title: 'root'
        }, defaults),
        childs: []
    };

    var stack = [],
        start,
        current = root;

    runner.on('suite', function(suite) {

        if (suite.root) {
            return;
        }

        var node = {
            type: 'suite',
            data: _.defaults(cleanSuite(suite), defaults),
            childs: [],
        };

        stack.push(current);
        current.childs.push(node);
        current = node;

    });

    runner.on('suite end', function(suite) {
        current = stack.pop();
    });

    runner.on('test end', function(test) {
        current.childs.push({
            type: 'test',
            data: cleanTest(test)
        });
    });

    runner.on('start', function() {
        start = process.hrtime();
    });

    runner.on('end', function() {
        root.data.duration = prettyHrtime(process.hrtime(start), { precise: true });
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

    function stat(prop, value) {
        _.forEach(stack, function(node) {
            node.data[prop] += value ? value : 1;
        });
        current.data[prop] += value ? value : 1;
    }

}

function cleanSuite(suite) {

    return {
        title: suite.title,
        fullTitle: suite.fullTitle()
    }

}

function cleanTest(test) {

    var obj = _.clone(test);

    delete obj.parent;
    delete obj.ctx;
    delete obj._events;
    delete obj.callback;

    return obj;
}

exports = module.exports = TreeJSON;