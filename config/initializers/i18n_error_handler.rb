# Responsible for:
# - Throwing an error on missing translations so tests will fail
#
# Default behavior is to display: 'translation missing: en.key.key.key'

if Rails.env.development? || Rails.env.test?

  # raises exception when there is a wrong/no i18n key
  module I18n
    def self.just_raise_that_exception(*args)
      raise "i18n #{args.first}"
    end
  end

  I18n.exception_handler = :just_raise_that_exception

end
