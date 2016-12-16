require 'simplecov'
require 'simplecov-cobertura'
require 'webmock/rspec'
require 'database_cleaner'
require 'os'
require 'signaller/test/helpers'

include Signaller::Test::Helpers

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

# Default OSX path is /Applications/Firefox.app/Contents/MacOS/firefox-bin
# set this var if you want to run a version installed at a different path
Capybara.register_driver :selenium do |app|
  require 'selenium/webdriver'

  if ENV['FIREFOX_BINARY_PATH']
    Selenium::WebDriver::Firefox::Binary.path = ENV['FIREFOX_BINARY_PATH']
  end

  firefox_version = `#{Selenium::WebDriver::Firefox::Binary.path} --version`.sub('Mozilla Firefox', '').strip
  unless firefox_version.to_f < 47
    puts "WARNING: Attempting to run possibly incompatible Firefox version #{firefox_version}!"
  end

  Capybara::Selenium::Driver.new(app, :browser => :firefox)
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

  config.around(:each, verify_stubs: false) do |example|
    config.mock_with :rspec do |mocks|
      mocks.verify_partial_doubles = false
      example.run
      mocks.verify_partial_doubles = true
    end
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

  ran_once = false

  # Integration tests specific before and after
  config.before(:all, type: :feature) do
    # Integration tests need a web connection
    WebMock.allow_net_connect!
    unless ran_once
      system "RAILS_ENV=test rake webpack"
      ran_once = true
    end
  end

  # We stub the custom theme css because it's costly to build and we want tests to
  # stay fast-ish
  config.before(:each, type: :feature) do
    allow(CoreServer).to receive(:story_themes).and_return([])
    stub_request(:get, /.*custom\.css.*/)
      .and_return(status: 200, body: '', headers: {})
  end

  config.after(:each) do
    ::RequestStore.clear!
  end

  config.after(:all, type: :feature) do
    WebMock.disable_net_connect!
  end

  config.before(:each) do
    @google_analytics_tracking_id = 'money-in-banana-stand'
  end

  config.before(:each) do
    init_signaller # Note, this comes from the Signaller gem.

    # Set default feature flags.
    set_feature_flags
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

# Matches against a class list string. I.e.
# expect('foo bar baz').to include_class('baz')  # pass
# expect('foo bar baz').to include_class('bing') # fail
RSpec::Matchers.define :include_class do |expected|
  match do |actual|
    actual.split(/\s+/).include?(expected)
  end
  failure_message do |actual|
    "expected that the class list [#{actual}] would include #{expected}"
  end
end


def fixture_path
  File.expand_path('../fixtures', __FILE__)
end

def fixture(file)
  File.new(File.join(fixture_path, file))
end

def stub_google_analytics
  allow(Rails.application.config).to receive(:google_analytics_tracking_id).and_return(@google_analytics_tracking_id)
end

class Capybara::Session
  def evaluate_multiline_script javascript
    evaluate_script "(function(){ #{javascript} })()"
  end
end

def current_story_json
  page.evaluate_script(
    "storyteller.storyStore.serializeStory(window.STORY_UID)"
  )
end

# Get number of blocks in the current story
def block_count
  page.evaluate_script(
    'storyteller.storyStore.getStoryBlockIds(window.STORY_UID).length'
  )
end

def block_component_at_index(block_index)
  block_id = page.evaluate_script(
    "storyteller.storyStore.getStoryBlockIds(window.STORY_UID)[#{block_index}]"
  )

  {
    id: block_id,
    components: page.evaluate_script(
      "storyteller.storyStore.getBlockComponents('#{block_id}')"
    )
  }

end

def block_content_at_index(block_id, component_index)
  page.evaluate_script(
    "storyteller.storyStore.getBlockComponentAtIndex('#{block_id}', #{component_index}).value"
  )
end

# Force the "are you sure you want to discard your unsaved changes"
# modal to come up at a deterministic time. If we don't, the next test
# to interact with the browser will fail (Selenium will complain of an
# unhandled modal).
def unload_page_and_dismiss_confirmation_dialog
  visit '/version'
  begin
    page.driver.browser.switch_to.alert.accept
  rescue Selenium::WebDriver::Error::NoAlertPresentError
  end
end

# Link the toolbar to the component-html located in the sequential ID for
# the blocks in the test story.
# I must stress *sequential*. This only works for full-width rich text editors.
# To select the correct editor, count *visually* the blocks in the UI.
# If I have three blocks, the first block is 2, the second block is 3, and so on.
def link_toolbar_to_squire_instance(id)
  link_toolbar_to_squire_instance_script = File.read('spec/scripts/link-toolbar-to-squire-instance.js')
  link_toolbar_to_squire_instance_script.sub!('{0}', id.to_s)
  execute_script(link_toolbar_to_squire_instance_script)
end

# Selects text within the specified selector.
# This is done within the context of the current session.
# Therefore, if you are within_frame, you can use relative selections
# such as body > h1.
def select_text_in_element(selector)
  select_arbitrary_text_inside_script = File.read('spec/scripts/select-text-in-element.js')
  select_arbitrary_text_inside_script.sub!('{0}', selector)

  evaluate_script(select_arbitrary_text_inside_script);
end

# Selects the correct key modifier based on the current operating system.
def os_control_key
  OS.mac? ? :command : :control
end

def wait_until
  require "timeout"
  Timeout.timeout(Capybara.default_max_wait_time) do
    sleep(0.1) until value = yield
    value
  end
end

# Trigger a mouse click on the given element via $(element).click().
# Use this only as a last resort if selenium refuses to click on the element for you
# (for instance, it can't figure out how to scroll the element into the viewport).
def javascript_click(element)
  page.driver.browser.execute_script("$(arguments[0]).click()", element.native)
end

# Feature flag values used for tests, unless overriden via set_feature_flags.
def default_test_feature_flags
  {
    'enable_deprecated_user_search_api' => false,
    'enable_getty_images_gallery' => true,
    'enable_filterable_visualizations_in_ax' => true,
    'enable_filtered_tables_in_ax' => true,
    'enable_storyteller_mixpanel' => true
  }
end

# Set feature flags to the given values. Example:
# set_feature_flags( 'use_awesomeness' => true )
#
# Defaults come from default_test_feature_flags.
#
# TODO
# This is the simplest thing that will work for the single usage of Signaller
# so far. We need to come up with a better stubbing system, ideally supported
# by Signaller itself (extending init_signaller?).
def set_feature_flags(flags_hash = {})
  flags_hash = default_test_feature_flags.merge(flags_hash)

  allow(Signaller).to receive(:for) do |options|
    flag = options[:flag]
    raise "Mocked feature flag not found: #{flag}" unless flags_hash.has_key?(flag)
    value = flags_hash[flag]
    mock = double("mock flag value #{flag} => #{value}")
    allow(mock).to receive(:value).and_return(value)
    mock
  end
  allow(Signaller::FeatureFlags).to receive(:list).and_return(flags_hash.keys)
  allow(Signaller::FeatureFlags).to receive(:on_domain).and_return(flags_hash)
  allow_any_instance_of(Signaller::Connection).to receive(:read_from).and_return(
    flags_hash.each_with_object({}) do |(flag, value), memo|
      memo[flag] = {
        'value' => value,
        'source' => 'test_stub'
      }
    end
  )
end
