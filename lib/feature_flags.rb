module FeatureFlags
  def self.merge(base = {}, other = {})
    flags = Hashie::Mash.new
    FEATURE_FLAGS.each do |flag, config|
      # No restrictions on value. Anything goes.
      if config['expectedValues'].nil?
        value = other[flag]
        value = base[flag] if value.nil?
        flags[flag] = process_value(value)
      # Check the whitelist. true and false are always valid
      elsif config['expectedValues'].split(' ').concat(['true', 'false']).include?(other[flag])
        flags[flag] = process_value(other[flag])
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
      CGI.parse(URI.parse(referer).query || '')
    rescue URI::InvalidURIError
      nil
    end
  end

  def self.list
    FEATURE_FLAGS.keys
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
