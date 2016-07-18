require 'rails_helper'

module SocrataSiteChrome
  describe Configuration do

    #####
    # NOTE: SocrataSiteChrome::Configuration was created to trigger "test_mode", however this was
    # abandoned in favor of simply using `Rails.env.test?`.
    # Leaving this around as an example in case we want to use Configuration in the future.
    #####

    # describe '#test_mode' do
    #   it 'defaults to false' do
    #     expect(SocrataSiteChrome::Configuration.new.test_mode).to eq(false)
    #   end
    # end

    # describe '#test_mode=' do
    #   it 'can set value' do
    #     config = SocrataSiteChrome::Configuration.new
    #     config.test_mode = true
    #     expect(config.test_mode).to eq(true)
    #   end
    # end

    # describe '.reset' do
    #   before(:each) do
    #     SocrataSiteChrome.configure do |config|
    #       config.test_mode = true
    #     end
    #   end

    #   it 'resets the configuration' do
    #     SocrataSiteChrome.reset
    #     config = SocrataSiteChrome.configuration
    #     expect(config.test_mode).to eq(false)
    #   end

    #   after(:each) do
    #     SocrataSiteChrome.reset
    #   end
    # end
  end
end
