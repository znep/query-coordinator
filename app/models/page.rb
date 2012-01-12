class Page < SodaModel
  def render
    '<div class="socrata-root" id="' + content['id'] + '"></div>'

    # TODO - actual render
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
