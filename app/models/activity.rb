class Activity < Model
  
  def self.find(limit = nil)
    path = "/activities.json"
    if (!limit.nil?)
      path += "?maxResults=#{limit}"
    end
    get_request(path)
  end
  
end