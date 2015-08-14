'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.makeRouterDriver = makeRouterDriver;

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

var _router5 = require('router5');

// The set of valid sink functions includes synchronous state-affecting router functions that do not require a callback
// and which do not have a significant return value other than the router object itself.
var validSinkFuncs = ['add', 'addNode', 'canActivate', 'deregisterComponent', 'navigate', 'registerComponent', 'setOption', 'start', 'stop'];

function validateAndRemapSinkArgument(arg) {
  if (!arg || !arg.length) {
    return null;
  };
  if (typeof arg === 'string') {
    arg = [arg];
  } else if (!(arg instanceof Array)) {
    throw new Error('A Router5 sink argument should be a string or an array of arguments, starting with a function name');
  }
  if (validSinkFuncs.indexOf(arg[0]) === -1) {
    throw new Error('"' + arg[0] + '" is not the name of a valid sink function call for the Router5 driver');
  }
  if (typeof arg[arg.length - 1] === 'function') {
    throw new Error('Router5 invocations specifying callbacks should be made using the source (responses) object');
  }
  return arg;
}

function createStateChange$(router, fname, args) {
  return Rx.Observable.create(function (observer) {
    try {
      router[fname].apply(router, args.concat(function (toState, fromState) {
        observer.onNext({ toState: toState, fromState: fromState });
      }));
    } catch (e) {
      observer.onError(e);
    }
  });
}

function createDone$(router, fname, args) {
  return Rx.Observable.create(function (observer) {
    try {
      router[fname].apply(router, args.concat(function () {
        observer.onNext(true);
        observer.onCompleted();
      }));
    } catch (e) {
      observer.onError(e);
    }
  });
}

function makeRouterDriver(routes, options) {
  var router = new _router5.Router5(routes, options);

  var clickEventName = typeof document !== 'undefined' && document.ontouchstart ? 'touchstart' : 'click';
  var clickHandler = makeOnClick(options.base, options.useHash, function (path) {
    return router.matchPath(path);
  }, function (_ref) {
    var name = _ref.name;
    var params = _ref.params;
    return router.navigate(name, params);
  });

  document.addEventListener(clickEventName, clickHandler, false);

  // The request stream allows certain synchronous [compatible] methods to be called in the form ['funcName', ...args].
  return function (request$) {
    request$.map(validateAndRemapSinkArgument).subscribe(function (_ref2) {
      var _ref22 = _toArray(_ref2);

      var fname = _ref22[0];

      var args = _ref22.slice(1);

      router[fname].apply(router, args);
    }, function (err) {
      return console.error(err);
    });

    return {
      start: function start() {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        return createDone$(router, 'start', args);
      },
      addListener: function addListener() {
        for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }

        return createStateChange$(router, 'addListener', args);
      },
      addNodeListener: function addNodeListener() {
        for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          args[_key3] = arguments[_key3];
        }

        return createStateChange$(router, 'addNodeListener', args);
      },
      addRouteListener: function addRouteListener() {
        for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
          args[_key4] = arguments[_key4];
        }

        return createStateChange$(router, 'addRouteListener', args);
      },
      navigate: function navigate() {
        for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
          args[_key5] = arguments[_key5];
        }

        return createDone$(router, 'navigate', args);
      },
      matchPath: function matchPath() {
        for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
          args[_key6] = arguments[_key6];
        }

        return router.matchPath.apply(router, args);
      },
      buildUrl: function buildUrl() {
        for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
          args[_key7] = arguments[_key7];
        }

        return router.buildUrl.apply(router, args);
      },
      buildPath: function buildPath() {
        for (var _len8 = arguments.length, args = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
          args[_key8] = arguments[_key8];
        }

        return router.buildPath.apply(router, args);
      }
    };
  };
}

// The following is adapted from VisionMedia's page.js router
// https://github.com/visionmedia/page.js/blob/master/index.js

var makeOnClick = function makeOnClick(base, hashbang, match, callback) {
  /**
   * Event button.
   */
  function which(e) {
    e = e || window.event;
    return null === e.which ? e.button : e.which;
  }

  /**
   * Check if `href` is the same origin.
   */
  function sameOrigin(href) {
    var origin = location.protocol + '//' + location.hostname;
    if (location.port) origin += ':' + location.port;
    return href && 0 === href.indexOf(origin);
  }

  return function onclick(e) {

    if (1 !== which(e)) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (e.defaultPrevented) return;

    // ensure link
    var el = e.target;
    while (el && 'A' !== el.nodeName) el = el.parentNode;
    if (!el || 'A' !== el.nodeName) return;

    // Ignore if tag has
    // 1. "download" attribute
    // 2. rel="external" attribute
    if (el.hasAttribute('download') || el.getAttribute('rel') === 'external') return;

    // ensure non-hash for the same path
    var link = el.getAttribute('href');
    if (!hashbang && el.pathname === location.pathname && (el.hash || '#' === link)) return;

    // Check for unexpected protocols in the href, e.g. (mailto: or skype:)
    if (link && /^[a-z]+:/.test(link) && /^https?/.test(link)) return;

    // check target
    if (el.target) return;

    // x-origin
    if (!sameOrigin(el.href)) return;

    // rebuild path
    var path = el.pathname + el.search + (el.hash || '');

    // strip leading "/[drive letter]:" on NW.js on Windows
    if (typeof process !== 'undefined' && path.match(/^\/[a-zA-Z]:\//)) {
      path = path.replace(/^\/[a-zA-Z]:\//, '/');
    }

    var route = match(path);
    if (!route) return;

    e.preventDefault();

    callback(route);
  };
};