module Cetera
  module Results
    # Base class for all search results from Cetera
    class SearchResult
      attr_reader :data

      class << self; attr_accessor :klass; end

      def initialize(data = {})
        unless data.is_a?(Hash)
          raise ArgumentError.new("The cetera results were not a Hash")
        end
        @data = data
      end

      def results
        @results ||= (data['results'] || []).map { |data| self.class.klass.new(data) }
      end

      def count
        data['resultSetSize']
      end

      def display
      end
    end
  end
end
