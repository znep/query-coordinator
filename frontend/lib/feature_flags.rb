require 'feature_flags/getters'

class FeatureFlags

  class << self

    def using_signaller?
      Signaller.healthy?
    end

    def on_domain(domain_or_cname)
      Signaller::FeatureFlags.on_domain(domain_or_cname)
    end

    def get_value(flag_name, options = {})
      return unless using_signaller?

      domain = options[:domain] || CurrentDomain.cname
      Signaller.for(flag: flag_name).value(on_domain: domain)
    end

    def set_value(flag_name, flag_value, options = {})
      return unless using_signaller?

      auth_header = { 'Cookie' => "_core_session_id=#{User.current_user.session_token}" }
      Signaller.for(flag: flag_name).set(on_domain: options[:domain],
                                         to_value: flag_value,
                                         authorization: auth_header)
      if AppConfig.feature_flag_monitor_uri
        poke_ffm = [ '/poke', options[:domain] ].compact.join('/') << '.json'
        HTTParty.post(URI.join(AppConfig.feature_flag_monitor_uri, poke_ffm),
                      body: {}.to_json, headers: auth_header)
      end
    end

    def reset_value(flag_name, options = {})
      auth_header = { 'Cookie' => "_core_session_id=#{User.current_user.session_token}" }
      Signaller.for(flag: flag_name).reset(on_domain: options[:domain],
                                           authorization: auth_header)
      if AppConfig.feature_flag_monitor_uri
        poke_ffm = [ '/poke', options[:domain] ].compact.join('/') << '.json'
        HTTParty.post(URI.join(AppConfig.feature_flag_monitor_uri, poke_ffm),
                      body: {}.to_json, headers: auth_header)
      end
    end

    def descriptions
      Signaller::FeatureFlags.configs.with_indifferent_access
    end

    def report(flag)
      Signaller.for(flag: flag).report
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

    def categories
      descriptions.categories
    end

    def config_for(flag)
      descriptions[flag]
    end

    def description_for(flag)
      config_for(flag)['description']
    end

    def default_for(flag)
      Signaller.for(flag: flag).default_value
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

      Signaller::Utils.derive(*flag_set, configs: descriptions)
    end
  end
end
