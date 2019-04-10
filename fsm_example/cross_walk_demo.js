
// node.js/CommonJS:
var machina = require('machina');
const GREEN = 'green';
const YELLOW = 'yellow';
const RED = 'red';
const FLASHING = 'flashing';
const WALK  = 'walk';
const DO_NOT_WALK  = 'do_not_walk';



// Child FSM
var vehicleSignal = new machina.Fsm( {
    namespace: "vehicle-signal",
    initialState: "uninitialized",
    reset: function() {
        this.transition( "green" );
    },
    states: {
        uninitialized: {
            "*": function() {
                this.deferUntilTransition();
                this.transition( "green" );
            }
        },
        green: {
            _onEnter: function() {
                this.timer = setTimeout( function() {
                    this.handle( "timeout" );
                }.bind( this ), 6000 );
                this.emit( "vehicles", { status: GREEN } );
            },
            timeout: "green-interruptible",
            pedestrianWaiting: function() {
                this.deferUntilTransition( "green-interruptible" );
            },
            _onExit: function() {
                clearTimeout( this.timer );
            }
        },
        "green-interruptible": {
            pedestrianWaiting: "yellow"
        },
        yellow: {
            _onEnter: function() {
                this.timer = setTimeout( function() {
                    this.handle( "timeout" );
                }.bind( this ), 5000 );
                this.emit( "vehicles", { status: YELLOW } );
            },
            timeout: "red",
            _onExit: function() {
                clearTimeout( this.timer );
            }
        },
        red: {
            _onEnter: function() {
                this.timer = setTimeout( function() {
                    this.handle( "timeout" );
                }.bind( this ), 1000 );
            },
            _reset: "green",
            _onExit: function() {
                clearTimeout( this.timer );
            }
        }
    }
} );

// // Child FSM
var pedestrianSignal = new machina.Fsm( {
    namespace: "pedestrian-signal",
    initialState: "uninitialized",
    reset: function() {
        this.transition( "walking" );
    },
    states: {
        uninitialized: {
            "*": function() {
                this.deferUntilTransition();
                this.transition( "walking" );
            }
        },
        walking: {
            _onEnter: function() {
                this.timer = setTimeout( function() {
                    this.handle( "timeout" );
                }.bind( this ), 6000 );
                this.emit( "pedestrians", { status: WALK } );
            },
            timeout: "flashing",
            _onExit: function() {
                clearTimeout( this.timer );
            }
        },
        flashing: {
            _onEnter: function() {
                this.timer = setTimeout( function() {
                    this.handle( "timeout" );
                }.bind( this ), 5000 );
                this.emit( "pedestrians", { status: DO_NOT_WALK, flashing: true } );
            },
            timeout: "dontwalk",
            _onExit: function() {
                clearTimeout( this.timer );
            }
        },
        dontwalk: {
            _onEnter: function() {
                this.timer = setTimeout( function() {
                    this.handle( "timeout" );
                }.bind( this ), 1000 );
            },
            _reset: "walking",
            _onExit: function() {
                clearTimeout( this.timer );
            }
        }
    }
} );

// // Parent FSM
var crosswalk = new machina.Fsm( {
    namespace: "crosswalk",
    initialState: "vehiclesEnabled",
    eventListeners: {
        "*": [ function( eventName, data ) {
                switch ( eventName ) {
                    case "transition" :
                        console.log( data.namespace, data.fromState, "->", data.toState );
                        break;
                    case "vehicles" :
                        console.log( "vehicles", data.status );
                        break;
                    case "pedestrians":
                        if ( data.flashing ) {
                            console.log( "pedestrians", data.status, "(flashing)" );
                        } else {
                            console.log( "pedestrians", data.status );
                        }
                        break;
                    default:

                        break;
                }
            }
        ]
    },
    states: {
        vehiclesEnabled: {
            // after _onEnter execs, send "reset" input down the hierarchy
            _onEnter: function() {
                this.emit( "pedestrians", { status: DO_NOT_WALK } );
            },
            timeout: "pedestriansEnabled",
            _child: vehicleSignal,
        },
        pedestriansEnabled: {
            _onEnter: function() {
                this.emit( "vehicles", { status: RED } );
            },
            timeout: "vehiclesEnabled",
            _child: pedestrianSignal
        }
    }
} );

crosswalk.handle( "pedestrianWaiting" );
