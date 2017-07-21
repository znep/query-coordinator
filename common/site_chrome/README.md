# Socrata Site Chrome

A Rails engine that supplies common header, footer, and navigation elements for use in Socrata
applications written in Rails.

## Installation

### From Artifactory [DEPRECATED]

_Note: this is deprecated following the monorepo work. The latest updates to Site Chrome are no longer being deployed to Artifactory. All consumers of Site Chrome must use it from source (see below)._

Ensure the `rubygems-virtual` artifactory source is in your Gemfile:

    ruby source 'https://repo.socrata.com/artifactory/api/gems/rubygems-virtual/'

> Note: Sometimes bundler will complain if there is more than one `source` in the `Gemfile`. If that
> is the case, use the `source` property in the second example.

Then add the `socrata_site_chrome` gem to your Gemfile:

    ruby gem 'socrata_site_chrome', '~> 2.0.3'

Or specify the source directly:

    ruby gem 'socrata_site_chrome', '~> 2.0.3', :source => 'https://repo.socrata.com/artifactory/api/gems/rubygems-virtual/'

### From Source

Add this line to your application's Gemfile (the path to common/site_chrome may vary depending on your project's root):

    ruby gem 'socrata_site_chrome', path: '../common/site_chrome'

Then execute:

    bundle install

## Prerequisites

### jQuery

The engine requires that jQuery be available on the page in order to support the mobile drop-down
menu in the header. It relies on general functions such as `$()`, `ready()`, `css()`,
`toggleClass()`, and `hasClass()`.

### SSL Certificate Validation

When connecting to localhost, or other domains without valid SSL certificates, the OpenSSL library
will complain. One must disable certificate validation with the code shown below. In an ideal world,
we would only do this when the domain in question is known to be a development host; i.e. IP address
`127.0.0.1`.

```ruby
# Put the following in `config/boot.rb` or your local equivalent
OpenSSL::SSL.send(:remove_const, :VERIFY_PEER)
OpenSSL::SSL::VERIFY_PEER = OpenSSL::SSL::VERIFY_NONE
```

### Asset Pipeline Prefix

You must set the `config.assets.prefix` to be `asset_pipeline` instead of the default `assets`:

```ruby
# In application.rb
config.assets.prefix = '/asset_pipeline'
```

This is because the default `/assets` is currently reserved in `frontend` for a route in `core`.

## Usage

In order to use the `*_tag` helper methods below, you will have to include SiteChromeConsumerHelpers. You
should most likely do this in your `ApplicationHelper.rb`.

```ruby
include SiteChromeConsumerHelpers
```

In the main layout that you are using for your application (usually
`app/views/layouts/application.html.erb`), you will need to add the following `site_chrome_*`
helpers to the bottom of the `<head>` section:

```erb
<title><%= site_chrome_window_title %></title>
<%= site_chrome_favicon_tag %>
<%= site_chrome_meta_viewport_tag %>
<%= site_chrome_analytics_tags %>
<%= site_chrome_stylesheet_tag %>
```

Within the `<body>` section add
`<%== site_chrome_header(request, response) %>`
just inside the opening `<body>` section, then add
`<%== site_chrome_footer(request, response) %>`
after the main body content. Then add
`<%= site_chrome_javascript_tag %>`
just before the closing `</body>` tag.
It is important that `site_chrome_javascript_tag` is AFTER
the `site_chrome_header` and `site_chrome_footer` helpers (EN-13762).

There is also an Admin header (currently used for Open Performance) which can be rendered with
`<%== site_chrome_admin_header(request, response) %>`

There are also "small" versions of the header and footer that you can choose to render. For example,
on dataset/view pages, where the full header/footer takes up too much screen real estate. To do
this, just use the argument `size: 'small'` when rendering the header or footer.

    <%== site_chrome_header(request, response, :size => 'small') %>

And the same goes for the admin header.

    <%= render 'site_chrome/admin_header', size: 'small' %>

An example layout is shown below:

```erb
<html>
  <head>
    <title>Your Application Title - <%= site_chrome_window_title %></title>
    <%= stylesheet_link_tag 'application', media: 'all' %>
    <%= javascript_include_tag 'application' %>
    <%= csrf_meta_tags %>

	...

    <%= site_chrome_favicon_tag %>
    <%= site_chrome_meta_viewport_tag %>
    <%= site_chrome_analytics_tags %>
    <%= site_chrome_stylesheet_tag %>
  </head>

  <body>
    <%== site_chrome_header(request, response) %>
    <%= yield %>
    <%== site_chrome_footer(request, response) %>
    <%= site_chrome_javascript_tag %>
  </body>
</html>
```

Add the following to `config/routes.rb` to mount the engine: Note: you must use the
`socrata_site_chrome` mount point because the gem references it. TODO: Find a way to allow the user
the set their own mount point and determine it within the engine.

    mount SocrataSiteChrome::Engine => 'socrata_site_chrome'

To run the engine on a given route, add this to `application.rb`

```
config.relative_url_root = '/your-route'
```

Then add this to your `config.ru` file:

```
map SocrataSiteChrome::Engine.config.relative_url_root = '/your-route' do
  run Rails.application # remove the other instance of this line
end
```
### Site Title and Favicon

The Chrome admin panel allows users to set the "Window or Tab Title Display" and "Window or Tab Icon
(favicon)". However the Chrome gem does not have access to the parent application's `<head>` section. It is
the responsibility of the parent application to make use of these properties on the appropriate pages.

TODO: Once this is done in Frontend, document the steps here.

### Runtime Dependencies

#### `current_user_json`

The host app must provide an ApplicationController method called
`current_user_json` which should return a json representation of the current
user. If this is not set, an exception will be raised.

#### `coreservice_uri`

The host app must also provide the configuration directive that specifies the
`coreservice_uri`. This value is used by the gem to make requests to core to
fetch and update the site chrome configuration.
It is expected to be a full URI, for example: `http://some.host.com:8080`.

#### `cache_key_prefix`

The host app must also provide a cache key prefix used to generate the same memcached key that the
hosting application uses to cache the underlying configuration data. The configuration property must
be called `Rails.application.config.cache_key_prefix` and usually consists of the first 8 characters
of the `REVISION` file which contains the `SHA1` representing the current release. For example:
`c597c5c5`.

## Site Configuration & Styling

The site configuration is domain-specific. The configuration is fetched from core using the domain
of the current request. The current domain is obtained from the request environment (`HTTP_HOST`).
Given how we implement multitenancy, this value must be set by middleware in the hosting
application. If this is not done, Rack will set the host to an unexpected or useless value. See
[request_host.rb](https://github.com/socrata/storyteller/blob/master/lib/request_host.rb) in
Storyteller for an example.

Create a **Configuration** in the Internal Panel of type `site_chrome` (you can name it whatever you
like). Within this configuration, add a property called `siteChromeConfigVars`, into which you can
copy the configuration information shown below.

The values specified in the configuration file are used in the following files to generate the CSS
that defines the theme.

    _common.scss
    _footer.scss
    _header.scss

### Styleguide icons

Site Chrome has a requirement that the hosting app provide the Socrata Styleguide icons font. See [Styleguide](https://github.com/socrata/styleguide) for more information.

#### Sample `siteChromeConfigVars` configuration:

```
{
  "current_version": "0.3",
  "versions": {
    "0.3": {
      "published": {
        "content": {
          "footer": {
            "links": [
              {
                "key": "home",
                "url": "/"
              },
              {
                "key": "terms_of_service",
                "url": "http://www.socrata.com/terms-of-service"
              },
              {
                "key": "privacy",
                "url": "http://www.socrata.com/privacy"
              },
              {
                "key": "accessibility",
                "url": "http://www.socrata.com/accessibility"
              },
              {
                "key": "contact_us",
                "url": "http://www.socrata.com/contact-us"
              }
            ],
            "logo": {
              "href": "#",
              "src": "https://evergreen.gov/logo.png",
              "alt": "Evergreen Logo"
            },
            "styles": {
              "bg_color": "#3b3a3c",
              "fg_color": "#eeeeee"
            }
          },
          "general": {
            "template": "rally",
            "default_locale": "en",
            "window_icon": "https://evergreen.gov/favicon.ico",
            "window_title_display": "Evergreen",
            "social_shares": {
              "facebook": {
                "url": "http://facebook.com/evergreen"
              },
              "twitter": {
                "url": "http://twitter.com/evergreen"
              }
            },
            "styles": {
              "bg_color": "#2c97de",
              "fg_color": "#eeeeee",
              "font_family": "Open Sans"
            }
          },
          "header": {
            "links": [
              {
                "key": "home",
                "url": "/"
              },
              {
                "key": "catalog",
                "url": "/browse"
              },
              {
                "key": "developers",
                "url": "http://dev.socrata.com"
              },
              {
                "key": "support",
                "url": "http://support.socrata.com"
              }
            ],
            "logo": {
              "href": "#",
              "src": "http://evergreen.gov/logo.png",
              "alt": "Evergreen Logo"
            },
            "styles": {
              "bg_color": "#22b479",
              "fg_color": "#eeeeee"
            }
          },
          "locales": {
            "en": {
              "footer": {
                "links": {
                  "accessibility": "Accessibility",
                  "contact_us": "Contact Us",
                  "home": "Home Page",
                  "privacy": "Privacy Policy",
                  "terms_of_service": "Terms of Service"
                },
                "site_name": "City of Evergreen"
              },
              "header": {
                "links": {
                  "catalog": "Browse",
                  "developers": "Developers",
                  "home": "Home Page",
                  "support": "Support"
                },
                "site_name": "Evergreen"
              }
            }
          }
        }
      }
    }
  }
}
```

## What it does

The engine provides a basic header Rails template that includes the logo, colors, and other styling
configured for the domain. The navigation section and the links that appear therein can
be controlled using the configuration. The engine also provides a basic footer Rails template that
includes a collection of configurable links, copyright notice, social media links, etc.

Both the header and footer respond to mobile screen sizes and will change how the links in the
header menu behave when in mobile mode. In order to do this, it uses a small amount of Javascript
code loaded from `site_chrome.js`.

The styling information is controlled by a combination of the information stored in the **Site
Configuration** as well as the default theme variables, which are shown below:

```SCSS
$breakpoint_mobile_med: 1000px;
$breakpoint_mobile_sm: 670px;

// Mixins
@mixin desktop {
  @media screen and (min-width: #{$breakpoint_mobile_med}) {
    @content;
  }
}
@mixin mobile-med {
  @media screen and (max-width: #{$breakpoint_mobile_med}) {
    @content;
  }
}
@mixin mobile-sm {
  @media screen and (max-width: #{$breakpoint_mobile_sm}) {
    @content;
  }
}

$dark_text_color: #2c2c2c;

// Default variables (can be over-written by site_chrome styles)
$bg_color: #22B479;
$fg_color: #fff;
$font_family: 'Open Sans';

$header_bg_color: $bg_color;
$header_fg_color: $fg_color;

$footer_bg_color: #3b3a3c;
$footer_fg_color: $fg_color;

$text_padding: 11px;
```

## Translations & LocaleApp

Only `en.yml` is checked into the codebase, and it should be the source of truth for all the latest English translations.
If you add a new translation or update an existing one, once it is merged you should be able to login to LocaleApp and optionally update the translations for the other languages.

[Updating translations](https://github.com/socrata/platform-ui/blob/master/frontend/doc/update-translations.md)

If you wish to test other languages locally, you can pull the LocaleApp translations by following these steps:

- Ensure you have a `LOCALEAPP_API_KEY` set in your `frontend/.env` file:
```
LOCALEAPP_API_KEY=[KEY FROM LASTPASS]
```
- Run the `bin/pull_translations` script

### Manual Deploy to Socrata Artifactory [DEPRECATED]

_Note: this is deprecated following the monorepo work. The latest updates to Site Chrome are no longer being deployed to Artifactory._

_**If the automated publishing job fails, below you'll find the steps to manually deploy
the gem to artifactory**_

To manually deploy gem to Artifactory ([See Artifactory
OpsDoc](https://docs.google.com/document/d/1xXUHPVtChsk1UHuw2b-m7fslCs4IVe-VTaDwrd4-6-M/edit)),
follow the directions to setup your access to artifactory.

Update `~/.gemrc` to include artifactory source. You will need to grab the encrypted password like [
this](https://docs.google.com/document/d/1KihQV3-UBfZEOKIInsQlloESR6NLck8RuP4BUKzX_Y8/edit#heading=h
.4hnxvstj4v5v). NOTE! If your username contains an `@` symbol, replace it with `%40`.

    gem source -a https://<USERNAME>:<ENCRYPTED_PASSWORD>@repo.socrata.com/artifactory/api/gems/ruby-local/

Add `API_KEY` to `~/.gem/credentials` file:

```
curl -u <USERNAME>:<ENCRYPTED_PASSWORD> https://repo.socrata.com/artifactory/api/gems/ruby-local/api/v1/api_key.yaml >> ~/.gem/credentials
chmod 0600 ~/.gem/credentials
```

Ensure `$RUBYGEMS_HOST` is set in environment:

    export RUBYGEMS_HOST=https://repo.socrata.com/artifactory/api/gems/ruby-local

Build the gem and push it to artifactory.

    bin/release

## Running tests

Run RSpec tests with:

    bundle exec rake

You can also watch the specs for changes and re-run them automatically with:

    bundle exec guard
