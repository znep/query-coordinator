# This service queries the consul k/v store and gets the version of storyteller
# that should be active. We compare the current app's version to the one in the
# k/v store and if it doesn't match, we shouldn't report ourselves as active.
#
# This service is used in the ConsulChecksController#active endpoint.

require 'httparty'

class StorytellerService

  def self.active?
    response = nil

    begin
      response = HTTParty.get(consul_active_version_url, timeout: Rails.application.config.consul_service_timeout)
    rescue => error
      Rails.logger.warn("Error while attempting to connect to #{consul_active_version_url}: (#{error.message})")
    end

    # Only return true when the version in the k/v store is identical to our own instance version.
    current_active_version(response) == Rails.application.config.version
  end

  private

  def self.current_active_version(response)
    active_version = nil

    if response.present? && response.ok?
      active_version_response = response.parsed_response

      active_version = active_version_from_response_json(active_version_response)
      if active_version
        # Save response in case we fail getting it later.
        Rails.cache.write(consul_active_version_url, active_version_response, expires_in: 12.hours)
      end
    end

    if active_version.blank?
      # Try and get the previously successful response.
      cached_response = Rails.cache.read(consul_active_version_url)
      unless cached_response.nil?
        active_version = active_version_from_response_json(cached_response)
      end
    end

    # If there is no value in the consul k/v store for the active storyteller version,
    # assume the current version of storyteller is the active version.
    active_version || Rails.application.config.version
  end

  def self.active_version_from_response_json(response)
    active_version_base64 = response.try(:first).try(:fetch, 'Value')
    unless active_version_base64.nil?
      Base64.decode64(active_version_base64).strip
    end
  end

  def self.consul_active_version_url
    "#{Rails.application.config.consul_service_uri}/v1/kv/storyteller/active_version"
  end
end
