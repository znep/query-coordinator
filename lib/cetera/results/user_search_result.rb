module Cetera
  module Results
    # Search results from /admin/users (admin only!)
    class UserSearchResult < SearchResult
      @klass = User

      def initialize(data = {})
        super
        data['results'].each do |result|
          result['displayName'] = result['screen_name'] if result['screen_name']
          result['roleName'] = result['role_name'] if result['role_name']
        end
      end
    end
  end
end
