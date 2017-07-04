# i18n (Internationalization) module

This module helps us localize content in both Ruby and JS and has two main functions:
* provide shared React components or a basic I18n object to use in our JS code
* store localized strings that are shared across applications within platform-ui and used in both Ruby and JS

## How this works with Rails
We currently have two main Rails applications - the main [Frontend](https://github.com/socrata/platform-ui/tree/master/frontend) app,
and [Storyteller](https://github.com/socrata/platform-ui/tree/master/storyteller). Each application follows the [typical Rails I18n convention](http://guides.rubyonrails.org/i18n.html#setup-the-rails-application-for-internationalization) by storing their set of localized
strings within their respective `/config/locales/` directories.

By default, each app will load the `.yml` files in `/config/locales/` and make those strings availabile via the `I18n` gem.

In addition to loading the strings for each app, we have added `/common/i18n/config/locales/` to the `config.i18n.load_path` to both
Frontend and Storyteller so that we will also have access to the 'shared' strings that are common to both applications.

### Note about namespacing
We should remain diligent about properly namespacing our `.yml` keys since they can overwrite
each other when combined. The strings in `/common/i18n/config/locales` will all be prefixed with `'shared'`, so as long as we don't use a `'shared'` as a top
level key in other apps, we should be fine.

## How this works with JS / React
In general, we are still relying on Rails to load the locale strings, and utilize Rails helpers to put the translations on the browser window object
on `window.translations`. Once the translations are on the window, we have two main ways to get access to I18n functionality.

### 1) Directly using `import I18n from 'common/i18n'`
If you are not in a React context, you can import the common `I18n` module directly, which will load the available translations on `window.translations`
and expose an `I18n.js` object which you can use like: `I18n.t('path.to.string.here')`. You will also have access to any other method on `I18n.js` which you can
[read more about here](https://github.com/fnando/i18n-js).

### 2) Using the React `<Localization>` HOC (higher-order-component)
If you are in a React context, you can wrap the entry point to the app like this:

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
To manually push new locale strings in `/common/i18n/config/locales` up to LocaleApp, you can use `/platform-ui/bin/push_locale`.
This ruby script accepts 2 command line arguments - a project name (frontend, storyteller, common), and an API key for that project (found in LastPass).
So if you have updates to `/common/i18n/config/locales/en.yml` and would like to push them up to LocaleApp, the command would look something like:

```
$ cd platform-ui/
$ bin/push_locale common <LOCALEAPP_COMMON_API_KEY>
```

You can read more about updating translations [here](https://github.com/socrata/platform-ui/blob/master/frontend/doc/update-translations.md)

## How does pluralization work?

Internationalized pluralization requires some knowledge of the different rules found in different languages. For example, Chinese does not mutate its words for different plural values (it is [transnumeral](https://en.wikipedia.org/wiki/Grammatical_number#Transnumeral)), whereas English generally uses one word for `1` ("singular form") but another word for every other number, and Romanian will translate "1 path" (singular) differently from "2 paths" (paucal) differently from "20 paths". The formalization of these variations is maintained and institutionalized by Unicode's [Common Locale Data Repository](http://cldr.unicode.org/index) as [supplemental data for plurals](http://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html). This data is interpreted according to a specification in the Unicode Technical Standard #35 (version as of this writing: 31-47, 2017-03-15) under Part 3, Section 5 (Language Plural Rules).

Our usage of the CLDR is done in `common/i18n/pluralization.js`. It reads directly from the CLDR data in [`cldr-core`](https://github.com/unicode-cldr/cldr-core) (an official JSON distribution) and uses the [CLDRPluralRuleParser](https://github.com/santhoshtr/CLDRPluralRuleParser) to parse those rules to determine which sub-key a particular count-translation combination correctly fits. The parser returns an array of admissible categories (the categories are not exclusive), and I18n-js will select the first admissible category for which a translation exists. (`other` should always exist.)

Note: It is not true that the names of the plural categories are an accurate mapping of number to category; it is best to rely on an actual human translator to determine which categories are most appropriate for a given translation. For instance, while every category is _available_ for every translation in Arabic, not every word has six different forms to use with different numbers. (E.g., "99 paths" uses the same translation for "paths" as "100 paths", even though the CLDR rules anticipate that `99` and `100` will have different translations.)

You should generally need to concern yourself with only two things: (1) correctly passing the `count` variable through to the translator using `I18n.t('some.translation', { count: 3 })`, and (2) choosing strings for translation that mutate only with respect to one number at most. So, "There are 4 lights" is a good string, but "1 man spoke to 3 people" is a bad string if both numbers matter; in the latter case, you should take it back to product and ask them to come up with a different sentence, because this situation is quite rare.
