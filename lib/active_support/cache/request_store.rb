module ActiveSupport
  module Cache

    # This store only uses the local cache to make an in-memory, per-request store
    #  It never stores data, so nothing is cached across requests
    class RequestStore < Store

      def initialize(options = {})
        @options = options
        extend Strategy::LocalCache
      end

        protected
        # The LocalStore will call super when it doesn't find anything,
        # so we nil these out to keep it from falling back to the (abstract)
        # base Store class
        def read_entry(key, options)
        end

        def write_entry(key, entry, options)
        end
    end
  end
end
