import {Router5} from 'router5';
import Rx from 'rx';

// The set of valid sink functions includes synchronous state-affecting router functions that do not require a callback
// and which do not have a significant return value other than the router object itself.
const validSinkFuncs = ['add','addNode','canActivate','deregisterComponent','navigate','registerComponent','setOption','start','stop'];

function validateAndRemapSinkArgument(arg) {
  if(!arg || !arg.length) {
    return null;
  };
  if(typeof arg === 'string') {
    arg = [arg];
  }
  else if(!(arg instanceof Array)) {
    throw new Error('A Router5 sink argument should be a string or an array of arguments, starting with a function name');
  }
  if(validSinkFuncs.indexOf(arg[0]) === -1) {
    throw new Error(`"${arg[0]}" is not the name of a valid sink function call for the Router5 driver`);
  }
  if(typeof arg[arg.length - 1] === 'function') {
    throw new Error('Router5 invocations specifying callbacks should be made using the source (responses) object');
  }
  return arg;
}

function createStateChange$(router, fname, args) {
  return Rx.Observable.create(observer => {
    try {
      router[fname].apply(router, args.concat((toState, fromState) => {
        observer.onNext({ toState, fromState });
      }));
    }
    catch(e) {
      observer.onError(e);
    }
  });
}

function createDone$(router, fname, args) {
  return Rx.Observable.create(observer => {
    try {
      router[fname].apply(router, args.concat(() => {
        observer.onNext(true);
        observer.onCompleted();
      }));
    }
    catch(e) {
      observer.onError(e);
    }
  });
}

function makeRouterDriver(routes, options) {
  let router = new Router5(routes, options);

  if(!options || !options.disableClickHandler) {
    var clickEventName = (typeof document !== 'undefined') && document.ontouchstart ? 'touchstart' : 'click';
    var clickHandler = makeOnClick(options.base, options.useHash,
      path => router.matchPath(path),
      ({name, params}) => router.navigate(name, params)
    );
    document.addEventListener(clickEventName, clickHandler, false);
  }
  
  // The request stream allows certain synchronous [compatible] methods to be called in the form ['funcName', ...args].
  return function(request$) {
    request$
      .map(validateAndRemapSinkArgument)
      .subscribe(
        ([fname, ...args]) => { router[fname].apply(router, args); },
        err => console.error(err)
      );

    return {
      start: (...args) => createDone$(router, 'start', args),
      addListener: (...args) => createStateChange$(router, 'addListener', args),
      addNodeListener: (...args) => createStateChange$(router, 'addNodeListener', args),
      addRouteListener: (...args) => createStateChange$(router, 'addRouteListener', args),
      areStatesDescendants: (...args) => router.areStatesDescendants.apply(router, args),
      navigate: (...args) => createDone$(router, 'navigate', args),
      matchPath: (...args) => router.matchPath.apply(router, args),
      buildUrl: (...args) => router.buildUrl.apply(router, args),
      buildPath: (...args) => router.buildPath.apply(router, args),
    };
  }
}

// The following is adapted from VisionMedia's page.js router
// https://github.com/visionmedia/page.js/blob/master/index.js

var makeOnClick = function(base, hashbang, match, callback) {
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
    return (href && (0 === href.indexOf(origin)));
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
    if(!route) return;

    e.preventDefault();
    
    callback(route);
  }

};

export default {
  makeRouterDriver
};