class Comment < Model

  def self.find(view_id)
    path = "/views/#{view_id}/#{self.name.pluralize.downcase}.json"
    get_request(path)
  end
end
