require 'feature_flags/getters'

module FeatureFlags
  def self.merge(base = {}, other = {})
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

  def self.process_value(value)
    return nil if value.nil?

    begin
      JSON.parse("{\"valueString\": #{value}}")['valueString']
    rescue JSON::ParserError # This means it's a string!
      value
    end
  end

  def self.iframe_parameters(referer)
    begin
      Rack::Utils.parse_query(URI.parse(referer).query || '')
    rescue URI::InvalidURIError
      nil
    end
  end

  def self.using_signaller?
    !!APP_CONFIG.feature_flag_signaller_uri
  end

  def self.endpoint(options = {})
    @signaller_uri ||= URI.parse(APP_CONFIG.feature_flag_signaller_uri)
    uri = @signaller_uri.dup
    uri.path =
      if options.key?(:with_path) then options.fetch(:with_path)
      else options.key?(:for_flag)
        if options[:for_domain]
          "/flag/#{options.fetch(:for_flag)}/#{options.fetch(:for_domain)}.json"
        else
          "/flag/#{options.fetch(:for_flag)}.json"
        end
      end
    uri
  end

  def self.set_value(flag_name, flag_value, options = {})
    uri = endpoint(for_flag: flag_name, for_domain: options[:domain])
    body = flag_value.is_a?(String) ? flag_value : flag_value.to_json
    auth_header = { 'Cookie' => "_core_session_id=#{User.current_user.session_token}" }
    HTTParty.put(uri, body: body, headers: auth_header)
  end

  def self.reset_value(flag_name, options = {})
    uri = endpoint(for_flag: flag_name, for_domain: options[:domain])
    auth_header = { 'Cookie' => "_core_session_id=#{User.current_user.session_token}" }
    HTTParty.delete(uri, headers: auth_header)
  end

  def self.list
    ExternalConfig.for(:feature_flag).keys
  end

  def self.has?(key)
    ExternalConfig.for(:feature_flag).key? key
  end

  def self.categories
    ExternalConfig.for(:feature_flag).categories
  end

  def self.config_for(flag)
    ExternalConfig.for(:feature_flag)[flag]
  end

  def self.default_for(flag)
    process_value((ExternalConfig.for(:feature_flag)[flag] || {})['defaultValue'])
  end

  def self.derive(view = nil, request = nil, is_iframe = false)
    flag_set = [ CurrentDomain.feature_flags ]
    flag_set << view.metadata.feature_flags if view.try(:metadata).present?
    if request.present?
      flag_set << request.query_parameters
      flag_set << iframe_parameters(request.referer) if is_iframe
    end

    flag_set.compact.inject({}) { |memo, other| merge(memo, other) }
  end
end
