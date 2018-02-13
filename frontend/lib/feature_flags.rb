require 'feature_flags/getters'

class FeatureFlags

  class << self

    def service
      (APP_CONFIG.feature_flag_service || :signaller).to_sym
    end

    def service_class
      case service
      when :signaller then Signaller
      when :monitor then FeatureFlagMonitor
      end
    end

    def service_healthy?
      case service
      when :signaller then Signaller.healthy?
      when :monitor then true
      end
    end

    def on_domain(domain_or_cname)
      case service
      when :signaller then Signaller::FeatureFlags.on_domain(domain_or_cname)
      when :monitor then FeatureFlagMonitor.flags_on(domain: domain_or_cname)
      end
    end

    def get_value(flag_name, options = {})
      if service == :monitor
        domain = options[:domain] || CurrentDomain.cname
        return FeatureFlagMonitor.flag(name: flag_name, domain: domain)
      end
      return unless service_healthy?

      domain = options[:domain] || CurrentDomain.cname
      Signaller.for(flag: flag_name).value(on_domain: domain)
    end

    def set_value(flag_name, flag_value, options = {})
      if service == :monitor
        auth_header = { 'Cookie' => "_core_session_id=#{User.current_user.session_token}" }
        domain = options[:domain] || CurrentDomain.cname
        return FeatureFlagMonitor.set(flag: flag_name, value: flag_value,
                            domain: domain, authorization: auth_header)
      end
      return unless service_healthy?

      auth_header = { 'Cookie' => "_core_session_id=#{User.current_user.session_token}" }
      Signaller.for(flag: flag_name).set(on_domain: options[:domain],
                                         to_value: flag_value,
                                         authorization: auth_header)
      if APP_CONFIG.feature_flag_monitor_uri
        begin
          poke_ffm = [ '/poke', options[:domain] ].compact.join('/') << '.json'
          HTTParty.post(URI.join(APP_CONFIG.feature_flag_monitor_uri, poke_ffm),
                        body: {}.to_json, headers: auth_header)
        rescue Errno::ECONNREFUSED => e
          Rails.logger.warn('===========================================================================')
          Rails.logger.warn('Hello! It looks like you do not have Feature Flag Monitor running!')
          Rails.logger.warn('Please consider doing so at https://github.com/socrata/feature-flag-monitor')
          Rails.logger.warn('===========================================================================')
        end
      end
    end

    def reset_value(flag_name, options = {})
      if service == :monitor
        auth_header = { 'Cookie' => "_core_session_id=#{User.current_user.session_token}" }
        domain = options[:domain] || CurrentDomain.cname
        return FeatureFlagMonitor.reset(flag: flag_name, domain: domain, authorization: auth_header)
      end
      auth_header = { 'Cookie' => "_core_session_id=#{User.current_user.session_token}" }
      Signaller.for(flag: flag_name).reset(on_domain: options[:domain],
                                           authorization: auth_header)
      if APP_CONFIG.feature_flag_monitor_uri
        begin
          poke_ffm = [ '/poke', options[:domain] ].compact.join('/') << '.json'
          HTTParty.post(URI.join(APP_CONFIG.feature_flag_monitor_uri, poke_ffm),
                        body: {}.to_json, headers: auth_header)
        rescue Errno::ECONNREFUSED => e
          Rails.logger.warn('===========================================================================')
          Rails.logger.warn('Hello! It looks like you do not have Feature Flag Monitor running!')
          Rails.logger.warn('Please consider doing so at https://github.com/socrata/feature-flag-monitor')
          Rails.logger.warn('===========================================================================')
        end
      end
    end

    def descriptions(full: true)
      case service
      when :signaller then Signaller::FeatureFlags.configs.with_indifferent_access
      when :monitor then FeatureFlagMonitor.list(with_descriptions: full).with_indifferent_access
      end
    end

    def report(flag)
      case service
      when :signaller then Signaller.for(flag: flag).report
      when :monitor then FeatureFlagMonitor.report(for_flag: flag)
      end
    end

    def each(&block)
      descriptions.each(&block)
    end

    def list
      descriptions.keys
    end

    def has?(key)
      descriptions.key?(key)
    end

    def config_for(flag)
      descriptions[flag]
    end

    def description_for(flag)
      config_for(flag)['description']
    end

    def default_for(flag)
      case service
      when :signaller then Signaller.for(flag: flag).default_value
      when :monitor then FeatureFlagMonitor.list[flag]['defaultValue']
      end
    end

    def iframe_parameters(referer)
      begin
        Rack::Utils.parse_query(URI.parse(referer).query || '')
      rescue URI::InvalidURIError
        nil
      end
    end

    def derive(view = nil, request = nil, is_iframe = false)
      flag_set = [ CurrentDomain.feature_flags ]
      flag_set << view.metadata.feature_flags if view.try(:metadata).present?
      if request.present?
        flag_set << request.query_parameters
        flag_set << iframe_parameters(request.referer) if is_iframe
      end

      return flag_set.first if service == :monitor && flag_set.size == 1
      service_class::Utils.derive(*flag_set, configs: descriptions(full: false))
    end
  end
end
