module Clytemnestra
  def self.search_users(opts)
    path = "/search/users.json?#{opts.to_core_param}"
    result = CoreServer::Base.connection.get_request(path, {})
    UserSearchResult.from_result(result)
  end

  # We may want to enable caching by default in the future; but for now
  # we only want to enable it in a few key locations - mostly canvas but
  def self.search_cached_views(opts, use_batch = false, cache_ttl = 15)
    path = "/search/views.json?#{opts.to_core_param}"
    cache_key = "search-views:" + Digest::MD5.hexdigest(path)
    result = cache.read(cache_key)
    if result.nil?
      result = CoreServer::Base.connection.get_request(path, {}, use_batch)
      cache.write(cache_key, result, :expires_in => cache_ttl.minutes)
    end
    ViewSearchResult.from_result(result)
  end


  def self.search_views(opts, use_batch = false)
    path = "/search/views.json?#{opts.to_core_param}"
    result = CoreServer::Base.connection.get_request(path, {}, use_batch)
    ViewSearchResult.from_result(result)
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
  
  private

  def self.cache
    @@cache ||= Rails.cache
  end
end
