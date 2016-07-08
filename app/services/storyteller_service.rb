# This service queries the consul k/v store and gets the version of storyteller
# that should be active. We compare the current app's version to the one in the
# k/v store and if it doesn't match, we shouldn't report ourselves as active.
#
# This service is used in the ConsulChecksController#active endpoint.

class StorytellerService

  CONSUL_KEYS = {
    version: 'storyteller/active_version',
    downtime: 'config/frontend/downtime'
  }

  def self.active?
    active_version = consul_reported_version
    active_version.nil? || active_version == Rails.application.config.version
  end

  def self.downtimes
    consul_reported_downtimes || []
  end

  private

  def self.consul_reported_version
    active_version = nil

    begin
      active_version = Diplomat::Kv.get(CONSUL_KEYS[:version])
      Rails.cache.write("consul:#{CONSUL_KEYS[:version]}", active_version, expires_in: 12.hours)
    rescue Diplomat::KeyNotFound => error
      Rails.logger.warn("Failed to find Consul KV #{CONSUL_KEYS[:version]}: #{error.message}")
    rescue Diplomat::UnknownStatus => error
      Rails.logger.warn("Received non-success status from Consul: #{error.message}")
    rescue Faraday::ConnectionFailed => error
      Rails.logger.warn("Unable to connect to Consul: #{error.message}")
    end

    active_version || Rails.cache.read("consul:#{CONSUL_KEYS[:version]}")
  end

  def self.consul_reported_downtimes
    downtimes = nil

    begin
      # within a given environment, downtimes may be specified as a hash or array of hashes
      downtime_config = if Rails.env.development?
        IO.read(Rails.root.join('config/downtime.yml'))
      else
        Diplomat::Kv.get(CONSUL_KEYS[:downtime])
      end
      downtimes = [YAML.load(downtime_config).try(:[], Rails.application.config.downtime_config_env)].flatten.compact
    rescue Psych::SyntaxError => error
      Rails.logger.warn("Invalid YAML in Consul KV #{CONSUL_KEYS[:downtime]}: #{error.message}")
    rescue Diplomat::KeyNotFound => error
      Rails.logger.warn("Failed to find Consul KV #{CONSUL_KEYS[:downtime]}: #{error.message}")
    rescue Diplomat::UnknownStatus => error
      Rails.logger.warn("Received non-success status from Consul: #{error.message}")
    rescue Faraday::ConnectionFailed => error
      Rails.logger.warn("Unable to connect to Consul: #{error.message}")
    end

    downtimes
  end
end
