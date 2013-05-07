class Page < SodaModel
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

  def locale
    @update_data['locale'] || @data['locale']
  end

  def metadata
    @update_data['metadata'] || @data['metadata'] || {}
  end

  def updated_at
    @data[':updated_at']
  end

  def owner_user
    u_id = owner
    return nil if u_id.nil? || u_id.blank?
    User.find(u_id)
  end

  def uneditable
    !content.blank? && (content['uneditable'] == true || content['uneditable'] == 'true')
  end

  def private_data?
    !content.blank?  && (content['privateData'] == true || content['privateData'] == 'true')
  end

  def page_type
    metadata['export'] ? 'export' : 'web'
  end

  def max_age
    !content.blank? && content['maxAge']
  end

  def self.[](path, ext, mtime)
    mtime ||= Time.now.to_i.to_s
    if !(defined? @@path_store) || !(defined? @@path_time) || (mtime > @@path_time)
      @@path_store = {}
      @@path_time = mtime
    end

    unless @@path_store[CurrentDomain.cname]
      ds = pages_data(mtime)
      @@path_store[CurrentDomain.cname] = copy_paths(ds)
    end

    unless get_item(@@path_store[CurrentDomain.cname], path, ext)[0]
      return nil
    end

    ds = pages_data(mtime) if ds.blank?
    get_item(ds, path, ext)
  end

  def self.parse(data)
    if data.blank?
      return nil
    end

    return self.set_up_model(JSON.parse(data, {:max_nesting => 35}))
  end

  def self.path_exists?(cur_path)
    cur_path = cur_path.split('/').map { |part| part.starts_with?(':') ? ':var' : part }.join('/')
    find.any? do |p|
      cur_path == p.path.split('/').map { |part| part.starts_with?(':') ? ':var' : part }.join('/')
    end
  end

  def self.create(attributes, custom_headers = {})
    # Status should eventually start as unpublished
    attributes = {:status => 'published', :content => { type: 'Container', id: 'pageRoot' }}.
      merge(attributes)
    path = "/id/pages.json"
    return parse(CoreServer::Base.connection.
                 create_request(path, attributes.to_json, custom_headers))
  end

private
  def self.pages_data(mtime)
    cache_key = generate_cache_key(mtime)
    ds = Rails.cache.read(cache_key)

    if ds.nil?
      ds = {}
      contents = find(:status => :published)
      contents.each do |c|
        cur_obj = ds
        c.path.split('/').each do |part|
          part = ':var' if part.starts_with?(':')
          cur_obj[part] ||= {}
          cur_obj = cur_obj[part]
        end
        key = ':' + c.page_type
        if cur_obj.has_key?(key)
          Rails.logger.error "***************** Routing collision! #{c.path}"
          # Shouldn't overload our messaging since it only happens when the
          # paths are regenerated, which shouldn't be too often
          Thread.new do
            # be chivalrous
            Thread.pass

            Airbrake.notify(:error_class => "Canvas Routing Error on #{CurrentDomain.cname}",
                            :error_message => "Canvas Routing Error on #{CurrentDomain.cname}: Routing collision, skipping #{c.path}",
                           :session => {:domain => CurrentDomain.cname},
                           :parameters => {:duplicate_config => c})
          end
        else
          cur_obj[key] = c
        end
      end
      Rails.cache.write(cache_key, ds)
    end
    return ds
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
    return [cur_obj[key], vars]
  end

  def self.generate_cache_key(mtime)
    app_helper.cache_key("page-dataset-v2", {
      'domain' => CurrentDomain.cname,
      'updated' => mtime
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
