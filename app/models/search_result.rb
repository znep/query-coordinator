
class SearchResult < Model
  def self.search(type, options)
    path = "/search/#{type}.json?#{options.to_param}"
    parse(CoreServer::Base.connection.get_request(path))
  end

  def results
    # results could either be views or users
    key = self.searchType.downcase
    if !data.has_key?(key)
      data[key] = data["results"]
    end
    result = send(key)
    if result.nil?
      return []
    end
    return result
  end
end
