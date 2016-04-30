# How we localize translations

See also https://docs.google.com/a/socrata.com/document/d/1PhGf6SwZMs1KeeKrgsnDQeK9pyiY0wVzGbbEYodFAMQ

## LocaleApp
Sign in to https://www.localeapp.com/projects/5484

If you don't yet have access, get an invite from Client Tseng (project owner).

LocaleApp manages all the localized translations, so:
"_please please please do not edit locale .yml files directly in the repo apart from en.yml!_"
-- Clint Tseng

If English localization has changed, import it from this repo into LocaleApp.

* main menu > Import > Import a file ...

After changing LocaleApp's localized translations, export the required file(s) into this repo.

* main menu > Downloads > Download All (zip)
* extract these files into the repo
* strip trailing whitespace
```sh
find . -name \*.yml |xargs -n 1 sed -i 's/[ \t]*$//'
```

Then follow the standard frontend change process.

## To Reiterate

Only edit en.yml!

Export files from LocaleApp to get other language changes.

Thanks!
