require 'time_extensions'
require 'hashie'
require 'core_server/errors'

class CurrentDomain
  REFRESH_CHECK_TIME = 10

  class << self

    def set(cname)
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

    def set?
      defined?(@@current_domain) && @@current_domain.present?
    end

    def reload(cname = nil)
      # Blow away the cached version of the domain,
      # forcing a refresh from the Core Server on configs and properties
      default_cname = @@current_domain[:data].cname
      cname ||= default_cname

      @@property_store.delete(cname)
      set(cname) if cname == default_cname
    end

    # Main properties
    def set_domain(domain)
      @@current_domain = {} unless defined?(@@current_domain)
      @@current_domain[:data] = domain
    end

    def domain_name
      @@current_domain[:data].name
    end

    # WTF This is isn't a domain object, it's a Hashie::Mash of the domain object data.
    def domain
      @@current_domain[:data]
    end

    def cname
      # We need to account for the case where we make a generic_request
      # before we know what domain we're on (eg to get the domain obj).
      (@@current_domain[:data].cname if defined?(@@current_domain)).to_s
    end

    def aliases
      (domain.try(:aliases).try(:split, ',') || []).compact
    end

    def cname_and_aliases
      [cname] + aliases
    end

    def short_name
      @@current_domain[:data].shortName
    end

    def accountTier
      @@current_domain[:data].accountTier
    end

    def organizationId
      @@current_domain[:data].organizationId
    end

    def flag_out_of_date!(cname)
      if Rails.env.development?
        reload(cname)
      else
        # By writing the time to this key, we're notifying all
        # frontend servers to reload this domain as soon as they notice
        Rails.cache.write(generate_cache_key(cname), Time.now)
      end
    end

    def needs_refresh_check?(cname)
      @@refresh_times ||= {}

      @@refresh_times[cname].nil? || (Time.now - @@refresh_times[cname]) > REFRESH_CHECK_TIME
    end

    def flag_refresh_checked!(cname)
      @@refresh_times[cname] = Time.now
    end

    def last_refresh(cname)
      value = Rails.cache.read(generate_cache_key(cname))
      value if value.is_a?(Time)
    end

    def check_for_theme_update(cname)
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

    def default_widget_customization_id
      if @@current_domain[:widget_customization].nil?
        # Use the given setting. Don't inherit.
        @@current_domain[:widget_customization] = Configuration.find_by_type('site_theme', true,
          CurrentDomain.cname, false).first.properties.sdp_template || false
        # a 'false' value indicates there is no default widget
      end

      @@current_domain[:widget_customization]
    end

    def set_default_widget_customization_id(id)
      begin
        current_theme.update_property('sdp_template', id)
      rescue
        # Something went wrong when we tried to update the property. Probably it
        # doesn't exist. Just create it.
        current_theme.create_property('sdp_template', id)
      end
    end

    def property(prop, config = 'site_theme')
      configuration(config.to_s).try(:properties).try(:[], prop)
    end

    def properties
      @@current_domain[:site_properties] ||= current_theme.try(:properties) || Hashie::Mash.new
    end

    def raw_properties
      @@current_domain[:site_properties_raw] ||= current_theme.try(:raw_properties) || Hashie::Mash.new
    end

    def templates(version = '2b', locale = nil)
      return properties.templates if version.to_i == 0

      # TODO: not sure how to safely per-request cache
      property_name = "templates_v#{version}"
      result = properties[property_name]
      result = result.merge(properties[property_name][locale] || {}) unless locale.nil?

      result
    end

    def theme(version = '2b')
      if version.to_i == 0
        properties.theme
      else
        properties["theme_v#{version}"]
      end || Hashie::Mash.new
    end

    def strings(locale = nil)
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

    def features
      @@current_domain[:data].features || Hashie::Mash.new
    end

    def feature_flags
      @@current_domain[:data].feature_flags || Hashie::Mash.new
    end

    def modules
      if @@current_domain[:modules].nil?
        @@current_domain[:modules] = ((@@current_domain[:data].data['accountModules'] || []) +
          (@@current_domain[:data].accountTier.data['accountModules'] || [])).uniq
      end

      @@current_domain[:modules]
    end

    def module_names
      @@current_domain[:module_names] ||= modules.pluck('name')
    end

    def default_config_id
      default_config.id
    end

    def default_config_updated_at
      default_config.updatedAt
    end

    def default_config
      @@current_domain[:data].default_configuration('site_theme')
    end

    def configuration(name)
      @@current_domain[:data].default_configuration(name)
    end

    def module_available?(name_or_set)
      return false if modules.nil?

      if name_or_set.is_a? Array
        name_or_set.any? { |module_name| module_names.include?(module_name.to_s) }
      else
        module_names.include?(name_or_set.to_s)
      end
    end

    def feature?(name_or_set)
      @@current_domain[:data].feature?(name_or_set)
    end

    # CAUTION! This method implementation differs from the method of the same name in the View class
    def module_enabled?(name_or_set)
      !!(module_available?(name_or_set) && feature?(name_or_set)) # Force boolean return value
    end

    def available_locales
      configuration(:locales).properties['available_locales'] || [default_locale]
    end

    def default_locale
      locale_props = configuration(:locales)
      locale_props.properties[cname] || locale_props.properties['*'] || 'en'
    end

    def site_title
      set? ? strings.site_title : 'Socrata'
    end


    # CurrentDomain['preference name'] returns properties
    def [](key)
      properties.send(key)
    end

    def method_missing(key, *args)
      key = key.to_s

      # If they ask for .something?, assume they're asking about the something feature
      if key =~ /\?$/
        return properties['features.' + key.gsub(/\?$/, '')] == true
      end

      ## Otherwise, assume we're looking for a property
      properties.send(key)
    end

    def member?(user)
      user.try(:rights).present?
    end

    def user_can?(user, action)
      !!(user && user.has_right?(action))
    end

    def truthy?(key)
      properties[key.to_s].to_s == 'true' # TrueClass.to_s => 'true'
    end

    # This method exists so we don't have to use :verify_stubs => false in RSpec
    def config_updated_at
      # If configUpdatedAt is nil, use a quantized 5 minute timestamp instead
      domain.configUpdatedAt || Time.now.quantize_to(300).to_i
    end
    alias :configUpdatedAt :config_updated_at

    def custom_facets
      property(:custom_facets, :catalog).try(:map, &:param) || []
    end

    private

    def current_theme
      default_config
    end

    def generate_cache_key(key)
      "domains.#{key}.updated_at"
    end

  end

end
