#
# Helper for setting and reading headers for conditional requests against a given
# Manifest object. We want to know the ETag hash, so we generate, set, and check it
# ourselves.
#
module ConditionalRequestHandler

  def self.set_conditional_request_headers(response, manifest)
    return if manifest.nil?
    response.headers[ETAG] = manifest.hash
    response.headers[LAST_MODIFIED] = manifest.last_mtime.httpdate
    # The cache-control settings are conservative here.
    # public/private
    # If "public", apache mod_cache will perform their own caching; they may serve 200's
    # and do the conditional request to the frontend. This can be incorrect because
    # rails may say it is returning a 304 but a 200 is sent from apache.
    #
    # max-age=0 means that some caching servers can serve stale pages, as opposed to no-cache which
    # means a successful validation must always occur. "no-cache" does not prevent storage, it is
    # just a stricter form of validation.
    response.headers[CACHE_CONTROL] = "must-revalidate, no-cache, private"
    # Set a special header for testing
    response.headers[X_SOCRATA_CONDITIONAL] = "#{response.headers[ETAG]},#{response.headers[LAST_MODIFIED]}"

  end

  # Given a VersionAuthority::Manifest, check the request for conditional
  # headers which would allow us to return a 304
  def self.check_conditional_request?(request, manifest)
    return false if manifest.nil?
    # check manifest hash
    return true if etag_matches_hash?(request, manifest.hash)
    return true if !request.if_modified_since.nil? && request.if_modified_since > manifest.last_mtime
    false
  end

  private

  LAST_MODIFIED = "Last-Modified".freeze
  ETAG          = "ETag".freeze
  CACHE_CONTROL = "Cache-Control".freeze
  X_SOCRATA_CONDITIONAL = "X-Socrata-Conditional".freeze

  #
  # Current version of rails doesn't have multiple etag tracking; so this will help
  #
  def self.etag_matches_hash?(request, manifest_hash)
    if !request.if_none_match.nil?
      request.if_none_match.split(/\s*,\s*/).each { |etag|
        return true if etag.gsub(/^\"|\"$/, "") == manifest_hash
      }
    end
    false
  end
end