# Site Chrome

![chrome](http://www.3dtotal.com/admin/new_cropper/tutorial_content_images/208_tid_main_01.jpg)

The "Chrome" is the header (including navigation bar) and footer of a customer site. This gem exists so that our various services/pages (catalogs, storyteller, data_lens, etc.) can easily render the same html for these components.

## Installation

TODO: write installation steps

## Usage

```ruby
domain = 'storiespreview.rc-socrata.com'
auth = Chrome::Auth.new(domain, email, password).authenticate
domain_config = Chrome::DomainConfig.new(domain, auth.cookie)
site_chrome = Chrome::SiteChrome.init_from_core_config(domain_config.config)

# for Localhost there are some additional parameters you pass for auth to work without SSL errors
domain = 'localhost'
auth = Chrome::Auth.new(domain, email, password, false).authenticate
domain_config = Chrome::DomainConfig.new(domain, auth.cookie, true)
site_chrome = Chrome::SiteChrome.init_from_core_config(domain_config.config)

# Get rendered html for each section (TODO)
# site_chrome.get_html('header') # 'header' or 'footer'
```

## Development

After checking out the repo, run `bin/setup` to install dependencies. Then, run `bundle exec rake` to run the tests.

Run `bundle exec rake console` for an interactive promprt that will allow you to experiment.

Run `bundle exec rake templates` to generate the dist HTML/CSS from your src ERB/SCSS.

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/[USERNAME]/chrome. This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [Contributor Covenant](http://contributor-covenant.org) code of conduct.


## License

The gem is available as open source under the terms of the [MIT License](http://opensource.org/licenses/MIT).
