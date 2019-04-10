
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
        console.log('here is initialize method');
        // this.reset();
        this.start();
    },
    reset: function() {
        console.log('-------reset------');
        this.transition( "walking" );
        // this.handle( "_reset" );
    },
    start: function() {
        console.log('wrap call to start:----------------');
        console.log(this.state, this.priorState);
        console.log('wrap call to start:----------------');
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
                this.timer = setTimeout( function() {
                    this.handle( "timeout" );
                }.bind( this ), 2000 );
                console.log('walking');
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
                }.bind( this ), 2000 );
                console.log('flashing');
                this.emit( "pedestrians", { status: FLASHING, flashing: true } );
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
                }.bind( this ), 2000 );
                console.log('dontwalk');
                this.emit( "pedestrians", { status: DO_NOT_WALK } );
            },
            _reset: "walking",
            _onExit: function() {
                clearTimeout( this.timer );
            }
        }
    }
} )
// console.log(pedestrianSignal);
pedestrianSignal.on('pedestrians', function(data) {
    console.log('on pedestrians', data);
    if(data.status === DO_NOT_WALK) {
        pedestrianSignal.reset();
    }
});
