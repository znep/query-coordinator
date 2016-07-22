class Page < Model

  # Implements an mtime-keyed cache of pages.
  # The mtime is jointly updated from core and frontend, and lives in memcache.
  #
  # There are inherent issues with using memcache as a distributed key-value store,
  # so we hope to do things better soon. The root issue is that page updates do not
  # go through frontend (direct PUT to core). We should at least query core for the
  # pages mtime, not memcache.
  #
  # Note that currently core doesn't share memcached instances in certain environments,
  # so the cache won't always update... resolution pending.
  class PageCache
    require 'snappy'

    # Fetch the cached pages list.
    def self.pages
      # The pages dataset can easily exceed the size limit of memcached (4MB as of this writing)
      # so we use snappy to compress it.
      cache_key = fetch_cache_key
      ds_raw = Rails.cache.read(cache_key, :raw => true)
      Marshal.load(Snappy.inflate(ds_raw)) unless ds_raw.nil?
    end

    # Replace the cached pages list with the given pages.
    def self.cache_pages(new_pages)
      cache_data = {}
      new_pages.each { |page| add_page(page, cache_data) }
      # Beware; there is a minor risk that cache_data may exceed the size limit of memcached
      write(cache_data)

      cache_data
    end

    # Update a particular page in the cache.
    def self.update_page(page)
      cache_data = pages
      unless current_pages.nil?
        add_page(page, cache_data, true)
        write(cache_data)
      end
    end

    # Invalidate the cache for all pages in this domain.
    def self.clear
      # Advance the mtime, so all cache keys generated in the past are no longer referenced.
      mtime = Time.now.to_i

      # Cache the modification times of the pages dataset for a week; so that
      # the pages mtime can be used for long-lived cache entires.
      expiry_time_minutes = 10080

      # Invalidation:
      #   If the pages dataset gets updated; the generic pages resource mtime
      #   will change from the core server. On the next call to fetch_cache_key
      #   the cache_time method will be called and the new maximum age will be
      #   selected as the mtime; invalidating any existing ds object entries.
      VersionAuthority.set_paths_mtime((mtime * 1000).to_s, expiry_time_minutes)
      VersionAuthority.set_resource('pages', mtime.to_s, expiry_time_minutes)
    end


    # The point in time this cache is valid for.
    def self.mtime
      [(VersionAuthority.paths_mtime.to_i / 1000).to_s || Time.now.to_i.to_s,
        VersionAuthority.resource('pages') || Time.now.to_i.to_s].max
    end

    private

    # mtime-sensitive cache key.
    # Fetched from memcache because presumably core can update it too,
    # though this is horrible practice.
    def self.fetch_cache_key
      AppHelper.instance.cache_key("page-dataset-v2-snappy", {
        'domain' => CurrentDomain.cname,
        'updated' => mtime
      })
    end

    def self.write(cache_data)
      clear # ensure mtime is cached

      cache_key = fetch_cache_key
      Rails.logger.info("Writing pages data to cache key: #{cache_key}")
      snapped = Snappy.deflate(Marshal.dump(cache_data))
      Rails.logger.info("Compressed size of pages structure #{snapped.size}")
      expiry = FeatureFlags.value_for(:zealous_dataslate_cache_expiry) || 24.hours
      Rails.cache.write(fetch_cache_key, snapped, :expires_in => expiry, :raw => true)
    end

    def self.add_page(item, cache_data, is_update = false)
      cur_obj = cache_data
      item.path.split('/').each do |part|
        part = ':var' if part.starts_with?(':')
        cur_obj[part] ||= {}
        cur_obj = cur_obj[part]
      end
      key = ':' + item.format
      if cur_obj.has_key?(key) && !is_update
        Rails.logger.error "***************** Routing collision! #{item.path}"
        # Shouldn't overload our messaging since it only happens when the
        # paths are regenerated, which shouldn't be too often
        Thread.new do
          # be chivalrous
          Thread.pass

          # EN-6285 - Address Frontend app Airbrake errors
          #
          # Starting on 04/22/2016 we started to see this error come up on a
          # variety of domains on a regular basis. After some discussion with
          # Michael Chui, who referred me to EN-1673, we came to the conclusion
          # that this notification is not directly actionable and as such
          # should not be notifying Airbrake. We will continue to log, however.
          #
          # The notification code is, in this case, left in place in case someone
          # else can use it for context when investigating the underlying cause.
          #
          # The entire thread thing is probably now unnecessary, but I'm hesitant
          # to make changes to this file beyond what is minimally necessary. :-(
          #
          # Airbrake.notify(:error_class => "Canvas Routing Error on #{CurrentDomain.cname}",
          #                 :error_message => "Canvas Routing Error on #{CurrentDomain.cname}: Routing collision, skipping #{item.path}",
          #                :session => {:domain => CurrentDomain.cname},
          #                :parameters => {:duplicate_config => item})
        end
      else
        cur_obj[key] = item
      end
    end
  end

  def self.find( options = nil, custom_headers = {}, batch = nil, is_anon = false )
    if options.nil?
      options = Hash.new
    end
    if options.is_a? String
      path = "/pages/#{options}.json"
      page = parse(CoreServer::Base.connection.get_request(path, custom_headers, batch, is_anon))
      return page
    end


    # If fetching by ID with additional args, handle specially
    if !options[:id].nil?
      path = "/pages.json?#{options.to_param}"
      page = parse(CoreServer::Base.connection.get_request(path, custom_headers, batch, is_anon))
      return page
    end

    # Fetch real service
    base_path = "/pages.json"
    svc_path = base_path
    if options.respond_to?(:to_param) && !options.to_param.blank?
      svc_options = options.clone.with_indifferent_access
      svc_options.delete('$select')
      svc_options.delete('$order')
      svc_path += "?#{svc_options.to_param}"
    end
    result = CoreServer::Base.connection.get_request(svc_path, custom_headers, batch, is_anon)
    pages = parse(result)

    # Set up index of existing paths to check against
    svc_paths = {}
    pages.each { |p| svc_paths[p.index_path + '|' + p.format] = true }

    # Then dataset, and merge
    ds_path = '/id' + base_path
    if options.respond_to?(:to_param) && !options.to_param.blank?
      ds_options = options.clone.with_indifferent_access
      ds_options.delete('method')
      ds_options.delete('status') if ds_options['status'] == 'all'
      ds_path += "?#{ds_options.to_param}"
    end
    # For when the Pages dataset doesn't exist
    begin
      result = CoreServer::Base.connection.get_request(ds_path, custom_headers, batch, is_anon)
      parse(result).each { |p| pages.push(p) if !svc_paths[p.index_path + '|' + p.format] }
    rescue CoreServer::ResourceNotFound
      # Nothing; we just don't merge
    end

    sort = (options['order'] || options['$order'] || 'name').split(' ')
    sort[0] = sort[0].slice(1, sort[0].length) if sort[0].start_with?(':')
    sort[0] = sort[0].to_sym
    sort[0] = :name if pages.length < 1 || !pages[0].respond_to?(sort[0])
    pages.sort_by! { |p| p.send(sort[0]) }
    pages.reverse! if sort.length > 1 && sort[1] == 'desc'

    pages
  end

  def self.find_by_uid(uid, custom_headers = {}, batch = nil, is_anon = false)
    path = "/pages/#{uid}.json"
    parse(with_path(path, custom_headers, batch, is_anon))
  end

  def self.find_by_unique_path(path, custom_headers = {}, batch = nil, is_anon = false )
    path = "/pages.json?method=getPageByPath&path=#{path}"
    parse(with_path(path, custom_headers, batch, is_anon))
  end

  def self.last_updated_at(uid, custom_headers = {})
    path = "/pages/#{uid}.json?method=getLastUpdated"
    timestamp = with_path(path, custom_headers)
    Time.at(timestamp.strip.to_i) unless timestamp.nil?
  end

  def self.with_path(path, custom_headers = {}, batch = nil, is_anon = false)
    begin
      CoreServer::Base.connection.get_request(path, custom_headers, batch, is_anon)
    rescue CoreServer::ResourceNotFound
      nil
    rescue CoreServer::CoreServerError => e
      case e.error_code.to_sym
        when :authentication_required then nil
        when :permission_denied then nil
        else raise
      end
    end
  end

  def set_context(vars)
    if vars.is_a?(Array)
      var_hash = {}
      path.split('/').each do |part|
        var_hash[part.slice(1, part.length)] = vars.shift if part.starts_with?(':')
      end
      vars = var_hash
    end
    Canvas2::Util.add_vars(vars) if vars.is_a?(Hash)
    return !(!data.nil? && !data.empty? && !Canvas2::DataContext.load(data))
  end

  def render(full = true)
    if full
      @timings = []
      [Canvas2::CanvasWidget.from_config_root(content, self)].flatten.map do |w|
        r = w.render
        @timings.push(r[2])
        r[0]
      end.join('')
    else
      '<div id="' + content['id'] + '"></div>'
    end
  end

  def render_timings
    (@timings || []).compact
  end

  def generate_file(type)
    [Canvas2::CanvasWidget.from_config_root(content, self)].flatten.map do |w|
      w.generate_file(type)
    end.join('')
  end

  def index_path
    p = @update_data['path'] || @data['path']
    p.gsub(':[^/]+', ':')
  end

  def name
    n = @update_data['name'] || @data['name']
    begin
      n = JSON.parse(n) if !n.blank?
    rescue JSON::ParserError
    end
    r = Canvas2::Util.string_substitute(n, Canvas2::Util.base_resolver)
    # Name _must_ be a string, so fall back to en locale if it didn't localize properly
    r = Canvas2::Util.localize(r, 'en') if r.is_a?(Hash)
    r
  end

  def content
    @update_data['content'] || @data['content'] ||
      (@update_data['content'] = { 'type' => 'Container', 'id' => 'defaultRoot' })
  end

  # DANGER! This method overrides the attr_accessor defined in the base class.
  def data
    @update_data['data'] || @data['data']
  end

  def metadata
    @update_data['metadata'] || @data['metadata'] || {}
  end

  def redirect?
    metadata['redirect']
  end

  def redirect_info
    { path: metadata['redirect'],
      code: metadata['redirectCode'] || 301
    }
  end

  def cache_info
    @update_data['cacheInfo'] || @data['cacheInfo'] || {}
  end

  def updated_at
    @data['updatedAt'] || @data[':updated_at']
  end

  def owner_id
    @data['owner'] = User.set_up_model(@data['owner']) if @data['owner'].is_a?(Hash)
    return owner if !owner.is_a?(User)
    owner.id
  end

  def owner_user
    @data['owner'] = User.set_up_model(@data['owner']) if @data['owner'].is_a?(Hash)
    return owner if @data['owner'].nil? || @data['owner'].is_a?(User)
    User.find(owner.to_s)
  end

  def uneditable
    !content.blank? && (content['uneditable'] == true || content['uneditable'] == 'true')
  end

  def private_data?
    @data.key?('privateData') ? @data['privateData'] :
      !content.blank? && (content['privateData'] == true || content['privateData'] == 'true')
  end

  def viewable_by?(user)
    case permission
    when 'private'
      user.present? && (user.id == owner_id || user.has_right?(UserRights::EDIT_PAGES))
    when 'domain_private'
      user.present? && (user.id == owner_id || !CurrentDomain.member?(user))
    when 'public'
      true
    end
  end

  def full_path(ext = nil)
    @full_path ||=
      begin
        full_path = "/#{path}"
        full_path << ".#{ext}" if ext.present?
        full_path
      end
  end

  def homepage?
    @homepage ||= full_path == '/'
  end

  def format
    @data['format'] || (metadata['export'] ? 'export' : 'web')
  end

  def max_age
    cache_info['max_age'] || !content.blank? && content['maxAge']
  end

  def body_class
    content['bodyClass'] || ''
  end

  def self.[](path, ext, user = nil)
    # Fetch the mtime from us and/or core. This is not a good idea,
    # as core does not necessarily use our same page cache.
    # Fix in discussion.
    mtime = PageCache.mtime

    # Check the quick path lookup table.
    # Lookup stale?
    if (
      !(defined? @@path_quick_lookup) ||
      !(defined? @@path_quick_lookup_update_time) ||
      (mtime > @@path_quick_lookup_update_time)
    )
      @@path_quick_lookup = {}
      @@path_quick_lookup_update_time = mtime
    end

    # Have we previously initialized the quick lookup for this domain?
    unless @@path_quick_lookup[CurrentDomain.cname]
      # This can be expensive, so hold on to a reference for below.
      pages = get_pages
      @@path_quick_lookup[CurrentDomain.cname] = generate_quick_path_lookup_hash(pages)
    end

    # Is the path in the quick path lookup?
    unless lookup_page_by_path(@@path_quick_lookup[CurrentDomain.cname], path, ext)[:page]
      # Nope, bail.
      return nil
    end

    # Get the pages if we haven't yet.
    pages = get_pages if pages.blank?

    search_result = lookup_page_by_path(pages, path, ext)

    page = search_result[:page]

    if !page.nil? && !page.uid.nil? # TODO what is page.uid.nil? catching?
      page = find(method: 'getPageRouting', id: page.uid)
      search_result[:page] = page

      if (FeatureFlags.value_for(:validate_fragment_cache_before_render))
        if (VersionAuthority.page_mtime(page.uid).to_i / 1000) <= page.updatedAt
          PageCache.clear
          VersionAuthority.set_page_mtime(page.uid, page.updatedAt)
        end
      else
        # Old behavior that won't work if core isn't writing to VersionAuthority.page_mtime.
        # Delete asap.
        #
        # If cache marked stale by core, re-fetch.
        if (VersionAuthority.page_mtime(page.uid).to_i / 1000) > page.updatedAt
          page = find(method: 'getPageRouting', id: page.uid)
          PageCache.update_page(page)
          search_result[:page] = page
        end
      end

      # Now check permissions
      case page.permission
      when 'private'
        return nil if user.nil? ||
          (user.id != page.owner_id && !user.has_right?(UserRights::EDIT_PAGES))
      when 'domain_private'
        return nil if user.nil? ||
          (user.id != page.owner_id && !CurrentDomain.member?(user))
      when 'public'
        # Yay, they can view it
      end
    end

    search_result.values_at(:page, :vars)
  end

  def self.parse(data)
    return nil if data.blank?

    json_data = nil

    begin
      json_data = JSON.parse(data, {:max_nesting => 35})
    rescue JSON::ParserError
      # EN-6886 - Fix another JSON::ParserError
      #
      # Add more specific logging around this error, which happens when a JSON
      # response from CoreServer is malformed (it has been observed to be
      # apparently valid JSON that has been truncated in addition to HTML error
      # pages from nginx).
      if data.start_with?('<html>')
        error_message = "It appears that CoreServer was unreachable: "\
          "#{data.inspect}"
      else
        error_message = "CoreServer responded with truncated and/or "\
          "invalid JSON: #{data.inspect}"
      end

      Airbrake.notify(
        :error_class => "Failed to parse invalid JSON",
        :error_message => error_message,
        :session => {:domain => CurrentDomain.cname}
      )
      return nil
    end

    return self.set_up_model(json_data)
  end

  def self.path_exists?(cur_path)
    cur_path = cur_path.split('/').map { |part| part.starts_with?(':') ? ':var' : part }.join('/')
    # TODO: better way to handle this w/ service?
    find(method: 'getRouting').any? do |p|
      cur_path == p.path.split('/').map { |part| part.starts_with?(':') ? ':var' : part }.join('/')
    end
  end

  def self.create(attributes, custom_headers = {})
    # Status should eventually start as unpublished
    attributes = {content: { type: 'Container', id: 'pageRoot' }}.merge(attributes)
    path = "/pages.json"

    new_page = parse(CoreServer::Base.connection.
      create_request(path, attributes.to_json, custom_headers)
    )

    PageCache.clear

    new_page
  end

private

  def self.get_pages
    cached = PageCache.pages

    if cached.nil?
      PageCache.cache_pages(find(status: 'published', method: 'getRouting'))
    else
      cached
    end
  end

  def self.generate_quick_path_lookup_hash(path_hash)
    obj = {}
    path_hash.each do |k, v|
      obj[k] = (k == ':web' || k == ':export') ? true : generate_quick_path_lookup_hash(v)
    end

    obj
  end

  def self.lookup_page_by_path(paths, path, ext)
    cur_obj = paths
    vars = []
    path.split('/').each do |part|
      p = part
      p = ':var' if !cur_obj.has_key?(p)
      return { page: nil, vars: nil } if !cur_obj.has_key?(p)
      cur_obj = cur_obj[p]
      vars.push(part) if p == ':var'
    end
    # Currently has an extension iff it is export
    key = ext == 'csv' || ext == 'xlsx' ? ':export' : ':web'

    {
      page: cur_obj[key],
      vars: vars
    }
  end

end

class AppHelper
  include Singleton
  include ApplicationHelper
end
