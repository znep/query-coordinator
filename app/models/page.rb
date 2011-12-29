class Page < SodaModel
  def render
    '<div class="socrata-root" id="' + content['id'] + '"></div>'

    # TODO - actual render
  end

  def self.[](path)
    if !(defined? @@path_store) || !(defined? @@path_time) || (Time.now - @@path_time > 15.minute)
      @@path_store = {}
      @@path_time = Time.now
      ds = pages_data
      ds.each { |k, v| @@path_store[k] = true }
    end

    return nil unless @@path_store.has_key?(path)

    ds = pages_data if ds.blank?
    ds[path]
  end

  def self.pages_data
    cache_key = app_helper.cache_key("page-dataset", { 'domain' => CurrentDomain.cname })
    ds = Rails.cache.read(cache_key)

    if ds.nil?
      ds = {}
      contents = find(:status => :published)
      contents.each do |c|
        ds[c.path] = c
      end
      Rails.cache.write(cache_key, ds, :expires_in => 15.minutes)
    end
    ds
  end

  def self.app_helper
    AppHelper.instance
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
end

class AppHelper
  include Singleton
  include ApplicationHelper
end
