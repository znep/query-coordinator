# i18n (Internationalization) module

This module helps us localize content in both Ruby and JS and has two main functions:
* provide shared React components or a basic I18n object to use in our JS code
* store localized strings that are shared across applications within platform-ui and used in both Ruby and JS

## How this works with Rails
We currently have two main Rails applications - the main [Frontend](https://github.com/socrata/platform-ui/tree/master/frontend) app,
and [Storyteller](https://github.com/socrata/platform-ui/tree/master/storyteller). Each application follows the [typical Rails I18n convention](http://guides.rubyonrails.org/i18n.html#setup-the-rails-application-for-internationalization) by storing their set of localized
strings within their respective `/config/locales/` directories.

By default, each app will load the `.yml` files in `/config/locales/` and make those strings availabile via the `I18n` gem.

In addition to loading the strings for each app, we have added `/common/i18n/locales/` to the `config.i18n.load_path` to both
Frontend and Storyteller so that we will also have access to the 'shared' strings that are common to both applications.

### Note about namespacing
We should remain diligent about properly namespacing our `.yml` keys since they can overwrite
each other when combined. The strings in `/common/i18n/locales` will all be prefixed with `common`, so as long as we don't use a `common` as a top
level key in other apps, we should be fine.

## How this works with JS / React
In general, we are still relying on Rails to load the locale strings, and utilize Rails helpers to put the translations on the browser window object
on `window.translations`. Once the translations are on the window, we have two main ways to get access to I18n functionality.

### 1) Directly using `import I18n from 'common/i18n'`
If you're not in a React context, you can import the common `I18n` module directly, which will load the available translations on `window.translations`
and expose an `I18n.js` object which you can use like: `I18n.t('path.to.string.here')`. You'll also have access to any other method on `I18nJS` which you can
[read more about here](https://github.com/fnando/i18n-js).

### 2) Using the React `<Localization>` HOC (higher-order-component)
If you are in a React context, you can wrap the entrypoint to the app like this:

```js
import Localization from 'common/i18n/components/Localization';

ReactDOM.render(
  <Localization
    translations={translations}
    locale={serverConfig.locale || 'en'}>
    <Provider store={store}>
      <App />
    </Provider>
  </Localization>,
  document.querySelector('#my-landing-page')
);
```

And in components where you want access to translations:

```js
import connectLocalization from 'common/i18n/components/connectLocalization';

const MyComponent = (props) => {
  var { I18n } = props; // <-- I18n available here!

  return (
    <h1>{I18n.t('path.to.string')}</h1>
  )
}

export default connectLocalization(connect(mapStateToProps)(MyComponent)); // <-- what actually makes I18n available via context
```

## Updating Locale strings
To manually push new locale strings in `/common/i18n/locales` up to LocaleApp, you can use `/platform-ui/bin/push_locale`.
This ruby script accepts 2 command line arguments - a project name (frontend, storyteller, common), and an API key for that project (found in LastPass).
So if you have updates to `/common/i18n/locales/en.yml` and would like to push them up to LocaleApp, the command would look something like:

```
$ cd platform-ui/
$ bin/push_locale common <LOCALEAPP_COMMON_API_KEY>
```
