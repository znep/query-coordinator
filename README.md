# Site Chrome

![chrome](http://www.3dtotal.com/admin/new_cropper/tutorial_content_images/208_tid_main_01.jpg)

The "Chrome" is the header (including navigation bar) and footer of a customer site. This gem exists
so that our various services/pages (catalogs, storyteller, data_lens, etc.) can easily render the
same html for these components.

## Installation / Usage

See [engine/README.md](file:///engine/README.md)

## Development

After checking out the repo, run `bundle install && npm install`.

Then `cd engine && npm install`

To run on your local development machine, in the root of the repo run:

    sh rails s -p 4000

To start a Rails console to experiment:

    sh rails c

> Note: If the console hangs, try running this first `bin/spring stop`

To view the demo page, visit [http://localhost:4000](http://localhost:4000)

## License

The gem is available as open source under the terms of the
[MIT License](http://opensource.org/licenses/MIT).
