class Grant < Model
  # Override super.type and return the type of the grant
  def type
    data['type']
  end
  
  def self.create(view_id, attributes)
    path = "/views/#{view_id}/grants"
    return Grant.parse(CoreServer::Base.connection.create_request(path, JSON.generate(attributes)))
  end

end
