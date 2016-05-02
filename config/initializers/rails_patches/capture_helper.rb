module ActionView
  module Helpers
    module CaptureHelper

      # This method is an override, with the _subset_content_for line added
      def content_for(name, content = nil, &block)
        if content || block_given?
          content = capture(&block) if block_given?
          @view_flow.append(name, content) if content
          @_subset_content_for[name] << content if content && @_subset_content_for
          nil
        else
          @view_flow.get(name)
        end
      end

      # These two methods are new
      def cache_with_content_for
        @_subset_content_for = Hash.new{ |h, k| h[k] = ActiveSupport::SafeBuffer.new }
        yield
      ensure
        @_subset_content_for = nil
      end

      def content_for_to_cache
        if defined? @_subset_content_for
          @_subset_content_for.dup
        else
          @_content_for.reject{ |k, v| k == :layout }.to_hash
        end
      end
    end
  end
end
