class FeatureFlags
  class Signaller
    class << self
      def available?
        base_uri.present?
      end

      def version
        read(endpoint: { with_path: '/version.json' }).
          each_with_object({}) do |(key, value), memo|
            memo[key.to_sym] =
              case key
                when 'signaller_version' then SemVer.parse(value)
                when 'feature_flags_mtime' then Time.at(value)
                else value
              end
          end
      end

      def write(endpoint_hash)
        return unless available?

        begin
          yield(endpoint(endpoint_hash))
          clear_throttler(cache_key_from_endpoint(endpoint_hash))
        rescue Errno::ECONNREFUSED
          raise RuntimeError.new('Error connecting to Feature Flag Signaller. Is it running?')
        end
      end

      def read(options = {})
        throttle_expiry = options.fetch(:expires_in, 5.seconds)

        cache_key = cache_key_from_endpoint(options.fetch(:endpoint))
        throttler_key = key_for_throttler(cache_key)
        last_known_good_key = key_for_last_known_good(cache_key)

        conditionally_mute do
          Rails.cache.fetch(throttler_key, expires_in: throttle_expiry) do
            begin
              HTTParty.get(endpoint(options.fetch(:endpoint)), format: :json).
                parsed_response.
                tap { | result| Rails.cache.write(last_known_good_key, result) }
            rescue => e
              Rails.cache.read(last_known_good_key).tap do |result|
                Rails.logger.error("Something nasty was returned from upstream: #{e.inspect}")
                if result.nil?
                  Rails.logger.error(
                    "Nothing found in last-known-good cache: #{last_known_good_key}"
                  )
                  raise
                end
              end
            end
          end
        end
      end

      def endpoint(options = {})
        @signaller_uri ||= URI.parse(base_uri)
        @signaller_uri.class.build(
          host: @signaller_uri.host,
          port: @signaller_uri.port,
          path: options.fetch(:with_path) do
            if options[:for_domain]
              "/flag/#{options.fetch(:for_flag)}/#{options.fetch(:for_domain)}.json"
            else
              "/flag/#{options.fetch(:for_flag)}.json"
            end
          end
        )
      end

      def conditionally_mute(&block)
        if ENV['LOG_FEATURE_FLAG_CACHING'].to_s.downcase == 'true'
          yield
        else
          Rails.cache.mute(&block)
        end
      end

      def base_uri
        APP_CONFIG.feature_flag_signaller_uri || ENV['FEATURE_FLAG_SIGNALLER_URI']
      end

      private
      def cache_key_from_endpoint(endpoint_hash)
        cache_key = endpoint_hash.fetch(:with_path, nil)
        if cache_key.present?
          cache_key.
            sub('.json', ''). # remove extension
            gsub(/\//, '_'). # convert slashes to underscorees
            sub(/^_/, '') # remove leading underscore
        else
          [ endpoint_hash[:for_flag], endpoint_hash[:for_domain] || 'environment' ].join(':')
        end
      end

      def key_for_throttler(cache_key)
        "feature_flags:throttler:#{cache_key}"
      end

      def key_for_last_known_good(cache_key)
        "feature_flags:last_known_good:#{cache_key}"
      end

      def clear_throttler(cache_key)
        Rails.cache.delete(key_for_throttler(cache_key))
      end
    end
  end
end
