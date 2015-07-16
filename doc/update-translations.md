# How to update translations

If you need to update translations, they must be kept in sync with [Locale](https://www.localeapp.com). You can get an account invite from Clint.

The Locale app includes the following sections:
* Dashboard — an overview of translation status
* Translations — a visual navigator for viewing translations
* Imports — a file uploader for translations
* Downloads — a batch download for translations

In the simplest case, we're only adding new keys to the English translation file. In this case, just upload the `en.yml` file in the Imports section. Locale will add the new keys and recognize that they're absent from our non-English files, prompting the translators to fill in the missing keys the next time we pay for their services. For small changes, it's also possible to use the Translations section to add individual entries.

If we need to remove a key, do so through the Translations section. Drill down to the appropriate namespace, look for the gear-dropdown icon at the far right of the row containing the key to be removed, and select Delete. **There is no confirm dialog**, so double-check before you click! Keys cannot be removed through the Imports section, even if you have deleted the key in the uploaded file, because the import process is purely additive.

Renaming and repurposing keys may require you to remove the key first, then add it back. To modify the translations of individual keys, the Translations section is an alternative to uploading entire files.

Pay attention to the results from importing a translation file — entries that raise warnings will not import, so they should usually be fixed and re-uploaded. Common warnings:
* _can't have the 'other' pluralization added to it because it is not a pluralized namespace_ — don't use `other` as a key, because this triggers special translation functionality
* _can't be a descendant of an existing translation_ — if you're converting an existing translation key so that it is a namespace (contains subkeys), you need to delete the existing translation key in Locale first
* _can't create a key that is being used as a namespace_ — the inverse of the previous warning, delete the subkeys if you want to convert a namespace to a single key
* _must use the same variables as the default locale_ — this seems to stem from translators not preserving HTML snippets embedded in translations

Other gotchas for translations:
* Text in the YAML file needs to be quoted if it contains a colon.
* The YAML conversion may coerce `true` and `false` to booleans instead of text. We should be safe from the effects of this because we run everything through `to_s` in `LocaleCache::load!`.

Once the translations have been updated in Locale, use the Downloads section to retrieve the batch of translation files, then replace the contents of `config/locales`. (For good measure, you may want to run the files through your text editor in order to trim trailing spaces.) Put the Locale-synced translation files through a pull request, and you're done!
