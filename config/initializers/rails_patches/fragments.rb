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

          begin
            result = Marshal.load(Snappy.inflate(result))
          rescue => e
            Airbrake.notify(
              :error_class => 'ActionController::Caching::Fragments',
              :error_message => "read_fragment failed for key #{key.inspect}, exception: #{e}"
            )
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
