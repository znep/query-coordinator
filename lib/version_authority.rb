#  Manifest tracking
#
#  Each url/current-user/domain has an associated manifest
#  containing a list of dataset resources and associated check_times
#  the manifest also contains a list of searches with the check_times of
#  the search generated during the page rendering process from the
#  DataContext. The frontend stores the manifest in memcached.
#
#  The frontend can compare it's manifest to one returned by the core server.
#
module VersionAuthority

  class Manifest
    @manifest = {}
    def add_resource(name, mtime)
      @manifest[name] = mtime
    end
  end

  # The current mtime of a resource; as set by the core server. This is a shortcut
  # method for checking the status of a single resource. It is not reliable.
  def self.resource(name)
    Rails.cache.read(resource_key(name), :raw => true)
  end

  def self.set_resource(name, mtime, cacheTTL=15)
    Rails.cache.write(resource_key(name), mtime, :expires_in => cacheTTL.minutes)
  end

  # Given a path/user find the manifest associated with this domain and
  # return 0 if the manifest is invalid or the hash of the retrieved manifest
  # if the manifest is valid. All manifests newer than checkAge are considered
  # valid
  def self.validate_manifest?(path, user, checkAge=15, core_manifest_fetcher=method(:get_core_manifest))
    name = manifest_key(path, user)
    manifest = Rails.cache.read(name, :raw => true)
    if !manifest.nil?
      cut_off_time = (Time.now - checkAge.minutes).to_i
      datasets = []
      searches = manifest.keys.select { |k|
        if k.to_s.match(/^search-views.*/).nil?
          datasets << k
          false
        else
          true
        end
      }
      #  1. if the manifest contains a search; only check the last search time.
      #     if any search is older than checkAge, return false
      searches.each {|s|
          return false if manifest[s] < cut_off_time
      }
      #  2. if the manifest does not contain a search, and all the manifest entries
      #     are newer than checkAge; return true
      return true if datasets.all? { |d| manifest[d] > cut_off_time }
      #  3. if there is no search, and the manifest contains entries older than checkAge
      #     ask the core server for the true manifest times and if the true manifest
      #     times are newer than the existing manifest times return false. If any of the true
      #     manifest times are newer than the check_times return false.
      #     if the core server returns fewer results than expected return false.
      true_manifest = core_manifest_fetcher.call(datasets)
      return false if true_manifest.size != datasets.size
      datasets.each {|d|
        return false if (manifest[d].seconds * 1000) < true_manifest[d]
        }
      #  4. If none of the above conditions apply return true
      true
    else
      false
    end
  end

  # set the manifest for a given path/user; domain is added implicitly
  # the manifest is a map of resource => check_time(long) - return a hash of
  # the manifest which can be used as part of the cache key.
  def self.set_manifest(path, user, manifest)
    name = manifest_key(path, user)
    manifest.each { |r, mtime|
      if !r.is_a?(String) || !mtime.is_a?(Integer)
        Rails.logger.info("INVALID MANIFEST for key #{name}")
        return 0
      end
    }
    Rails.cache.write(name, manifest, :expires_in => 24.hours)
    Digest::MD5.hexdigest(manifest.to_json)
  end

  private

  def self.resource_key(name)
    "_dataset.version.#{CurrentDomain.domain.id}.#{name}"
  end

  def self.manifest_key(path, user)
    "_manifest.version.#{CurrentDomain.domain.id}.#{path}-#{user}"
  end

  def self.get_core_manifest(datasets)
    params = datasets.to_core_query("uid")
    path = "/manifest_version.json?#{params}"
    result = CoreServer::Base.connection.get_request(path, {}, false)
    JSON.parse(result, :max_nesting => 25)
  end

end
