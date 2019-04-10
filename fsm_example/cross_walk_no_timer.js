// node.js/CommonJS:
var machina = require('machina');
const GREEN = 'green';
const YELLOW = 'yellow';
const RED = 'red';
const FLASHING = 'flashing';
const WALK  = 'walk';
const DO_NOT_WALK  = 'do_not_walk';

var pedestrianSignal = new machina.Fsm( {
    namespace: "pedestrian-signal",
    initialState: "uninitialized",
    initialize: function( options ) {
        // your setup code goes here...
        console.log('pedestrianSignal here is initialize method');
        // this.reset();
        this.start();
    },
    reset: function() {
        console.log('-----pedestrianSignal--reset------');
        this.transition( "walking" );
        // this.handle( "_reset" );
    },
    start: function() {
        console.log('pedestrianSignal wrap call to start:----------------');
        console.log(this.state, this.priorState);
        console.log('pedestrianSignal wrap call to start:----------------');
        this.handle('start');
        // 虽然没有start这个handle，不过应该会进入 * 这个handle
    },
    states: {
        uninitialized: {
            "*": function() {
                this.deferUntilTransition();
                console.log('uninitialized');
                this.transition( "walking" );
            }
        },
        walking: {
            _onEnter: function() {
                this.handle('timeout');
                // this.timer = setTimeout( function() {
                //     this.handle( "timeout" );
                // }.bind( this ), 3000 );
                console.log('walking:3000');
                this.emit( "pedestrians", { status: WALK } );
            },
            timeout: "flashing",
            _onExit: function() {
                // clearTimeout( this.timer );
            }
        },
        flashing: {
            _onEnter: function() {
                this.handle('timeout');
                // this.timer = setTimeout( function() {
                //     this.handle( "timeout" );
                // }.bind( this ), 1000 );
                console.log('flashing:1000');
                this.emit( "pedestrians", { status: FLASHING, flashing: true } );
            },
            timeout: "dontwalk",
            _onExit: function() {
                // clearTimeout( this.timer );
            }
        },
        dontwalk: {
            _onEnter: function() {
                this.handle('timeout');
                // this.timer = setTimeout( function() {
                //     this.handle( "timeout" );
                // }.bind( this ), 2000 );
                console.log('dontwalk:2000');
                this.emit( "pedestrians", { status: DO_NOT_WALK } );
            },
            _reset: "walking",
            _onExit: function() {
                // clearTimeout( this.timer );
            }
        }
    }
} )
// console.log(pedestrianSignal);
pedestrianSignal.on('pedestrians', function(data) {
    console.log('pedestrianSignal pedestrians', data);
    // if(data.status === DO_NOT_WALK) {
    //     pedestrianSignal.reset();
    // }
});
var vehicleSignal = new machina.Fsm( {

    // the initialize method is called right after the FSM
    // instance is constructed, giving you a place for any
    // setup behavior, etc. It receives the same arguments
    // (options) as the constructor function.
    initialize: function( options ) {
        // your setup code goes here...
        console.log('here is initialize method');
        this.pedestrianWaiting();
    },

    namespace: "vehicle-signal",

    // `initialState` tells machina what state to start the FSM in.
    // The default value is "uninitialized". Not providing
    // this value will throw an exception in v1.0+
    initialState: "uninitialized",

    // The states object's top level properties are the
    // states in which the FSM can exist. Each state object
    // contains input handlers for the different inputs
    // handled while in that state.
    states: {
        uninitialized: {
            // Input handlers are usually functions. They can
            // take arguments, too (even though this one doesn't)
            // The "*" handler is special (more on that in a bit)
            "*": function() {
                this.deferUntilTransition();
                // the `transition` method takes a target state (as a string)
                // and transitions to it. You should NEVER directly assign the
                // state property on an FSM. Also - while it's certainly OK to
                // call `transition` externally, you usually end up with the
                // cleanest approach if you endeavor to transition *internally*
                // and just pass input to the FSM.
                this.transition( "green" );
            }
        },
        green: {
            // _onEnter is a special handler that is invoked
            // immediately as the FSM transitions into the new state
            _onEnter: function() {
                this.handle('timeout');
                // this.timer = setTimeout( function() {
                //     this.handle( "timeout" );
                // }.bind( this ), 2000 );
                console.log('timeout for green after 2000');
                this.emit( "vehicles", { status: GREEN } );
            },
            // If all you need to do is transition to a new state
            // inside an input handler, you can provide the string
            // name of the state in place of the input handler function.
            timeout: "green-interruptible",
            pedestrianWaiting: function() {
                console.log('green:pedestrianWaiting:defer');
                // console.log(this.state, this.priorState);
                this.deferUntilTransition( "green-interruptible" );
            },
            // _onExit is a special handler that is invoked just before
            // the FSM leaves the current state and transitions to another
            _onExit: function() {
                // clearTimeout( this.timer );
            }
        },
        "green-interruptible": {
            _onEnter: function() {
                this.handle( "timeout" );
            },
            timeout: function() {
                this.handle('pedestrianWaiting');
            },
            pedestrianWaiting: function() {
                console.log('green-interruptible: transition to yellow');
                // console.log(this.state, this.priorState);
                this.transition("yellow");
            }
        },
        yellow: {
            _onEnter: function() {
                this.handle('timeout');
                // this.timer = setTimeout( function() {
                //     this.handle( "timeout" );
                // }.bind( this ), 1000 );
                console.log('timeout for yellow after 1000');
                // machina FSMs are event emitters. Here we're
                // emitting a custom event and data, etc.
                this.emit( "vehicles", { status: YELLOW } );
            },
            timeout: "red",
            _onExit: function() {
                // clearTimeout( this.timer );
            }
        },
        red: {
            _onEnter: function() {
                this.handle('timeout');
                // this.timer = setTimeout( function() {
                //     this.handle( "timeout" );
                // }.bind( this ), 3000 );
                console.log('timeout for red after 3000');
                this.emit( "vehicles", { status: RED } );
            },
            _reset: function() {
                console.log('red reset');
                this.transition("green");
            },
            _onExit: function() {
                // clearTimeout(this.timer);
            }
        }
    },

    // While you can call the FSM's `handle` method externally, it doesn't
    // make for a terribly expressive API. As a general rule, you wrap calls
    // to `handle` with more semantically meaningful method calls like these:
    reset: function() {
        console.log('-----vehiclesSignal--reset------');
        this.handle( "_reset" );
    },

    pedestrianWaiting: function() {
        console.log('wrap call to pedestrianWaiting:----------------');
        console.log(this.state, this.priorState);
        console.log('wrap call to pedestrianWaiting:----------------');
        this.handle( "pedestrianWaiting" );
    }
} );

vehicleSignal.on('vehicles', function(data)  {
    console.log('vehiclesSignal vehicles',data);
    if(data.status === RED) {
        // vehicleSignal.reset();
        // vehicleSignal.pedestrianWaiting();
    } else if(data.status === GREEN) {
        vehicleSignal.pedestrianWaiting();
    }
});

var crosswalk = new machina.Fsm( {
    namespace: "crosswalk",
    initialState: "vehiclesEnabled",
    initialize: function( options ) {
        // 这里控制 两者的状态一致
        // 因为不使用timer了，测试是否可以同步转换彼此的状态
        console.log('here is crosswalk method');
    },
    states: {
        vehiclesEnabled: {
            _child: vehicleSignal,
            _onEnter: function() {
                this.emit( "pedestrians", { status: DO_NOT_WALK } );
                console.log('enter vehiclesEnabled');
            },
            // timeout: "pedestriansEnabled"
        },
        pedestriansEnabled: {
            _child: pedestrianSignal,
            _onEnter: function() {
                this.emit( "vehicles", { status: RED } );
                console.log('enter pedestriansEnabled');
            },
            // timeout: "vehiclesEnabled"
        }
    }
} );
crosswalk.on('pedestrians', function(data){
    console.log('crosswalk pedestrians',data);
})

// Notice how each state has a _child property? This property can be used to assign
//  an FSM instance to act as a child FSM for this parent state 
//  (or a factory function that produces an instance to be used, etc.).
//   Here's how it works:

// When an FSM is handling input, it attempts to let the child FSM handle it first. 
// If the child emits a nohandler event, the parent FSM will take over and attempt to handle it.
//  For example - if a pedestrianWaiting input is fed to the above FSM while in the vehiclesEnabled state, 
//  it will be passed on to the vehicleSignal FSM to be handled there.
// Events emitted from the child FSM are bubbled up to be emitted by the top level parent 
// (except for the nohandler event).
// If a child FSM handles input that it does not have a handler for, 
// it will bubble the input up to the parent FSM to be handled there. 
// Did you notice that both our pedestrianSignal and 
// vehicleSignal FSMs queue up a timeout input in the dontwalk and red states, respectively? 
// However, neither of those FSMs have an input handler for timeout in those states.
//  When these FSMs become part of the hierarchy above, as children of the crosswalk FSM,
//   the timeout input will bubble up to the parent FSM to be handled, where there are handlers for it.
// When the parent FSM transitions to a new state, any child FSM from a previous state is ignored entirely 
// (i.e. - events emitted, or input bubbled, will not be handled in the parent).
//  If the parent FSM transitions back to that state, it will resume listening to the child FSM, etc.
// As the parent state transitions into any of its states, it will tell the child FSM to handle a _reset input.
//  This gives you a hook to move the child FSM to the correct state before handling any further input. 
//  For example, you'll notice our pedestrianSignal FSM has a _reset input handler in the dontwalk state,
//   which transitions the FSM to the walking state.
// In v1.1.1, machina added the compositeState() method to the BehavioralFsm and Fsm prototypes.
//  This means you can get the current state of the FSM hierarchy. For example:
