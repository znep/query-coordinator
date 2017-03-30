# Custom Themes

Storyteller supports Custom Themes which can be created through the site internal panel. Themes get inserted as inline CSS and override particular variables that affect
a variety of styles such as general layout, typography, and colors.

## Caching
Custom Themes are cached using a Theme's `updated_at` attribute, and an environment variable `THEME_CACHE_KEY_PREFIX` to build a cache key string.

If you need to make changes to underlying styles that affect all Custom Themes, you will need to invalidate the existing assets by updating the `THEME_CACHE_KEY_PREFIX` variable in
apps-marathon.


