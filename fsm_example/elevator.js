
// node.js/CommonJS:
const machina = require('machina');
const IDLE = 'IDLE';
const UP = 'UP';
const DOWN = 'DOWN';
const TOP = 30;
const BOTTOM = 1;
const readline = require('readline');


const elevator = new machina.Fsm( {
    upQueue: [], // ASC
    downQueue: [], // DESC
    curLevel: 1,
    timer: null,
    top: TOP,
    bottom: BOTTOM,
    initialize: function( options ) {
        // 设置好timer
        // 每一秒检查一下是否需要动作，同时更新reach事件
        this.timer = setInterval(()=>{
            // console.log(`timer`);
            this.handle('reach', {level: this.curLevel});
            return;
        }, 1000);
    },
    close: function() {
        this.clearInterval(this.timer);
        console.log('close');
        this.upQueue = [];
        this.downQueue = [];
        this.curLevel = 1;
        this.transition(IDLE);
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
        // 根据意愿入队！！！
        console.log(`enqueue:upDown:${upDown};this.curLevel:${this.curLevel};level:${level}`);
        if(upDown && this.curLevel > level){
            this._enDownQueue(level);
        } else if(upDown && this.curLevel < level){
            this._enUpQueue(level);
        } else if(!upDown && this.curLevel > level) {
            this._enDownQueue(level);
        } else if(!upDown && this.curLevel < level) {
            this._enUpQueue(level);
        } else {
            // 其他是curLevel===level
        }
        // 等待时间的到来
        // this.handle('reach');
    },
    reach: function() {
        this.handle('reach');
    },
    checkIDLE: function() {
        return !this.upQueue.length && !this.downQueue.length;
    },
    namespace: "elevator",
    initialState: IDLE,
    // 对于reach事件，需要处理掉queue里面全部符合要求的level.
    states: {
        IDLE: {
            _onEnter: function(){
                console.log('enter IDLE');
            },
            reach: function(data){
                // 优先up
                if(this.upQueue.length) {
                    this.transition(UP);
                } else if(this.downQueue.length) {
                    this.transition(DOWN);
                } else {
                    // 原封不动
                }
            },
            _onExit: function() {
                console.log('exit IDLE');
            }
        },
        UP: {
            _onEnter: function(){
                console.log('enter UP');
            },
            reach: function(data){
                if(this.curLevel!==this.top) {
                    this.curLevel++;
                }
                // 判断是否需要删除已经到达的楼层，
                // 如果没有接下来的楼层的话，那么，不会继续了
                const upList = this.upQueue.filter(l=>{
                    return l !== this.curLevel;
                });
                console.log(`${this.curLevel};${this.upQueue.toString()};${this.downQueue.toString()};up remove current level : ${this.upQueue.length - upList.length}`);
                this.emit('level', {level: this.curLevel});
                const next = this.upQueue.find(l=>{
                    return l>this.curLevel;
                });
                this.upQueue = upList;
                if(next) {
                    // 继续保持up
                } else if(this.downQueue.length){
                    console.log(`${this.curLevel};up->down:${this.upQueue.toString()};${this.downQueue.toString()}`);
                    this.transition(DOWN);
                } else {
                    console.log(`${this.curLevel};up->idle:${this.upQueue.toString()};${this.downQueue.toString()}`);
                    this.transition(IDLE);
                }
            },
            _onExit: function() {
                console.log('exit UP');
            }
        },
        DOWN: {
            _onEnter: function(){
                console.log('enter DOWN');
            },
            reach: function(data){
                if(this.curLevel!==this.bottom) {
                    this.curLevel--;
                }
                // 判断是否需要删除已经到达的楼层，
                // 如果没有接下来的楼层的话，那么，不会继续了
                const downList = this.downQueue.filter(l=>{
                    return l !== this.curLevel;
                });
                console.log(`${this.curLevel};${this.upQueue.toString()};${this.downQueue.toString()};down remove current level : ${this.downQueue.length - downList.length}`);
                this.emit('level', {level: this.curLevel});
                const next = this.downQueue.find(l=>{
                    return l<this.curLevel;
                });
                this.downQueue = downList;
                if(next) {
                    // 继续保持up
                } else if(this.upQueue.length){
                    console.log(`${this.curLevel};down->up:${this.upQueue.toString()};${this.downQueue.toString()}`);
                    this.transition(UP);
                } else {
                    console.log(`${this.curLevel};down->idle:${this.upQueue.toString()};${this.downQueue.toString()}`);
                    this.transition(IDLE);
                }
            },
            _onExit: function() {
                console.log('exit DOWN');
            }
        }
    }
} );

elevator.on('level', function(data)  {
    console.log('event level',data);
    // 在5楼之后，点击下去3楼的操作
    // if(data.level===5) {
    //     elevator.enQueue({level: 3, upDown: 1});
    // }
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '请输入 level[1,30] upDown[0,1]> '
});
  
rl.prompt();

rl.on('line', (line) => {
    const input = line.trim().split(' ');
    if(input.length === 2) {
        elevator.enQueue({level: Number(input[0]), upDown: Number(input[1])});
    } else {
        console.log(`error input:${input.toString()}`);
    }
    rl.prompt();
}).on('close', () => {
    console.log('再见!');
    process.exit(0);
});

// elevator.enQueue({level: 5, upDown: 1});
// elevator.enQueue({level: 6, upDown: 1});
// elevator.enQueue({level: 7, upDown: 1});
