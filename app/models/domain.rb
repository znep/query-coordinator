class Domain < Model
  cattr_accessor :themeable_items, :configurable_strings, 
    :configurable_features, :flippable_modules, :comment_modules,
    :site_theme_options

  def self.find(cname)
    # We don't know our cname yet, so we need to pass it in to connection.rb
    # manually
    headers = { "X-Socrata-Host" => cname }
    path = "/domains/#{cname}.json"
    parse(CoreServer::Base.connection.get_request(path, headers))
  end

  def self.add_account_module(cname, module_name)
    headers = { "X-Socrata-Host" => cname }
    path = "/domains/#{cname}.json?method=addAccountModule&moduleName=#{module_name}"
    CoreServer::Base.connection.update_request(path, headers)
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

  # Customer-available per-domain configuration options
  @@themeable_items =
    ['urls.footer', 'urls.header']

  @@configurable_features = 
    ['show_tags', 'show_categories']

  @@flippable_modules =
    ['discovery_module', 'community_module', 'community_creation']

  @@comment_modules = 
    ['community_comment_moderation', 'publisher_comment_moderation']

  @@configurable_strings =
    ['company', 'copyright_string', 'site_title', 'discover_header']

  @@site_theme_options = 
    [ { :name => 'emails.from_address',
        :description => 'The address from which automatic emails are sent'} ]
end
