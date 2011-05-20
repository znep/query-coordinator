
class SearchResult < Model
  def self.search(type, options, use_batching = false)
    path = "/search/#{type}.json?#{options.to_core_param}"
    result = CoreServer::Base.connection.get_request(path, {}, use_batching)
    !result.nil? ? parse(result) : result
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
