class Configuration < Model
  def self.find_by_type(type, default_only = false, cname = nil)
    path = "/#{self.name.pluralize.downcase}.json?type=#{type}&" +
      "defaultOnly=#{default_only.to_s}"
    headers = cname.nil? ? {} : { "X-Socrata-Host" => cname }
    parse(CoreServer::Base.connection.get_request(path, headers))
  end

  def self.find_unmerged(id)
    path = "/#{self.name.pluralize.downcase}/#{id}.json?merge=false"
    parse(CoreServer::Base.connection.get_request(path))
  end

  def properties
    props = Hashie::Mash.new
    return props if data['properties'].nil?

    data['properties'].each do |p|
      name_parts = p['name'].split('.')
      p_hash = props
      while name_parts.length > 1 do
        n = name_parts.shift
        p_hash[n] = Hashie::Mash.new if p_hash[n].nil?
        p_hash = p_hash[n]
      end
      p_hash[name_parts[0]] = p['value']
    end
    return props
  end

  def create_property(name, value)
    url = "/#{self.class.name.pluralize.downcase}/#{id}/properties.json"
    CoreServer::Base.connection.
      create_request(url, {'name' => name, 'value' => value}.to_json)
  end

  def update_property(name, value, is_internal = false)
    # HACK: The is_internal flag is used to allow as many requests in one
    # page load as we want.  Only use this if it really is used on an internal
    # page that only employees will use
    headers = {}
    headers['Internal-Skip-Request-Count'] = true if is_internal

    url = "/#{self.class.name.pluralize.downcase}/#{id}/properties/#{name}.json"
    CoreServer::Base.connection.
      update_request(url, {'name' => name, 'value' => value}.to_json, headers)
  end

  def delete_property(name, is_internal = false)
    # HACK: The is_internal flag is used to allow as many requests in one
    # page load as we want.  Only use this if it really is used on an internal
    # page that only employees will use
    headers = {}
    headers['Internal-Skip-Request-Count'] = true if is_internal

    url = "/#{self.class.name.pluralize.downcase}/#{id}/properties/#{name}.json"
    CoreServer::Base.connection.
      delete_request(url, '', headers)
  end
end
