class CuratedRegion < Model

  def self.find_enabled( options = nil, custom_headers = {}, batch = nil, is_anon = false )
    options ||= {}
    options[:enabledOnly] = true
    find(options, custom_headers, batch, is_anon)
  end

  def self.find_default( options = nil, custom_headers = {}, batch = nil, is_anon = false )
    options ||= {}
    options[:defaultOnly] = true
    find(options, custom_headers, batch, is_anon)
  end

  def disable
    path = "/#{CuratedRegion.service_name}/#{id}.json"
    attributes = {
      :enabledFlag => false
    }
    response = CoreServer::Base.connection.update_request(path, attributes.fix_key_encoding.to_json)
    self.class.parse(response)
  end

end
