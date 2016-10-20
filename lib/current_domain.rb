require 'hashie'
require 'core_server/errors'

class CurrentDomain
  REFRESH_CHECK_TIME = 10

  def self.set(cname)
    @@property_store = {} unless defined?(@@property_store)

    unless @@property_store.has_key?(cname)
      begin
        RequestStore[:current_domain] = cname
        @@property_store[cname] = { :data => Domain.find(cname) }
      rescue CoreServer::ResourceNotFound
        return false
      rescue
        raise CoreServer::ConnectionError.new(OpenStruct.new(:code => 500),
          'There was a problem fetching current domain from core. Check that core ' <<
          'is available and that the domain exists.')
      end
    end

    @@current_domain = @@property_store[cname]
  end

  def self.set?
    defined?(@@current_domain) && @@current_domain.present?
  end

  def self.reload(cname = nil)
    # Blow away the cached version of the domain,
    # forcing a refresh from the Core Server on configs and properties
    default_cname = @@current_domain[:data].cname
    cname ||= default_cname

    @@property_store.delete(cname)
    set(cname) if cname == default_cname
  end

  # Main properties
  def self.set_domain(domain)
    @@current_domain = {} unless defined?(@@current_domain)
    @@current_domain[:data] = domain
  end

  def self.domain_name
    @@current_domain[:data].name
  end

  def self.domain
    @@current_domain[:data]
  end

  def self.cname
    # We need to account for the case where we make a generic_request
    # before we know what domain we're on (eg to get the domain obj).
    if defined?(@@current_domain)
      @@current_domain[:data].cname
    else
      ''
    end
  end

  def self.short_name
    @@current_domain[:data].shortName
  end

  def self.accountTier
    @@current_domain[:data].accountTier
  end

  def self.organizationId
    @@current_domain[:data].organizationId
  end

  def self.flag_out_of_date!(cname)
    if Rails.env.development?
      reload(cname)
    else
      # By writing the time to this key, we're notifying all
      # frontend servers to reload this domain as soon as they notice
      Rails.cache.write(generate_cache_key(cname), Time.now)
    end
  end

  def self.needs_refresh_check?(cname)
    @@refresh_times ||= {}

    @@refresh_times[cname].nil? || (Time.now - @@refresh_times[cname]) > REFRESH_CHECK_TIME
  end

  def self.flag_refresh_checked!(cname)
    @@refresh_times[cname] = Time.now
  end

  def self.last_refresh(cname)
    value = Rails.cache.read(generate_cache_key(cname))
    value if value.is_a?(Time)
  end

  def self.check_for_theme_update(cname)
    @@update_times = {} unless defined? @@update_times

    # Check memcache to see if we need to fetch a new theme.
    refresh_mtime = last_refresh(cname)
    refresh_mtime = nil unless refresh_mtime.is_a?(Time)

    if refresh_mtime.nil?
      refresh_time = Time.now
      flag_out_of_date!(cname)
      return
    end

    # If the key is present, and the value is larger (newer)
    # than our local copy, time to update
    if @@update_times[cname].nil? || (refresh_mtime > @@update_times[cname])
      @@update_times[cname] = refresh_mtime
      reload
    end
  end

  def self.default_widget_customization_id
    if @@current_domain[:widget_customization].nil?
      # Use the given setting. Don't inherit.
      @@current_domain[:widget_customization] = Configuration.find_by_type('site_theme', true,
        CurrentDomain.cname, false).first.properties.sdp_template || false
      # a 'false' value indicates there is no default widget
    end

    @@current_domain[:widget_customization]
  end

  def self.set_default_widget_customization_id(id)
    begin
      current_theme.update_property('sdp_template', id)
    rescue
      # Something went wrong when we tried to update the property. Probably it
      # doesn't exist. Just create it.
      current_theme.create_property('sdp_template', id)
    end
  end

  def self.property(prop, config = 'site_theme')
    configuration(config.to_s).try(:properties).try(:[], prop)
  end

  def self.properties
    @@current_domain[:site_properties] ||= current_theme.try(:properties) || Hashie::Mash.new
  end

  def self.raw_properties
    @@current_domain[:site_properties_raw] ||= current_theme.try(:raw_properties) || Hashie::Mash.new
  end

  def self.templates(version = '2b', locale = nil)
    return properties.templates if version.to_i == 0

    # TODO: not sure how to safely per-request cache
    property_name = "templates_v#{version}"
    result = properties[property_name]
    result = result.merge(properties[property_name][locale] || {}) unless locale.nil?

    result
  end

  def self.theme(version = '2b')
    if version.to_i == 0
      properties.theme
    else
      properties["theme_v#{version}"]
    end || Hashie::Mash.new
  end

  def self.strings(locale = nil)
    # i don't like this, but i don't see another option: always try to use the
    # current locale, unless it's the default one.
    locale = I18n.locale unless locale.present? || I18n.locale.to_s == CurrentDomain.default_locale

    default_strings = properties.strings!

    if locale.present?
      # If necessary, merge the default strings with the locale strings and cache the result.
      computed_merged_with_default = properties.strings.computed_merged_with_default!
      unless computed_merged_with_default.key?(locale)
        computed_merged_with_default[locale] = default_strings.deep_merge(properties.strings[locale] || {})
      end

      computed_merged_with_default[locale]
    else
      default_strings
    end
  end

  def self.features
    @@current_domain[:data].features || Hashie::Mash.new
  end

  def self.feature_flags
    @@current_domain[:data].feature_flags || Hashie::Mash.new
  end

  def self.modules
    if @@current_domain[:modules].nil?
      @@current_domain[:modules] = ((@@current_domain[:data].data['accountModules'] || []) +
        (@@current_domain[:data].accountTier.data['accountModules'] || [])).uniq
    end

    @@current_domain[:modules]
  end

  def self.module_names
    @@current_domain[:module_names] ||= modules.pluck('name')
  end

  def self.default_config_id
    default_config.id
  end

  def self.default_config_updated_at
    default_config.updatedAt
  end

  def self.default_config
    @@current_domain[:data].default_configuration('site_theme')
  end

  def self.configuration(name)
    @@current_domain[:data].default_configuration(name)
  end

  def self.module_available?(name_or_set)
    return false if modules.nil?

    if name_or_set.is_a? Array
      name_or_set.any? { |module_name| module_names.include?(module_name.to_s) }
    else
      module_names.include?(name_or_set.to_s)
    end
  end

  def self.feature?(name_or_set)
    @@current_domain[:data].feature?(name_or_set)
  end

  # CAUTION! This method implementation differs from the method of the same name in the View class
  def self.module_enabled?(name_or_set)
    !!(module_available?(name_or_set) && feature?(name_or_set)) # Force boolean return value
  end

  def self.available_locales
    configuration(:locales).properties['available_locales'] || [default_locale]
  end

  def self.default_locale
    locale_props = configuration(:locales)
    locale_props.properties[cname] || locale_props.properties['*'] || 'en'
  end

  def self.site_title
    set? ? strings.site_title : 'Socrata'
  end


  # CurrentDomain['preference name'] returns properties
  def self.[](key)
    properties.send(key)
  end

  def self.method_missing(key, *args)
    key = key.to_s

    # If they ask for .something?, assume they're asking about the something feature
    if key =~ /\?$/
      return properties['features.' + key.gsub(/\?$/, '')] == true
    end

    ## Otherwise, assume we're looking for a property
    properties.send(key)
  end

  def self.member?(user)
    !!(user && user.rights && user.rights.size > 0)
  end

  def self.user_can?(user, action)
    !!(user && user.has_right?(action))
  end

  def self.truthy?(key)
    properties[key.to_s].to_s == 'true' # TrueClass.to_s => 'true'
  end

  private

  def self.current_theme
    default_config
  end

  def self.generate_cache_key(key)
    "domains.#{key}.updated_at"
  end

end
