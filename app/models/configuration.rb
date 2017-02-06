class Configuration < Model

  def self.find_by_type(type, default_only = false, cname = nil, merge = true, cache = true)
    fetch_config_from_core = lambda do |*cache_key|
      CoreServer::Base.connection.get_request(
        "/#{name.pluralize.downcase}.json?type=#{type}&defaultOnly=#{default_only}&merge=#{merge}",
        { :'X-Socrata-Host' => cname }.compact
      )
    end

    # If we don't have a cname, we don't know what cache key to use, so skip caching.
    # If cname is not CurrentDomain, we're in the internal panel, and caching is
    # 1: more complicated (needs another domain object), 2: riskier,
    # and 3: low-benefit, so skip it.
    response = if type.nil? || cname.nil? || cname != CurrentDomain.cname || !cache
      fetch_config_from_core.call
    else
      Rails.cache.fetch(cache_key(type), &fetch_config_from_core)
    end

    parse(response) || []
  end

  # Currently used only by the InternalController
  def self.find_unmerged(id)
    parse(CoreServer::Base.connection.get_request("/#{name.pluralize.downcase}/#{id}.json?merge=false"))
  end

  def self.find_or_create_by_type(type, opts = {})
    find_by_type(type, true, CurrentDomain.cname).first ||
      create(opts.reverse_merge('type' => type, 'default' => true, 'domainCName' => CurrentDomain.cname))
  end

  # NOTE!! It is critical that the composition this cache key structurally match the corresponding cache_key
  # method in the site_chrome gem and any others that consume / cache configuration data. For example in the
  # site_chrome gem, this is defined in socrata_site_chrome/engine/lib/socrata_site_chrome/domain_config.rb
  def self.cache_key(configuration_type)
    unless CurrentDomain.configUpdatedAt.present?
      raise RuntimeError.new(
        "configUpdatedAt missing on domain #{CurrentDomain.cname} for type #{configuration_type}"
      )
    end
    [
      'frontend',
      Rails.application.config.cache_key_prefix,
      'domain',
      CurrentDomain.cname,
      CurrentDomain.configUpdatedAt,
      'configurations',
      configuration_type
    ].join(':')
  end

  def route_params
    { id: id }
  end

  def has_child_configs?
    childCount > 0
  end

  # TODO Refactor this confusing method. Is it even necessary? Can't we just Hashie::Mash.new(data['properties'])
  def properties
    props = Hashie::Mash.new
    return props unless data['properties'].present?

    # TODO: Rewrite to use #bury
    # data['properties'].each do |property|
    #   props.bury(*property['name'].split('.'), property['value'])
    # end

    data['properties'].each do |property|
      name_parts = property['name'].split('.')
      property_hash = props
      while name_parts.length > 1 do
        name = name_parts.shift
        property_hash[name] = Hashie::Mash.new if property_hash[name].blank?
        property_hash = property_hash[name]
      end
      property_hash[name_parts[0]] = property['value']
    end

    props
  end

  # Copied from CurrentDomain.strings.
  def strings(locale = nil)
    # i don't like this, but i don't see another option: always try to use the
    # current locale, unless it's the default one.
    locale = I18n.locale unless locale.present? || I18n.locale.to_s == CurrentDomain.default_locale

    # TODO: not sure how to safely per-request cache
    result = properties[:strings] || Hashie::Mash.new
    result.merge!(result[locale] || {}) if locale.present?

    result
  end

  def raw_properties
    props = Hashie::Mash.new
    return props unless data['properties'].present?

    data['properties'].each do |property|
      props[property['name']] = property['value']
    end

    props
  end

  def has_property?(name)
    properties.has_key?(name.to_s)
  end

  def create_property(name, value, batch_id = nil)
    sanitize_value!(value)

    data['properties'] = [] if data['properties'].nil?
    data['properties'].push({'name' => name, 'value' => value})

    CoreServer::Base.connection.create(
      path: "/#{self.class.name.pluralize.downcase}/#{id}/properties.json",
      payload: {'name' => name, 'value' => value}.to_json,
      batch_id: batch_id
    )
  end

  def update_property(name, value, batch_id = nil)
    sanitize_value!(value)
    result = CoreServer::Base.connection.update(
      path: "/#{self.class.name.pluralize.downcase}/#{id}/properties/#{CGI.escape!(name)}.json",
      payload: {'name' => name, 'value' => value}.to_json,
      batch_id: batch_id
    )

    # Only update our cached properties if the update call above succeeds.
    if result.present?
      data['properties'].detect { |p| p['name'] == name }['value'] = value
    end

    result
  end

  def delete_property(name, is_internal = false, batch_id = nil)
    CoreServer::Base.connection.delete(
      path: "/#{self.class.name.pluralize.downcase}/#{id}/properties/#{CGI.escape!(name)}.json",
      batch_id: batch_id
    )
  end

  def create_or_update_property(name, value, batch_id = nil)
    return if value.nil?  # Empty values _are_ valid, so don't use #present?

    if raw_properties.key?(name)
      update_property(name, value, batch_id)
    else
      create_property(name, value, batch_id)
    end
  end

  def sanitize_value!(value)
    value.deep_string_strip! if value.respond_to?(:deep_string_strip!)
    value.strip! if value.respond_to?(:strip!)
  end

end
