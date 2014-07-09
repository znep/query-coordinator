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
require 'manifest.rb'

module VersionAuthority

  # The current mtime of a resource; as set by the core server. This is a shortcut
  # method for checking the status of a single resource. It is not reliable.
  def self.resource(name)
    Rails.cache.read(resource_key(name), :raw => true)
  end

  def self.set_resource(name, mtime, cacheTTL=15)
    Rails.cache.write(resource_key(name), mtime, :expires_in => cacheTTL.minutes)
  end

  def self.paths_mtime
    Rails.cache.read(pages_key, :raw => true)
  end

  def self.set_paths_mtime(mtime, cache_ttl = 15)
    Rails.cache.write(pages_key, mtime, :expires_in => cache_ttl.minutes)
  end

  def self.page_mtime(uid)
    Rails.cache.read(pages_key(uid), :raw => true)
  end

  # Given a path/user find the manifest associated with this domain and
  # return nil if the manifest is invalid or the hash of the retrieved manifest
  # if the manifest is valid. All manifests newer than checkAge are considered
  # valid
  def self.validate_manifest?(key, user, core_manifest_fetcher=method(:get_core_manifest))
    name = manifest_key(key, user)
    manifest = Rails.cache.read(name, :raw => true)
    if !manifest.nil?
      Rails.logger.info("Read manifest #{name} from cache #{manifest.to_json}")
      check_age = (manifest.max_age.minutes if manifest.max_age) || Rails.application.config.manifest_check_age
      cut_off_time = (Time.now - check_age).to_i
      datasets = []
      resources = []
      page = nil
      page_uid = nil
      searches = manifest.keys.select { |k|
        if k.to_s.match(/^search-views.*/)
          true
        elsif k.to_s.match(/^\w{4}-\w{4}/)
          datasets << k
          false
        elsif m = k.to_s.match(/^pageUid-(\w{4}-\w{4})/)
          page = k
          page_uid = m[1]
          false
        else
          resources << k
          false
        end
      }
      #  1. if the manifest contains a search; only check the last search time.
      #     if any search is older than checkAge, return nil
      searches.each {|s|
        return return_invalid("search") if manifest[s] < cut_off_time
      }
      #  2. if the manifest does not contain a search, and all the manifest entries
      #     are newer than checkAge; return the manifest hash
      return manifest if datasets.all? { |d| manifest[d] > cut_off_time } &&
                         resources.all? { |r| manifest[r] > cut_off_time } &&
                         (manifest[page].nil? || manifest[page] > cut_off_time)

      #  3. if there is no search, and the manifest contains entries older than checkAge
      #     ask the core server for the true manifest times and if the true manifest
      #     times are newer than the existing manifest times return nil. If any of the true
      #     manifest times are newer than the check_times return nil.
      #     if the core server returns fewer results than expected return nil.
      Rails.logger.info("Checking our manifest against the core server's version manifest")
      true_manifest = core_manifest_fetcher.call(datasets.sort, resources.sort, page_uid)
      return return_invalid("core-mismatch") if true_manifest.size !=
        ( datasets.size + resources.size + (page.nil? ? 0 : 1) )
      datasets.each {|d|
        return return_invalid("core-dataset", d) if (manifest[d].seconds * 1000) < true_manifest[d]
      }
      resources.each {|r|
        return return_invalid("core-resource", r) if (manifest[r].seconds * 1000) < true_manifest[r]
      }
      return return_invalid("core-page", page) if true_manifest[page].nil? ||
        (manifest[page].seconds * 1000) < true_manifest[page]

      #  4. If none of the above conditions apply return the manifest
      manifest
    else
      return_invalid("not-available")
    end
  end

  def self.return_invalid(type, id = nil)
    Rails.logger.info("Invalid manifest; #{type} #{id.nil? ? '' : id} has expired")
    domain_id = CurrentDomain.domain.nil? ? "all" : CurrentDomain.domain.id.to_s
    MetricQueue.instance.push_metric(domain_id + "-intern", "manifest-invalid-#{type}", 1)
    nil
  end

  def self.expire(key, user)
    name = manifest_key(key, user)
    manifest = Rails.cache.delete(name)
  end

  # set the manifest for a given path/user; domain is added implicitly
  # the manifest is a map of resource => check_time(long) - return a hash of
  # the manifest which can be used as part of the cache key.
  def self.set_manifest(key, user, manifest)
    name = manifest_key(key, user)
    Rails.logger.info("Writing manifest #{name} to cache #{manifest.to_json}")
    Rails.cache.write(name, manifest, :expires_in => 168.hours)
    manifest.hash
  end

  private

  # WARNING: These keys are shared with the core server
  def self.resource_key(name)
    "_dataset.version.#{CurrentDomain.domain.id}.#{name}"
  end

  def self.manifest_key(path, user)
    "_manifest.version.5.#{CurrentDomain.domain.id}.#{path}-#{user}"
  end

  def self.pages_key(uid = nil)
    "_pages.version.#{CurrentDomain.domain.id}" + (uid.nil? ? '' : ".#{uid}")
  end

  def self.get_core_manifest(datasets, resources, page)
    params = datasets.to_core_query("uid")
    rparams = resources.to_core_query("resource")
    path = "/manifest_version.json?#{params}&#{rparams}&pageUid=#{page}"
    result = CoreServer::Base.connection.get_request(path, {}, false)
    JSON.parse(result, :max_nesting => 25)
  end

  def self.get_core_dataset_mtime(dataset)
    path = "/manifest_version.json?uid=#{dataset}"
    result = CoreServer::Base.connection.get_request(path, {}, false)
    JSON.parse(result, :max_nesting => 25)
  end

end
