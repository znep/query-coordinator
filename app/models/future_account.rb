class FutureAccount < Model
  def self.find
    parse(CoreServer::Base.connection.get_request("/future_accounts.json"))
  end

  def self.create(attributes, parse = true)
    response = CoreServer::Base.connection.
                 create_request("/future_accounts.json", attributes.to_json)
    # So we can bulk create these via batch request
    return parse(response) if parse
  end

  def self.delete(id)
    path = "/future_accounts/#{id}.json"
    parse(CoreServer::Base.connection.delete_request(path))
  end
end
