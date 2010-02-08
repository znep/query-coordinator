require 'hashie'

class CurrentDomain
  def self.load_all
    @@property_store = {}

    domains = Domain.find
    domains.each do |domain|
      @@property_store[domain.cname] = { :data => domain }
    end
  end

  def self.set(cname, site_config_id = nil)
    @@property_store = {} unless defined? @@property_store

    if !@@property_store.has_key?(cname)
      begin
        @@property_store[cname] = { :data => Domain.find(cname),
          :site_config_id => site_config_id }
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

  def self.properties
    if @@current_domain[:site_properties].nil?
      if @@current_domain[:site_config_id].nil?
        conf = self.default_configuration('site_theme')
      else
        conf = Configuration.find(@@current_domain[:site_config_id].to_s)
      end
      @@current_domain[:site_properties] = conf.nil? ?
        Hashie::Mash.new : conf.properties
    end
    return @@current_domain[:site_properties]
  end

  def self.templates
    return self.properties.templates || Hashie::Mash.new
  end

  def self.theme
    return self.properties.theme || Hashie::Mash.new
  end

  def self.strings
    return self.properties.strings || Hashie::Mash.new
  end

  def self.features
    conf = self.default_configuration('featureset')
    return conf.nil? ? Hashie::Mash.new : conf.properties
  end

  def self.modules
    if @@current_domain[:modules].nil?
      @@current_domain[:modules] = ((@@current_domain[:data].data['accountModules'] || []) +
        (@@current_domain[:data].accountTier.data['accountModules'] || [])).uniq
    end
    @@current_domain[:modules]
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

  # CurrentDomain['preference name'] returns properties
  def self.[](key)
    self.properties.send key
  end

  def self.method_missing(key, *args)
    key = key.to_s

    # If they ask for .something?, assume they're asking about the something feature
    if key =~ /\?$/
      return (self.properties['features.' + key.gsub(/\?$/, '')] == true)
    end

    ## Otherwise, assume we're looking for a property
    self.properties.send key
  end

  def self.member?(user)
    if user.nil?
      false
    else
      self.organizationId == user.organizationId
    end
  end
end
