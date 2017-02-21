module SocrataSiteChrome
  class CacheKey
    # NOTE!! It is critical that the composition this cache key structurally match the corresponding
    # cache_key method in consuming applications. For example in the frontend, this is defined in the
    # frontend/app/models/configuration.rb class.
    def self.cache_key_string(domain_config, config_type)
      request_config = domain_config.try(:request_config)
      raise 'Invalid domain_config for Site Chrome cache key' if [
        domain_config,
        request_config,
        request_config.try(:[], :application),
        request_config.try(:[], :cache_key_prefix),
        domain_config.try(:cname),
        domain_config.try(:config_updated_at)
      ].any?(&:blank?)

      raise 'config_type must be present for Site Chrome cache key' if config_type.blank?

      [
        request_config[:application],
        request_config[:cache_key_prefix],
        'domain',
        domain_config.cname,
        domain_config.config_updated_at,
        'configurations',
        config_type
      ].join(':')
    end
  end
end
