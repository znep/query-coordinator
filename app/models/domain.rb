class Domain < Model
  def self.find(cname)
    # We don't know our cname yet, so we need to pass it in to connection.rb
    # manually
    headers = { "X-Socrata-Host" => cname }
    path = "/domains/#{cname}.json"
    parse(CoreServer::Base.connection.get_request(path, headers))
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
    if @default_configs.nil?
      @default_configs = Hash.new
    end

    if @default_configs[type].nil?
      @default_configs[type] =
        Configuration.find_by_type(type, true, cname)[0]
    end

    return @default_configs[type]
  end

  def features
    conf = default_configuration('featureset')
    return conf.nil? ? Hashie::Mash.new : conf.properties
  end

  def feature?(name_or_set)
    if name_or_set.is_a? Array
      name_or_set.any?{|mod| features[mod.to_s] }
    else
      features[name_or_set.to_s]
    end
  end

end
