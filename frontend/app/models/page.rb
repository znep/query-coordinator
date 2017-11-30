class AppHelper
  include Singleton
  include ApplicationHelper
end

class Page < Model

  def self.find(options, custom_headers = {}, batch = nil, is_anon = false)
    options ||= Hash.new

    if options.is_a?(String)
      return parse(
        CoreServer::Base.connection.get_request("/pages/#{options}.json", custom_headers, batch, is_anon)
      )
    end

    # If fetching by ID with additional args, handle specially
    if options[:id].present?
      return parse(
        CoreServer::Base.connection.get_request("/pages.json?#{options.to_param}", custom_headers, batch, is_anon)
      )
    end

    # Fetch real service
    base_path = '/pages.json'
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
    pages.each { |p| svc_paths["#{p.index_path}|#{p.format}"] = true }

    # Then dataset, and merge
    ds_path = "/id#{base_path}"
    if options.respond_to?(:to_param) && !options.to_param.blank?
      ds_options = options.clone.with_indifferent_access
      ds_options.delete('method')
      ds_options.delete('status') if ds_options['status'] == 'all'
      ds_path += "?#{ds_options.to_param}"
    end
    # For when the Pages dataset doesn't exist
    begin
      result = CoreServer::Base.connection.get_request(ds_path, custom_headers, batch, is_anon)
      parse(result).each { |p| pages.push(p) if !svc_paths["#{p.index_path}|#{p.format}"] }
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

  def self.routing_table(custom_headers = {}, batch = nil, is_anon = false)
    JSON.parse(with_path('/pages.json?method=getLightweightRouting', custom_headers, batch, is_anon))
  end

  def self.find_by_uid(uid, custom_headers = {}, batch = nil, is_anon = false)
    parse(with_path("/pages/#{uid}.json", custom_headers, batch, is_anon))
  end

  def self.find_by_unique_path(path, custom_headers = {}, batch = nil, is_anon = false )
    parse(with_path("/pages.json?method=getPageByPath&path=#{path}", custom_headers, batch, is_anon))
  end

  def self.last_updated_at(uid, custom_headers = {})
    timestamp = with_path("/pages/#{uid}.json?method=getLastUpdated", custom_headers)
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
    !(data.present? && !Canvas2::DataContext.load(data))
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
      %Q{<div id="#{content['id']}"></div>}
    end
  end

  def render_timings
    @timings.to_a.compact
  end

  def index_path
    path = @update_data['path'] || @data['path']
    path.gsub(':[^/]+', ':')
  end

  def name
    n = @update_data['name'] || @data['name']
    begin
      n = JSON.parse(n) if n.present?
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
    {
      path: metadata['redirect'],
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
    @data['owner'] = User.setup_model(@data['owner']) if @data['owner'].is_a?(Hash)
    return owner unless owner.is_a?(User)

    owner.id
  end

  def owner_user
    @data['owner'] = User.setup_model(@data['owner']) if @data['owner'].is_a?(Hash)
    return owner if @data['owner'].nil? || @data['owner'].is_a?(User)

    User.find(owner.to_s)
  end

  def uneditable
    content.present? && (content['uneditable'] == true || content['uneditable'] == 'true')
  end

  def private_data?
    @data.key?('privateData') ? @data['privateData'] :
      content.present? && (content['privateData'] == true || content['privateData'] == 'true')
  end

  def viewable_by?(user)
    case permission
      when 'private'
        user.present? && (user.id == owner_id || user.has_right?(UserRights::EDIT_PAGES))
      when 'domain_private'
        # Only owners or domain members can access this page.
        if user.present?
          user.id == owner_id || CurrentDomain.member?(user)
        else
          false
        end
      when 'public' then true
    end
  end

  def full_path(ext = nil)
    @full_path ||= begin
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
        error_message = "It appears that CoreServer was unreachable: #{data.inspect}"
      else
        error_message = "CoreServer responded with truncated and/or invalid JSON: #{data.inspect}"
      end

      Airbrake.notify(
        :error_class => 'Failed to parse invalid JSON',
        :error_message => error_message,
        :session => {:domain => CurrentDomain.cname}
      )
      return nil
    end

    setup_model(json_data)
  end

  def self.create(attributes, custom_headers = {})
    # Status should eventually start as unpublished
    attributes = {content: { type: 'Container', id: 'pageRoot' }}.merge(attributes)
    path = '/pages.json'

    new_page = parse(CoreServer::Base.connection.create_request(path, attributes.to_json, custom_headers))

    DataslateRouting.clear_cache_for_current_domain!

    new_page
  end
end
