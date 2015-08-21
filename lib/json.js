(function(global) {

var hrtime = typeof process !== 'undefined' ? process.hrtime : hrtimeShim();

/**
 * Mocha tree json reporter reporter.
 *
 * @param {Object} runner
 * @api public
 */
function Reporter(runner) {

    var stack = [],
        timing = [];

    var root;

    runner.on('suite', function(suite) {

        // mocha-phantomjs browser fix
        if (!root) {
            timing.push(hrtime());
            stack.push(createSuiteNode({
                title: 'root'
            }));
            root = true;
        }

        log(suite.title);

        var node = createSuiteNode(suite);

        if (stack.length) {
            last(stack).nodes.push(node);
        }

        timing.push(hrtime());
        stack.push(node);

    });

    runner.on('suite end', function(suite) {

        last(stack).data.duration = hrtime(last(timing));

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
        last(stack).nodes.push(createTestNode(test));
    });

    runner.on('end', function() {

        var json = JSON.stringify(last(stack), null, 2);

        if (typeof window !== 'undefined') {
            window.MochaTreeJsonReporterResult = json;
        } else if (process && process.env.MOCHA_JSON_OUTPUT_FILE) {
            fs.writeFileSync(process.env.MOCHA_JSON_OUTPUT_FILE, json, 'utf8');
        } else {
            console.log(json);
        }

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
        stack.forEach(function(node) {
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

}

/**
 * Create node from suite
 * @param {Object} suite - mocha's suite object
 * @returns {Object} node
 */
function createSuiteNode(suite) {
    var obj = clean(suite);
    obj.passed = 0;
    obj.pending = 0;
    obj.failed = 0;
    return {
        type: 'suite',
        data: obj,
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

const WHITE_LIST = [
    'title', 'message'
];

function clean(obj) {

    var o = {};

    WHITE_LIST.forEach(function(k) {
        if (obj[k]) {
            o[k] = obj[k];
        }
    });

    return o;

}

function last(arr) {
    return arr[arr.length - 1];
}

function hrtimeShim() {
    // https://github.com/kumavis/browser-process-hrtime/blob/master/index.js
    var performance = global.performance || {};
    var performanceNow = performance.now || performance.mozNow ||
        performance.msNow || performance.oNow || performance.webkitNow || function() {
            return (new Date()).getTime();
        };

    return function (previousTimestamp) {
        var clocktime = performanceNow.call(performance) * 1e-3;
        var seconds = Math.floor(clocktime);
        var nanoseconds = Math.floor((clocktime % 1) * 1e9);
        if (previousTimestamp) {
            seconds = seconds - previousTimestamp[0];
            nanoseconds = nanoseconds - previousTimestamp[1];
            if (nanoseconds<0) {
                seconds--;
                nanoseconds += 1e9;
            }
        }
        return [seconds, nanoseconds];
    }
}

var defineAsGlobal = true;

if(typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = Reporter;
    defineAsGlobal = false;
}

defineAsGlobal && (global.MochaTreeJsonReporter = Reporter);

})(this);
