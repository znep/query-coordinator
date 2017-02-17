module SocrataSiteChrome
  class CacheKey
    # NOTE!! It is critical that the composition this cache key structurally match the corresponding
    # cache_key method in consuming applications. For example in the frontend, this is defined in the
    # frontend/app/models/configuration.rb class.
    def self.cache_key_string(domain_config, config_type)
      [
        domain_config.request_config[:application],
        domain_config.request_config[:cache_key_prefix],
        'domain',
        domain_config.cname,
        domain_config.config_updated_at,
        'configurations',
        config_type
      ].join(':')
    end
  end
end
