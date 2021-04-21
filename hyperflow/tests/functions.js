var functions = require('../functions')

exports.setUp = function(callback) {
    this.config = {
        executor: {
            executable: "ls",
            args: "-la"
        }
    };
    callback();
}

exports.test_function_notifyevents_with_eventserver = function(test) {
    var notified = false;
    var ins = [],
        outs = [];

    this.config.eventserver = {
        emit: function() {
            notified = true;
        }
    };

    var cb = function(exceptions, outs) {
        test.equal(exceptions, null);
    };


    functions.command_notifyevents(ins, outs, this.config, cb);
    test.ok(notified);

    test.done()
}

exports.test_function_notifyevents_without_eventserver = function(test) {
    var ins = [],
        outs = [];

    var cb = function(exceptions, outs) {
        test.equal(exceptions, null);
    };

    functions.command_notifyevents(ins, outs, this.config, cb);

    test.done()
}
