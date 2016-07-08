class DataslateRouting
  class << self
    alias :for :new
  end

  def initialize(cname)
    @cname = cname
    @pages = {}

    # This being run only once presumes that the Pages Dataset is extremely unlikely to
    # change for a given instance of this object. If this assumption is false, then this
    # design is a problem.
    scrape_pages_dataset_for_paths!
  end

  def page_for(path, options = {})
    unique_path = lookup_path(path, options[:ext])
    page = @pages[unique_path]

    custom_headers = options.fetch(:custom_headers, {})
    @pages[unique_path] =
      if page.nil?
        # Case: Not cached in this process.
        Rails.logger.debug("Not cached: #{unique_path}")
        page = Page.find_by_unique_path(unique_path, custom_headers)
        Rails.logger.debug("Not in Pages Service; checking Pages Dataset: #{unique_path}")
        page ||= fetch_from_pages_dataset(unique_path) if @ds_paths.key?(unique_path)
        page
      elsif @ds_paths.key?(unique_path)
        # Case: Driven by Pages Dataset; never cache because dumb.
        Rails.logger.debug("Pages Dataset: #{unique_path}")
        page = fetch_from_pages_dataset(unique_path)
      elsif Time.at(page.updated_at) < Page.last_updated_at(page.uid, custom_headers)
        # Case: Driven by Pages Service; updated, so invalidate cache.
        Rails.logger.debug("Pages Service (out-of-date): #{unique_path}")
        page = Page.find_by_uid(page.uid, custom_headers)
      else
        # Case: Driven by Pages Service; not updated, use cache.
        Rails.logger.debug("Pages Service (cached): #{unique_path}")
        page
      end
  end

  def delete(path)
    @pages.delete(lookup_path(path))
  end
  alias :invalidate :delete

  def clear!
    @pages = {}
  end

  private
  def uniqify(path, var_as = ':')
    return path if path.nil? || path == '/'
    path.split('/').map { |part| part.starts_with?(':') ? var_as : part }.join('/')
  end

  def lookup_path(path, ext = nil)
    path = "/#{path}".sub(/^\/\//, '/')
    path << ".#{ext}" if ext.present? && !%w(csv xlsx).include?(ext)
    uniqify(path)
  end

  def scrape_pages_dataset_for_paths!
    @ds_paths = {}
    begin
      url = '/id/pages.json?$select=path'
      JSON.parse(CoreServer::Base.connection.get_request(url)).each do |row|
        path = row['path']
        @ds_paths[lookup_path(path)] = path
      end
    rescue CoreServer::ResourceNotFound
    end
  end

  def fetch_from_pages_dataset(unique_path)
    url = "/id/pages.json?$where=path=%27#{@ds_paths[unique_path]}%27"
    Page.parse(CoreServer::Base.connection.get_request(url)).first
  end
end
