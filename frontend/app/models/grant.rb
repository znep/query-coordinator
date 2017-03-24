class Grant < Model
  # Override super.type and return the type of the grant
  def type
    data['type']
  end

  def self.create(view_id, attributes)
    path = "/views/#{view_id}/grants"
    return Grant.parse(CoreServer::Base.connection.create_request(path, attributes.to_json))
  end

  def self.delete(view_id, attributes)
    # TODO: remove the random "i" string from the path. Kostub to make
    # changes that will allow it to be removed. I've not idea why it
    # has to be there. Just a sacrifice to the Core Server gods I guess.
    # -pete
    #path = "/views/#{view_id}/grants?method=delete"
    path = "/views/#{view_id}/grants/i?method=delete"
    return Grant.parse(CoreServer::Base.connection.update_request(path, attributes.to_json))
  end

end
