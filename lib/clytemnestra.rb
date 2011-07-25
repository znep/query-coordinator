module Clytemnestra
  # Performs all che searching against Clytemnestra
  class Sentinel
    def self.search_users(opts)
      path = "/search/users.json?#{opts.to_core_param}"
      result = CoreServer::Base.connection.get_request(path, {})
      UserSearchResult.from_result(result)
    end

    def self.search_views(opts, use_batch = false)
      path = "/search/views.json?#{opts.to_core_param}"
      result = CoreServer::Base.connection.get_request(path, {}, use_batch)
      ViewSearchResult.from_result(result)
    end
  end

  # A view, with rows that match the search query
  class ViewWithRows < View
    attr_reader :row_results

    def initialize(data)
      super(data['view'])
      @row_results = data['rows']
    end
  end

  class SearchResult
    attr_reader :data
    cattr_reader :klass

    def initialize(data = {})
      @data = data
    end

    def self.from_result(result)
      unless result.nil?
        obj = self.new(JSON.parse(result, :max_nesting => 25))
      end
    end

    def results
      @results ||= (data['results'] || []).map{ |data| @@klass.new(data) }
    end

    def count
      data['count']
    end
  end

  class UserSearchResult < SearchResult
    @@klass = User
  end

  class ViewSearchResult < SearchResult
    @@klass = Clytemnestra::ViewWithRows
  end
end
