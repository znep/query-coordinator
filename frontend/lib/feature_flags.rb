require 'feature_flags/getters'

class FeatureFlags

  class << self

    def merge(base = {}, other = {})
      flags = Hashie::Mash.new
      other_with_indifferent_access = other.with_indifferent_access
      descriptions.each do |flag, config|
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

    def flag_set_by_user?(flag)
      return false unless using_signaller?

      Signaller.for(flag: flag_name).source(on_domain: domain) == 'domain'
    end

    def set_value(flag_name, flag_value, options = {})
      return unless using_signaller?

      auth_header = { 'Cookie' => "_core_session_id=#{User.current_user.session_token}" }
      Signaller.for(flag: flag_name).set(on_domain: options[:domain],
                                         to_value: flag_value,
                                         authorization: auth_header)
    end

    def reset_value(flag_name, options = {})
      auth_header = { 'Cookie' => "_core_session_id=#{User.current_user.session_token}" }
      Signaller.for(flag: flag_name).reset(on_domain: options[:domain],
                                           authorization: auth_header)
    end

    def descriptions
      Signaller::FeatureFlags.configs
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
      process_value(descriptions.dig(flag, 'defaultValue'))
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
