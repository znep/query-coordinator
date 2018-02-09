require 'webmock/rspec'
require 'time_extensions'

Dir['./spec/support/**/*.rb'].sort.each {|f| require f}

# Disable all net connections during testing
WebMock.disable_net_connect!

# The tests expect a Hashie::Mash, not a RestrictedHash.
# This is the fastest way to deal with it, but it WILL come back
# to bite us someday.
require 'signaller'
require 'feature_flag_monitor'
require 'hashie'
Signaller::Utils.wrapper_class = Hashie::Mash
FeatureFlagMonitor::Utils.wrapper_class = Hashie::Mash

RSpec.configure do |config|
  config.expect_with :rspec do |expectations|
    expectations.include_chain_clauses_in_custom_matcher_descriptions = true
    expectations.syntax = [:expect]
  end

  config.mock_with :rspec do |mock|
    mock.syntax = [:expect]
  end

  config.mock_with :rspec do |mocks|
    mocks.verify_partial_doubles = true
    mocks.allow_message_expectations_on_nil = true
  end

  config.around(:each, verify_stubs: false) do |example|
    config.mock_with :rspec do |mocks|
      mocks.verify_partial_doubles = false
      example.run
      mocks.verify_partial_doubles = true
    end
  end
end

def stub_logged_in
  good_user_object = {
    'id' => 'tugg-xxxx',
    'createdAt' => 1425577015,
    'displayName' => 'testuser'
  }
  allow(@controller).to receive(:current_user).and_return(good_user_object)
end

def fixture_path
  File.expand_path('../fixtures', __FILE__)
end

def fixture(file)
  File.read(File.join(fixture_path, file))
end

def json_fixture(file)
  data = JSON.parse(fixture(file))
  if data.respond_to?(:with_indifferent_access)
    data.with_indifferent_access
  else
    data
  end
end

def with_constants(constants, &block)
  original_const_vals = {}

  constants.each do |constant, val|
    if Object.const_defined?(constant)
      original_const_vals[constant] = Object.const_get(constant)
      Object.send(:remove_const, constant)
    end
    Object.const_set(constant, val)
  end

  block.call

  constants.each do |constant, val|
    Object.send(:remove_const, constant)
    if original_const_vals.has_key?(constant)
      Object.const_set(constant, original_const_vals[constant])
    end
  end
end
