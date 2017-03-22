class Contact < User
  def self.find( options = nil )
    self.find_under_user(options)
  end

  def self.create(attributes)
    path = "/contacts.json"
    parse(CoreServer::Base.connection.create_request(path, attributes.to_json))
  end

  def self.delete(id)
    path = "/contacts/#{id}.json"
    parse(CoreServer::Base.connection.delete_request(path, nil))
  end
end
