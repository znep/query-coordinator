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

require 'signaller/test/helpers'

RSpec.configure do |config|
  include Signaller::Test::Helpers

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

    config.before(:each) do
      RequestStore.clear!
    end

    config.around(:each, verify_stubs: false) do |example|
      config.mock_with :rspec do |mocks|
        mocks.verify_partial_doubles = false
        example.run
        mocks.verify_partial_doubles = true
      end
    end
  end

  # rspec-mocks config goes here. You can use an alternate test double
  # library (such as bogus or mocha) by changing the `mock_with` option here.
  config.mock_with :rspec do |mocks|
    # Prevents you from mocking or stubbing a method that does not exist on
    # a real object. This is generally recommended, and will default to
    # `true` in RSpec 4.
    mocks.verify_partial_doubles = true
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

  # Allows RSpec to persist some state between runs in order to support
  # the `--only-failures` and `--next-failure` CLI options. We recommend
  # you configure your source control system to ignore this file.
  config.example_status_persistence_file_path = "spec/examples.txt"

  # Limits the available syntax to the non-monkey patched syntax that is
  # recommended. For more details, see:
  #   - http://rspec.info/blog/2012/06/rspecs-new-expectation-syntax/
  #   - http://www.teaisaweso.me/blog/2013/05/27/rspecs-new-message-expectation-syntax/
  #   - http://rspec.info/blog/2014/05/notable-changes-in-rspec-3/#zero-monkey-patching-mode
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

def stub_current_domain_with(domain)
  @request.host = domain
end

def stub_site_chrome(custom_config = nil)
  allow(self).to receive(:site_chrome_instance).and_return(SocrataSiteChrome::SiteChrome.new(
    :content => custom_config || site_chrome_config
  ))
end

def site_chrome_config
  JSON.parse(File.read("#{SocrataSiteChrome::Engine.root}/spec/fixtures/site_chrome_config.json")).
    with_indifferent_access['properties'].first.dig('value', 'versions',
      SocrataSiteChrome::SiteChrome::LATEST_VERSION, 'published', 'content')
end

def stub_current_user(user_hash = nil)
  @request.env['action_controller.instance'] = OpenStruct.new(:current_user_json => user_hash)
end

def unstub_current_user
  @request.env['action_controller.instance'] = nil
end

# domains_uri is expected to be let'd in the examples
def stub_domains(response = { status: 200, body: %Q({ "cname": "#{domain}", "configUpdatedAt": #{Time.now.to_i} }) })
  stub_request(:get, domains_uri).to_return(response)
end

# configurations_uri is expected to be let'd in the example
def stub_configurations(response = { status: 200, body: '[{ "stuff": true }]' })
  stub_request(:get, configurations_uri).to_return(response)
end

def core_managed_session_feature_flag
  {:core_managed_session => ENV['CORE_SESSION'] != 'frontend-generated'}
end

def init_feature_flag_signaller(args = {})
  args[:with] = args.fetch(:with, {}).merge(core_managed_session_feature_flag)

  init_signaller(args)
end
