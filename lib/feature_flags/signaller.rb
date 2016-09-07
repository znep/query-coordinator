class FeatureFlags
  class Signaller
    class << self
      def available?
        base_uri.present?
      end

      def version
        read('version', endpoint: { with_path: '/version.json' }).
          each_with_object({}) do |(key, value), memo|
            memo[key.to_sym] =
              case key
                when 'signaller_version' then SemVer.parse(value)
                when 'feature_flags_mtime' then Time.at(value)
                else value
              end
          end
      end

      def write
        return unless available?

        begin
          yield
        rescue Errno::ECONNREFUSED
          raise RuntimeError.new('Error connecting to Feature Flag Signaller. Is it running?')
        end
      end

      def read(cache_key, options = {})
        namespace = options.fetch(:namespace, 'feature_flags')
        throttle_expiry = options.fetch(:expires_in, 5.seconds)

        lkg_key = "#{namespace}:last_known_good:#{cache_key}"
        thr_key = "#{namespace}:throttler:#{cache_key}"

        Rails.cache.fetch(thr_key, expires_in: throttle_expiry) do
          begin
            result =
              if options.key?(:endpoint)
                JSON.parse(HTTParty.get(endpoint(options.fetch(:endpoint))).body)
              else
                yield
              end
            Rails.cache.write(lkg_key, result)
            result
          rescue
            result = Rails.cache.read(lkg_key)
            Rails.logger.error('Something nasty was returned from Signaller')
            raise 'Nothing in cache.' if result.nil? # TODO: Raise a real error?
            result
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

      private
      def base_uri
        APP_CONFIG.feature_flag_signaller_uri || ENV['FEATURE_FLAG_SIGNALLER_URI']
      end
    end
  end
end
