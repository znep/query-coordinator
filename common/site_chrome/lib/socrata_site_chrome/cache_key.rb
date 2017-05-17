module SocrataSiteChrome
  class CacheKey
    # NOTE!! It is critical that the composition this cache key structurally match the corresponding
    # cache_key method in consuming applications. For example in the frontend, this is defined in the
    # frontend/app/models/configuration.rb class.
    def initialize(domain_config, config_type)
      @domain_config = domain_config
      @request_config = domain_config.try(:request_config)
      @config_type = config_type

      raise ArgumentError.new('Invalid domain_config for Site Chrome cache key') if [
        @domain_config,
        @request_config,
        @request_config.try(:[], :application),
        @request_config.try(:[], :cache_key_prefix),
        @domain_config.try(:cname),
        @domain_config.try(:config_updated_at)
      ].any?(&:blank?)

      raise ArgumentError.new('config_type must be present for Site Chrome cache key') if @config_type.blank?
    end

    def to_str
      [
        @request_config[:application],
        @request_config[:cache_key_prefix],
        'domain',
        @domain_config.cname,
        @domain_config.config_updated_at,
        'configurations',
        @config_type
      ].join(':')
    end

    alias to_s to_str

  end
end
