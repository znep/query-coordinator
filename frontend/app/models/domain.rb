class Domain < Model

  @@domains = Hash.new

  # Do our own caching here
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

  def self.update_name(cname, name)
    headers = { "X-Socrata-Host" => cname }
    path = "/domains/#{cname}.json?method=updateName&newName=#{CGI.escape(name)}"
    CoreServer::Base.connection.update_request(path, headers)
  end

  def self.update_organization_id(cname, orgId)
    headers = { "X-Socrata-Host" => cname }
    path = "/domains/#{cname}.json?method=updateOrganizationId&orgId=#{orgId}"
    CoreServer::Base.connection.update_request(path, headers)
  end

  def self.update_salesforce_id(cname, salesforceId)
    headers = { "X-Socrata-Host" => cname }
    path = "/domains/#{cname}.json?method=updateSalesforceId&salesforceId=#{salesforceId}"
    CoreServer::Base.connection.update_request(path, headers)
  end

  def self.all
    # cache in memory locally for 10 minutes:
    return @@all_domains if (defined? @@all_domains) && @@all_domains_fetched.since(600) > DateTime.current
    path = "/domains.json?method=all"
    @@all_domains = parse(CoreServer::Base.connection.get_request(path))
    @@all_domains_fetched = DateTime.current
    @@all_domains
  end

  def default?
    shortName == 'default'
  end

  def has_child_domains?
    childCount > 0
  end

  def configurations(type)
    # Note: searching for @configs returns results, but they're typically set
    # in a controller method instead of here.
    Airbrake.notify(
      :error_class => 'Deprecation',
      :error_message => 'Called Domain#configurations - we hope this is not being used because we should always ask for default_configuration',
      :parameters => {
        :type => type,
        :contact_person => 'Courtney Spurgeon'
      }
    )

    if @configs.nil?
      @configs = Hash.new
    end

    if @configs[type].nil?
      @configs[type] = Configuration.find_by_type(type, false, cname)
    end

    @configs[type]
  end

  def default_configuration(type)
    # If there are no default_configs, cache all set configs to minimize Core calls
    @default_configs ||= Configuration.find_by_type(nil, true, cname).
        each_with_object({}) do |config_hash, memo|
          memo[config_hash.type] = config_hash
        end

    # If a key didn't come back in api/configurations for the site, make another request
    # for that type and core will grab it with merged inheritance.
    if !@default_configs.has_key?(type)
      @default_configs[type] = Configuration.find_by_type(type, true, cname).first
    end

    @default_configs[type]
  end

  def modules
    data['accountModules'].try(:pluck, 'name') || []
  end

  def features
    conf = default_configuration('feature_set')
    return conf.nil? ? Hashie::Mash.new : conf.properties
  end

  def feature?(name_or_set)
    if name_or_set.is_a?(Array)
      name_or_set.any? { |mod| features[mod.to_s] }
    else
      features[name_or_set.to_s]
    end
  end

  def feature_flags
    FeatureFlags.on_domain(self)
  end

  # For definition, see "ID Field Type" section here:
  # https://developer.salesforce.com/docs/atlas.en-us.api.meta/api/field_types.htm#i1435616
  #
  # For clarity, since this is using a magical regex:
  # There are valid 15-character SFDC IDs and valid 18-character SFDC IDs.
  # The only valid characters are digits, uppercase letters, and lowercase letters.
  def has_valid_salesforce_id?
    /^[0-9A-Za-z]{15}[0-9A-Za-z]{3}?$/.match(self.salesforceId)
  end

end
