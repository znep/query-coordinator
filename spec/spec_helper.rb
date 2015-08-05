require 'simplecov'
require 'simplecov-cobertura'
require 'webmock/rspec'
require 'database_cleaner'

SimpleCov.profiles.define 'filtered' do
  load_profile 'rails'
  add_filter 'vendor' # Don't include vendored stuff
  coverage_dir 'coverage/ruby'
end
SimpleCov.formatters = [
  SimpleCov::Formatter::HTMLFormatter,
  SimpleCov::Formatter::CoberturaFormatter
]

SimpleCov.start 'filtered'

Dir["./spec/support/**/*.rb"].sort.each {|f| require f}

# Disable all net connections during testing
WebMock.disable_net_connect!

# Clean the database by truncating between spec runs
DatabaseCleaner.strategy = :truncation

if ENV['HEADLESS'] == 'true'
  require 'headless'

  headless = Headless.new
  headless.start

  at_exit do
    headless.destroy
  end
end


# This file was generated by the `rails generate rspec:install` command. Conventionally, all
# specs live under a `spec` directory, which RSpec adds to the `$LOAD_PATH`.
# The generated `.rspec` file contains `--require spec_helper` which will cause
# this file to always be loaded, without a need to explicitly require it in any
# files.
#
# Given that it is always loaded, you are encouraged to keep this file as
# light-weight as possible. Requiring heavyweight dependencies from this file
# will add to the boot time of your test suite on EVERY test run, even for an
# individual file that may not need all of that loaded. Instead, consider making
# a separate helper file that requires the additional dependencies and performs
# the additional setup, and require it from the spec files that actually need
# it.
#
# The `.rspec` file also contains a few flags that are not defaults but that
# users commonly want.
#
# See http://rubydoc.info/gems/rspec-core/RSpec/Core/Configuration
RSpec.configure do |config|
  # rspec-expectations config goes here. You can use an alternate
  # assertion/expectation library such as wrong or the stdlib/minitest
  # assertions if you prefer.
  config.expect_with :rspec do |expectations|
    # This option will default to `true` in RSpec 4. It makes the `description`
    # and `failure_message` of custom matchers include text for helper methods
    # defined using `chain`, e.g.:
    #     be_bigger_than(2).and_smaller_than(4).description
    #     # => "be bigger than 2 and smaller than 4"
    # ...rather than:
    #     # => "be bigger than 2"
    expectations.include_chain_clauses_in_custom_matcher_descriptions = true
  end

  # rspec-mocks config goes here. You can use an alternate test double
  # library (such as bogus or mocha) by changing the `mock_with` option here.
  config.mock_with :rspec do |mocks|
    # Prevents you from mocking or stubbing a method that does not exist on
    # a real object. This is generally recommended, and will default to
    # `true` in RSpec 4.
    mocks.verify_partial_doubles = true
  end


  # Full test suite before and after
  config.before(:suite) do
    # Run seed before each test run
    DatabaseCleaner.start
    system "RAILS_ENV=test rake db:seed"
  end

  config.after(:suite) do
    # Clean out the seed after the entire test suite
    DatabaseCleaner.clean
    # Generating code coverage reports seems to fail without
    # net connections.
    WebMock.allow_net_connect!
  end

  # Integration tests specific before and after
  config.before(:all, type: :feature) do
    # Integration tests need a web connection
    WebMock.allow_net_connect!
  end

  config.after(:all, type: :feature) do
    WebMock.disable_net_connect!
  end

# The settings below are suggested to provide a good initial experience
# with RSpec, but feel free to customize to your heart's content.
=begin
  # These two settings work together to allow you to limit a spec run
  # to individual examples or groups you care about by tagging them with
  # `:focus` metadata. When nothing is tagged with `:focus`, all examples
  # get run.
  config.filter_run :focus
  config.run_all_when_everything_filtered = true

  # Limits the available syntax to the non-monkey patched syntax that is
  # recommended. For more details, see:
  #   - http://myronmars.to/n/dev-blog/2012/06/rspecs-new-expectation-syntax
  #   - http://teaisaweso.me/blog/2013/05/27/rspecs-new-message-expectation-syntax/
  #   - http://myronmars.to/n/dev-blog/2014/05/notable-changes-in-rspec-3#new__config_option_to_disable_rspeccore_monkey_patching
  config.disable_monkey_patching!

  # Many RSpec users commonly either run the entire suite or an individual
  # file, and it's useful to allow more verbose output when running an
  # individual spec file.
  if config.files_to_run.one?
    # Use the documentation formatter for detailed output,
    # unless a formatter has already been configured
    # (e.g. via a command-line flag).
    config.default_formatter = 'doc'
  end

  # Print the 10 slowest examples and example groups at the
  # end of the spec run, to help surface which specs are running
  # particularly slow.
  config.profile_examples = 10

  # Run specs in random order to surface order dependencies. If you find an
  # order dependency and want to debug it, you can fix the order by providing
  # the seed, which is printed after each run.
  #     --seed 1234
  config.order = :random

  # Seed global randomization in this process using the `--seed` CLI option.
  # Setting this allows you to use `--seed` to deterministically reproduce
  # test failures related to randomization by passing the same `--seed` value
  # as the one that triggered the failure.
  Kernel.srand config.seed
=end
end

def mock_valid_user
  {
    'id' => 'tugg-xxxx',
    'createdAt' => 1425577015,
    'displayName' => 'testuser'
  }
end

def mock_valid_lenses_view_metadata(initialized)
  { 'initialized' => initialized }
end

def mock_valid_lenses_view_title
  'Test Story'
end

def mock_valid_uninitialized_lenses_view
  {
    'name' => mock_valid_lenses_view_title,
    'metadata' => mock_valid_lenses_view_metadata(false),
    'owner' => mock_valid_user
  }
end

def mock_valid_initialized_lenses_view
  {
    'name' => mock_valid_lenses_view_title,
    'metadata' => mock_valid_lenses_view_metadata(true),
    'owner' => mock_valid_user
  }
end

def stub_valid_session
  allow(@controller).to receive(:current_user).and_return(mock_valid_user)
end

def stub_invalid_session
  allow(@controller).to receive(:current_user).and_return(nil)
end

def stub_valid_uninitialized_lenses_view
  allow(CoreServer).to receive(:get_view).and_return(mock_valid_uninitialized_lenses_view)
end

def stub_valid_initialized_lenses_view
  allow(CoreServer).to receive(:get_view).and_return(mock_valid_initialized_lenses_view)
end

def stub_invalid_lenses_view
  allow(CoreServer).to receive(:get_view).and_return(nil)
end

def fixture_path
  File.expand_path('../fixtures', __FILE__)
end

def fixture(file)
  File.new(File.join(fixture_path, file))
end

def stub_logged_in_user
  allow_any_instance_of(ApplicationController).to receive(:require_logged_in_user).and_return(true)
end

def stub_core_view(uid)
  stub_request(:get, "http://localhost:8080/views/#{uid}.json").
    to_return(:status => 200, :body => '{"name": "test story" }')
end
