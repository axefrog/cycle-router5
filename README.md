# Cycle Router5 Driver

A source/sink router driver for [Cycle.js](http://cycle.js.org), based on [router5](http://router5.github.io/).

See the router5 documentation to learn how router5 works. See the Cycle.js documentation to learn how Cycle and its driver system works.

**Note:** I have adapted some of the code from [Visionmedia's page.js router](https://github.com/visionmedia/page.js) to handle automatic intercepting of link clicks. When a link is clicked, a number of verifications are initially performed to validate that the link matches a registered route. If so, the action is cancelled and router5 is called upon to enact the route transition. If no route is matched, the click resolves normally. If this behaviour causes problems for you, please open an issue and I'll add some additional code to make this behaviour optional. Alternatively, feel free to submit a pull request.

## Installation

```
npm install cycle-router5
```

## Usage:

The following router5 methods can be called from the exposed driver object, i.e. via the `responses` object. Those methods which take a callback instead have the callback wrapped up inside
the returned observable stream.

* start
* addListener
* addNodeListener
* addRouteListener
* navigate
* matchPath
* buildUrl
* buildPath

Router5 methods which are side-effectful (causing a state change in the router) and would normally only return the router5 object itself, or where the callback is optional, can be called by wrapping the name of the method, along with its arguments, in an array, and returning the array as a request to the driver. The following methods are exposed in this way:

* add
* addNode
* canActivate
* deregisterComponent
* navigate
* registerComponent
* setOption
* start
* stop

## Example

```js
import {makeRouterDriver} from 'cycle-router5';

const drivers = {
  router: makeRouterDriver(),
  // ... other cycle drivers here
}

// from your main function:

function main(responses) {

  // the following would likely be used within your intents function as you build your main view
  responses.router.addListener().map(...) // respond to route changes
  
  return {
    router: Rx.Observable.from('start') // or e.g. ['addNode', 'users', '/users']
  }
}
```