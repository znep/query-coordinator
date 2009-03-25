module ActiveSupport
  module Cache

    # This store only uses the local cache to make an in-memory, per-request store
    #  It never stores data, so nothing is cached across requests
    class RequestStore < Store

      def initialize
        extend Strategy::LocalCache
      end

      def read(name, options = nil)
        super
        nil
      end

      def exist?(key, options = nil)
        super
        false
      end
    end
  end
end
