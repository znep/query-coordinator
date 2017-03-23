module Cetera
  module Results
    class TagCountResult < SearchResult
      @klass = Tag

      def initialize(data = {})
        super
        # Format results the same way Cly does so the rest of topics_facet doesn't need to change
        data['results'].each do |result|
          result['name'] = result['domain_tag'] if result['domain_tag']
          result['frequency'] = result['count'] if result['count']
        end
      end
    end
  end
end
