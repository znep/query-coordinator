# This service queries the consul k/v store and gets the version of storyteller
# that should be active. We compare the current app's version to the one in the
# k/v store and if it doesn't match, we shouldn't report ourselves as active.
#
# This service is used in the ConsulChecksController#active endpoint.

class StorytellerService

  CONSUL_KEYS = {
    :version => 'storyteller/active_version'
  }

  def self.active?
    active_version = consul_reported_version
    active_version.nil? || active_version == Rails.application.config.version
  end

  private

  def self.consul_reported_version
    active_version = nil

    begin
      active_version = Diplomat::Kv.get(CONSUL_KEYS[:version])
      Rails.cache.write("consul:#{CONSUL_KEYS[:version]}", active_version, expires_in: 12.hours)
    rescue Diplomat::KeyNotFound => error
      Rails.logger.warn("Failed to find Consul KV #{CONSUL_KEYS[:version]}: #{error.message}")
    rescue Faraday::ConnectionFailed => error
      Rails.logger.warn("Unable to connect to Consul: #{error.message}")
    end

    active_version || Rails.cache.read("consul:#{CONSUL_KEYS[:version]}")
  end
end
