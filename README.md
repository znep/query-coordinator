# Site Chrome

![chrome](http://www.3dtotal.com/admin/new_cropper/tutorial_content_images/208_tid_main_01.jpg)

The "Chrome" is the header (including navigation bar) and footer of a customer site. This gem exists so that our various services/pages (catalogs, storyteller, data_lens, etc.) can easily render the same html for these components.

## Installation

None

## Usage

To run on your local development machine:

```sh
LOCALHOST=true bundle exec rails s
```

To start a Rails console to experiment:

```sh
LOCALHOST=true bundle exec rails c
```
>Note: If the console hangs, try running this first `bin/spring stop`

## Feature flag

By default the feature flag is off, so in order to see the unified header/footer, you can enable it either in `config/feature_flags.yml` or you can set it on the URL by visiting:

```
http://localhost:3000/?enable_unified_header_footer=true
```

## Development

After checking out the repo, run `bundle install`.

Run `bundle exec rake templates` to generate the dist HTML/CSS from your src ERB/SCSS.

## License

The gem is available as open source under the terms of the [MIT License](http://opensource.org/licenses/MIT).
