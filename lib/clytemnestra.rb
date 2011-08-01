module Clytemnestra
  # Performs all the searching against Clytemnestra
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
    def initialize(data)
      super(data['view'])
      @data['rowResults'] = data['rows']
      @data['rowResultCount'] = data['totalRows']
    end
  end

  class SearchResult
    attr_reader :data
    class << self; attr_accessor :klass; end

    def initialize(data = {})
      @data = data
    end

    def self.from_result(result)
      unless result.nil?
        obj = self.new(JSON.parse(result, :max_nesting => 25))
      end
    end

    def results
      @results ||= (data['results'] || []).map{ |data| self.class.klass.new(data) }
    end

    def count
      data['count']
    end
  end

  class UserSearchResult < SearchResult
    @klass = User
  end

  class ViewSearchResult < SearchResult
    @klass = Clytemnestra::ViewWithRows
  end
end
