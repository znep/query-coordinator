module Cetera
  module Results
    # Search results from /admin/users (admin only!)
    class UserSearchResult < SearchResult
      @klass = User

      def initialize(data)
        super
        data['results'].map! do |result|
          screen_name = result['screen_name']
          result['display_name'] = screen_name.blank? ? '-' : screen_name
          Hash[result.map { |k, v| [k.camelize(:lower), v] }]
        end
      end
    end
  end
end
