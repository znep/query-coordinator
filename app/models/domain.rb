class Domain < Model
  def self.find(cname)
    # We don't know our cname yet, so we need to pass it in to connection.rb
    # manually
    headers = { "X-Socrata-Host" => cname }
    path = "/domains/#{cname}.json"
    parse(CoreServer::Base.connection.get_request(path, headers))
  end
end
