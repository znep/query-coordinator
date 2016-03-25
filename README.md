# Site Chrome

![chrome](http://www.3dtotal.com/admin/new_cropper/tutorial_content_images/208_tid_main_01.jpg)

The "Chrome" is the header, footer, and navbar of a customer site. This gem exists so that our various services/pages (catalogs, storyteller, data_lens, etc.) can easily render the same html for these components.

## Installation

TODO: write installation steps

## Usage

```ruby
domain = 'opendata-demo.rc-socrata.com'
auth = Chrome::Auth.new(domain, email, password).authenticate
configuration = Chrome::DomainConfig.new(domain, auth.cookie)

configuration.header_html # html for site header
configuration.footer_html # html for site footer
configuration.json        # json of entire domain configuration
```

## Development

After checking out the repo, run `bin/setup` to install dependencies. Then, run `bundle exec rake` to run the tests.

Run `bundle exec rake console` for an interactive promprt that will allow you to experiment.

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/[USERNAME]/chrome. This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [Contributor Covenant](http://contributor-covenant.org) code of conduct.


## License

The gem is available as open source under the terms of the [MIT License](http://opensource.org/licenses/MIT).

