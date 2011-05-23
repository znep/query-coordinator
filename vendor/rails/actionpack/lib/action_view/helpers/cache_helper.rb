module ActionView
  module Helpers
    # This helper to exposes a method for caching of view fragments.
    # See ActionController::Caching::Fragments for usage instructions.
    module CacheHelper
      # A method for caching fragments of a view rather than an entire
      # action or page.  This technique is useful caching pieces like
      # menus, lists of news topics, static HTML fragments, and so on.
      # This method takes a block that contains the content you wish
      # to cache.  See ActionController::Caching::Fragments for more
      # information.
      #
      # ==== Examples
      # If you wanted to cache a navigation menu, you could do the
      # following.
      #
      #   <% cache do %>
      #     <%= render :partial => "menu" %>
      #   <% end %>
      #
      # You can also cache static content...
      #
      #   <% cache do %>
      #      <p>Hello users!  Welcome to our website!</p>
      #   <% end %>
      #
      # ...and static content mixed with RHTML content.
      #
      #    <% cache do %>
      #      Topics:
      #      <%= render :partial => "topics", :collection => @topic_list %>
      #      <i>Topics listed alphabetically</i>
      #    <% end %>
      def cache(name = {}, options = nil, &block)
        @controller.fragment_for(output_buffer, name, options, &block)
      end

      # A custom method that detangles fragment reading from fragment rendering,
      # so that unnecessary work in the controller is avoided.
      def prerendered_fragment_for(buffer, name = {}, prerendered_content = nil, options = nil, &block)
        if @controller.perform_caching
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
            @controller.write_fragment(name, hash_to_cache, options)
          end
        else
          block.call
        end
      end
    end
  end
end
