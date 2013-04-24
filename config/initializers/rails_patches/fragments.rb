require 'snappy'

module ActionController
  module Caching
    module Fragments

      def compressed_cache_key(key)
        key + "-compressed"
      end

      def write_fragment(key, content, options = nil)
        return_value = (content.is_a? Hash) ? content[:layout] : content
        return return_value unless cache_configured?

        key = compressed_cache_key(fragment_cache_key(key))

        instrument_fragment_cache :write_fragment, key do
          content = content.html_safe.to_str if content.respond_to?(:html_safe)
          snapped = Snappy.deflate(Marshal.dump(content))
          success = cache_store.write(key, snapped, options)
          Rails.logger.info("Error writing fragment; too large? Cache unavailable?") unless success.nil? || success
        end

        return_value
      end

      def read_fragment(key, options = nil)
        return unless cache_configured?

        key = fragment_cache_key(key)

        instrument_fragment_cache :read_fragment, key do
          # optimistically read the compressed version
          result = cache_store.read(compressed_cache_key(key), options)

          # Support uncompressed versions: After 24hrs we should be able to reliably kill the following block
          if result.nil?
            result = cache_store.read(key, options)
          else
            result = Marshal.load(Snappy.inflate(result))
          end

          if result.is_a? Hash
            safe_result = {}
            result.each{ |k, v| safe_result[k] = (v.respond_to?(:html_safe) ? v.html_safe : v ) }
            safe_result
          else
            result.respond_to?(:html_safe) ? result.html_safe : result
          end
        end
      end
    end
  end
end
