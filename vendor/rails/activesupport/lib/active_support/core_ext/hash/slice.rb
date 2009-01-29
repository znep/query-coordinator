module ActiveSupport #:nodoc:
  module CoreExtensions #:nodoc:
    module Hash #:nodoc:
      # Slice a hash to include only the given keys. This is useful for
      # limiting an options hash to valid keys before passing to a method:
      #
      #   def search(criteria = {})
      #     assert_valid_keys(:mass, :velocity, :time)
      #   end
      #
      #   search(options.slice(:mass, :velocity, :time))
      #
      # If you have an array of keys you want to limit to, you should splat them:
      #
      #   valid_keys = [:mass, :velocity, :time]
      #   search(options.slice(*valid_keys))
      module Slice
        # Returns a new hash with only the given keys.
        def slice(*keys)
          keys = keys.map! { |key| convert_key(key) } if respond_to?(:convert_key)
          hash = self.class.new
          keys.each { |k| hash[k] = self[k] if has_key?(k) }
          hash
        end

        # Replaces the hash with only the given keys.
        def slice!(*keys)
          replace(slice(*keys))
        end
      end
    end
  end
end
