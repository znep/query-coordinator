# How to update translations

LocaleApp manages all the localized translations, so:
> _"Please please please do not edit locale .yml files directly in the repo apart from en.yml!"_ — Clint Tseng

## LocaleApp

If you need to update translations, they must be kept in sync with LocaleApp.

Sign in to [https://www.localeapp.com/projects/5484](https://www.localeapp.com/projects/5484)

Use the `localizations-l@socrata.com` account found in [LastPass](https://lastpass.com/?&ac=1&lpnorefresh=1&fromwebsite=1&newvault=1&nk=1).

The LocaleApp includes the following important sections in the main menu:

* Dashboard — an overview of translation status
* Translations — a visual navigator for viewing translations
* Imports — a file uploader for translations
* Downloads — a batch download for translations

## Getting Started

We use the `localeapp` gem to interact with the LocaleApp service. If you've yet to
do so, you'll need to run:

      gem install localeapp

In order to use the `localeapp` gem, you need to configure the gem to use the api
key. The simplest way to do this is to run the `bin/setup_environment.sh` script.
When you're prompted for the LocaleApp api key, paste the key from the _LocaleApp_
entry in LastPass. This adds the key to `.env`.

Should you decide to manually configure the api key, add an entry to `.env` that
looks like:

    LOCALEAPP_API_KEY=<API KEY>

From a clean branch run:

    localeapp pull

This will pull down the latest locales to `config/locales`.

## Updating English localizations

Upating localizations will have a varying set of steps depending on the type of update you are making. We cover 6 types of updates here:

 1. Adding a new key/value pair
 2. Removing a key/value pair
 3. Updating only the key of a key/value pair
 4. Updating only the value of a key/value pair
 5. Updating both the key and value of a key/value pair
 6. Moving a key/value pair

### Adding a new key/value pair

This is the simplest case and only requires one step:

1. add the new key/value pair into en.yml and commit the change

To make finding keys easier, we try to keep the keys alphabetized, but this isn't necessary.

Once the code is merged and a build is started on the build server, the latest `en.yml` is pushed to LocaleApp, creating the new keys in all the languages.

LocaleApp will add the new keys and recognize that they're absent from our
non-English files, prompting the translators to fill in the missing keys the next time we pay for their services.

### Removing a key/value pair

Removing a k/v pair requires two steps:

1. remove the key/value pair from en.yml and commit the change
2. after your change is deployed to fedramp, delete the key from LocaleApp. To do so, use the Translations section of the app and drill down to the appropriate namespace; look for the gear-dropdown icon at the far right of the row containing the key to be removed, and select Delete. **There is no confirm dialog**, so double-check before you click!

Keys cannot be removed through the Imports section or by pushing with the script, even if you have deleted the key in the uploaded file, because the import process is purely additive, so please just follow the 2 steps above.

### Updating only the key of a key/value pair

Updating the key (and not the associated text value) involves 3 steps:

1. change the key in the en.yml and commit the change
2. (optional) after the change is committed to master and the build has succeeded, you will find both the new and old k/v pairs in LocaleApp. If you want to save us some money and translations, you can now copy over the translations from the old key into the new key. To do so, use the Translations section of the app and drill down to the appropriate namespace of the old key; copy the existing translations somewhere, then drill down to the namespace of the new key and add those translations.
3. after your change is deployed to fedramp, delete the old key from LocaleApp. If you are unfamiliar with how to do that see [removing a key/value pair](#removing-a-keyvalue-pair)

### Updating only the value of a key/value pair

Updating the text value (and not the key) involves 2 steps:

1. change the text value in en.yml and commit the change
2. after the change is committed to master and the build has succeeded, invalidate the old translations. You'll want to do this so that the app re-reads the new text and supplies us with new translations. To do so, use the Translations section of the app and drill down to the appropriate namespace of the key whose text you've changed; using the drop-down on the far right, choose "Mark as incomplete" for each non-English translation.

### Updating both the key and value of a key/value pair

This is synonymous with [adding a new key/value pair](#adding-a-new-keyvalue-pair) and [removing a key/value pair](#removing-a-keyvalue-pair).

### Moving a key/value pair

In many cases, moving a key/value is synonymous with [updating only the key of a key/value pair](#updating-only-the-key-of-a-keyvalue-pair). One notable exception is if in so doing, you have made an existing key (with an existing value) into a parent key with no value. This will break the build. Rather than do this, make a parent key under an alternate name.

### Warnings and Errors

Pay attention to the results from importing a translation file — entries that raise warnings will not import, so they
should usually be fixed and re-uploaded. Common warnings:

* _can't have the 'other' pluralization added to it because it is not a pluralized namespace_ — don't use `other` as a
key, because this triggers special translation functionality.

* _can't be a descendant of an existing translation_ — if you're converting an existing translation key so that it is
a namespace (contains subkeys), you need to [delete the existing translation key](#removing-a-keyvalue-pair) in Locale first.

* _can't create a key that is being used as a namespace_ — the inverse of the previous warning, [delete](#removing-a-keyvalue-pair) the subkeys if
you want to convert a namespace to a single key.

* _must use the same variables as the default locale_ — this seems to stem from translators not preserving HTML
snippets embedded in translations.

Other gotchas for translations:

* Text in the YAML file needs to be quoted if it contains a colon.

* The YAML conversion may coerce `true` and `false` to booleans instead of text. We should be safe from the effects of
this because we run everything through `to_s` in `LocaleCache::load!`.

## Updating foreign translations

Use LocaleApp to update the appropriate translations. The latest translations will be pulled down and included in the build at build time.

To pull the foreign translations onto your local machine:

    bin/pull_translations

## See also
* `config/locales`
* [Socrata Localization Guide](https://docs.google.com/a/socrata.com/document/d/1PhGf6SwZMs1KeeKrgsnDQeK9pyiY0wVzGbbEYodFAMQ)
