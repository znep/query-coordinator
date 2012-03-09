class Page < SodaModel
  def render(vars, full = true)
    if full
      if vars.is_a?(Array)
        var_hash = {}
        path.split('/').each do |part|
          var_hash[part.slice(1, part.length)] = vars.shift if part.starts_with?(':')
        end
        vars = var_hash
      end
      Canvas2::Util.add_vars(vars) if vars.is_a?(Hash)
      return false if !data.nil? && !data.empty? && !Canvas2::DataContext.load(data)
      [Canvas2::CanvasWidget.from_config(content)].flatten.map {|w| w.render[0]}.join('')
    else
      '<div id="' + content['id'] + '"></div>'
    end
  end

  def content
    @update_data['content'] || @data['content']
  end

  def data
    @update_data['data'] || @data['data']
  end

  def locale
    @update_data['locale'] || @data['locale']
  end

  def self.[](path, mtime)
    mtime ||= Time.now.to_i.to_s
    if !(defined? @@path_store) || !(defined? @@path_time) || (mtime > @@path_time)
      @@path_store = {}
      @@path_time = mtime
    end

    unless @@path_store[CurrentDomain.cname]
      ds = pages_data(mtime)
      @@path_store[CurrentDomain.cname] = copy_paths(ds)
    end

    unless get_item(@@path_store[CurrentDomain.cname], path)[0]
      return nil
    end

    ds = pages_data(mtime) if ds.blank?
    get_item(ds, path)
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
        if cur_obj.has_key?(':page')
          Rails.logger.error "***************** Routing collision! #{c.path}"
          # Shouldn't overload our messaging since it only happens when the
          # paths are regenerated, which shouldn't be too often
          Thread.new do
            # be chivalrous
            Thread.pass

            Airbrake.notify(:error_class => 'Canvas Routing Error',
                            :error_message => "Canvas Routing Error: Routing collision, skipping #{c.path}")
          end
        else
          cur_obj[':page'] = c
        end
      end
      Rails.cache.write(cache_key, ds)
    end
    return ds
  end

  def self.copy_paths(path_hash)
    obj = {}
    path_hash.each { |k, v| obj[k] = k == ':page' ? true : copy_paths(v) }
    return obj
  end

  def self.get_item(paths, path)
    cur_obj = paths
    vars = []
    path.split('/').each do |part|
      p = part
      p = ':var' if !cur_obj.has_key?(p)
      return [nil, nil] if !cur_obj.has_key?(p)
      cur_obj = cur_obj[p]
      vars.push(part) if p == ':var'
    end
    return [cur_obj[':page'], vars]
  end

  def self.generate_cache_key(mtime)
    app_helper.cache_key("page-dataset", {
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
