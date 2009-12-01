class CurrentDomain
  def self.load_all
    @@property_store = {}

    domains = Domain.find
    domains.each do |domain|
      @@property_store[domain.cname] = { :data => domain,
                                         :namespaces => {} }
    end
  end

  def self.set(cname)
    @@property_store = {} unless defined? @@property_store

    if !@@property_store.has_key?(cname)
      begin
        @@property_store[cname] = { :data => Domain.find(cname),
                                    :namespaces => {} }
      rescue CoreServer::ResourceNotFound
        return false
      end
    end

    return @@current_domain = @@property_store[cname]
  end

  # Main properties
  def self.domain_name
    @@current_domain[:data].name
  end

  def self.cname
    # We need to account for the case where we make a generic_request
    # before we know what domain we're on (eg to get the domain obj).
    if defined? @@current_domain
      @@current_domain[:data].cname
    else
      ''
    end
  end

  def self.accountTier
    @@current_domain[:data].accountTier
  end

  def self.modules
    if @@current_domain[:modules].nil?
      @@current_domain[:modules] = ((@@current_domain[:data].data['accountModules'] || []) +
        (@@current_domain[:data].accountTier.data['accountModules'] || [])).uniq
    end
    @@current_domain[:modules]
  end

  def self.module?(module_name)
    self.modules.any?{ |account_module| account_module['name'] == module_name.to_s }
  end

  def self.feature?(feature_name)
    self.features[feature_name] == 'true'
  end

  # CurrentDomain['preference name'] should return preferences
  def self.[](key)
    if @@current_domain[:data].preferences.nil?
      return nil
    else
      @@current_domain[:data].preferences[key.to_s]
    end
  end

  def self.method_missing(key, *args)
    key = key.to_s

    # If they ask for .something?, assume they're asking about the something feature
    if key =~ /\?$/
      return (self['features.' + key.gsub(/\?$/, '')] == 'true')
    end

    # Allow easy access to namespaced keys
    unless @@current_domain[:namespaces].has_key?(key)
      @@current_domain[:namespaces][key] = {}

      unless @@current_domain[:data].preferences.nil?
        @@current_domain[:data].preferences.data.each do |full_key, property|
          if full_key.index(key + '.') == 0
            @@current_domain[:namespaces][key][full_key[(key.size + 1)..-1]] = property
          end
        end
      end
    end
    @@current_domain[:namespaces][key]
  end
end