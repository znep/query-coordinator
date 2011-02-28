class Story < Model
  def self.delete(id)
    path = "/#{self.name.pluralize.downcase}.json?" + {"id" => id, "method" => "delete"}.to_param
    parse(CoreServer::Base.connection.delete_request(path))
  end

  def customization
    @customization ||= JSON.parse(data['customization'])
  end

  def customization=(value)
    @customization = value
    data['customization'] = @customization.to_json
  end

  def raw_customization
    data['customization']
  end

  def <=>(other)
    (self.order || 0) <=> (other.order || 0)
  end
end
