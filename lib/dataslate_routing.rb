class DataslateRouting
  def self.for(path, options = {})
    (RequestStore[:dataslate_routing] ||= new(options.only(:custom_headers))).
      page_for(path, options)
  end

  def self.debug
    (RequestStore[:dataslate_routing] ||= new(options.only(:custom_headers))).
      routes
  end

  attr_reader :routes, :custom_headers
  def initialize(options = {})
    @custom_headers = options.fetch(:custom_headers, {})
    @routes = {}

    scrape_pages_dataset_for_paths!
    scrape_pages_service_for_paths!
  end

  def page_for(path, options = {})
    @custom_headers = options.fetch(:custom_headers, custom_headers)
    lookup = map_resolved_path_to_lookup_data(lookup_path(path))
    Rails.logger.debug("Mapped `#{path}` as #{lookup.inspect}")
    return if lookup.nil?

    page = case lookup[:from]
      when :service then Page.find_by_unique_path(lookup[:path], custom_headers)
      when :dataset then fetch_from_pages_dataset(lookup[:path])
    end
    if page.present?
      { page: page,
        from: lookup[:from],
        # TODO: Later, when addressing DataSlate's globals-everywhere paradigm.
        #vars: Hash[page.path.split('/').select { |part| part.starts_with?(':') }.zip(lookup[:vars])]
        vars: lookup[:vars]
      }
    end
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

  def map_resolved_path_to_lookup_data(path)
    # On the server-side, it does not appear that we actually *use* the vars at all.
    # But I'm determining them now for (1) debugging and (2) thoroughness.
    vars = []
    path.split('/').inject(routes) do |lookup_cursor, part|
      break unless lookup_cursor.has_key?(part) || lookup_cursor.has_key?(':')
      lookup_cursor[part] || (vars << part && lookup_cursor[':'])
    end.try(:merge, vars: vars)
  end

  def scrape_pages_service_for_paths!
    Page.routing_table(custom_headers).each_with_object(routes) do |entry, memo|
      unique_path = uniqify(entry['path'])
      memo.bury(*unique_path.split('/'), { from: :service, path: unique_path })
    end
  end

  def scrape_pages_dataset_for_paths!
    begin
      url = '/id/pages.json?$select=path'
      ds_paths = JSON.parse(CoreServer::Base.connection.get_request(url)).
        collect { |row| row['path'] }
      ds_paths.each_with_object(routes) do |path, memo|
        unique_path = uniqify(path)
        memo.bury(*unique_path.split('/'), { from: :dataset, path: unique_path })
      end
    rescue CoreServer::ResourceNotFound
      # Pages Dataset does not exist for this domain. Hooray!
    end
  end

  def fetch_from_pages_dataset(unique_path)
    url = "/id/pages.json?$where=path=%27#{unique_path}%27"
    Page.parse(CoreServer::Base.connection.get_request(url)).first
  end
end
