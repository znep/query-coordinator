module ActionView
  module Helpers
    module CacheHelper

      # A custom method that detangles fragment reading from fragment rendering,
      # so that unnecessary work in the controller is avoided.
      def prerendered_fragment_for(buffer, name = {}, prerendered_content = nil, options = nil, &block)
        if controller.perform_caching
          if prerendered_content

            if prerendered_content.is_a? Hash
              fragment = prerendered_content.delete :layout
              prerendered_content.each{|k,v| content_for(k, v) }
              prerendered_content = fragment
            end

            buffer.concat(prerendered_content)
          else
            pos = buffer.length

            hash_to_cache = nil
            cache_with_content_for do
              block.call
              fragment = buffer[pos..-1]
              hash_to_cache = {:layout => fragment}.merge(content_for_to_cache)
            end
            controller.write_fragment(name, hash_to_cache, options)
          end
        else
          block.call
        end
      end
    end
  end
end
