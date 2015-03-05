class Configuration < Model
  def self.find_by_type(type, default_only = false, cname = nil, merge = true)
    path = "/#{self.name.pluralize.downcase}.json?type=#{type}&" +
      "defaultOnly=#{default_only.to_s}&merge=#{merge}"
    headers = cname.nil? ? {} : { "X-Socrata-Host" => cname }
    parse(CoreServer::Base.connection.get_request(path, headers))
  end

  def self.find_unmerged(id)
    path = "/#{self.name.pluralize.downcase}/#{id}.json?merge=false"
    parse(CoreServer::Base.connection.get_request(path))
  end

  def self.get_or_create(type, opts)
    config = self.find_by_type(type, true, CurrentDomain.cname).first
    if config.nil?
      config = self.create({'type' => type, 'default' => true,
        'domainCName' => CurrentDomain.cname}.merge(opts))
    end
    config
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

  # Copied from CurrentDomain.strings.
  def strings(locale = nil)
    # i don't like this, but i don't see another option: always try to use the
    # current locale, unless it's the default one.
    locale = I18n.locale unless locale.present? || I18n.locale.to_s == CurrentDomain.default_locale

    # TODO: not sure how to safely per-request cache
    result = properties[:strings] || Hashie::Mash.new
    result.merge!(result[locale] || {}) unless locale.nil?

    result
  end

  def raw_properties
    props = Hashie::Mash.new
    
    return props if data['properties'].nil?
    
    data['properties'].each do |p|
      props[p['name']] = p['value']
    end
    return props
  end

  def create_property(name, value, batch_id = nil)
    sanitize_value!(value)

    data['properties'] = [] if data['properties'].nil?
    data['properties'].push({'name' => name, 'value' => value})
    url = "/#{self.class.name.pluralize.downcase}/#{id}/properties.json"
    CoreServer::Base.connection.
      create_request(url, {'name' => name, 'value' => value}.to_json, {}, false, batch_id)
  end

  def update_property(name, value, batch_id = nil)
    sanitize_value!(value)

    data['properties'].detect {|p| p['name'] == name}['value'] = value
    url = "/#{self.class.name.pluralize.downcase}/#{id}/properties/#{CGI.escape(name)}.json"
    CoreServer::Base.connection.
      update_request(url, {'name' => name, 'value' => value}.to_json, {}, batch_id)
  end

  def delete_property(name, is_internal = false, batch_id = nil)
    url = "/#{self.class.name.pluralize.downcase}/#{id}/properties/#{CGI.escape(name)}.json"
    CoreServer::Base.connection.delete_request(url, '', {}, batch_id)
  end

  def update_or_create_property(name, value, batch_id = nil)
    unless value.nil?
      if (!raw_properties.key?(name))
        create_property(name, value, batch_id)
      else
        update_property(name, value, batch_id)
      end
    end
  end

  def sanitize_value!(value)
    value.deep_string_strip! if value.respond_to?(:deep_string_strip!)
    value.strip! if value.respond_to?(:strip!)
  end

end
