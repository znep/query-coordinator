class FutureAccount < Model
  def self.create(attributes, parse = true)
    response = CoreServer::Base.connection.
                 create_request("/future_accounts.json", attributes.to_json, {}, false, true)
    # So we can bulk create these via batch request
    return parse(response) if parse
  end
end
