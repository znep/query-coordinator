class Domain < Model

  @@domains = Hash.new

  # CurrentDomain.load_all does not work.  Do our own caching here
  def self.find(cname, cached = false)
    # We don't know our cname yet, so we need to pass it in to connection.rb
    # manually
    if cname.is_a? String
      if (cached && !@@domains[cname].nil?)
        return @@domains[cname]
      end
      headers = { "X-Socrata-Host" => cname }
    end

    domain = super(cname, headers || {})
    if cached && cname.is_a?(String)
      @@domains[cname] = domain
    end
    domain
  end

  def self.findById(id)
    # We don't know our cname yet, so we need to pass it in to connection.rb
    # manually
    headers = { "X-Socrata-Host" => CurrentDomain.cname }
    path = "/domains/#{id}.json"
    parse(CoreServer::Base.connection.get_request(path, headers))
  end

  def self.add_account_module(cname, module_name)
    headers = { "X-Socrata-Host" => cname }
    path = "/domains/#{cname}.json?method=addAccountModule&moduleName=#{module_name}"
    CoreServer::Base.connection.update_request(path, headers)
  end

  def self.update_aliases(cname, new_cname, aliases)
    headers = { "X-Socrata-Host" => cname }
    path = "/domains/#{cname}.json?method=updateAliases&cname=#{new_cname}&aliases=#{aliases}"
    CoreServer::Base.connection.update_request(path, headers)
  end

  def self.all
    return @@all_domains if defined? @@all_domains
    path = "/domains.json?method=all"
    @@all_domains = parse(CoreServer::Base.connection.get_request(path))
  end

  def protocol
    self.httpsEnforced ? 'https' : 'http'
  end

  def port
    port = 80
    if self.httpsEnforced
      if Rails.env.development?
        port = APP_CONFIG['ssl_port']
      else
        port = 443
      end
    else
      if Rails.env.development?
        port = APP_CONFIG['http_port']
      end
    end

    if (port == 80 || port == 443)
      url_port = ""
    else
      url_port = ":#{port}"
    end
    url_port
  end

  def configurations(type)
    if @configs.nil?
      @configs = Hash.new
    end

    if @configs[type].nil?
      @configs[type] = Configuration.find_by_type(type, false, cname)
    end

    return @configs[type]
  end

  def default_configuration(type)
    @default_configs ||= Hash.new

    if @default_configs[type].nil?
      @default_configs[type] =
        Configuration.find_by_type(type, true, cname)[0]
    end

    return @default_configs[type]
  end

  def features
    conf = default_configuration('feature_set')
    return conf.nil? ? Hashie::Mash.new : conf.properties
  end

  def feature?(name_or_set)
    if name_or_set.is_a? Array
      name_or_set.any?{|mod| features[mod.to_s] }
    else
      features[name_or_set.to_s]
    end
  end

  def feature_flags
    conf = default_configuration('feature_flags')
    FeatureFlags.merge({}, conf.try(:properties) || {})
  end

end
