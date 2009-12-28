require 'hashie'

class CurrentDomain
  def self.load_all
    @@property_store = {}

    domains = Domain.find
    domains.each do |domain|
      @@property_store[domain.cname] = { :data => domain }
    end
  end

  def self.set(cname)
    @@property_store = {} unless defined? @@property_store

    if !@@property_store.has_key?(cname)
      begin
        @@property_store[cname] = { :data => Domain.find(cname) }
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

  def self.organizationId
    @@current_domain[:data].organizationId
  end

  def self.preferences
    if @@current_domain[:preferences].nil?
      if @@current_domain[:data].preferences.nil?
        # No configured preferences, use only defaults
        @@current_domain[:preferences] = Hashie::Mash.new(DEFAULT_DOMAIN_PREFS)
      else
        # Merge our prefs with default prefs
        @@current_domain[:data].preferences.data.deep_symbolize_keys!
        @@current_domain[:preferences] =
          Hashie::Mash.new(DEFAULT_DOMAIN_PREFS.deep_merge(@@current_domain[:data].preferences.data))
      end
    end
    @@current_domain[:preferences]
  end

  def self.theme
    self.preferences.theme
  end

  def self.modules
    if @@current_domain[:modules].nil?
      @@current_domain[:modules] = ((@@current_domain[:data].data['accountModules'] || []) +
        (@@current_domain[:data].accountTier.data['accountModules'] || [])).uniq
    end
    @@current_domain[:modules]
  end

  def self.strings
    if @@current_domain[:strings].nil?
      strings = Hash.new
      self.preferences.keys.each do |key|
        if key =~ /^strings\.(\w+)$/
          strings[$1] = self.preferences[key]
        end
      end
      @@current_domain[:strings] = Hashie::Mash.new(strings)
    end
    @@current_domain[:strings]
  end

  def self.module_available?(module_name)
    return false if self.modules.nil?
    self.modules.any?{ |account_module| account_module['name'] == module_name.to_s }
  end

  def self.module_enabled?(name)
    self.module_available?(name.to_s) && self.feature?(name.to_s)
  end

  def self.feature?(feature_name)
    self.preferences["features.#{feature_name}"] == true
  end

  # CurrentDomain['preference name'] returns preferences
  def self.[](key)
    self.preferences.send key
  end

  def self.method_missing(key, *args)
    key = key.to_s

    # If they ask for .something?, assume they're asking about the something feature
    if key =~ /\?$/
      return (self.preferences['features.' + key.gsub(/\?$/, '')] == true)
    end

    ## Otherwise, assume we're looking for a preference
    self.preferences.send key
  end

  def self.member?(user)
    if user.nil?
      false
    else
      self.organizationId == user.organizationId
    end
  end
end
