#
# Helper for setting and reading headers for conditional requests against a given
# Manifest object. We want to know the ETag hash, so we generate, set, and check it
# ourselves.
#
module ConditionalRequestHandler

  def self.set_cache_control_headers(response, anonymous = false, maxAge = 15.minutes)
    # On pages which are anonymous we allow caching by proxies to maxAge, otherwise
    # we are very conservative. Even for pages which can be shared between logged-in
    # users we cannot allow proxy caching w/o edge-side includes.
    #
    # We include an additional header which should not be stomped by intermediate
    # caches for debugging and to provide a mechanism for socrata-controlled caches to
    # do something useful without needing to perform a regex on every request.
    #
    if anonymous
      response.headers[CACHE_CONTROL] = "public, max-age=" + maxAge.seconds.to_s
      response.headers[X_SOCRATA_CACHE_CONTROL] = "public"
    else
      response.headers[CACHE_CONTROL] = "private, no-cache, no-store, must-revalidate"
      response.headers[X_SOCRATA_CACHE_CONTROL] = "private"
    end
  end

  def self.set_conditional_request_headers(response, manifest)
    return if manifest.nil?
    response.headers[ETAG] = manifest.hash
    response.headers[LAST_MODIFIED] = Time.now.httpdate
    # Set a special header for testing
    response.headers[X_SOCRATA_CONDITIONAL] = "#{response.headers[ETAG]},#{response.headers[LAST_MODIFIED]}"
    Rails.logger.info("Setting conditional headers: #{response.headers[X_SOCRATA_CONDITIONAL]}")

  end

  # Given a VersionAuthority::Manifest, check the request for conditional
  # headers which would allow us to return a 304
  def self.check_conditional_request?(request, manifest)
    return false if manifest.nil?
    # check manifest hash
    return true if etag_matches_hash?(request, manifest.hash)
    return modified_since_matches?(request, manifest)
  end

  private

  LAST_MODIFIED = "Last-Modified".freeze
  ETAG          = "ETag".freeze
  CACHE_CONTROL = "Cache-Control".freeze
  X_SOCRATA_CONDITIONAL = "X-Socrata-Conditional".freeze
  X_SOCRATA_CACHE_CONTROL = "X-Socrata-Cache-Control".freeze

  def self.etag_exists?(request)
    !request.if_none_match.nil?
  end

  def self.modified_since_matches?(request, manifest)
    # if the etag check failed we can check the last modified
    return false if etag_exists?(request)
    if !request.if_modified_since.nil?
      Rails.logger.info("  Last-Modified-Since found: #{request.if_modified_since}")
      return true if request.if_modified_since > manifest.last_mtime
    end
    false
  end

  #
  # Current version of rails doesn't have multiple etag tracking; so this will help
  #
  def self.etag_matches_hash?(request, manifest_hash)
    if !request.if_none_match.nil?
      Rails.logger.info("  ETag found: #{request.if_none_match}")
      request.if_none_match.split(/\s*,\s*/).each { |etag|
        return true if etag.gsub(/^\"|\"$/, "") == manifest_hash
      }
    end
    false
  end
end