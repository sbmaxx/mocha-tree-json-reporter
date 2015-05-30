/**
 * Module dependencies.
 */

var Base = require('mocha').reporters.Base,
    _ = require('lodash');

exports = module.exports = TreeJSON;

/**
` reporter.
 *
 * @param {Runner} runner
 * @api public
 */

function TreeJSON(runner) {

    Base.call(this, runner);

    var stats = this.stats;

    var report = {
        type: 'suite',
        data: {
            title: 'root',
            tests: 0,
            failed: 0,
            passed: 0,
            duration: 0
        },
        childs: []
    };

    var stack = [],
        currentNode = report;

    runner.on('suite', function(suite) {

        if (suite.root) {
            return;
        }

        var node = {
            type: 'suite',
            data: _.merge(cleanSuite(suite), {
                tests: 0,
                failed: 0,
                passed: 0,
                duration: 0
            }),
            childs: [],
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
        console.log(JSON.stringify(magic(report), null, 4));
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
        parent.data.tests += node.data.tests;
        parent.data.passed += node.data.passed;
        parent.data.failed += node.data.failed;
        parent.data.duration += node.data.duration;
    } else {
        parent.data.tests +=1;
        parent.data.passed += node.data.state === 'passed' ? 1 : 0;
        parent.data.failed += node.data.state === 'failed' ? 1 : 0;
        parent.data.duration += parseInt(node.data.duration, 10);
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
