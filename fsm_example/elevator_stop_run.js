
// node.js/CommonJS:
var machina = require('machina');
const RUNNING = 'running';
const STOPPING = 'stopping';
const STOP = 'stop';
const IDLE = 'idle';
const UP = 'up';
const DOWN = 'down';
const TOP = 30;
const BOTTOM = 1;

var elevator = new machina.Fsm( {
    upQueue: [], // ASC
    downQueue: [], // DESC
    curLevel: 1,
    status: IDLE,
    timer: null,
    top: TOP,
    bottom: BOTTOM,
    initialize: function( options ) {
        // 设置好timer
        // 每一秒检查一下是否需要动作，同时更新reach事件
        // 这里不需要更新status，由每一个state的reach事件处理status
        this.timer = setInterval(()=>{
            if(!this.upQueue.length && !this.downQueue.length) {
                // do nothing
                return;
            }
            if(this.status === IDLE) {
                // 优先upQueue,其次downQueue
                if(this.curLevel===this.bottom) {
                    this.curLevel++;
                    this.status = UP;
                } else if(this.curLevel===this.top) {
                    this.curLevel--;
                    this.status = DOWN;
                } else if(this.upQueue.length){
                    // 靠近对应的楼层
                    const next = this.upQueue.find(l=>{
                        return l>=this.curLevel;
                    });
                    if(!next) {
                        this.curLevel--;
                        this.status = DOWN;
                    } else {
                        this.curLevel++;
                        this.status = UP;
                    }
                } else if(this.downQueue.length) {
                    // 靠近对应的楼层
                    const next = this.downQueue.find(l=>{
                        return l<=this.curLevel;
                    });
                    if(!next) {
                        this.curLevel++;
                        this.status = UP;
                    } else {
                        this.curLevel--;
                        this.status = DOWN;
                    }
                }
            } else if(this.status === UP) {
                // if(this.curLevel === this.top) {
                //     this.curLevel--;
                //     this.status = DOWN;
                // } else {
                //     this.curLevel++;
                // }
                this.curLevel++;
            } else if(this.status === DOWN) {
                // if(this.curLevel === this.bottom) {
                //     this.curLevel++;
                //     this.status = UP;
                // } else {
                //     this.curLevel--;
                // }
                this.curLevel--;
            } else {
                // will not happen
                throw new Error(' timer status invalid');
            }
            // this.emit('reach', {level: this.curLevel, status: this.status});
            this.handle('reach', {level: this.curLevel, status: this.status});
            return;
        }, 1000);
    },
    close: function() {
        this.clearInterval(this.timer);
        console.log('close');
        this.upQueue = [];
        this.downQueue = [];
        this.curLevel = 1;
        this.status = IDLE;
        this.transition('stop');
    },
    _enDownQueue: function(level) {
        const index = this.downQueue.findIndex(l=>{
            return l<level;
        });
        if(index === -1) {
            this.downQueue.push(level);
        } else {
            this.downQueue.splice(index, 0, level);;
        }
    },
    _enUpQueue: function(level) {
        const index = this.upQueue.findIndex(l=>{
            return l>level;
        });
        if(index === -1) {
            this.upQueue.push(level);
        } else {
            this.upQueue.splice(index, 0, level);;
        }
    },
    // 这里需要包装一下 入队操作，使用优先队列
    enQueue: function({level, upDown}) {
        if(this.status === IDLE) {
            if(this.upQueue.length || this.downQueue.length) {
                throw new Error(`idle with up queue length:${this.upQueue.length};down queue length:${this.downQueue.length}`);
            }
            // if(upDown){
            //     this._enDownQueue(level);
            // } else if(!upDown) {
            //     this._enUpQueue(level);
            // } else {
            //     // no this way
            //     throw new Error(`idle status upDown:${upDown};this.curLevel:${this.curLevel};level:${level}`);
            // }         
        } else if(this.status === UP) {
            if(!this.upQueue.length) {
                throw new Error('enqueue up status with no upQueue');
            }
            // if(upDown){
            //     this._enDownQueue(level);
            // } else if(!upDown) {
            //     this._enUpQueue(level);
            // } else {
            //     // no this way
            //     throw new Error(`up status upDown:${upDown};this.curLevel:${this.curLevel};level:${level}`);
            // }
        } else if(this.status === DOWN) {
            if(!this.downQueue.length) {
                throw new Error('enqueue down status with no downQueue');
            }
            // if(upDown){
            //     this._enDownQueue(level);
            // } else if(!upDown) {
            //     this._enUpQueue(level);
            // } else {
            //     // no this way
            //     throw new Error(`up status upDown:${upDown};this.curLevel:${this.curLevel};level:${level}`);
            // }
        } else {
            // will not happen
            throw new Error(' enqueue status invalid');
        }
        // 根据意愿入队！！！
        if(upDown){
            this._enDownQueue(level);
        } else if(!upDown) {
            this._enUpQueue(level);
        } else {
            // no this way
            throw new Error(`${this.status} status upDown:${upDown};this.curLevel:${this.curLevel};level:${level}`);
        }     
    },
    namespace: "elevator",
    initialState: "stop",
    // 对于reach事件，需要处理掉queue里面全部符合要求的level.
    states: {
        stop: {
            _onEnter: function(){
                console.log('enter stop');
            },
            reach: function(data){
                // 这里需要对stop进行判断，准确进入running
                if(data.status === UP) {
                    const upList = this.upQueue.filter(l=>{
                        return l !== data.level;
                    });
                    if(this.upQueue.length - upList.length) {
                        console.log(`stop now open remove ${data.level}`);
                        this.upQueue = upList;
                    } else {
                        console.log(`stop now will not open ${data.level}`);
                    }
                } else if(data.status === DOWN) {
                    const downList = this.downQueue.filter(l=>{
                        return l !== data.level;
                    });
                    if(this.downQueue.length - downList.length) {
                        console.log(`stop now open remove ${data.level}`);
                        this.downQueue = downList;
                    } else {
                        console.log(`stop now will not open ${data.level}`);
                    }
                } else {

                }
                this.transition('running');
            },
            _onExit: function() {
                console.log('exit stop');
            }
        },
        // stopping: {
        //     _onEnter: function(){
        //         console.log('enter stopping');
        //     },
        //     reach: function(data){
        //         // 这里需要对stop进行判断，准确进入stop
        //     },
        //     _onExit: function() {
        //         console.log('exit stopping');
        //     }
        // },
        running: {
            _onEnter: function(){
                console.log('enter running');
            },
            reach: function(data){
                // 这里需要对stopping进行判断，及时进入stopping
                if(data.status === UP) {
                    const upList = this.upQueue.filter(l=>{
                        return l !== data.level;
                    });
                    if(this.upQueue.length - upList.length) {
                        console.log(`running now open remove ${data.level}`);
                        this.upQueue = upList;
                    } else {
                        console.log(`running now will not open ${data.level}`);
                    }
                } else if(data.status === DOWN) {
                    const downList = this.downQueue.filter(l=>{
                        return l !== data.level;
                    });
                    if(this.downQueue.length - downList.length) {
                        console.log(`running now open remove ${data.level}`);
                        this.downQueue = downList;
                    } else {
                        console.log(`running now will not open ${data.level}`);
                    }
                } else {

                }
            },
            _onExit: function() {
                console.log('exit running');
            }
        }
    }
} );

elevator.on('level', function(data)  {
    console.log('event level',data);
});

elevator.enQueue({level: 5, upDown: 1});
elevator.enQueue({level: 6, upDown: 1});
elevator.enQueue({level: 7, upDown: 1});
