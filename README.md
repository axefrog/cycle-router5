# Cycle Router5 Driver

A source/sink router driver for [Cycle.js](http://cycle.js.org), based on [router5](http://router5.github.io/).

See the router5 documentation to learn how router5 works. See the Cycle.js documentation to learn how Cycle and its driver system works.

## Installation

```text
npm install --save cycle-router5
```

## Usage:

### Construction

Create a router driver like this:

```js
var drivers = {
  DOM: makeDOMDriver(...),
  router: makeRouterDriver(...)
}
```

You can pass the same arguments to `makeRouterDriver` as you would to the [router5 constructor](http://router5.github.io/docs/api-reference.html).

### Click Handler

I have adapted some of the code from [Visionmedia's page.js router](https://github.com/visionmedia/page.js) to handle automatic intercepting of link clicks. When a link is clicked, a number of verifications are initially performed to validate that the link matches a registered route. If so, the action is cancelled and router5 is called upon to enact the route transition. If no route is matched, the click resolves normally.

If you wish to handle this behaviour, you can pass the option `disableClickHandler` with the router5 options object when creating the driver, like so:

```js
var drivers = {
  DOM: makeDOMDriver(...),
  router: makeRouterDriver(yourRoutes, {
    disableClickHandler: true,
    // router5 options here
  })
}
```

### Making Calls

In order to play nicely with Cycle.js, the router5 API methods have been divided into two groups; (1) those that cause an instant side effect and just generally return the router5 instance itself, and (2) those that either (a) return a value synchronously without side effects or (b) cause a side effect and take a callback argument.

Methods in group (1) must be called via the "sink" side of the driver. That is, to make such a call, construct your call as an array of arguments, with the first argument being the name of the function to call, and the subsequent arguments being those that you'd like to pass to the function when calling it. If you're not passing any arguments, you can just emit a string instead of an array.

This works just like Cycle's DOM driver works, in that you hook up an event stream to pass out to the driver, and then pass function calls out the event stream as needed.

## Rough Example (for illustration purposes only)

```js
import {makeRouterDriver} from 'cycle-router5';

function intent(sources) {
  return {
    clickStart$: sources.dom.get('.start-button', 'click'),
    routeChange$: sources.router.addListener()
  };
}

function model(actions) {
  return actions.clickStart$
    .startWith(null)
    .map(ev => {
      return {
        started: !!ev
      };
    });
}

function view(model$) {
  return model$.map(model => {
    return h('p', [
      model.started ? 'Router starting now.' : 'Router not started yet.',
      h('br'),
      h('button', { className: 'start-button' }, 'Start Router')
      h('br')
    ]);
  });
}

function routing(actions) {
  return actions.clickStart$
    .map(ev => 'start'); // could also be ['start'] or ['start', arg1, ...]
}

function main(sources) {
  var actions = intent(sources);
  return {
    DOM: view(model(actions)),
    router: routing(actions)
  };
}

var routes = [
  { name: 'home', path: '/' }
];

var routerOptions = {
  disableClickHandler: false // obviously you could omit this if false
  // other router5 constructor options go here
};

var [sources, sinks] = Cycle.run(main, {
  DOM: makeDOMDriver('#app'),
  router: makeRouterDriver(routes, routerOptions)
});
```

### API

The following router5 methods can be called from the exposed driver object, i.e. via the `sources.router` object in my example. Those methods which take a callback instead have the callback wrapped up inside the returned observable stream.

* start
* addListener
* addNodeListener
* addRouteListener
* navigate
* matchPath
* buildUrl
* buildPath

Router5 methods which are side-effectful (causing a state change in the router) and would normally only return the router5 object itself, or where the callback is optional, can be called by wrapping the name of the method, along with its arguments, in an array, and returning the array as a request to the driver, as per the `return` statement for the `main` function in the example above. The following methods are exposed in this way:

* add
* addNode
* canActivate
* deregisterComponent
* navigate
* registerComponent
* setOption
* start
* stop

Please see the [router5 documentation](http://router5.github.io/) for full API details.
