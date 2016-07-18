module SocrataSiteChrome
  class Configuration

    #####
    # NOTE: SocrataSiteChrome::Configuration was created to trigger "test_mode", however this was
    # abandoned in favor of simply using `Rails.env.test?`.
    # Leaving this file here in case we want to use Configuration in the future.
    #####

    # attr_accessor :test_mode

    def initialize
      # @test_mode = false
    end
  end
end
