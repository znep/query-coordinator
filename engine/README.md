# Chrome

A Rails engine that supplies common header, footer, and navigation elements for use in Socrata applications written in Rails.

> Note: Within this repo, the top-level `chrome` app is just a demo container to exercise the engine. The header/footer engine itself is within the `engine` subdirectory.

## Installation

### From Artifactory

Ensure the `ruby-local` artifactory source is in your Gemfile:

```ruby
source 'https://socrata.artifactoryonline.com/socrata/api/gems/ruby-local/'
```

> Note: Sometimes bundler will complain if there is more than one `source` in the `Gemfile`. If that is the case, use the `source` property in the second example.

Then add the `chrome` gem to your Gemfile:

```ruby
gem 'chrome', '~> 0.0.4'
```

Or specify the source directly:

```ruby
gem 'chrome', '~> 0.0.4', :source => 'https://socrata.artifactoryonline.com/socrata/api/gems/ruby-local/'
```

### From Source

Add this line to your application's Gemfile:

```ruby
gem 'chrome', '~> 0.0.4', :path => 'engine/chrome' # Where 'engine/chrome' is the correct directory path
```

Then execute:

    bundle install


## Prerequisites

### jQuery

The engine requires that jQuery be available on the page in order to support the mobile drop-down menu in the header. It relies on general functions such as `$()`, `ready()`, `css()`, `toggleClass()`, and `hasClass()`.

### SSL Certificate Validation

When connecting to localhost, or other domains without valid SSL certificates, the OpenSSL library will complain. One must disable certficate validation with the code shown below. In an ideal world, we would only do this when the domain in question is known to be a development host; i.e. IP address `127.0.0.1`.

```ruby
OpenSSL::SSL.send(:remove_const, :VERIFY_PEER)
OpenSSL::SSL::VERIFY_PEER = OpenSSL::SSL::VERIFY_NONE
```

## Usage

In the main layout that you are using for your application (usually `app/views/layouts/application.html.erb`), add the following `site_chrome_*` helpers to the bottom of the `<head>` section.

Within the `<body>` section add the `<%= render 'site_chrome/header' %>` just inside the opening `<body>` section, then add the `<%= render 'site_chrome/footer' %>` just before the closing `</body>` tag.

An example layout is shown below:

```erb
<html>
  <head>
    <title>Your Application Title</title>
    <%= stylesheet_link_tag 'application', media: 'all' %>
    <%= javascript_include_tag 'application' %>
    <%= csrf_meta_tags %>

	...

   <%= site_chrome_meta_viewport_tag %>
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

```
mount Chrome::Engine => '/chrome'
```

## Site Configuration & Styling

Create a **Configuration** in the Internal Panel of type `site_chrome` (you can name it whatever you like). Within this configuration, add a property called `siteChromeConfigVars`, into which you can copy the configuration information shown below.

The values specified in the configuration file are used in the following files to generate the CSS that defines the theme.

* `_common.scss`
* `_footer.scss`
* `_header.scss`

### Fonts

There are two fonts that included in the engine, though only `socrata-icons` is required:

1. `open-sans`
2. `socrata-icons`
 
#### Sample `siteChromeConfigVars` configuration:

```
{
  "versions": {
    "0.1": {
      "published": {
        "content": {
          "footer": {
            "logo": {
              "src": "http://i.imgur.com/rF2EJ4P.gif",
              "href": "#"
            },
            "links": [
              {
                "url": "/",
                "key": "home"
              },
              {
                "url": "http://www.socrata.com/terms-of-service",
                "key": "terms_of_service"
              },
              {
                "url": "http://www.socrata.com/privacy",
                "key": "privacy"
              },
              {
                "url": "http://www.socrata.com/accessibility",
                "key": "accessibility"
              },
              {
                "url": "http://www.socrata.com/contact-us",
                "key": "contact_us"
              },
              {
                "url": "#a",
                "key": "a"
              },
              {
                "url": "#b",
                "key": "b"
              },
              {
                "url": "#c",
                "key": "c"
              },
              {
                "url": "#d",
                "key": "d"
              },
              {
                "url": "#e",
                "key": "e"
              },
              {
                "url": "#f",
                "key": "f"
              },
              {
                "url": "#g",
                "key": "g"
              },
              {
                "url": "#h",
                "key": "h"
              },
              {
                "url": "#i",
                "key": "i"
              },
              {
                "url": "#j",
                "key": "j"
              }
            ]
          },
          "locales": {
            "en": {
              "footer": {
                "logo_alt": "Evergreen!",
                "links": {
                  "f": "Link F",
                  "home": "Home Page",
                  "g": "Link G with a super long title!!!",
                  "d": "Link D",
                  "e": "Link E",
                  "b": "Link B",
                  "c": "Link C",
                  "a": "Link A",
                  "privacy": "Privacy Policy",
                  "terms_of_service": "Terms of Service",
                  "j": "Link J",
                  "h": "Link H",
                  "i": "Link I",
                  "contact_us": "Contact Us",
                  "accessibility": "Accessibility"
                }
              },
              "general": {
                "social_shares": {
                  "twitter": "Follow us on Twitter",
                  "facebook": "Like us on Facebook"
                },
                "site_name": "City of Evergreen"
              },
              "header": {
                "logo_alt": "Evergreen!",
                "links": {
                  "home": "Home Page",
                  "support": "Support",
                  "catalog": "Browse",
                  "evergreen": "City of Evergreen",
                  "developers": "Developers"
                }
              }
            }
          },
          "header": {
            "logo": {
              "src": "http://i.imgur.com/E8wtc6d.png",
              "href": "#"
            },
            "styles": {
              "fg_color": "#eee",
              "bg_color": "#5D7365"
            },
            "links": [
              {
                "url": "/",
                "key": "home"
              },
              {
                "url": "/browse",
                "key": "catalog"
              },
              {
                "url": "http://dev.socrata.com",
                "key": "developers"
              },
              {
                "url": "http://support.socrata.com",
                "key": "support"
              },
              {
                "url": "http://data.evergreen.gov",
                "key": "evergreen"
              }
            ]
          },
          "general": {
            "social_shares": [
              {
                "type": "facebook",
                "url": "http://facebook.com"
              },
              {
                "type": "twitter",
                "url": "http://twitter.com"
              }
            ],
            "link_text_color": "grey",
            "favicon": "http://foo.png",
            "default_locale": "en",
            "locales": [
              "en",
              "es",
              "fr"
            ],
            "styles": {
              "fg_color": "#eee",
              "bg_color": "#2c97de",
              "font_family": "Open Sans"
            },
            "site_title": "Evergreen"
          }
        },
        "updatedAt": 1458946330
      }
    }
  }
}
```

## Dependencies

Chrome requires access to the _current domain_ in order to fetch the domain configuration from the metadb. It currently expects this information to be set by `CurrentDomainMiddleware` and stored in `Thread.current[:current_domain]`.

## Localhost

In order to run / test the engine on your local development environment, you'll need to set `LOCALHOST=true` when launching your Rails application.

```sh
LOCALHOST=true rails s
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

$mobile_btn_color: #288dc1;
$mobile_btn_hover_color: #20719a;
$text_padding: 11px;
```

### Deploy to Socrata Artifactory

To deploy gem to Artifactory Online ([See Artifactory OpsDoc](https://docs.google.com/document/d/1KihQV3-UBfZEOKIInsQlloESR6NLck8RuP4BUKzX_Y8/edit#)), follow
the directions to setup your access to artifactory.

Update `~./gemrc` to include artifactory source.

```
gem source -a http://<USERNAME>:<API_KEY>@socrata.artifactoryonline.com/artifactory/api/gems/ruby-local/
```

Add `API_KEY` to `~/.gem/credentials` file:

```
curl -u<USERNAME>:<API_KEY> https://socrata.artifactoryonline.com/socrata/api/gems/ruby-local/api/v1/api_key.yaml > ~/.gem/credentials
chmod 0600 ~/.gem/credentials
```

Ensure $RUBYGEMS_HOST is set in environment:

```
export RUBYGEMS_HOST=https://socrata.artifactoryonline.com/socrata/api/gems/ruby-local
```

Build them gem and push it to artifactory:

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
