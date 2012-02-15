class Page < SodaModel
  def render(full = true)
    if full
      Canvas2::Util.set_path(path)
      return if !Canvas2::DataContext.load(data)
      [Canvas2::CanvasWidget.from_config(content)].flatten.map {|w| w.render}.join('')
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
      @@path_store[CurrentDomain.cname] = {}
      ds = pages_data(mtime)
      ds.each { |k, v| @@path_store[CurrentDomain.cname][k] = true }
    end

    unless @@path_store[CurrentDomain.cname].has_key?(path)
      return nil
    end

    ds = pages_data(mtime) if ds.blank?
    ds[path]
  end

private
  def self.pages_data(mtime)
    cache_key = generate_cache_key(mtime)
    ds = Rails.cache.read(cache_key)

    if ds.nil?
      ds = {}
      contents = find(:status => :published)
      contents.each do |c|
        ds[c.path] = c
      end
      Rails.cache.write(cache_key, ds)
    end
    ds
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
