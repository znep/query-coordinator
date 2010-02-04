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

  def self.default_widget_customization
    # Return empty if the current domain doesn't have the customizer
    if !self.module_available?(:sdp_customizer)
      return ""
    end

    if @@current_domain[:widget_customization].nil?
      # Pull the default customization. Assume it is the first
      customizations = WidgetCustomization.find
      if !customizations.nil? && customizations.size > 0
        @@current_domain[:widget_customization] = customizations.first.uid
      else
        # If they don't have any customizations, default to empty
        @@current_domain[:widget_customization] = ""
      end
    end
    @@current_domain[:widget_customization]
  end

  def self.configurations(type)
    if @@current_domain[:configs].nil?
      @@current_domain[:configs] = Hash.new
    end

    if @@current_domain[:configs][type].nil?
      @@current_domain[:configs][type] = Configuration.find_by_type(type)
    end

    return @@current_domain[:configs][type]
  end

  def self.default_configuration(type)
    if @@current_domain[:default_configs].nil?
      @@current_domain[:default_configs] = Hash.new
    end

    if @@current_domain[:default_configs][type].nil?
      @@current_domain[:default_configs][type] =
        Configuration.find_by_type(type, true)[0]
    end

    return @@current_domain[:default_configs][type]
  end

  def self.templates
    def_config = self.default_configuration('site_theme')
    if def_config.nil?
      return Hashie::Mash.new
    end
    return def_config.properties.templates
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

  def self.module_names
    @@current_domain[:module_names] ||= self.modules.collect{|m| m['name']}
  end

  def self.module_available?(name_or_set)
    return false if self.modules.nil?

    if name_or_set.is_a? Array
      name_or_set.any?{|mod| self.module_names.include? mod.to_s }
    else
      self.module_names.include? name_or_set.to_s
    end
  end

  def self.features
    if @@current_domain[:features].nil?
      @@current_domain[:features] = self.preferences.collect { |pref|
        if pref[0] =~ /^features\./ && pref[1] == true
          pref[0].gsub(/^features\./, '')
        end
      }.compact
    end
    @@current_domain[:features]
  end

  def self.feature?(name_or_set)
    if name_or_set.is_a? Array
      name_or_set.any?{|mod| self.features.include? mod.to_s }
    else
      self.features.include? name_or_set.to_s
    end
  end

  def self.module_enabled?(name_or_set)
    self.module_available?(name_or_set) && self.feature?(name_or_set)
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
