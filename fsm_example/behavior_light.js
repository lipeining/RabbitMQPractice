// node.js/CommonJS:
var machina = require('machina');
const GREEN = 'green';
const YELLOW = 'yellow';
const RED = 'red';


var vehicleSignal = new machina.BehavioralFsm( {

    initialize: function( options ) {
        // your setup code goes here...
        console.log('here is initialize method');
        // for(const light of lights) {
        //     this.pedestrianWaiting(light);
        // }
    },

    namespace: "vehicle-signal",

    initialState: "uninitialized",

    states: {
        uninitialized: {
            "*": function( client ) {
                this.deferUntilTransition( client );
                this.transition( client, "green" );
            }
        },
        green: {
            _onEnter: function( client ) {
                client.timer = setTimeout( function() {
                    this.handle(  client, "timeout" );
                }.bind( this ), 30000 );
                console.log('timeout for green after 3000');
                this.emit( "vehicles", { client: client, status: GREEN } );
            },
            timeout: "green-interruptible",
            pedestrianWaiting: function( client ) {
                console.log('green:pedestrianWaiting:defer');
                this.deferUntilTransition(  client, "green-interruptible" );
            },
            _onExit: function( client ) {
                clearTimeout( client.timer );
            }
        },
        "green-interruptible": {
            pedestrianWaiting: function(client) {
                console.log('green-interruptible: transition to yellow');
                // console.log(this.state, this.priorState);
                this.transition(client, "yellow");
            }
            // pedestrianWaiting: 'yellow',
        },
        yellow: {
            _onEnter: function( client ) {
                client.timer = setTimeout( function() {
                    this.handle( client, "timeout" );
                }.bind( this ), 5000 );
                console.log('timeout for yellow after 3000');
                this.emit( "vehicles", { client: client, status: YELLOW } );
            },
            timeout: "red",
            _onExit: function( client ) {
                clearTimeout( client.timer );
            }
        },
        red: {
            _onEnter: function( client ) {
                client.timer = setTimeout( function() {
                    this.handle( client, "timeout" );
                }.bind( this ), 1000 );
                console.log('timeout for red after 3000');
                this.emit( "vehicles", { client:client, status: RED } );
            },
            _reset: "green",
            _onExit: function( client ) {
                clearTimeout( client.timer );
            }
        }
    },

    reset: function( client ) {
        this.handle(  client, "_reset" );
    },

    pedestrianWaiting: function( client ) {
        this.handle( client, "pedestrianWaiting" );
    }
} );

// Now we can have multiple 'instances' of traffic lights that all share the same FSM:
var light1 = { location: "Dijsktra Ave & Hunt Blvd", direction: "north-south" };
var light2 = { location: "Dijsktra Ave & Hunt Blvd", direction: "east-west" };
var lights = [light1, light2];

vehicleSignal.on('vehicles', function(data)  {
    console.log('event vehicles',data.status, data.client.direction);
    if(data.status === RED) {
        vehicleSignal.reset(data.client);
        // vehicleSignal.pedestrianWaiting();
    } else if(data.status === GREEN) {
        vehicleSignal.pedestrianWaiting(data.client);
    }
});

// // to use the behavioral fsm, we pass the "client" in as the first arg to API calls:
vehicleSignal.pedestrianWaiting( light1 );

// // Now let's signal a pedestrian waiting at light2
vehicleSignal.pedestrianWaiting( light2 );

// if you were to inspect light1 and light2, you'd see they both have
// a __machina__ property, which contains metadata related to this FSM.
// For example, light1.__machina__.vehicleSignal.state might be "green"
// and light2.__machina__.vehicleSignal.state might be "yellow" (depending
// on when you check). The point is - the "clients' state" is tracked
// separately from each other, and from the FSM. Here's a snapshot of
// light1 right after the vehicleSignal.pedestrianWaiting( light1 ) call:

// {
//   "location": "Dijsktra Ave & Hunt Blvd",
//   "direction": "north-south",
//   "__machina__": {
//     "vehicle-signal": {
//       "inputQueue": [
//         {
//           "type": "transition",
//           "untilState": "green-interruptible",
//           "args": [
//             {
//               "inputType": "pedestrianWaiting",
//               "delegated": false
//             }
//           ]
//         }
//       ],
//       "targetReplayState": "green",
//       "state": "green",
//       "priorState": "uninitialized",
//       "priorAction": "",
//       "currentAction": "",
//       "currentActionArgs": [
//         {
//           "inputType": "pedestrianWaiting",
//           "delegated": false
//         }
//       ],
//       "inExitHandler": false
//     }
//   },
//   "timer": 11
// }