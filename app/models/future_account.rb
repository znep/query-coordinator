class FutureAccount < Model
  def self.create(attributes, parse = true)
    response = CoreServer::Base.connection.
                 create_request("/future_accounts.json", attributes.to_json, {}, false, true)
    # So we can bulk create these via batch request
    return parse(response) if parse
  end

  def self.create_multiple(addresses, role)
    path = "/future_accounts?method=createMultiple"
    JSON.parse(CoreServer::Base.connection.post_form(path, {:addresses => addresses, :role => role}))
  end
end
