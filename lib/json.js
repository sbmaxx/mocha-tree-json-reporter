(function(global) {

    var hrtime = typeof process !== 'undefined' ? process.hrtime : hrtimeShim();

    var stack = [],
        timing = [];

    var root;

    /**
     * Mocha tree json reporter reporter.
     *
     * @param {Object} runner
     * @api public
     */
    function Reporter(runner) {

        runner.on('start', function() {
            log('Runner started');
        });

        runner.on('suite', function(suite) {

            // mocha-phantomjs browser fix
            if (!root) {
                timing.push(hrtime());
                stack.push(createSuiteNode({
                    title: 'root'
                }));
                root = true;
            } else {
                log('%s (%s)', suite.title, suite.file);
            }

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

            console.log('');
            console.log('');

        });

        runner.on('end', function() {

            log('Runner ended');

            if (typeof process !== 'undefined' && process.env.MOCHA_JSON_OUTPUT_FILE) {

                var json = getResult();

                log('trying to save in ' + process.env.MOCHA_JSON_OUTPUT_FILE);

                try {
                    require('fs').writeFileSync(process.env.MOCHA_JSON_OUTPUT_FILE, json, 'utf8');
                } catch(e) {
                    console.log(e.stack);
                }

            }

        });

        runner.on('pass', onTestEnd);
        runner.on('fail', onTestEnd);
        runner.on('pending', onTestEnd);

    }

    const PASSED = '✓';
    const FAILED = '✕';
    const PENDING = '…';
    const INDENT = '  ';

    function onTestEnd(test, error) {

        if (!test.state && test.pending === true) {
            test.state = 'pending'
        }

        log(INDENT + ( test.state === 'passed' ? PASSED : test.state === 'failed' ? FAILED : PENDING ) + INDENT + test.title);

        if (error) {
            log(INDENT + error.stack);
            test.error = error;
        }

        last(stack).nodes.push(createTestNode(test));
        stat(test.state);

    }

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

    /**
     * Log into console on non-browser environment
     */
    function log() {
        if (typeof window !== 'undefined') {
            return;
        }
        arguments[0] = indent() + arguments[0];
        console.log.apply(console, arguments);
    }

    /**
     * Get level of nested item in stack
     * @returns {string}
     */
    function indent() {
        return Array(stack.length).join('  ');
    }


    /**
     * Get results
     * @returns {String}
     */
    function getResult() {

        var json;

        try {
            json = JSON.stringify(last(stack), null, 2);
        } catch(e) {
            console.log(e.stack);
        }

        log('JSON.length = ' + json.length);

        return json;

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

    function clean(obj) {

        var o = {};

        ['title', 'message', 'state', 'error'].forEach(function(k) {
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

    Reporter.getResult = getResult;

    var defineAsGlobal = true;

    if(typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = Reporter;
        defineAsGlobal = false;
    }

    defineAsGlobal && (global.MochaTreeJsonReporter = Reporter);

})(this);
