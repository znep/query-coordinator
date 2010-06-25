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

  def self.reload(cname, site_config_id = nil)
    @@property_store.delete(cname)
    self.set(cname, site_config_id)
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
  
  def self.preferences_out_of_date?
    @@current_domain[:out_of_date] || false
  end
  
  def self.flag_preferences_out_of_date!
    @@current_domain[:out_of_date] = true
  end

  def self.default_widget_customization_id
    if @@current_domain[:widget_customization].blank?
      # Use the given setting. Don't inherit.
      result = Configuration.find_by_type('site_theme', true,
        CurrentDomain.cname, false)[0].properties.sdp_template

      if result.blank?
        # if they don't have a default, create one for them
        result = WidgetCustomization.create_default!.uid
        self.set_default_widget_customization_id(result)
      end
      @@current_domain[:widget_customization] = result
    end
    @@current_domain[:widget_customization]
  end

  def self.set_default_widget_customization_id(id)
    begin
      self.current_theme.update_property('sdp_template', id)
    rescue
      # Something went wrong when we tried to update the property. Probably it
      # doesn't exist. Just create it.
      self.current_theme.create_property('sdp_template', id)
    end
  end

  def self.properties
    if @@current_domain[:site_properties].nil?
      conf = self.current_theme
      @@current_domain[:site_properties] = conf.nil? ?
        Hashie::Mash.new : conf.properties
    end
    return @@current_domain[:site_properties]
  end

  def self.raw_properties
    if @@current_domain[:site_properties_raw].nil?
      conf = self.current_theme
      @@current_domain[:site_properties_raw] = conf.nil? ?
        Hash.new : conf.raw_properties
    end
    return @@current_domain[:site_properties_raw]
  end

  def self.templates(version = 0)
    if version == 0
      return self.properties.templates || Hashie::Mash.new
    else
      return self.properties['templates_v' + version] || Hashie::Mash.new
    end
  end

  def self.theme(version = 0)
    if version == 0
      return self.properties.theme || Hashie::Mash.new
    else
      return self.properties['theme_v' + version] || Hashie::Mash.new
    end
  end

  def self.strings
    return self.properties.strings || Hashie::Mash.new
  end

  def self.features
    return @@current_domain[:data].features || Hashie::Mash.new
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

  def self.default_config_id
    return @@current_domain[:data].default_configuration('site_theme').id
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
    @@current_domain[:data].feature?(name_or_set)
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
      user.rights && user.rights.size > 0
    end
  end

  def self.user_can?(user, action)
    if user.nil?
      false
    else
      user.has_right?(action.to_s)
    end
  end


private
  def self.current_theme
    @@current_domain[:site_config_id].nil? ?
      @@current_domain[:data].default_configuration('site_theme') : 
      Configuration.find(@@current_domain[:site_config_id].to_s)
  end
end
