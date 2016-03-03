/**
 * 抄了一个Promise / A+的实现，来学习改进下，顺便加下注释
 */

(function (global) {

    // status
    var PENDING = 0,
        RESOLVED = 1,
        REJECTED = 2;

    var Promise = function (fun) {

        if(typeof fun !== 'function') {
            throw 'Promise resolver undefined is not a function';
            return;
        }

        // 缓存一下resolve和reject
        var me = this,
            resolve = function (val) {
                me.resolve(val);
            },
            reject = function (val) {
                me.reject(val);
            }
        
        me._status = PENDING;   // 初始状态为未完成状态
        me._onResolved = [];    // 已完成回调保存队列
        me._onRejected = [];    // 已失败回调保存队列

        fun(resolve, reject);   // 执行初始操作函数，完成会调用resolve，失败会调用reject
    }

    /**
     * 添加Promise的原型链函数
     * @type {Function}
     */
    var fn = Promise.prototype;

    /**
     * then函数的成功回调和失败回调，用于订阅Promise对象状态转换事件
     * @param  {[type]} onResolved [description]
     * @param  {[type]} onRejected [description]
     * @return {[type]}            [description]
     */
    fn.then = function (onResolved, onRejected) {
        var self = this;

        return new Promise(function (resolve, reject) {
            var onResolvedWraper = function (val) {
                var ret = onResolved ? onResolved(val) : val;
                if (Promise.isPromise(ret)) {
                    ret.then(function (val) {
                        resolve(val);
                    });
                }
                else {
                    resolve(ret);
                }
            };
            var onRejectedWraper = function (val) {
                var ret = onRejected ? onRejected(val) : val;
                reject(ret);
            };

            self._onResolved.push(onResolvedWraper);
            self._onRejected.push(onRejectedWraper);

            // 成功则调用成功函数
            if (self._status === RESOLVED) {
                onResolvedWraper(self._value);
            }

            // 失败则调用失败函数
            if (self._status === REJECTED) {
                onRejectedWraper(self._value);
            }
        });
    }

    /**
     * 仅对失败情况进行操作
     * @param  {[type]} onRejected [description]
     * @return {[type]}            [description]
     */
    fn.catch = function (onRejected) {
        return this.then(null, onRejected);
    }

    /**
     * 内部声明操作完成，并将转态转为resolved，执行成功回调
     * @param  {[type]} val [description]
     * @return {[type]}     [description]
     */
    fn.resolve = function (val) {
        if (this._status === PENDING) {
            this._status = RESOLVED;
            this._value = val;
            for (var i = 0, len = this._onResolved.length; i < len; i++) {
                this._onResolved[i](val);
            }
        }
    }

    /**
     * 内部声明操作失败，并将转态转为rejected，，执行失败回调
     * @param  {[type]} val [description]
     * @return {[type]}     [description]
     */
    fn.reject = function (val) {
        if (this._status === PENDING) {
            this._status = REJECTED;
            this._value = val;
            for (var i = 0, len = this._onRejected.length; i < len; i++) {
                this._onRejected[i](val);
            }
        }
    }

    /**
     * 外部方法同时处理多个Promise，当array中所有Promise实例的状态均为resolved时，该方法返回的Promise对象的状态也转为resolved，否则转换为rejected。
     * @param  {[type]} arr [description]
     * @return {[type]}     [description]
     */
    Promise.all = function (arr) {
        return Promise(function (resolve, reject) {
            var len = arr.length,
                i = -1,
                count = 0,
                results = [];
            while (++i < len) {
                ~function (i) {
                    arr[i].then(
                        function (val) {
                            results[i] = val;
                            if (++count === len) {
                                resolve(results);
                            }
                        },
                        function (val) {
                            reject(val);
                        }
                    );
                }(i);
            }
        });
    }

    /**
     * 外部方法同时处理多个Promise。当array中所有Promise实例的状态出现fulfilled时，该方法返回的Promise对象的状态也转为fulfilled，否则转换为rejected。Promise.race 和 Promise.all 相类似的方法。不同的是只要该数组中的 Promise对象的状态发生变化（无论是 resolve 还是 reject）该方法都会返回。
     * @param  {[type]} arr [description]
     * @return {[type]}     [description]
     */
    Promise.race = function (arr) {
        return new Promise(function (resolve, reject) {
            var len = arr.length,
                i = -1;
            while (++i < len) {
                arr[i].then(
                    function (val) {
                        resolve(val);
                    },
                    function (val) {
                        reject(val);
                    }
                );
            }
        });
    }

    /**
     * 外部方法，用于将非Promise类型的入参封装为resolved的Promise对象
     * @param  {[type]} obj [description]
     * @return {[type]}     [description]
     */
    Promise.resolve = function (obj) {
        if (Promise.isPromise(obj)) {
            return obj;
        }
        return new Promise(function (resolve) {
            resolve();
        });
    }

    /**
     * 外部方法，用于将非Promise类型的入参封装为状态为rejected的Promise对象。
     * @param  {[type]} obj [description]
     * @return {[type]}     [description]
     */
    Promise.reject = function (obj) {
        if (Promise.isPromise(obj)) {
            return obj;
        }
        return new Promise(function (resolve, reject) {
            reject();
        });
    }

    /**
     * 外部方法判断是否为Promise
     * @param  {[type]}  obj [description]
     * @return {Boolean}     [description]
     */
    Promise.isPromise = function (obj) {
        return obj instanceof Promise;
    }

    global.Promise = global.Promise || Promise;

    try{
        module.exports = Promise;
    }
    catch (e){}

})(this);