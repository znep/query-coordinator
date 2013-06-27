class Page < Model
  def self.find( options = nil, custom_headers = {}, batch = nil, is_anon = false )
    if options.nil?
      options = Hash.new
    end
    if options.is_a? String
      path = "/pages/#{options}.json"
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
      ds_options.delete('status') if ds_options['status'] == 'all'
      ds_path += "?#{ds_options.to_param}"
    end
    result = CoreServer::Base.connection.get_request(ds_path, custom_headers, batch, is_anon)
    parse(result).each { |p| pages.push(p) if !svc_paths[p.index_path + '|' + p.format] }

    sort = (options['order'] || options['$order'] || 'name').split(' ')
    sort[0] = sort[0].slice(1, sort[0].length) if sort[0].start_with?(':')
    sort[0] = sort[0].to_sym
    sort[0] = :name if pages.length < 1 || !pages[0].respond_to?(sort[0])
    pages.sort_by! { |p| p.send(sort[0]) }
    pages.reverse! if sort.length > 1 && sort[1] == 'desc'

    pages
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
    Canvas2::Util.string_substitute(n, Canvas2::Util.base_resolver)
  end

  def content
    @update_data['content'] || @data['content'] ||
      (@update_data['content'] = { 'type' => 'Container', 'id' => 'defaultRoot' })
  end

  def data
    @update_data['data'] || @data['data']
  end

  def metadata
    @update_data['metadata'] || @data['metadata'] || {}
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

  def format
    @data['format'] || (metadata['export'] ? 'export' : 'web')
  end

  def max_age
    cache_info['max_age'] || !content.blank? && content['maxAge']
  end

  def self.[](path, ext)
    mtime = cache_time
    if !(defined? @@path_store) || !(defined? @@path_time) || (mtime > @@path_time)
      @@path_store = {}
      @@path_time = mtime
    end

    unless @@path_store[CurrentDomain.cname]
      ds = pages_data
      @@path_store[CurrentDomain.cname] = copy_paths(ds)
    end

    unless get_item(@@path_store[CurrentDomain.cname], path, ext)[0]
      return nil
    end

    ds = pages_data if ds.blank?
    results = get_item(ds, path, ext)
    # look up to see if modified
    page = results[0]
    return results if page.nil? || page.uid.nil?

    if (VersionAuthority.page_mtime(page.uid).to_i / 1000) > page.updatedAt
      page = find(page.uid)
      # Update cache if it exists
      cache_key = generate_cache_key
      ds = Rails.cache.read(cache_key)
      if !ds.nil?
        add_page(page, ds, true)
        Rails.cache.write(cache_key, ds)
      end
      results[0] = page
    end
    results
  end

  def self.parse(data)
    return nil if data.blank?
    return self.set_up_model(JSON.parse(data, {:max_nesting => 35}))
  end

  def self.path_exists?(cur_path)
    cur_path = cur_path.split('/').map { |part| part.starts_with?(':') ? ':var' : part }.join('/')
    # TODO: better way to handle this w/ service?
    find.any? do |p|
      cur_path == p.path.split('/').map { |part| part.starts_with?(':') ? ':var' : part }.join('/')
    end
  end

  def self.create(attributes, custom_headers = {})
    # Status should eventually start as unpublished
    attributes = {:content => { type: 'Container', id: 'pageRoot' }}.
      merge(attributes)
    path = "/pages.json"
    parse(CoreServer::Base.connection.
                 create_request(path, attributes.to_json, custom_headers))
  end

private
  def self.cache_time
    [(VersionAuthority.paths_mtime.to_i / 1000).to_s || Time.now.to_i.to_s,
      VersionAuthority.resource('pages') || Time.now.to_i.to_s].max
  end

  def self.pages_data()
    cache_key = generate_cache_key
    ds = Rails.cache.read(cache_key)

    if ds.nil?
      ds = {}
      VersionAuthority.set_paths_mtime((Time.now.to_i * 1000).to_s)
      find(:status => :published).each { |c| add_page(c, ds) }
      cache_key = generate_cache_key
      Rails.cache.write(cache_key, ds)
    end
    return ds
  end

  def self.add_page(item, cache_obj, is_update = false)
    cur_obj = cache_obj
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

        Airbrake.notify(:error_class => "Canvas Routing Error on #{CurrentDomain.cname}",
                        :error_message => "Canvas Routing Error on #{CurrentDomain.cname}: Routing collision, skipping #{item.path}",
                       :session => {:domain => CurrentDomain.cname},
                       :parameters => {:duplicate_config => item})
      end
    else
      cur_obj[key] = item
    end
  end

  def self.copy_paths(path_hash)
    obj = {}
    path_hash.each { |k, v| obj[k] = (k == ':web' || k == ':export') ? true : copy_paths(v) }
    return obj
  end

  def self.get_item(paths, path, ext)
    cur_obj = paths
    vars = []
    path.split('/').each do |part|
      p = part
      p = ':var' if !cur_obj.has_key?(p)
      return [nil, nil] if !cur_obj.has_key?(p)
      cur_obj = cur_obj[p]
      vars.push(part) if p == ':var'
    end
    # Currently has an extension iff it is export
    key = ext == 'csv' || ext == 'xlsx' ? ':export' : ':web'
    [cur_obj[key], vars]
  end

  def self.generate_cache_key
    app_helper.cache_key("page-dataset-v2", {
      'domain' => CurrentDomain.cname,
      'updated' => cache_time
    })
  end

  def self.app_helper
    AppHelper.instance
  end
end

class AppHelper
  include Singleton
  include ApplicationHelper
end
