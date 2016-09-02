require 'feature_flags/getters'

class FeatureFlags

  class << self

    def merge(base = {}, other = {})
      flags = Hashie::Mash.new
      other_with_indifferent_access = other.with_indifferent_access
      ExternalConfig.for(:feature_flag).each do |flag, config|
        expected_values = if config['expectedValues'].nil?
          nil
        else
          values = config['expectedValues'].split(' ')
          values += ['true', 'false'] unless config['disableTrueFalse']
          values
        end

        # No restrictions on value. Anything goes.
        if expected_values.nil?
          value = other_with_indifferent_access[flag]
          value = base[flag] if value.nil?
          flags[flag] = process_value(value)
        # Check the whitelist. true and false are always valid
        # We must to_s other[flag] because expectedValues is always a string (if present), unlike
        # the actual flag value which may be a bool or number.
        elsif expected_values.include?(other_with_indifferent_access[flag].to_s)
          flags[flag] = process_value(other_with_indifferent_access[flag])
        # Drop to default.
        else
          flags[flag] = process_value(base[flag])
        end
        flags[flag] = config['defaultValue'] if flags[flag].nil?
      end
      flags
    end

    def process_value(value)
      return nil if value.nil?

      begin
        JSON.parse("{\"valueString\": #{value}}")['valueString']
      rescue JSON::ParserError # This means it's a string!
        value
      end
    end

    def iframe_parameters(referer)
      begin
        Rack::Utils.parse_query(URI.parse(referer).query || '')
      rescue URI::InvalidURIError
        nil
      end
    end

    def feature_flag_signaller_uri
      APP_CONFIG.feature_flag_signaller_uri || ENV['FEATURE_FLAG_SIGNALLER_URI']
    end

    def using_signaller?
      feature_flag_signaller_uri.present?
    end

    def flag_set_by_user?(flag)
      return false unless using_signaller?

      FeatureFlags.get_value(flag)['source'] == 'domain'
    end

    def endpoint(options = {})
      @signaller_uri ||= URI.parse(feature_flag_signaller_uri)
      uri = @signaller_uri.dup
      uri.path =
        if options.key?(:with_path)
          options.fetch(:with_path)
        else options.key?(:for_flag)
          if options[:for_domain]
            "/flag/#{options.fetch(:for_flag)}/#{options.fetch(:for_domain)}.json"
          else
            "/flag/#{options.fetch(:for_flag)}.json"
          end
        end
      uri
    end

    def connect_to_signaller
      return unless using_signaller?

      begin
        yield
      rescue Errno::ECONNREFUSED
        raise RuntimeError.new('Error connecting to Feature Flag Signaller. Is it running?')
      end
    end

    def get_value(flag_name, options = {})
      return unless using_signaller?

      uri = endpoint(for_flag: flag_name, for_domain: options[:domain] || CurrentDomain.cname)
      connect_to_signaller { JSON.parse(HTTParty.get(uri))[flag_name] }
    end

    def set_value(flag_name, flag_value, options = {})
      return unless using_signaller?

      uri = endpoint(for_flag: flag_name, for_domain: options[:domain])
      body = flag_value.is_a?(String) ? flag_value : flag_value.to_json
      auth_header = { 'Cookie' => "_core_session_id=#{User.current_user.session_token}" }
      connect_to_signaller { HTTParty.put(uri, body: body, headers: auth_header) }
    end

    def reset_value(flag_name, options = {})
      uri = endpoint(for_flag: flag_name, for_domain: options[:domain])
      auth_header = { 'Cookie' => "_core_session_id=#{User.current_user.session_token}" }
      connect_to_signaller { HTTParty.delete(uri, headers: auth_header) }
    end

    def list
      ExternalConfig.for(:feature_flag).keys
    end

    def has?(key)
      ExternalConfig.for(:feature_flag).key?(key)
    end

    def categories
      ExternalConfig.for(:feature_flag).categories
    end

    def config_for(flag)
      ExternalConfig.for(:feature_flag)[flag]
    end

    def description_for(flag)
      config_for(flag)['description']
    end

    def default_for(flag)
      process_value((ExternalConfig.for(:feature_flag)[flag] || {})['defaultValue'])
    end

    def derive(view = nil, request = nil, is_iframe = false)
      flag_set = [ CurrentDomain.feature_flags ]
      flag_set << view.metadata.feature_flags if view.try(:metadata).present?
      if request.present?
        flag_set << request.query_parameters
        flag_set << iframe_parameters(request.referer) if is_iframe
      end

      flag_set.compact.inject({}) { |memo, other| merge(memo, other) }
    end

  end

end
