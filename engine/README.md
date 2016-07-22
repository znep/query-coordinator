# Chrome

A Rails engine that supplies common header, footer, and navigation elements for use in Socrata applications written in Rails.

> Note: Within this repo, the top-level `chrome` app is just a demo container to exercise the engine. The header/footer engine itself is within the `engine` subdirectory.

## Installation

### From Artifactory

Ensure the `rubygems-virtual` artifactory source is in your Gemfile:

```ruby
source 'https://socrata.artifactoryonline.com/socrata/api/gems/rubygems-virtual/'
```

> Note: Sometimes bundler will complain if there is more than one `source` in the `Gemfile`. If that is the case, use the `source` property in the second example.

Then add the `socrata_site_chrome` gem to your Gemfile:

```ruby
gem 'socrata_site_chrome', '~> 0.0.4'
```

Or specify the source directly:

```ruby
gem 'socrata_site_chrome', '~> 0.0.4', :source => 'https://socrata.artifactoryonline.com/socrata/api/gems/rubygems-virtual/'
```

### From Source

Add this line to your application's Gemfile:

```ruby
gem 'socrata_site_chrome', '~> 0.0.4', :path => 'engine' # Where 'engine' is the correct directory path
```

Then execute:

    bundle install


## Prerequisites

### jQuery

The engine requires that jQuery be available on the page in order to support the mobile drop-down menu in the header. It relies on general functions such as `$()`, `ready()`, `css()`, `toggleClass()`, and `hasClass()`.

### SSL Certificate Validation

When connecting to localhost, or other domains without valid SSL certificates, the OpenSSL library will complain. One must disable certficate validation with the code shown below. In an ideal world, we would only do this when the domain in question is known to be a development host; i.e. IP address `127.0.0.1`.

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

In order to use the `*_tag` helper methods below, you will have to include SiteChromeHelper.
You should most likely do this in your `ApplicationHelper.rb`.

```ruby
include SiteChromeHelper
```

In the main layout that you are using for your application (usually `app/views/layouts/application.html.erb`), you will need to add the following `site_chrome_*` helpers to the bottom of the `<head>` section:
```erb
<title><%= site_chrome_window_title %></title>
<%= site_chrome_favicon_tag %>
<%= site_chrome_meta_viewport_tag %>
<%= site_chrome_google_analytics_tag %>
<%= site_chrome_stylesheet_tag %>
<%= site_chrome_javascript_tag %>
```


Within the `<body>` section add the `<%= render 'site_chrome/header' %>` just inside the opening `<body>` section, then add the `<%= render 'site_chrome/footer' %>` just before the closing `</body>` tag.

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
    <%= site_chrome_google_analytics_tag %>
    <%= site_chrome_stylesheet_tag %>
    <%= site_chrome_javascript_tag %>
  </head>

  <body>
    <%= render 'site_chrome/header' %>
    <%= yield %>
    <%= render 'site_chrome/footer' %>
  </body>
</html>
```

Add the following to `config/routes.rb` to mount the engine:
Note: you must use the `socrata_site_chrome` mount point because the gem references it.
TODO: Find a way to allow the user the set their own mount point and determine it within the engine.

```
mount SocrataSiteChrome::Engine => 'socrata_site_chrome'
```

To run the engine on a given route:
1. add this to `application.rb`
  ```ruby
  config.relative_url_root = '/your-route'
  ```
2. add this to `config.ru`
  ```ruby
  map SocrataSiteChrome::Engine.config.relative_url_root = '/your-route' do
    run Rails.application # remove the other instance of this line
  end
  ```

### Site Title and Favicon

The Chrome admin panel allows users to set the "Window or Tab Title Display" and "Window or Tab Icon (favicon)".
However the Chrome gem does not have access to the parent application's <head>. It is the responsibility of
the parent application to make use of these properties on the proper pages.

TODO: Once this is done in Frontend, document the steps here.

### Runtime Dependencies

The host app must provide a value for `:current_user` in `RequestStore.store`. If there is a signed in user, the value must be a hash containing all properties from the current user object (typically obtained via a call to `/api/users/current.json`). The keys are expected to be strings. If there is no signed in user, the value must be set to nil in the request store. If `:current_user` is not set, an error will be thrown.

## Site Configuration & Styling

The site configuration is domain-specific. The configuration is fetched from core using the domain of the current request. The current domain is obtained from the request environment (`HTTP_HOST`). Given how we implement multitenancy, this value must be set by middleware in the hosting application. If this is not done, Rack will set the host to an unexpected or useless value. See [request_host.rb](https://github.com/socrata/storyteller/blob/master/lib/request_host.rb) in Storyteller for an example.

Create a **Configuration** in the Internal Panel of type `site_chrome` (you can name it whatever you like). Within this configuration, add a property called `siteChromeConfigVars`, into which you can copy the configuration information shown below.

The values specified in the configuration file are used in the following files to generate the CSS that defines the theme.

* `_common.scss`
* `_footer.scss`
* `_header.scss`

### Styleguide icons

By default, `styleguide` icons are included in the rendered CSS through the engine.
However, if you know your hosting app is already using the styleguide and you want
to prevent the engine from rendering it, add the following to `application.rb`:

```ruby
config.styleguide = false
```

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
              "src": "https://evergreen.gov/logo.png"
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
            "link_text_color": "blue",
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
              "src": "http://evergreen.gov/logo.png"
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
                "logo_alt": "Welcome to Evergreen",
                "site_name": "City of Evergreen"
              },
              "header": {
                "links": {
                  "catalog": "Browse",
                  "developers": "Developers",
                  "home": "Home Page",
                  "support": "Support"
                },
                "logo_alt": "Evergreen",
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

The engine provides a basic header Rails template that includes the logo, colors, and other styling configured for the domain. The include the navigation section and the links that appear therein can be controled using the configuration. The engine also provides a basic footer Rails template that include a collection of configurable links, copyright notice, social media links, etc.

Both the header and footer respond to mobile screen sizes and will change how the links in the header menu behave when in mobile mode. In order to do this, it uses a small amount of Javascript code loaded from `site_chrome.js`.

The styling information is controlled by a combination of the information stored in the **Site Configuration** as well as the default theme variables, which are shown below:

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

### Deploy to Socrata Artifactory

To deploy gem to Artifactory Online ([See Artifactory OpsDoc](https://docs.google.com/document/d/1KihQV3-UBfZEOKIInsQlloESR6NLck8RuP4BUKzX_Y8/edit#)), follow
the directions to setup your access to artifactory. If this doesn't work, perhaps artifactory changed its API. Click on `Set Me Up` on the [rubygems-virtual repository page](https://socrata.artifactoryonline.com/socrata/webapp/#/artifacts/browse/tree/General/rubygems-virtual) for official instructions.

Update `~/.gemrc` to include artifactory source. You will need to grab the encrypted password like [this](https://docs.google.com/document/d/1KihQV3-UBfZEOKIInsQlloESR6NLck8RuP4BUKzX_Y8/edit#heading=h.4hnxvstj4v5v).
NOTE! If your username contains an @, replace it with %40.

```
gem source -a https://<USERNAME>:<ENCRYPTED_PASSWORD>@socrata.artifactoryonline.com/socrata/api/gems/rubygems-virtual/
```

Add `API_KEY` to `~/.gem/credentials` file:

```
curl -u <USERNAME>:<ENCRYPTED_PASSWORD> https://socrata.artifactoryonline.com/socrata/api/gems/rubygems-virtual/api/v1/api_key.yaml
cat ~/.gem/credentials
chmod 0600 ~/.gem/credentials
```

Ensure $RUBYGEMS_HOST is set in environment:

```
export RUBYGEMS_HOST=https://socrata.artifactoryonline.com/socrata/api/gems/rubygems-virtual
```

Build them gem and push it to artifactory:
NOTE! Ensure you are in the `engine` directory.

```
rake gem
```

Alternatively you can run each step individually
```
rake gem:build
```

```
rake gem:publish
```

## Running tests

Run RSPec tests from within the `engine` directory with:

```
bundle exec rspec
```

You can also watch the specs for changes and re-run them automatically with:

```
bundle exec guard
```
