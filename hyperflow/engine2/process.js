 /* HyperFlow workflow engine
 ** Author: Bartosz Balis (2013-2014)
 **
 ** Common functions used by processes
 ** 
 */

var async = require('async'),
    log4js = require('log4js');

// This function is invoked on arrival of an input signal.
// 'obj.message' is a JSON object which should contain:
// - wfId: workflow instance id
// - sigId: signal id
// - sig: the actual signal
// - ...
function fireInput(obj) {
    var msg = obj.message, 
        proc = obj.session.logic,
        state = obj.session.getCurrentState().name,
        sigId = msg.sigId,
        sig = msg.sig;

    //onsole.log("FIRE INPUT Proc", proc.procId, sig);
    //onsole.log("FIRING SIGS="+JSON.stringify(proc.firingSigs));

    if (sigId == proc.ctrIns.done) { // the "done" control signal has arrived
        proc.done = true;
    } else {
        if (sig.control == "count") { // a "count" control signal has arrived
            //onsole.log("COUNT SIG ARRIVED!", sig);
            var tSigId = proc.fullInfo.incounts.rev[sigId];
            //onsole.log("WILL SET sig '" + tSigId + "' count to", sig.count);

            if (!proc.countSigs[sigId]) {
                proc.countSigs[sigId] = [];
            }
            if (!proc.countSigs[sigId].length) { // no previously stashed 'count' signals...
                // ...set the appropriate 'count' in the firing signals pattern
                proc.firingSigs[tSigId] = sig.count;
            }
            proc.countSigs[sigId].push(sig); // stash the signal
        }
        if (!proc.dataIns[sigId]) {
            proc.dataIns[sigId] = 1;
            proc.cnt++;
        } else {
            proc.dataIns[sigId] += 1;
        }

        //onsole.log("CNT Proc", proc.procId, proc.cnt, proc.dataIns);
        if (proc.cnt >= Object.keys(proc.firingSigs).length) { // FIXME: not accurate if signal counts > 1 in the firing pattern
            proc.tryTransition();
        }
    }
}

var ProcLogic = function() {
    this.procs = []; // array of all process FSM "sessions" (so processes can send events to other processes)
    this.appId = -1; // workflow instance id
    this.procId = -1; // id of this process
    this.cnt = 0; // how many inputs have at least one signal on the queue
    this.dataIns = []; // dataIns[sigId] = count of instances of signal 'sigId' awaiting on the queue
    this.nDataIns = -1; // how many data inputs are there?
    this.next = false; // has the "next" control sig arrived?
    this.done = false; // has the "done" control sig arrived? 
    this.ctrIns = {};  // control inputs (map sig name -> sigId)
    this.ctrOuts = {}; // control outputs (map sig name -> sigId)
    this.ins = []; // ids of inputs (data and control signals)
    this.outs = []; // ids of outputs (data and control signals)
    this.sources = []; 
    this.sinks = [];
    this.firingInterval = -1; // a process can have 0 data inputs and a firing interval ==> its 
                              // function will be invoked regularly according to this interval
    this.firingSigs = {};    // sigs required to fire the process
    this.firingLimit = -1;   // max number of times the process can fire (-1 = unlimited)
    this.sigValues = null;
    this.firingId = 0;       // which firing of the process is this?
    this.runningCount = 0;   // how many firings are currently running in parallel (max = parlevel)?
    this.orderId = 1;   // used if ordering = true to enforce emitting output signals in the order of firingIds

    this.emitStash = {}; // used if ordering = true as a stash of output signals to be emitted in the right order

    this.countSigs = {}; // stash for 'count' signals for next firings

    this.ready = false; // is the proc ready to read input signals?

    this.provStash = []; // stash for provenance events

    this.init = function(engine, appId, procId, session, fullInfo) {
        this.engine = engine;
        this.wflib = engine.wflib;
	this.procs = engine.tasks;
	this.appId = +appId;
	this.procId = +procId;
	this.ins = engine.ins[procId];
	this.outs = engine.outs[procId];
	this.sources = engine.sources;
	this.sinks = engine.sinks;
        this.nDataIns = engine.ins[procId].length;
        this.firstFiring = true;
        this.fullInfo = fullInfo;
	this.name = fullInfo.name;
	this.parlevel = fullInfo.parlevel ? fullInfo.parlevel : 1; // maximum level of parallelism
        this.session = session;

	this.firingLimit = this.fullInfo.firingLimit ? this.fullInfo.firingLimit : -1;

	if (this.procId in engine.cPorts) {
            var procCPorts = engine.cPorts[this.procId];
            if ("ins" in procCPorts) {
                for (var i in procCPorts.ins) {
                    // this should be correct: #(data_ins) = #(all_ins) - #(control_ins)
                    // (not an efficient way to compute but there should be max ~2 control ins)
                    this.nDataIns--;
                }
                this.ctrIns = procCPorts.ins;
            }
            if ("outs" in procCPorts) {
                this.ctrOuts = procCPorts.outs;
            }
            //onsole.log("Cports: "+this.ctrIns.next, this.ctrIns.next, this.ctrOuts.next, this.ctrOuts.next); // DEBUG
	}

        if (this.nDataIns == 0) { // special case with no data inputs (a 'source' pocess)
            // FIXME: add assertion/validation that firing interval is defined!
            // TODO: change semantics of firingInterval to *minimal* firing interval (regardless of # of inputs)
            this.firingInterval = this.fullInfo.firingInterval;
	}

        //onsole.log("INCOUNTS", this.fullInfo.incounts);
        //onsole.log("OUTCOUNTS", this.fullInfo.outcounts);

        session.addListener({
            contextCreated      : function( obj ) {    },
            contextDestroyed    : function( obj ) {    },
            finalStateReached   : function( obj ) {    },
            stateChanged        : function( obj ) {    },
            customEvent         : fireInput
        });

        //onsole.log("PROC COUTSET: ", this.fullInfo.coutset);
        //onsole.log("PROC CTROUTS: ", this.ctrOuts);

        // process-specific initialization
        if (this.init2) {
            this.init2(session);
        }
    }

    this.tryTransition = function() {
        var proc = this;
        if (proc.ready && proc.done) {
            proc.ready = false;
            proc.makeTransition("ReFi");
        }

        if (proc.nDataIns == 0 && proc.ready) { 
            // a "source" process: to be fired regularly according to a firing interval
            proc.ready = false;
            if (proc.firstFiring) {
                proc.makeTransition("ReRu");
            } else {
                setTimeout(function() {
                    proc.makeTransition("ReRu");
                }, proc.firingInterval);
            }
        } else if (proc.ready) {
            proc.ready = false;
            proc.fetchInputs(proc, function(arrived, sigValues) {
                if (arrived) {
                    proc.makeTransition("ReRu");
                } else {
                    proc.ready = true;
                }
            });
        }
    }

    this.fetchInputs = function(proc, cb) {
        var sigs = proc.firingSigs;
        //onsole.log("FETCHING", sigs);
        proc.wflib.fetchInputs(proc.appId, proc.procId, sigs, true, function(arrived, sigValues) {
            if (arrived) {
                //onsole.log("FETCHED", sigValues, proc.procId);
                /*if (sigs[sigs.length-1][0] == proc.ctrIns.next) {
                    sigValues.pop(); // remove 'next' signal (should not be passed to the function)
                }*/
                proc.sigValues = sigValues; // set input signal values to be passed to the function
            } else {
                proc.ready = true;
            }
            cb(arrived, sigValues);
        });
    }

    this.preInvoke = function(cb) {
        var proc = this;
        proc.runningCount += 1;
        if (proc.firingLimit != -1) {
            proc.firingLimit -= 1;
            if (proc.firingLimit == 0) {
                proc.done = true;
            }
        }
        //onsole.log("runningCount (" + proc.fullInfo.name + "):", proc.runningCount);
        proc.wflib.setTaskState(proc.appId, proc.procId, { "status": "running" }, function(err, rep) {
            err ? cb(err): cb(null); 
        });
    }

    this.invokeFunction = function(cb) {
        var proc = this, emul = proc.engine.emulate;
        var asyncInvocation = false;
        var funcIns = [], funcOuts = [];

        // create arrays of data ins and outs ids (exclude control signals)
        for (var sigId in proc.firingSigs) {
            if (!(sigId in proc.fullInfo.cinset)) {  
                funcIns.push(sigId);
            }
        }
        for (var i=0; i<proc.outs.length; ++i) {
            outId = proc.outs[i];
            if (!(outId in proc.fullInfo.coutset)) { 
                funcOuts.push(outId);
            }
        }

        //logger.debug(funcIns, funcOuts);
        
        var isSticky = function(sigId) { 
            return proc.fullInfo.sticky && (sigId in proc.fullInfo.stickySigs);
        }
        // update - 'cnt': number of inputs with signals waiting
        //        - 'dataIns': signal counts on input queues
        proc.cnt = 0;
        for (var sigId in proc.firingSigs) {
            var sigCount = proc.firingSigs[sigId];
            if (!isSticky(sigId)) {
                proc.dataIns[sigId] -= sigCount;
            }
            if (proc.dataIns[sigId]) {
                proc.cnt++;
            }
        }
        //onsole.log("RESET CNT Proc", proc.procId, proc.cnt, proc.dataIns);

        if (proc.firstFiring) {
            proc.firstFiring = false;
        }

        if (!proc.done && (proc.runningCount < proc.parlevel || proc.parlevel == 0)) {
            asyncInvocation = true;
            // we return to the ready state BEFORE invoking the function, i.e. the firing
            // is ASYCHRONOUS; as a result, another firing can happen in parallel
            proc.shiftCountSigs(); 
            proc.makeTransition("RuRe");
        }

        /*proc.cnt -= proc.firingSigs.length; // subtract cnt by the number of consumed signals
        if (proc.fullInfo.sticky) 
            proc.cnt += proc.fullInfo.sticky; // sticky signals weren't actually consumed!
            */

        ///////////////////////////////////////////
        ///////// Provenance logging //////////////
        ///////////////////////////////////////////
        
        // TODO: implement user-driven events (state-reset and state-remove)

        if (proc.engine.logProvenance) {
            // 1. emit stashed ("state-*") provenance events
            if (proc.provStash) {
                while (proc.provStash.length) {
                    proc.engine.eventServer.emit("prov", proc.provStash.shift());
                }
            }

            // 2a. emit "read" provenance events (signal was read by a process)
            // 2b. stash "state-reset" or "state-remove" provenance events for next firing
            var isStateful = function(sigId) { 
                return proc.fullInfo.stateful && (sigId in proc.fullInfo.statefulSigs);
            }
            if (proc.sigValues) {
                proc.sigValues.forEach(function(sigs) {
                    sigs.forEach(function(sig) {
                        // FIXME: remove "sig" at the end of event (for debugging only)
                        proc.engine.eventServer.emit("prov", 
                            ["read", +proc.appId, +proc.procId, +proc.firingId, +sig._id, +sig.sigIdx, sig]
                        );
                    });

                    // stash events for the next firing
                    if (!proc.fullInfo.stateful) { 
                        // process is stateless => do "state-reset" in next firing
                        proc.provStash.push( 
                            ["state-reset", proc.appId, proc.procId, proc.firingId+1, null, null]
                        );
                    } else if (!isStateful(sig._id)) { 
                        // some sigs are stateful => do "state-remove" for those which aren't
                        proc.provStash.push( 
                            ["state-remove", proc.appId, proc.procId, proc.firingId+1, sig._id, sig.sigIdx]
                        );
                    }
                });
            }
        }

        proc.wflib.invokeProcFunction(
                proc.appId,
                proc.procId,
		proc.firingId, 
                funcIns,
                proc.sigValues,
                funcOuts, emul,
                proc.engine.eventServer,
                proc.engine.config, 
                function(err, ins, outs, options) { // 'ins' is returned only for the purpose of persistence
		    //onsole.log("FUNC INVOKED");
		    //onsole.log("INS: ", JSON.stringify(proc.sigValues, null, 2));
		    //onsole.log("OUTS: ", outs);

                    // convert ins and outs object-arrays to arrays for the purpose of persistence
                    var outsArray = [], insArray = [];
                    if (outs == null) {
                       outsArray = null; 
                    } else {
                        outs.forEach(function(out, i) {
                            outsArray.push(out);
                            // FIXME: the code below is repeated below in "postInvoke"
                            // --> TODO: make a function for adding metadata to a signal 
                            outsArray[i]["_id"] = +funcOuts[i];
                            outsArray[i]["source"] = +proc.procId;
                            outsArray[i]["firingId"] = +proc.firingId;
                        });        
                    }                    
                    if (ins == null) {
                       insArray = null; 
                    } else {
                        ins.forEach(function(input) {
                            insArray.push(input);
                        });
                    }


                    // persist outputs (originally persistence was disabled DURING recovery, 
                    // but it's probably wrong: currently even when recovering from a previous log, 
                    // workflow execution is persisted normally to a new log)
                    //if (!options || !options.recovered) {
                        proc.engine.eventServer.emit("persist", 
                            // FIXME: insArray only added for testing "pregel" algorithm
                            ["fired", proc.appId, proc.procId, proc.firingId, outsArray, insArray]);
                    //}
                    err ? cb(err): cb(null, outs, asyncInvocation, funcIns, funcOuts);
                }
        );
    }

    this.postInvoke = function(outs, asyncInvocation, funcIns, funcOuts, firingId, firingSigs, cb) {
        var proc = this;

        // the function can return 'null' in order not to emit any signals (e.g. the process can
        // be stateful and emit an output for every three firings). 
        if (outs == null) return cb();

        var outValues = outs;
        for (var i=0; i<funcOuts.length; ++i) {
            outValues[i]["_id"] = +funcOuts[i];
            outValues[i]["source"] = +proc.procId;
            outValues[i]["firingId"] = +firingId;

            // emit the associated "count" signal (if exists)
            var countSigId = proc.fullInfo.outcounts && 
                proc.fullInfo.outcounts[funcOuts[i]] ? proc.fullInfo.outcounts[funcOuts[i]]: undefined;
            if (countSigId) {
                var count = outValues[i].data ? outValues[i].data.length: 1; 
                var sigId = countSigId.split(":")[1]; 

                //onsole.log("FUNC OUTS", funcOuts);
                //onsole.log("EMITTING COUNT SIG", sigId);
                //onsole.log("IN  COUNTS", proc.fullInfo.incounts);
                //onsole.log("OUT COUNTS", proc.fullInfo.outcounts);
                var sigV = {"_id": +sigId, "count": count, "control": "count", data: [{}]};
                if (count > 0) { // 0 can happen if process returns an empty "data" array
                    if (!proc.fullInfo.ordering) {
                        proc.engine.emitSignals([sigV]);
                    } else {
                        // TODO: test thouroughly if ordering works correctly with output "count" signals
                        function Arg() {} // we need an Array-like object
                        Arg.prototype = Object.create(Array.prototype);
                        proc.emitStash[firingId] = new Arg;
                        proc.emitStash[firingId].push(sigV); 
                    }
                }
            }
        }

        if (proc.ctrOuts.next) { // emit "next" signal if there is such an output port
            outValues.push({"_id": proc.ctrOuts.next, "control": "next" });
        }

        //onsole.log("OUT SIGS", outValues);
        //onsole.log("firingId:", firingId, proc.firingId);

        if (!proc.fullInfo.ordering) {
            //onsole.log("OUT SIGS", JSON.stringify(outValues, null, 2));
            proc.engine.emitSignals(outValues, function(err) {
                proc.runningCount -= 1;
                //onsole.log("runningCount (" + proc.fullInfo.name + ")/2:", proc.runningCount);
                err ? cb(err): cb(null);
            });
        } else {
            proc.runningCount -= 1;
            if (!proc.emitStash[firingId]) {
                proc.emitStash[firingId] = outValues;
            } else {
                outValues.forEach(function(v) {
                    proc.emitStash[firingId].push(v);
                });
            }
        }

        // check if there are stashed signals to be emitted
        (function emitStashedSigs() {
            if (!proc.fullInfo.ordering)  {
                return;
            }
            //onsole.log("ORDER!!!!!", proc.orderId, JSON.stringify(proc.emitStash, null, 2));
            if (proc.emitStash[proc.orderId]) {
                var outSigs = proc.emitStash[proc.orderId];
                //onsole.log("EMITTING IN ORDER", outSigs[0].firingId);
                proc.orderId += 1;
                //onsole.log("OUT SIGS", JSON.stringify(outSigs, null, 2));
                proc.engine.emitSignals(outSigs, function(err) {
                    delete proc.emitStash[proc.orderId-1];
                    emitStashedSigs();
                });
            } else {
                cb(null);
            }
        })();
    }

    this.postInvokeTransition = function(asyncInvocation, cb) {
        if (!asyncInvocation) {
            this.shiftCountSigs();
            this.makeTransition("RuRe"); // proc goes back to ready state
        }
        cb(null);
    }

    return this;
}

ProcLogic.prototype.makeTransition = function(tr) {
    this.session.dispatch( { msgId: tr } );
}

// If there are stashed input 'count' signals, sets the associated signal counts for next firing
ProcLogic.prototype.shiftCountSigs = function() {
    for (var s in this.countSigs) {
        if (this.countSigs[s]) {
            this.countSigs[s].shift(); // remove current 'count' signal
        }
        if (this.countSigs[s] && this.countSigs[s].length) {
            var sig = this.countSigs[s][0], sigId = s;
            var tSigId = this.fullInfo.incounts.rev[sigId];
            //onsole.log("SHIFTING COUNTS... WILL SET sig '" + tSigId + "' count to", sig.count);
            this.firingSigs[tSigId] = sig.count; // set signal count for next firing
        }
    }
}


function extend(subc, superc) {
    var subcp = subc.prototype;
    var method;

    // Class pattern.
    var F = function() {
    };
    F.prototype = superc.prototype;

    subc.prototype = new F();       // chain prototypes.
    subc.superclass = superc.prototype;
    subc.prototype.constructor = subc;

    // Reset constructor. See Object Oriented Javascript for an in-depth explanation of this.
    if (superc.prototype.constructor === Object.prototype.constructor) {
        superc.prototype.constructor = superc;
    }

    for ( method in subcp ) {
        if (subcp.hasOwnProperty(method)) {
            subc.prototype[method] = subcp[method];
        }
    }
}

exports.ProcLogic = ProcLogic;
exports.fireInput = fireInput;
exports.extend = extend;
