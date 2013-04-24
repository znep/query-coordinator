module ActionController
  module Caching
    module Fragments

      def write_fragment(key, content, options = nil)
        return_value = (content.is_a? Hash) ? content[:layout] : content
        return return_value unless cache_configured?

        key = fragment_cache_key(key)

        instrument_fragment_cache :write_fragment, key do
          content = content.html_safe.to_str if content.respond_to?(:html_safe)
          success = cache_store.write(key, content, options)
          Rails.logger.info("Error writing fragment; too large? Cache unavailable?") unless success.nil? || success
        end

        return_value
      end

      def read_fragment(key, options = nil)
        return unless cache_configured?

        key = fragment_cache_key(key)

        instrument_fragment_cache :read_fragment, key do
          result = cache_store.read(key, options)

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
