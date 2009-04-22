class Comment < Model

  def self.find(view_id)
    path = "/views/#{view_id}/#{self.name.pluralize.downcase}.json"
    get_request(path)
  end

  def self.create(view_id, attributes)
    path = "/views/#{view_id}/#{self.name.pluralize.downcase}.json"
    return self.create_request(path, JSON.generate(attributes))
  end
end
