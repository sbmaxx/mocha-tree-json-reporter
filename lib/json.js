/**
 * Module dependencies.
 */

var Base = require('mocha').reporters.Base,
    _ = require('lodash');

exports = module.exports = TreeJSON;

/**
 * Initialize a new `JSONTree` reporter.
 *
 * @param {Runner} runner
 * @api public
 */

function TreeJSON(runner) {

    Base.call(this, runner);

    var stats = this.stats;

    var report = {
        type: 'root',
        data: {
            title: 'root'
        },
        childs: [],
        tests: 0,
        failed: 0,
        passed: 0,
        duration: 0
    };

    var stack = [],
        currentNode = report;

    runner.on('suite', function(suite) {

        if (suite.root) {
            return;
        }

        var node = {
            type: 'suite',
            data: cleanSuite(suite),
            childs: [],
            tests: 0,
            failed: 0,
            passed: 0,
            duration: 0
        };

        stack.push(currentNode);
        currentNode.childs.push(node);
        currentNode = node;

    });

    runner.on('suite end', function(suite) {
        if (suite.root) return;
        currentNode = stack.pop();
    });

    runner.on('test end', function(test) {
        currentNode.childs.push({
            type: 'test',
            data: cleanTest(test)
        });
    });

    runner.on('start', function() {
    });

    runner.on('end', function() {
        console.log(magic(report));
    });
}

function magic(root) {
    tree(root, null);
    return root;
}

function tree(node, parent) {
    if (node.type !== 'test') {
        node.childs.forEach(function(child) {
            tree(child, node);
        });
        if (parent === null) {
            return;
        }
        parent.tests += node.tests;
        parent.passed += node.passed;
        parent.failed += node.failed;
        parent.duration += node.duration;
    } else {
        parent.tests +=1;
        parent.passed += node.data.state === 'passed' ? 1 : 0;
        parent.failed += node.data.state === 'failed' ? 1 : 0;
        parent.duration += parseInt(node.data.duration, 10);
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
