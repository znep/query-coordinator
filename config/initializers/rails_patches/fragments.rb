require 'snappy'

module ActionController
  module Caching
    module Fragments

      def compressed_cache_key(key)
        "#{key}-compressed"
      end

      def write_fragment(key, content, options = nil)
        return_value = (content.is_a?(Hash)) ? content[:layout] : content
        return return_value unless cache_configured?

        key = compressed_cache_key(fragment_cache_key(key))

        instrument_fragment_cache(:write_fragment, key) do
          content = content.html_safe.to_str if content.respond_to?(:html_safe)
          snapped = Snappy.deflate(Marshal.dump(content))
          success = cache_store.write(key, snapped, options)
          # The write method return value is not guaranteed and should not be relied upon for success / fail.
          # Though a nil value is very like indicative of failure, so the warning below can be inaccurate.
          Rails.logger.info('Error writing fragment; too large? Cache unavailable?') unless success.nil? || success
        end

        return_value
      end

      def read_fragment(key, options = nil)
        return unless cache_configured?

        key = fragment_cache_key(key)

        instrument_fragment_cache(:read_fragment, key) do
          # optimistically read the compressed version
          result = cache_store.read(compressed_cache_key(key), options)

          # EN-6747 - Fix ActionController::Caching::Fragments errors
          #
          # Quit early if we don't have a cached version.
          return nil unless result.present?

          # EN-6747 - Fix ActionController::Caching::Fragments errors
          #
          # The bigger problem with this area of the code was the fact that
          # things which had been cached using Rails 3 were being retrieved
          # from the cache in a format that the version of Snappy used by
          # Rails 4 did not understand, causing the call to Snappy.inflate
          # to fail with 'Snappy::Error: INVALID INPUT'.
          #
          # Check for this error and invalidate this key if it looks like we
          # are trying to read something that was written using a different
          # version of Snappy/Rails.
          begin
            result = Marshal.load(Snappy.inflate(result))
          rescue Snappy::Error => error
            cache_store.delete(compressed_cache_key(key))
            # Let's still keep track of how many Snappy version mismatches we
            # run into so that we can investigate further if the problem does
            # not resolve itself.
            Airbrake.notify(
              :error_class => 'IncompatibleSnappyVersionError',
              :error_message => (
                'Attempted to read fragment cache item written by'\
                'incompatible version of Snappy.'
              )
            )
            # Quit early since we now do not have a cached version because we
            # just destroyed it.
            return nil
          end

          safe_html = lambda { |arg| arg.respond_to?(:html_safe) ? arg.html_safe : arg }
          if result.is_a?(Hash)
            Hash[result.map { |key, value| [key, safe_html.call(value)] }]
          else
            safe_html.call(result)
          end
        end
      end
    end
  end
end
