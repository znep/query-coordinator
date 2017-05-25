# AirbrakeJS Wrapper
This module is a wrapper around AirbrakeJS and exposes the following methods:

* [init(projectId, projectKey)](#init)
* [notify(payload)](#notify)
* [addFilter(filterFunction)](#addFilter)

## Getting Started

1. Make sure you have `airbrakeProjectId` and `airbrakeKey` for your team/project and that they are set:
* as environment variables via [apps-marathon](https://github.com/socrata/apps-marathon/blob/master/resources/frontend.json)
* on the `window.serverConfig` object with a Rails helper [example here](https://github.com/socrata/platform-ui/blob/master/frontend/app/helpers/admin_helper.rb#L171)
* as properties in [AppConfig](https://github.com/socrata/platform-ui/blob/master/frontend/lib/app_config.rb#L70)

2. Then wherever the entrypoint is for your app:

```js
import airbrake from 'common/airbrake'

if (window.serverConfig.environment !== 'development') {
  airbrake.init(window.serverConfig.airbrakeProjectId, window.serverConfig.airbrakeKey);
}

airbrake.notify({
  error: 'Your custom error message here',
  context: { component: 'FileUpload' } // provide useful information here about where the error occurred
});
```

## Custom Filters
Filters are a great way to either ignore a particular set of errors under certain conditions (for example we [ignore all errors from < IE11](https://github.com/socrata/platform-ui/blob/master/common/airbrake/filters/ie.js)) or alternatively decorate all the errors in your instance of Airbrake to provide more contextual information (we add environment information to the context object [here](https://github.com/socrata/platform-ui/blob/master/common/airbrake/filters/environment.js)). Read more about Airbrake filters in the [AirbrakeJS docs](https://github.com/airbrake/airbrake-js#filtering-errors)

Filters are simply functions that receive a `notice` argument and either return `null` (to ignore) or the `notice` itself (to pass through).

If you'd like to define a new custom filter, place it in `common/airbrake/filters` using the following naming convention:

```js
// common/airbrake/filters/ignore_firefox.js <-- snake_case filename

export default function ignoreFirefoxFilter(notice) { // camelCase + 'Filter'
  const browser = _.get(notice, 'context.userAgentInfo.browserName');

  if (browser === 'Firefox') {
    return null;
  }

  return notice;
}
```

## API

### init
`airbrake.init(projectId [String], projectKey [String])`

Creates a new instance of `AirbrakeJS`. This would typically be called within the entrypoint of your module or application. When you `import airbrake from 'common/airbrake'` in other parts of your module, and invoke methods such as `airbrake.notify()` or `airbrake.addFilter()`, we will reach for the already initialized instance and complain that `'Airbrake not initialized.'` if no instance is found.


### notify
`airbrake.notify(payload [Object])`

A basic wrapper around AirbrakeJS's `notify` method that also logs the error to the console. See the [documentation here](https://github.com/airbrake/airbrake-js#notice-annotations) for what can be included in the `payload` object.

### addFilter
`airbrake.addFilter(noticeCallback [function])`

Wraps AirbrakeJS's [`addFilter` method](https://github.com/airbrake/airbrake-js#filtering-errors). Doesn't do anything special.
