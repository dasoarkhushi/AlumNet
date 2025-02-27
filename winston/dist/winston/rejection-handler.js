/**
 * exception-handler.js: Object for handling uncaughtException events.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 */

'use strict';

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var os = require('os');
var asyncForEach = require('async/forEach');
var debug = require('@dabh/diagnostics')('winston:rejection');
var once = require('one-time');
var stackTrace = require('stack-trace');
var RejectionStream = require('./rejection-stream');

/**
 * Object for handling unhandledRejection events.
 * @type {RejectionHandler}
 */
module.exports = /*#__PURE__*/function () {
  /**
   * TODO: add contructor description
   * @param {!Logger} logger - TODO: add param description
   */
  function RejectionHandler(logger) {
    _classCallCheck(this, RejectionHandler);
    if (!logger) {
      throw new Error('Logger is required to handle rejections');
    }
    this.logger = logger;
    this.handlers = new Map();
  }

  /**
   * Handles `unhandledRejection` events for the current process by adding any
   * handlers passed in.
   * @returns {undefined}
   */
  return _createClass(RejectionHandler, [{
    key: "handle",
    value: function handle() {
      var _this = this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      args.forEach(function (arg) {
        if (Array.isArray(arg)) {
          return arg.forEach(function (handler) {
            return _this._addHandler(handler);
          });
        }
        _this._addHandler(arg);
      });
      if (!this.catcher) {
        this.catcher = this._unhandledRejection.bind(this);
        process.on('unhandledRejection', this.catcher);
      }
    }

    /**
     * Removes any handlers to `unhandledRejection` events for the current
     * process. This does not modify the state of the `this.handlers` set.
     * @returns {undefined}
     */
  }, {
    key: "unhandle",
    value: function unhandle() {
      var _this2 = this;
      if (this.catcher) {
        process.removeListener('unhandledRejection', this.catcher);
        this.catcher = false;
        Array.from(this.handlers.values()).forEach(function (wrapper) {
          return _this2.logger.unpipe(wrapper);
        });
      }
    }

    /**
     * TODO: add method description
     * @param {Error} err - Error to get information about.
     * @returns {mixed} - TODO: add return description.
     */
  }, {
    key: "getAllInfo",
    value: function getAllInfo(err) {
      var message = null;
      if (err) {
        message = typeof err === 'string' ? err : err.message;
      }
      return {
        error: err,
        // TODO (indexzero): how do we configure this?
        level: 'error',
        message: ["unhandledRejection: ".concat(message || '(no error message)'), err && err.stack || '  No stack trace'].join('\n'),
        stack: err && err.stack,
        rejection: true,
        date: new Date().toString(),
        process: this.getProcessInfo(),
        os: this.getOsInfo(),
        trace: this.getTrace(err)
      };
    }

    /**
     * Gets all relevant process information for the currently running process.
     * @returns {mixed} - TODO: add return description.
     */
  }, {
    key: "getProcessInfo",
    value: function getProcessInfo() {
      return {
        pid: process.pid,
        uid: process.getuid ? process.getuid() : null,
        gid: process.getgid ? process.getgid() : null,
        cwd: process.cwd(),
        execPath: process.execPath,
        version: process.version,
        argv: process.argv,
        memoryUsage: process.memoryUsage()
      };
    }

    /**
     * Gets all relevant OS information for the currently running process.
     * @returns {mixed} - TODO: add return description.
     */
  }, {
    key: "getOsInfo",
    value: function getOsInfo() {
      return {
        loadavg: os.loadavg(),
        uptime: os.uptime()
      };
    }

    /**
     * Gets a stack trace for the specified error.
     * @param {mixed} err - TODO: add param description.
     * @returns {mixed} - TODO: add return description.
     */
  }, {
    key: "getTrace",
    value: function getTrace(err) {
      var trace = err ? stackTrace.parse(err) : stackTrace.get();
      return trace.map(function (site) {
        return {
          column: site.getColumnNumber(),
          file: site.getFileName(),
          "function": site.getFunctionName(),
          line: site.getLineNumber(),
          method: site.getMethodName(),
          "native": site.isNative()
        };
      });
    }

    /**
     * Helper method to add a transport as an exception handler.
     * @param {Transport} handler - The transport to add as an exception handler.
     * @returns {void}
     */
  }, {
    key: "_addHandler",
    value: function _addHandler(handler) {
      if (!this.handlers.has(handler)) {
        handler.handleRejections = true;
        var wrapper = new RejectionStream(handler);
        this.handlers.set(handler, wrapper);
        this.logger.pipe(wrapper);
      }
    }

    /**
     * Logs all relevant information around the `err` and exits the current
     * process.
     * @param {Error} err - Error to handle
     * @returns {mixed} - TODO: add return description.
     * @private
     */
  }, {
    key: "_unhandledRejection",
    value: function _unhandledRejection(err) {
      var info = this.getAllInfo(err);
      var handlers = this._getRejectionHandlers();
      // Calculate if we should exit on this error
      var doExit = typeof this.logger.exitOnError === 'function' ? this.logger.exitOnError(err) : this.logger.exitOnError;
      var timeout;
      if (!handlers.length && doExit) {
        // eslint-disable-next-line no-console
        console.warn('winston: exitOnError cannot be true with no rejection handlers.');
        // eslint-disable-next-line no-console
        console.warn('winston: not exiting process.');
        doExit = false;
      }
      function gracefulExit() {
        debug('doExit', doExit);
        debug('process._exiting', process._exiting);
        if (doExit && !process._exiting) {
          // Remark: Currently ignoring any rejections from transports when
          // catching unhandled rejections.
          if (timeout) {
            clearTimeout(timeout);
          }
          // eslint-disable-next-line no-process-exit
          process.exit(1);
        }
      }
      if (!handlers || handlers.length === 0) {
        return process.nextTick(gracefulExit);
      }

      // Log to all transports attempting to listen for when they are completed.
      asyncForEach(handlers, function (handler, next) {
        var done = once(next);
        var transport = handler.transport || handler;

        // Debug wrapping so that we can inspect what's going on under the covers.
        function onDone(event) {
          return function () {
            debug(event);
            done();
          };
        }
        transport._ending = true;
        transport.once('finish', onDone('finished'));
        transport.once('error', onDone('error'));
      }, function () {
        return doExit && gracefulExit();
      });
      this.logger.log(info);

      // If exitOnError is true, then only allow the logging of exceptions to
      // take up to `3000ms`.
      if (doExit) {
        timeout = setTimeout(gracefulExit, 3000);
      }
    }

    /**
     * Returns the list of transports and exceptionHandlers for this instance.
     * @returns {Array} - List of transports and exceptionHandlers for this
     * instance.
     * @private
     */
  }, {
    key: "_getRejectionHandlers",
    value: function _getRejectionHandlers() {
      // Remark (indexzero): since `logger.transports` returns all of the pipes
      // from the _readableState of the stream we actually get the join of the
      // explicit handlers and the implicit transports with
      // `handleRejections: true`
      return this.logger.transports.filter(function (wrap) {
        var transport = wrap.transport || wrap;
        return transport.handleRejections;
      });
    }
  }]);
}();