# Responsible for:
# - Throwing an error on missing translations so tests will fail
#
# Default behavior is to display: 'translation missing: en.key.key.key'

if Rails.env.development? || Rails.env.test?

  # Raises an exception when there is a wrong/no matching i18n key
  module I18n
    class JustRaiseExceptionHandler < ExceptionHandler
      def call(exception, locale, key, options)
        if exception.is_a?(MissingTranslationData) || exception.is_a?(MissingTranslation)
          raise exception.to_exception
        else
          super
        end
      end
    end
  end

  I18n.exception_handler = I18n::JustRaiseExceptionHandler.new
end
