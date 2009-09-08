class InvitationRecord < Model
  
  def self.create(attributes)
    path = "/invites"
    return parse(CoreServer::Base.connection.create_request(path, attributes.to_json))
  end
  
end
