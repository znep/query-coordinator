class View < Model
  include Rails.application.routes.url_helpers
  include SocrataUrlHelpers
  extend FindExtensions

  cattr_accessor :filter_type1s
  attr_accessor :custom_vis_cols, :sodacan

  def self.find(options = nil, custom_headers = {}, batch = false, is_anon = false, get_all = false)
    raise ArgumentError.new("Invalid header value (must be a string): #{custom_headers}") unless
      custom_headers.all? { |k, v| k.kind_of?(String) && v.kind_of?(String) }
    custom_headers.merge!({'X-Socrata-Federation' => 'Honey Badger'})
    if get_all || options.is_a?(String)
      return super(options, custom_headers, batch, is_anon)
    else
      return self.find_under_user(options)
    end
  end

  def self.find_external(ext_id)
    return self.find({'method' => 'getByExternalId', 'externalId' => ext_id}, {}, false, false, true)
  end

  def self.find_filtered(options)
    path = "/views.json?#{options.to_param}"
    parse(CoreServer::Base.connection.get_request(path,
                                                  {'X-Socrata-Federation' => 'Honey Badger'}))
  end

  def self.find_by_resource_name(resource_name, is_anon = false)
    return self.find({'method' => 'getByResourceName', 'name' => resource_name}, {}, false, is_anon, true)
  end

  def self.find_multiple(ids)
    path = "/#{self.name.pluralize.downcase}.json?" + {'ids' => ids}.to_param
    parse(CoreServer::Base.connection.get_request(path,
                                                  {'X-Socrata-Federation' => 'Honey Badger'}))
  end

  def self.find_deleted_name(id)
    path = "/#{self.name.pluralize.downcase}.json?" + {'method' => 'getDeletedNameById', 'id' => id}.to_param
    name = CoreServer::Base.connection.get_request(path, {'X-Socrata-Federation' => 'Honey Badger'})
    JSON.parse("[#{name}]").first # core returns this as a quoted string, so parse it as json to un-quote it
  end

  def self.find_for_user(id)
    path = "/users/#{id}/views.json"
    parse(CoreServer::Base.connection.get_request(path))
  end

  def self.find_favorites()
    path = "/favorite_views.json"
    parse(CoreServer::Base.connection.get_request(path))
  end

  def self.find_shared_to_user(id, options)
    options[:method] = 'getShared'
    path = "/users/#{id}/views.json?" + options.to_param
    r = JSON.parse(CoreServer::Base.connection.get_request(path))
    r['results'] = (r['results'] || []).map { |d| self.set_up_model(d) }
    r
  end

  def self.find_in_store(id, store)
    unless store =~ /^[a-z0-9]+\.[a-z0-9]+$/
      raise "Invalid store identifier: #{store}"
    end
    path = "/#{self.service_name}/#{id}.json?$$store=#{store}"
    parse(CoreServer::Base.connection.get_request(path, federation_headers))
  end

  def self.federation_headers
    {'X-Socrata-Federation' => 'Honey Badger'}
  end

  def self.get_predeploy_api_view(baseUid)
    path = "/views/#{baseUid}/publication.json?" + {'method' => 'getPredeployApiView'}.to_param
    parse(CoreServer::Base.connection.get_request(path))
  end

  def migrations
    self.class.migrations(id)
  end

  # Will raise CoreServer::ResourceNotFound if no migration is found
  def self.migrations(id)
    # This is hitting core migrations, which is at /migrations/4x4. NOT /api/migrations/4x4
    path = "/migrations/#{id}"
    JSON.parse(CoreServer::Base.connection.get_request(path)).with_indifferent_access
  end

  # NBE geospatial datasets no longer have an OBE component, so this method
  # answers the question of whether or not an NBE dataset is geospatial.
  def is_geospatial?
    is_map = viewType == 'geo' && displayType == 'map'
    is_layer = viewType == 'tabular' && displayType == 'geoRows'
    new_backend? && (is_map || is_layer)
  end

  # NBE geospatial datasets created via API end up with weird metadata.
  # See EN-3889 for context.
  def is_api_geospatial?
    # return a cached value for this property once defined (see below)
    return @_is_api_geospatial unless @_is_api_geospatial.nil?

    # exit early (and cache) if the opt-in signal is missing
    return (@_is_api_geospatial = false) unless (merged_metadata['custom_fields'] || {}).reduce(false) do |acc, (fieldset, fields)|
      # Customers must opt-in on a per-dataset basis by creating a custom metadata group called
      # "Geospatial API Pre-release" with a field called "Enabled", then setting that field to "true"
      # on the desired datasets.
      #
      # This can be implemented self-serve by customers; let's be forgiving.
      acc || (fieldset =~ /^geo-?spatial api pre-?release$/i && (fields['Enabled'] || fields['enabled']) == 'true')
    end

    # examine markers of API-ingressed geospatial datasets
    nbe_only = new_backend? && obe_view.nil?
    has_geo_column = (columns || []).any? { |column| column.dataTypeName =~ /(polygon|line|point)$/i }
    half_tabular = (displayType.nil? ||  displayType == 'map') && is_tabular?

    # return and cache this determination, because consumers may conditionally
    # override the metadata upon encountering a `true` case... in a way that
    # will make the above heuristic no longer true.
    @_is_api_geospatial = nbe_only && has_geo_column && half_tabular
  end

  def geospatial_child_layer_count
    if is_geospatial?
      has_geo_layers = metadata.present? &&
        metadata.geo.present? &&
        metadata.geo['layers'].respond_to?(:split)

      has_geo_layers ? metadata.geo['layers'].split(',').length : 0
    else
      0
    end
  end

  def geospatial_child_layers
    if geospatial_child_layer_count > 0
      layer_ids = metadata.geo['layers'].split(',')
      View.find_multiple(layer_ids)
    else
      []
    end
  end

  def derived_layer_count
    if displayFormat.present? && displayFormat.viewDefinitions.present?
      displayFormat.viewDefinitions.length
    else
      0
    end
  end

  def derived_layers
    if derived_layer_count > 0
      displayFormat.viewDefinitions
    else
      []
    end
  end

  def is_multi_layered?
    geospatial_child_layer_count > 1 || derived_layer_count > 1
  end

  def nbe_view
    @nbe_view ||= begin
      if newBackend?
        self
      elsif parent_view.nil?
        View.find(migrations[:nbeId])
      else
        View.find(parent_view.migrations[:nbeId])
      end
    rescue CoreServer::ResourceNotFound
      nil # This means the migration was not found.
    rescue CoreServer::CoreServerError => e
      raise e
    end
  end

  def obe_view
    @obe_view ||= begin
      if !newBackend?
        self
      elsif parent_view.nil?
        View.find(migrations[:obeId])
      else
        View.find(parent_view.migrations[:obeId])
      end
    rescue CoreServer::ResourceNotFound
      nil # This means the migration was not found.
    rescue CoreServer::CoreServerError => e
      raise e
    end
  end

  def fetch_json
    path = "/views/#{id}.json"
    parse_json_with_max_nesting(CoreServer::Base.connection.get_request(path))
  end


  # TODO Factor these new_backend methods out into a different container
  def row_count
    if new_backend?
      # Alias the column to provide a reasonably strong guarantee of uniqueness.
      # This is necessary because 1) without an alias, Core may return a key of
      # `count_0` or `count_1` if the customer dataset has a column named `count`
      # and 2) a parse error may trigger if the alias conflicts with a column.
      path = "/id/#{id}?#{{'$query' => 'select count(*) as COLUMN_ALIAS_GUARD__count'}.to_param}"
      JSON.parse(CoreServer::Base.connection.get_request(path)).first['COLUMN_ALIAS_GUARD__count'].to_i
    else
      get_total_rows.to_i
    end
  end

  def find_related(page, limit = 10, sort_by = 'most_accessed')
    params = {
      method: 'getByTableId',
      tableId: self.tableId,
      page: page,
      count: limit, # the core server is super consistent
      sortBy: sort_by
    }
    path = "/views.json?" + params.to_param
    View.parse(CoreServer::Base.connection.get_request(path))
  end

  def find_dataset_landing_page_related_content
    # Get related datasets associated with the OBE
    related_obe_views = obe_view ? obe_view.find_related(1) : []

    # Get related datasets associated with the NBE
    related_nbe_views = nbe_view ? nbe_view.find_related(1) : []

    # Separate Data Lens views
    related_data_lens_views, related_nbe_views = related_nbe_views.partition do |related_view|
      related_view.displayType == 'data_lens'
    end

    # Combine everything in our preferred order
    related_data_lens_views.
      concat(related_nbe_views).
      concat(related_obe_views).
      reject do |related_view|
        (obe_view && related_view.id == obe_view.id) || (nbe_view && related_view.id == nbe_view.id)
      end
  end

  def find_api_throttles()
    path = "/views/#{self.id}/apiThrottle.json?" + {'method' => 'findViewThrottles'}.to_param
    View.parse(CoreServer::Base.connection.get_request(path))
  end

  def find_api_anonymous_throttle()
    path = "/views/#{self.id}/apiThrottle.json?" + {'method' => 'findViewAnonThrottle'}.to_param
    View.parse(CoreServer::Base.connection.get_request(path))
  end

  def prefetch(rows, conditions = {})
    row_data = get_rows(rows, 1, conditions, true)
    @sodacan = SodaCan::Processor.new(row_data[:meta], row_data, true) unless use_soda2?
  end

  def set_sodacan(sodacan)
    @sodacan = sodacan unless use_soda2?
  end

  def sodacan
    @sodacan
  end

  def set_api_throttle(appId, minuteLimit, hourLimit, dayLimit, monthLimit)
    params = {
      'method' => 'setViewThrottle',
      'appId' => appId,
      'minuteLimit' => minuteLimit,
      'hourLimit' => hourLimit,
      'dayLimit' => dayLimit,
      'monthLimit' => monthLimit
    }
    path = "/views/#{self.id}/apiThrottle.json?" + params.to_param
    View.parse(CoreServer::Base.connection.get_request(path))
  end

  def self.category_tree
    categories = CurrentDomain.configuration('view_categories').properties
    top_level_cats = @@default_categories.clone
    categories.each do |c, o|
      next if !o.enabled
      c = c.titleize_if_necessary
      t = (o['locale_strings'] || {})[I18n.locale]
      t = c if t.blank?
      if o['parent'].blank?
        top_level_cats[c] ||= {}
        top_level_cats[c][:value] = c
        top_level_cats[c][:text] = t
      else
        p = o['parent'].titleize_if_necessary
        top_level_cats[p] ||= {}
        top_level_cats[p][:children] ||= []
        top_level_cats[p][:children].push({ value: c, text: t })
      end
    end
    return top_level_cats.reject { |k, c| c[:value].nil? }
  end

  def self.category_display(category)
    return nil if category.blank?

    categories = CurrentDomain.configuration('view_categories').properties
    cat_obj = nil
    categories.each do |c, o|
      cat_obj = o if c == category || c.titleize_if_necessary == category
    end
    return category if cat_obj.nil?

    c = (cat_obj['locale_strings'] || {})[I18n.locale]
    c = category if c.blank?
    c
  end

  def category_display
    View.category_display(category)
  end

  def module_enabled?(name)
    return false if self.disabledFeatureFlags && self.disabledFeatureFlags.member?(name.to_s)
    return CurrentDomain.module_enabled?(name.to_s.downcase.to_sym)
  end

  def enabled_modules
    result = {}
    overridable_features.each do |feature|
      result[feature[:key]] = self.module_enabled?(feature[:key])
    end
    return result
  end

  def disabled_features
    features = overridable_features.select do |flag|
      CurrentDomain.module_enabled?(flag[:key].to_s.downcase.to_sym) && flag[:if] != false
    end
    unless self.disabledFeatureFlags.blank?
      self.disabledFeatureFlags.each do |flag|
        feature_index = features.find_index {|f| f[:key] == flag}
        features[feature_index][:disabled] = true if feature_index
      end
    end
    features
  end

  def overridable_features
    of = [{ :key => 'allow_comments' }]
    of << { :key => 'cell_comments' } if is_tabular? && !is_form? && !new_backend?
    of
  end

  def column_by_id(column_id)
    self.columns.find{ |c| c.id == column_id }
  end

  def column_by_table_column_id(table_column_id)
    self.columns.find{ |c| c.tableColumnId == table_column_id }
  end

  def column_by_id_or_field_name(column_id_or_field_name)
    self.columns.find{ |c|
      c.id == column_id_or_field_name.to_i ||
      c.fieldName == column_id_or_field_name }
  end

  def visible_columns(custom_query = nil)
    q = custom_query || query.data
    if q['groupBys'].is_a?(Array) && q['groupBys'].length > 0
      grouped_cols = {}
      q['groupBys'].each { |c| grouped_cols[c['columnId']] = true }
    end
    vc = (self.custom_vis_cols || self.columns).reject do |c|
      c.flag?('hidden') ||
        (!grouped_cols.blank? && !grouped_cols[c.id] && c.format.grouping_aggregate.blank?)
    end
    vc = vc.sort_by {|c| c.position} if self.custom_vis_cols.blank?
    vc
  end

  def html
    if is_tabular?
      CoreServer::Base.connection.get_request("/#{self.class.name.pluralize.downcase}/#{id}/" +
        "rows.html?template=bare_template.html", {})
    end
  end

  def save_filter(name, conditions)
    request_body = {
      'name' => name,
      'searchString' => conditions.delete('searchString'),
      'query' => conditions,
      'originalViewId' => self.id
    }.to_json

    View.parse(CoreServer::Base.connection.create_request("/views.json", request_body))
  end

  def find_data(per_page, page = 1, conditions = {})
    params = { :method => 'getByIds',
               :asHashes => true,
               :accessType => 'WEBSITE',
               :meta => true,
               :start => (page - 1) * per_page,
               :length => per_page }

    if conditions.empty?
      if use_soda2?
        page_params = {
          '$order' => ':id',
          '$offset' => (page - 1) * per_page,
          '$limit' => per_page
        }
        url = "/id/#{id}.json?#{page_params.to_param}"
        meta_and_data = {
          'data' => parse_json_with_max_nesting(
            CoreServer::Base.connection.get_request(
              url,
              { 'X-Socrata-Federation' => 'Honey Badger' }
            )
          )
        }
        meta_and_data['meta'] = { 'view' => { 'columns' => columns }}
      else
        url = "/#{self.class.name.pluralize.downcase}/#{id}/rows.json?#{params.to_param}"
        meta_and_data = parse_json_with_max_nesting(
          CoreServer::Base.connection.get_request(
            url,
            { 'X-Socrata-Federation' => 'Honey Badger' }
          )
        )

        url = "/#{self.class.name.pluralize.downcase}/#{id}/rows.json?method=getAggregates"
        aggregates = parse_json_with_max_nesting(
          CoreServer::Base.connection.create_request(
            url,
            {},
            { 'X-Socrata-Federation' => 'Honey Badger' }
          )
        )
      end
    else
      merged_conditions = self.query.cleaned.merge({'searchString'=>self.searchString}).
        deep_merge(conditions)
      if use_soda2?
        soql_obj = SoqlFromConditions.process(self, Hashie::Mash.new(merged_conditions))
        params['$$version'] = '2.0'
        params['$$row_count'] = 'approximate'
        params.merge! soql_obj.to_soql_parts

        params['$select'] = [ params['$select'] || '*', ':*' ].compact.join(',')
        params['$offset'] = (page - 1) * per_page
        params['$limit'] = per_page
        params['$order'] ||= ':id'

        meta_and_data =
          make_rows_request_using_soda2(url: "/id/#{self.id}.json?#{params.to_param}")
      else
        request_body = {
          'name' => self.name,
          'searchString' => merged_conditions.delete('searchString'),
          'query' => merged_conditions,
          'originalViewId' => self.id
        }.to_json

        url = "/#{self.class.name.pluralize.downcase}/INLINE/rows.json?#{params.to_param}"
        meta_and_data = parse_json_with_max_nesting(
          CoreServer::Base.connection.create_request(
            url,
            request_body,
            { 'X-Socrata-Federation' => 'Honey Badger' }
          )
        )

        url = "/#{self.class.name.pluralize.downcase}/INLINE/rows.json?method=getAggregates"
        aggregates = parse_json_with_max_nesting(
          CoreServer::Base.connection.create_request(
            url,
            request_body,
            { 'X-Socrata-Federation' => 'Honey Badger' }
          )
        )
      end
    end

    # grab viewable columns; this is inline rather than a separate method to
    # mitigate the need for another core server request
    viewable_columns =
      (meta_and_data.try(:[], 'meta').try(:[], 'view').try(:[], 'columns') || []).
        map{ |column_hash| Column.set_up_model(column_hash) }.
        each_with_index{ |column, i| column.data_position = i }.
        find_all{ |column| column.dataTypeName != 'meta_data' &&
                          !column.flag?("hidden") }.
        sort_by { |column| column.position }

    # grab other return values
    data = meta_and_data['data']
    row_count =
      if use_soda2?
        self.row_count
      else
        meta_and_data['meta']['totalRows']
      end

    return data, viewable_columns, aggregates, row_count
  end

  #
  # Return a tuple for a getRowsByIds request
  #
  def get_rows_request(per_page_or_ids, page = 1, merged_conditions, include_meta)
    if use_soda2?
      get_rows_request_using_soda1(per_page_or_ids, page, merged_conditions, include_meta)
    else
      get_rows_request_using_soda1(per_page_or_ids, page, merged_conditions, include_meta)
    end
  end

  def get_rows_request_using_soda1(per_page_or_ids, page = 1, merged_conditions, include_meta)
    params = { :method => 'getByIds',
               :asHashes => true,
               :accessType => 'WEBSITE',
               :meta => include_meta}
    if per_page_or_ids.is_a?(Array)
      params[:ids] = per_page_or_ids
    else
      params[:start] = (page - 1) * per_page_or_ids
      params[:length] = per_page_or_ids
    end
    request_body = {
               'name' => self.name,
               'searchString' => merged_conditions.delete('searchString'),
               'query' => merged_conditions,
               'originalViewId' => self.id
               }
    request_body['columns'] = visible_columns(merged_conditions).map {|c| c.to_core}

    url = "/views/INLINE/rows.json?#{params.to_param}"
    { url: url, request: request_body}
  end

  def get_rows_request_using_soda2(per_page_or_ids, page = 1, merged_conditions, include_meta)
    params = {}

    # per_page_or_ids might be an Array.
    # This is not something SODA2 can handle and we really can't do anything about that.

    params['$offset'] = (page - 1) * per_page_or_ids
    params['$limit'] = per_page_or_ids

    soql_obj = SoqlFromConditions.process(self, Hashie::Mash.new(merged_conditions))

    params['$$version'] = '2.0'
    params['$$row_count'] = 'approximate'
    params.merge! soql_obj.to_soql_parts

    params['$select'] = [ params['$select'] || '*', ':*' ].compact.join(',') if include_meta

    { url: "/id/#{self.id}.json?#{params.to_param}", request: {} }
  end

  #
  # Return rows only (not metadata), possibly cached - Can be used in discrete
  # locations where we make a large number of small requests to the core server
  # for individual rows for a poor-persons join. Caching in the frontend is not
  # fun, but this helps reduce and reuse calls to the core server across multiple
  # requests
  #
  def get_cached_rows(per_page, page = 1, conditions = {}, is_anon = false, cache_ttl = Rails.application.config.cache_ttl_rows)
    # dedup with create request
    merged_conditions = query.cleaned.merge('searchString' => searchString).deep_merge(conditions)
    unless @sodacan.nil? || !@sodacan.can_query?(merged_conditions)
      return {rows: @sodacan.get_rows(merged_conditions, per_page, page), meta: nil}
    end

    req = get_rows_request(per_page, page, merged_conditions, true)
    cache_key = "rows:#{id}:#{Digest::MD5.hexdigest(req.sort.to_json)}:#{self.rowsUpdatedAt}"
    cache_key << ':anon' if is_anon
    result = cache.read(cache_key)
    if result.nil?
      begin
        server_result = make_rows_request(req, is_anon)
        result = {
          rows: server_result['data'],
          total_count: server_result['meta']['totalRows'],
          meta_columns: server_result['meta']['view']['columns'].select do |c|
            c['dataTypeName'] == 'meta_data'
          end
        }
        cache.write(cache_key, result, :expires_in => cache_ttl)
      rescue Exception => e
        Rails.logger.info(
          "Possibly invalid model found in row request, deleting model cache key: " +
          "#{model_cache_key}. Exception details: #{e.inspect}, #{e.backtrace[0]}"
        )
        cache.delete(model_cache_key) if model_cache_key
        raise e
      end
    end
    cache_row_result(result, result.merge({ start: (page - 1) * per_page })) if conditions.empty?
    {rows: result[:rows], meta: nil}
  end

  def get_rows(per_page, page = 1, conditions = {}, include_meta = false, is_anon = false)
    if use_soda2?
      get_rows_with_soda2(per_page, page, conditions, include_meta, is_anon)
    else
      get_rows_with_soda1(per_page, page, conditions, include_meta, is_anon)
    end
  end

  def get_rows_with_soda1(per_page, page = 1, conditions = {}, include_meta = false, is_anon = false)
    include_meta = true if @cached_rows.try(:[], :rows).nil?
    # dedup with create request
    merged_conditions = self.query.cleaned.merge({'searchString'=>self.searchString}).deep_merge(conditions)
    unless @sodacan.nil? || !@sodacan.can_query?(merged_conditions)
      result = {
        rows: @sodacan.get_rows(merged_conditions, per_page, page),
        meta: include_meta ? @sodacan.meta : nil
      }
      return result
    end

    req = get_rows_request_using_soda1(per_page, page, merged_conditions, include_meta)
    result = make_rows_request_using_soda1(req, is_anon)
    result[:rows] = row_result = include_meta ? result['data'] : result
    if conditions.empty?
      cache_row_results(result, { start: (page - 1) * per_page,
                                  no_meta: !include_meta })
    end
    {rows: row_result, meta: include_meta ? result['meta'] : nil}
  end

  def get_rows_with_soda2(per_page, page = 1, conditions = {}, include_meta = false, is_anon = false)
    include_meta = true if @cached_rows.try(:[], :rows).nil?
    merged_conditions = self.query.cleaned.merge({'searchString'=>self.searchString}).deep_merge(conditions)

    req = get_rows_request_using_soda2(per_page, page, merged_conditions, include_meta)
    row_result = result = make_rows_request_using_soda2(req, is_anon)
    if conditions.empty?
      cache_row_results({ rows: row_result }, { start: (page - 1) * per_page,
                                                total_count: row_count,
                                                meta_columns: [] })
    end
    {rows: row_result, meta: nil}
  end

  def get_total_rows(conditions = {}, is_anon = false)
    merged_conditions = self.query.cleaned.merge({'searchString'=>self.searchString}).deep_merge(conditions)
    unless @sodacan.nil?
      return @sodacan.total_rows if conditions.empty?
      return @sodacan.get_rows(merged_conditions).size
    end
    params = { :method => 'getByIds',
               :accessType => 'WEBSITE',
               :meta => true,
               :start => 0,
               :length => 1 }
    request_body = {
      'name' => self.name,
      'searchString' => merged_conditions.delete('searchString'),
      'query' => merged_conditions,
      'originalViewId' => self.id
    }
    request_body['columns'] = visible_columns(merged_conditions).map {|c| c.to_core}

    url = "/views/INLINE/rows.json?#{params.to_param}"
    result = parse_json_with_max_nesting(
      CoreServer::Base.connection.create_request(url, request_body.to_json,
                                                 { 'X-Socrata-Federation' => 'Honey Badger' },
                                                 false, false, is_anon))
    cache_row_results(result, only_meta: true) if conditions.empty?
    return result['meta']['totalRows']
  end

  # This does not work for SODA2.
  def get_row(row_id, is_anon = false)
    merged_conditions = self.query.cleaned.merge({'searchString'=>self.searchString})
    req = get_rows_request([row_id], 0, merged_conditions, false)
    JSON.parse(CoreServer::Base.connection.create_request(req[:url], req[:request].to_json,
                                                          { 'X-Socrata-Federation' => 'Honey Badger' },
                                                          false, false, is_anon),
      {:max_nesting => 25})[0]
  end

  def get_row_by_index(row_index)
    parse_json_with_max_nesting(
      CoreServer::Base.connection.get_request(
        "/#{self.class.name.pluralize.downcase}/#{id}/" +
        "rows.json?start=#{row_index}&length=1&method=getByIds&asHashes=true",
        { 'X-Socrata-Federation' => 'Honey Badger' }))[0]
  end

  def get_sid_by_row_identifier(row_identifier)
    CoreServer::Base.connection.get_request(
      "/#{self.class.name.pluralize.downcase}/#{id}/" +
      "rows?method=getSidByRowIdentifier&id=#{row_identifier}",
      { 'X-Socrata-Federation' => 'Honey Badger' }
    )
  end

  def get_aggregates(aggregates, conditions = {})
    merged_conditions = self.query.cleaned.merge({'searchString'=>self.searchString}).deep_merge(conditions)
    request_body = {
      'name' => self.name,
      'searchString' => merged_conditions.delete('searchString'),
      'query' => merged_conditions,
      'originalViewId' => self.id,
      'columns' => visible_columns(conditions).map { |c| c.deep_clone(Column) }
    }

    url = "/views/INLINE/rows.json?method=getAggregates"
    reqs = []
    aggregates.each do |col_id, agg_list|
      col = self.column_by_id(col_id)
      next if col.blank?
      agg_list = [agg_list] if !agg_list.is_a?(Array)
      agg_list.each_with_index do |agg, i|
        if reqs.length <= i
          reqs << request_body.clone
          reqs[i]['columns'] = request_body['columns'].map { |c| c.deep_clone(Column) }
        end
        req_col = reqs[i]['columns'].detect { |c| c.id == col.id }
        req_col.update({ 'aggregate' => { 'type' => agg } }) if !req_col.blank?
      end
    end

    agg_results = {}
    CoreServer::Base.connection.batch_request do |b_id|
      reqs.each do |req|
        req['columns'] = req['columns'].map {|c| c.to_core}
        r = req.to_json
        CoreServer::Base.connection.create_request(url, r, {'X-Socrata-Federation' => 'Honey Badger'},
                                                   true, b_id)
      end
    end.each do |r|
      agg_resp = parse_json_with_max_nesting(r['response'])
      agg_resp.each do |agg|
        agg_results[agg['columnId']] ||= {}
        agg_results[agg['columnId']][agg['name']] = agg['value']
        col = self.column_by_id(agg['columnId'])
        if !col.blank?
          col.data['aggregates'] ||= {}
          col.data['aggregates'][agg['name']] = agg['value'].to_f
        end
      end
    end
    agg_results
  end

  def json(params)
    url = "/#{self.class.name.pluralize.downcase}/#{id}/rows.json"
    if !params.nil?
      url += '?' + params.to_param
    end
    escape_object(parse_json_with_max_nesting(CoreServer::Base.connection.get_request(url))).
      to_json.html_safe
  end

  def self.notify_all_of_changes(id)
    path = "/#{self.name.pluralize.downcase}/#{id}.json?" +
        {"method" => "notifyUsers"}.to_param
    parse(CoreServer::Base.connection.create_request(path))
  end

  def set_permission(permission_type)
    path = "/#{self.class.name.pluralize.downcase}/#{self.id}.json?" +
        {"method" => "setPermission", 'value' => permission_type}.to_param
    self.class.parse(CoreServer::Base.connection.update_request(path))
  end

  def self.create_favorite(id)
    path = "/favorite_views?" + {"id" => id}.to_param
    parse(CoreServer::Base.connection.create_request(path))
  end

  def create_favorite
    self.data['flags'] << "favorite"
    self.class.create_favorite(self.id)
  end

  def self.create(attributes)
    if attributes['query'].blank? || attributes['query'] == '""' ||
      attributes['query'] == "''" || attributes['query'] == "null"
      attributes['query'] = nil
    else
      attributes['query'] = JSON.parse(attributes['query'])
    end
    if attributes['searchString'].blank? || attributes['searchString'] == '""' ||
      attributes['searchString'] == "''" || attributes['searchString'] == "null"
      attributes['searchString'] = nil
    else
      attributes['searchString'] = attributes['searchString']
    end
    super(attributes)
  end

  def self.delete(id)
    path = "/#{self.name.pluralize.downcase}.json?" + {"id" => id, "method" => "delete"}.to_param
    parse(CoreServer::Base.connection.delete_request(path))
  end

  def self.delete_favorite(id)
    path = "/favorite_views/#{id}"
    parse(CoreServer::Base.connection.delete_request(path))
  end

  def self.featured_image(featured_view)
    case featured_view['display']
      when 'thumbnail' then
        "/api/views/#{featured_view['viewId']}/snapshots/page?size=thumb"
      when 'custom' then
        assetId = featured_view['assetId']
        if assetId.start_with?('fileId:')
          return "/api/views/#{featured_view['viewId']}/files/#{assetId.split(':')[1]}?s=featured"
        else
          return "/api/assets/#{assetId}?s=featured"
        end
    end
  end

  def delete
    self.class.delete(self.id)
  end

  def delete_favorite
    self.data['flags'].delete("favorite")
    self.class.delete_favorite(self.id)
  end

  def register_opening(referrer)
    params = {"method" => "opening"}

    if !referrer.blank?
      params["referrer"] = referrer
    end
    View.parse(CoreServer::Base.connection.create_request("/#{self.class.name.pluralize.downcase}/#{id}.json?" + params.to_param))
  end

  def set_permissions(perm_value)
    CoreServer::Base.connection.
      update_request("/#{self.class.name.pluralize.downcase}/#{id}.json" +
                     "?method=setPermission&value=#{perm_value}")
  end

  def as_json(opts = nil)
    dhash = data_hash
    dhash["numberOfComments"] = numberOfComments
    dhash["averageRating"] = averageRating
    dhash["totalTimesRated"] = totalTimesRated
    dhash['columns'] = (columns || []).map {|c| c.to_core}
    if !@cached_rows.nil?
      dhash['initialRows'] = { rows: @cached_rows[:rows] || [], start: @cached_rows[:start] || 0,
        total: @cached_rows[:total_count] }
      dhash['initialMetaColumns'] = @cached_rows[:meta_columns]
    end

    # Fieldnames beginning :@ are computed columns and should not be displayed.
    # Old Front End will never actually use these columns for anything.
    # (Possible exception: choropleths; not planned, though.)
    # Including these columns breaks edit functionality, so we're just going to exclude them.
    dhash['columns'].reject! { |col| col[:fieldName].starts_with? ':@' }
    dhash
  end

  def row_to_SODA2(row)
    r = {}
    columns.each do |c|
      r[c.fieldName] = row[c.id.to_s]
      if c.renderTypeName == 'location' && !r[c.fieldName].blank? &&
        r[c.fieldName].key?('human_address') && r[c.fieldName]['human_address'].is_a?(String)
        r[c.fieldName] = r[c.fieldName].clone
        r[c.fieldName]['human_address'] = JSON.parse(r[c.fieldName]['human_address'])
      end
      if c.renderTypeName == 'drop_down_list' && !r[c.fieldName].blank? && c.dropDown
        ddl_id = r[c.fieldName]
        c.dropDown.values.each { |opt| r[c.fieldName] = opt['description'] if opt['id'] == ddl_id }
      end
    end
    if !@cached_rows.nil? && @cached_rows.key?(:meta_columns)
      @cached_rows[:meta_columns].each { |c| r[c['fieldName']] = row[c['name']] }
    else # I guess we'll guess...
      row.each { |k, v| r[':' + k] = v if !k.match(/^\d/) }
    end
    r
  end

  def numberOfComments
    data['numberOfComments'] || 0
  end

  def averageRating
    (data['averageRating'] || 0) / 20.0
  end

  def average_rating(type)
    (data.deep_value_at(['ratings', type]) || 0) / 20.0
  end

  def user_rating(type)
    r = data.deep_value_at(['currentUserRatings', type])
    return '' if r.nil?
    r / 20.0
  end
  def totalTimesRated
    data['totalTimesRated'] || 0
  end

  def last_activity
    if @last_activity.nil?
      @last_activity = [rowsUpdatedAt || 0, createdAt || 0, viewLastModified || 0].max
    end
    @last_activity
  end

  def time_created_at
    createdAt ? Time.at(createdAt) : nil
  end

  def time_data_last_updated_at
    rowsUpdatedAt ? Time.at(rowsUpdatedAt) : nil
  end

  def time_metadata_last_updated_at
    viewLastModified ? Time.at(viewLastModified) : nil
  end

  def time_last_updated_at
    last_activity ? Time.at(last_activity) : nil
  end

  # Returns the meta keyword tags for this view that we'll use in headers
  @@default_meta_tags = ["public", "data", "statistics", "dataset"]
  def meta_keywords
    (self.tags.nil? ? @@default_meta_tags : self.tags + @@default_meta_tags).sort_by {rand}
  end

  # Return the description we'll use in the meta description header
  def meta_description
    if self.description.blank?
      desc = "View this dataset"
      updated_at = self.rowsUpdatedAt.nil? ? nil : blist_long_date(self.rowsUpdatedAt, true)
      if updated_at
        desc += ", last updated #{updated_at}"
      end
      return desc
    else
      return self.description
    end
  end

  def is_blist?
    flag?("default") && is_tabular? && !is_arcgis? # allow modifying view_format for arcgis
  end

  def is_public?
    @_is_public ||= display.is_public?
  end

  # This represents whether or not the view is accessible exclusively to the current user.
  # Importantly, note that is_private? is not the opposite of is_public?
  def is_private?
    grants.nil? || grants.length == 0
  end

  def is_shared?
    grants && grants.any? {|p| !p.flag?('public')}
  end

  def is_grouped?
    !self.query.nil? && !self.query.groupBys.nil? && self.query.groupBys.length > 0
  end

  def has_modifying_parent_view?
    !self.modifyingViewUid.nil?
  end

  def last_updated_user
    begin
      return rowsUpdatedBy.blank? ? nil : User.find(rowsUpdatedBy)
    rescue CoreServer::ResourceNotFound
      return nil
    end
  end

  def show_official_badge_in_catalog?
    FeatureFlags.derive(nil, request)[:show_provenance_badge_in_catalog] && data_lens? && is_official?
  end

  def is_official?
    # CORE-7419: If enable_data_lens_provenance is false, assume all data lenses are official
    FeatureFlags.derive(nil, request)[:enable_data_lens_provenance] ?
      provenance =~ /^official$/i : true
  end

  def is_community?
    provenance =~ /^community$/i
  end

  def federated?
    !domainCName.blank?
  end

  def route_params
    params =
      { category: (category || 'dataset').convert_to_url,
        view_name: (name || 'dataset').convert_to_url,
        id: id }

    params[:host] = canonical_domain_name

    params
  end

  def rss
    download_url('rss')
  end

  def show_rss?
    is_tabular? &&
    !is_form? &&
    !data_lens?
  end

  def download_url(ext = 'json')
    "//#{canonical_domain_name}/#{download_path(ext)}"
  end

  def download_path(extension, params = {})
    path = "/api/views/#{self.id}/rows.#{extension}"
    query_string = '?' + params.reverse_merge({ :accessType => 'DOWNLOAD' }).to_query
    path + query_string
  end

  # While we still have datasets in both OBE and NBE, prefer the NBE id
  # when possible. This involves fetching the dataset's NBE id from its
  # migrations (if available), and falling back to the OBE id.
  # Note that non-default views should always use their own id.
  def preferred_id
    @preferred_id ||= begin
      (new_backend? || !flag?('default')) ? id : migrations.fetch(:nbeId, id)
    rescue CoreServer::ResourceNotFound
      id # This means the migration was not found.
    end
  end

  def api_foundry_url
    "https://dev.socrata.com/foundry/#{canonical_domain_name}/#{preferred_id}"
  end

  def resource_url(request = nil)
    "#{request.try(:scheme) || 'https'}://#{CurrentDomain.cname}/resource/#{preferred_id}.json"
  end

  # EN-5634: Don't prefer NBE id for OData endpoint as it truncates rows
  def odata_url(request = nil)
    "#{request.try(:scheme) || 'https'}://#{CurrentDomain.cname}/OData.svc/#{id}"
  end

  def allAccessPoints
    if metadata.present?
      # If additionalAccessPoints is present, we can assume that the links in accessPoints are
      # already inside additionalAccessPoints. Otherwise, we create an array with a single hash
      # for accessPoints.
      metadata.additionalAccessPoints.present? ?
        metadata.additionalAccessPoints :
        [ { 'title' => nil, 'description' => nil, 'urls' => metadata.accessPoints || {} } ]
    else
      []
    end
  end

  def blobs
    return @blobs unless @blobs.nil?

    if is_blobby?
      opts = { :filename => URI.escape(blobFilename || '') }
      b = {'href' => "/api/file_data/#{blobId}?#{opts.to_param}",
        'type' => (blobMimeType || '').gsub(/;.*/, ''), 'size' => blobFileSize}
      b['name'] =  blobFilename if blobFilename != name
      @blobs = [b]
    elsif is_href?
      b = []
      unless metadata.nil?
        if metadata.href.present?
          b << { 'href' => metadata.href, 'type' => 'Link', 'size' => 'Unknown' }
        end
      end
      @blobs = b
    else
      @blobs = []
    end

    @blobs
  end

  def has_importable_type?
    return false unless is_href?

    blobs.any? do |b|
      ['csv', 'tsv', 'xls', 'xlsx', 'esri', 'kml', 'kmz'].include?(b['type'].downcase)
    end
  end

  def canonical_domain_name
    federated? ? domainCName : CurrentDomain.cname
  end

  def domain_icon_href
    "/api/domains/#{canonical_domain_name}/icons/smallIcon"
  end

  def user_role(user_id)
    if user_id == tableAuthor.id
      'Dataset Author'
    elsif user_id == owner.id
      'View Author'
    elsif owner_users.any? {|cu| cu == user_id}
      'Dataset Owner'
    elsif contributor_users.any? {|cu| cu == user_id}
      'Dataset Contributor'
    elsif viewer_users.any? {|vu| vu == user_id}
      'Dataset Viewer'
    else
      ''
    end
  end

  # Whether or not the user has priviliges above an anonymous user
  def user_granted?(user)
    user && user_role(user.id).present?
  end

  def can_see_private_meta?
    rights_include?(ViewRights::UPDATE_VIEW)
  end

  def can_edit?
    mutation_rights? && !is_grouped? && !is_api?
  end

  def rights_include?(right)
    (data || {}).fetch('rights', []).include?(right)
  end

  def mutation_rights?
    [
      ViewRights::ADD,
      ViewRights::DELETE,
      ViewRights::WRITE,
      ViewRights::UPDATE_VIEW
    ].any? { |right| rights_include?(right) }
  end

  def can_read?
    rights_include?(ViewRights::READ)
  end

  def can_add?
    rights_include?(ViewRights::ADD)
  end

  def has_rights?(*rights)
    Array[rights].flatten.all? { |right| rights_include?(right) }
  end

  def has_grant_for?(user, grant_type)
    users_with_grant(grant_type).include?(user.id)
  end

  def can_edit_story?(user)
    raise RuntimeError.new('view is not a story') unless story?

    (
      user.is_owner?(self) ||
      has_grant_for?(user, 'owner') || # Co-owner
      has_grant_for?(user, 'contributor')
    )
  end

  def can_preview_story?(user)
    raise RuntimeError.new('view is not a story') unless story?

    (
      can_edit_story?(user) ||
      has_grant_for?(user, 'viewer') ||
      user.has_right?(UserRights::VIEW_UNPUBLISHED_STORY)
    )
  end

  def users_with_grant(grant_type)
    (grants || []).select { |grant| !grant.flag?('public') && grant.type.to_s.downcase == grant_type }.
      map { |matched_grant| matched_grant.userId || matched_grant.userEmail }.flatten.sort.uniq
  end

  def owner_users
    users_with_grant('owner')
  end

  def contributor_users
    users_with_grant('contributor')
  end

  def viewer_users
    users_with_grant('viewer').reject {|u| contributor_users.include? u}
  end

  def shares
    filtered_grants = (grants || []).reject {|g| g.flag?('public')}
    user_ids = Hash.new
    filtered_grants.each do |g|
      if g.userId.present?
        user_ids[g.userId] = true
      end
    end
    users = Hash.new
    if user_ids.any?
      users_list = User.find 'ids' => user_ids.keys
      users_list.each {|u| users[u.id] = u }
    end
    user_shares = Hash.new
    filtered_grants.each do |g|
      user_id = g.userId.nil? ? g.userEmail : g.userId
      s = Share.new((g.type || '').capitalize, user_id,
                    g.userId.nil? ? g.userEmail : users[g.userId].displayName, users[g.userId],
                    !g.userId.nil?, false, g.inherited)
      user_shares[user_id] = s
    end
    user_shares.values
  end

  def filters
    View.find({"method" => 'getByTableId', "tableId" => self.tableId}, {}, false, false, true).
      reject {|l| l.is_blist? || l.is_blobby?}
  end

  def parent_dataset
    return @parent_dataset unless !defined? @parent_dataset
    if is_blist? || ((is_href? || is_blobby?) && flag?("default"))
      @parent_dataset = self
    else
      url = "/views/#{id}.json?method=getDefaultView&accessType=WEBSITE"
      begin
        @parent_dataset = View.parse(CoreServer::Base.connection.get_request(url))
      rescue CoreServer::CoreServerError => e
        if (e.error_code == 'authentication_required') || (e.error_code == 'permission_denied')
          @parent_dataset = nil
        else
          raise e
        end
      rescue CoreServer::ResourceNotFound => e
        @parent_dataset = nil
      end
    end
    return @parent_dataset
  end

  # in case there's a modifyingViewUid
  def parent_view
    return @parent_view unless @parent_view.nil?
    if modifyingViewUid.present?
      @parent_view = View.find modifyingViewUid
    else
      @parent_view = self.parent_dataset
    end
    return @parent_view
  end

  def comments
    Comment.find(id)
  end

  def share_date_for_contact(contact)
    out = ""
    contact_grant = grants.find {|g| g.userId == contact.id}
    if (contact_grant)
      out = contact_grant.createdAt
    end
  end

  def is_alt_view?
    !available_display_types.eql?(['table', 'fatrow', 'page'])
  end

  def is_form?
    display.is_a?(Displays::Form)
  end

  def new_backend?
    newBackend? # Cannot use alias because :newBackend? derives from method_missing
  end

  def use_soda2?
    should_use = newBackend? || FeatureFlags.derive(self).useSoda2

    case should_use
    when 'always', TrueClass
      true
    else
      false
    end
  end

  def can_add_form?
    columns.any? {|c| !c.flag?('hidden')}
  end

  def can_add_calendar?
    columns.any? {|c| (c.renderTypeName == 'date' ||
                       c.renderTypeName == 'calendar_date') &&
                       !c.flag?('hidden')} &&
      columns.any? {|c| c.renderTypeName == 'text' && !c.flag?('hidden')}
  end

  def can_add_map?
    return columns.select {|c| ['location', 'point'].include?(c.renderTypeName) &&
      !c.flag?('hidden')}.length > 0
  end

  def is_tabular?
    viewType == 'tabular'
  end

  def non_tabular?
    !is_tabular?
  end

  def is_blobby?
    viewType == 'blobby'
  end

  def data_lens?
    is_tabular? && displayType == 'data_lens'
  end

  def visualization?
    standalone_visualization? || classic_visualization?
  end

  def standalone_visualization?
    is_tabular? && (is_data_lens_chart? || is_data_lens_map?)
  end

  def classic_visualization?
    classic_chart? || classic_map?
  end

  def classic_chart?
    is_tabular? && displayType == 'chart'
  end

  def classic_map?
    is_tabular? && displayType == 'map'
  end

  def is_data_lens_chart?
    displayType == 'data_lens_chart'
  end

  def is_data_lens_map?
    displayType == 'data_lens_map'
  end

  def visualization_interchange_format_v1
    raise 'Only standalone visualizations have VIF representations' unless standalone_visualization?

    JSON::parse(
      displayFormat.visualization_interchange_format_v1
    ).with_indifferent_access
  end

  # Returns an array of column names that are mentioned in
  # display_format.
  def display_format_columns
    # Maps don't use the normal valueColumns/seriesColumns/fixedColumns thing.
    view_definition_column_field_names = (displayFormat.viewDefinitions || []).select do |viewDefinition|
      viewDefinition['uid'] == 'self' || viewDefinition['uid'] == id
    end.map do |viewDefinition|
      viewDefinition.try(:[], 'plot').try(:[], 'locationId')
    end.map do |locationId|
      column_by_table_column_id(locationId)
    end.compact.map(&:fieldName)

    [
      view_definition_column_field_names,
      (displayFormat.valueColumns || []).pluck('fieldName'),
      displayFormat.fixedColumns || [],
      (displayFormat.seriesColumns || []).pluck('fieldName')
    ].flatten.compact.uniq
  end

  def pulse?
    displayType == 'pulse'
  end

  def draft?
    displayType == 'draft' && viewType == 'tabular'
  end

  def story?
    # 12/8/2015 - We are changing the viewType of a storyteller asset from 'href'
    # to 'story'. As such, for the duration of our migration we will have to
    # support two definitions for what constitutes a story:
    #
    #   1. viewType == 'href' && displayType == 'story'
    #   2. viewType == 'story' && displayType == 'story'
    #
    # Once our migration is complete, we will cease to support the first case,
    # relying only on viewType == 'story'.
    (viewType == 'href' && displayType == 'story') || viewType == 'story'
  end

  def is_href?
    viewType == 'href'
  end

  def is_geo?
    metadata.present? && metadata.data['geo'].present?
  end

  def is_arcgis?
    !metadata.blank? && !metadata.data['custom_fields'].blank? &&
      !metadata.data['custom_fields']['Basic'].blank? &&
      !metadata.data['custom_fields']['Basic']['Source'].blank?
  end

  def is_insecure_arcgis?
    is_arcgis? && /^https/.match(metadata.data['custom_fields']['Basic']['Source']).nil?
  end

  def is_api?
    displayType == 'api'
  end

  def is_immutable?
    is_blobby? || is_geo?
  end

  def can_email?
    is_tabular?
  end

  def can_print?
    !is_alt_view?
  end

  def is_link?
    display.display_type == 'link'
  end

  def modern_display_type
    {
      'annotatedtimeline' => 'chart',
      'imagesparkline' => 'chart',
      'areachart' => 'chart',
      'barchart' => 'chart',
      'columnchart' => 'chart',
      'linechart' => 'chart',
      'piechart' => 'chart',

      'intensitymap' => 'map',
      'geomap' => 'map'
    }.fetch(displayType, displayType)
  end

  # Retrieve the display.  The display model represents the view's display and controls how the view is rendered.
  def display
    return @display if @display

    dt = modern_display_type

    if is_api_geospatial?
      dt = 'map'
    end

    # If we have a display attempt to load the implementing class
    if dt
      # Hack around Page being a different top-level class
      if dt.camelize == 'Page'
        display_class = Displays::Page
      else
        begin
          display_class = Displays.const_get(dt.camelize)
        rescue NameError
          Rails.logger.info "Ignoring invalid display type #{dt}"
        end
      end
    end

    if !display_class
      if is_blobby?
        display_class = Displays::Blob
      elsif is_href?
        display_class = Displays::Href
      elsif is_api?
        display_class = Displays::Api
      else
        # Table display is the default if the display type is absent or invalid
        display_class = Displays::Table
      end
    end

    # Create the display
    @display = display_class.new(self)
  end

  def available_display_types
    adt = metadata.nil? ? nil : metadata.availableDisplayTypes
    if adt.nil?
      if display.is_a?(Displays::Href)
        adt = ['href']
      elsif display.is_a?(Displays::Blob)
        adt = ['blob']
      elsif display.is_a?(Displays::Form)
        adt = ['form']
      elsif display.is_a?(Displays::Table)
        adt = ['table', 'fatrow', 'page']
      else
        adt = [modern_display_type, 'table', 'fatrow', 'page']
      end
    end
    return adt
  end

  def visible_display_types
    visible_types = metadata.data['renderTypeConfig']['visible'] rescue nil
    if visible_types.nil?
      return [ displayType ]
    else
      return visible_types.keys
    end
  end

  # A human readable form of what the view type is, e.g. 'Dataset' rather than 'Table'
  def display_name
    d = display
    return @@display_names[d.name] || d.name
  end

  def dataset?
    # 'filtered view' is anything that uses sorting / roll-up / filter / conditional formatting
    #
    # This duplicates the logic used in #display to determine which Displays
    # class to use, as well as the logic within Displays::Table to determine
    # if it's a table, since we can't rely on the display_name being "table"
    # when we throw localization into the mix.

    # If it looks like a blist and quacks like a blist, it still might not be a blist...
    is_not_dataset = [is_blobby?, standalone_visualization?, data_lens?, is_href?, is_api?].any?
    is_blist? && !is_not_dataset
  end

  def owned_by?(user)
    if user.nil?
      false
    else
      self.owner.id == user.id ||
        (grants && grants.any? { |p| p.userId == user.id && (p.type || '').downcase == 'owner' })
    end
  end

  def shared_to?(user)
    (grants || []).map(&:userId).include?(user.id)
  end

  def can_modify_data?
    # The user can modify the data if:
    # - This is a blist
    # - They can edit it
    # - It is unpublished
    return (self.can_edit? && self.is_blist? && self.is_unpublished?)
  end

  def columns_for_datatypes(datatypes, include_hidden = false)
    columns.select do |c|
      (include_hidden || !c.flag?('hidden')) && datatypes_match(c, datatypes)
    end
  end

  def datatypes_match(column, datatypes)
    dt = column.client_type
    datatypes.is_a?(Array) && datatypes.include?(dt) || dt == datatypes
  end

  # Value out of 100
  def update_rating(value, type)
    CoreServer::Base.connection.create_request(
      "/#{self.class.name.pluralize.downcase}/#{id}/ratings.json",
      { type: type, rating: value }.to_json)
  end

  def email(email = nil)
    CoreServer::Base.connection.create_request(
      "/#{self.class.name.pluralize.downcase}/#{id}.json?method=sendAsEmail",
      { :message => '', :recipient => email }.to_json)
  end

  def flag(params = {})
    CoreServer::Base.connection.create_request(
      "/#{self.class.name.pluralize.downcase}/#{id}.json?method=flag&#{params.to_param}")
  end

  def rdf_class
    metadata.nil? ? nil : metadata.rdfClass
  end

  def rdf_subject
    if (!metadata.nil? && !metadata.rdfSubject.nil?)
      rdfSubj = metadata.rdfSubject
      rdfSubjCol = column_by_id_or_field_name(rdfSubj)
      if !rdfSubjCol.nil?
        return rdfSubjCol.name
      end
    end
  end

  def rdf_class_display_name
    if rdf_class.blank?
      return rdf_class
    end

    rdf_classes = RdfTerm.all_classes

    rdf_classes.each do |m|
      if (m.CName == rdf_class)
        return m.namespace + ': ' + (m.displayName.empty? ? m.name : m.displayName)
      end
    end
    return rdf_class
  end

  def row_identifier
    if (!metadata.nil? && !metadata.rowIdentifier.nil?)
      rdf_row_ident_col = column_by_id_or_field_name(metadata.rowIdentifier)
      if !rdf_row_ident_col.nil?
        return rdf_row_ident_col.name
      end
    end
  end

  def row_label
    metadata.try(:rowLabel)
  end

  def get_rating_class(rating)
    ['zero', 'one', 'two', 'three', 'four', 'five'][
      ((rating * 2.0).round / 2.0).floor] +
      ((rating * 2.0).round % 2 == 1 ? '_half' : '')
  end

  def get_rating_html
    rating = averageRating
    "<div class='rating " +
      "#{get_rating_class(rating)}' " +
      "title='#{rating}'><span>#{rating}</span></div>"
  end

  def custom_image(size = 'medium')
    if self.iconUrl
      if self.iconUrl.start_with?('fileId:')
        return "/api/views/#{self.id}/files/#{self.iconUrl.split(':')[1]}?size=#{size}"
      else
        return "/assets/#{self.iconUrl}?s=#{size}"
      end
    else
      return nil
    end
  end

  def preferred_image(port = 80)
    if !custom_image.nil?
      return custom_image('thumb')
    elsif !self.metadata.nil? && ((self.metadata.data['thumbnail'] || {})['page'] || {})['filename'].present?
      url_port = (port == 80) ? '' : ':' + port.to_s
      protocol = federated? ? "//#{domainCName}#{url_port}" : ''
      return "#{protocol}/api/views/#{self.id}/snapshots/page?size=thumb"
    end
    nil
  end

  def preferred_image_type
    if !custom_image.nil?
      return 'customImage'
    elsif !self.metadata.nil? && ((self.metadata.data['thumbnail'] || {})['page'] || {})['filename'].present?
      return 'thumbnail'
    end
    ''
  end

  # Looks for property with _name_, or asks Configurations service
  def property_or_default(path)
    unless path.is_a?(Array)
      path = path.to_s.split('.')
    end
    value = data.deep_value_at(path)
    return value unless value.nil?

    defaults = CurrentDomain.properties.dataset_defaults || Hashie::Mash.new
    return defaults.deep_value_at(path)
  end

  # Don't allow granting "Viewer" to forms as that right is useless
  def share_types
    Share.types.reject do |type|
      is_form? && type == 'Viewer'
    end
  end

  def moderation_status
    case moderationStatus
      when true then 'Approved'
      when false then 'Rejected'
      else 'Pending'
    end
  end

  def merged_metadata
    merged = (data['metadata'] || {}).deep_merge(data['privateMetadata'] || {})
    return merged unless merged['custom_fields'].present? && (custom_fields = CurrentDomain.property(:fieldsets, :metadata)).present?
    # This is a massive hack for CORE-1535.
    # If a field is set to private in /admin/metadata, do not display it to unsigned users.
    # If a field is set to public  in /admin/metadata, force it to use the public version.
    # This means that it is possible to have a public and private value for the same key.
    # We can call it Schrödinger's Metadata.
    custom_fields.each do |fieldset|
      next unless merged['custom_fields'].has_key? fieldset['name']
      (fieldset['fields'] || []).each do |field|
        next unless merged['custom_fields'][fieldset['name']].has_key? field['name']
        merged['custom_fields'][fieldset['name']][field['name']] = data['metadata'].fetch('custom_fields', {}).fetch(fieldset['name'], {}).fetch(field['name'], nil) unless field['private'] === true
        merged['custom_fields'][fieldset['name']].delete(field['name']) unless can_see_private_meta? || field['private'] != true
      end
      merged['custom_fields'].delete(fieldset['name']) if merged['custom_fields'][fieldset['name']].empty?
    end
    merged
  end

  def approval_history_batch(batch_id)
    CoreServer::Base.connection.get_request("/views/#{id}/approval.json", {}, batch_id)
  end

  def set_approval_history(ah)
    @app_hist = ah
  end

  def approval_history
    if @app_hist.nil?
      path = "/views/#{id}/approval.json"
      @app_hist = JSON.parse(CoreServer::Base.connection.get_request(path))
    end

    return @app_hist
  end

  def last_approval_date
    latest_date = if approval_history.empty?
      createdAt
    else
      approval_history.last['approvalDate']
    end
    return latest_date
  end

  def is_stuck?(approval)
    !approval.nil? &&
      (Time.now - approval.maxInactivityInterval.day).to_i > last_approval_date
  end

  def approval_stream(approval)
    if @app_stream.nil?
      stage_items = {}
      approval_history.each {|ah| stage_items[ah['approvalStageId']] = ah}
      @app_stream = []
      approval.stages.each do |s|
        @app_stream << stage_items[s['id']] if !stage_items[s['id']].nil?
      end
    end

    return @app_stream
  end

  def last_approval(include_rejected = false)
    approval_history.select {|ah| include_rejected || ah['approvalTypeName'] == 'A'}.last
  end

  def next_approval_stage(approval)
    return nil if approval.nil?

    cur_stage = last_approval
    ns = if cur_stage.nil?
      approval.stages[0]
    elsif cur_stage['visible']
      nil
    else
      i = approval.stages.index {|s| s['id'] == cur_stage['approvalStageId']}
      i = -1 if i.nil?
      approval.stages[i + 1]
    end
    return ns
  end

  def set_approval(approval, approval_type, comment = nil)
    next_stage = next_approval_stage(approval)
    return false if next_stage.nil? || !['A', 'R', 'M'].include?(approval_type)

    opts = {:approvalStageId => next_stage['id'],
            :approvalTypeName => approval_type,
            :comment => comment}
    if approval_type == 'M'
      prev_app = last_approval(true)
      return false if prev_app.nil? || prev_app['approvalTypeName'] != 'R'
      opts[:approvalStageId] = prev_app['approvalStageId']
      opts[:relatedApprovalHistoryId] = prev_app['id']
    end

    path = "/#{self.class.name.pluralize.downcase}/#{id}/approval.json"
    CoreServer::Base.connection.create_request(path, opts.to_json)
  end

  # Publishing

  def is_published?
    publicationStage == 'published'
  end

  def is_unpublished?
    publicationStage == 'unpublished'
  end

  def is_snapshotted?
    publicationStage == 'snapshotted'
  end

  def unpublished_dataset
    if @got_unpublished.nil?
      path = "/#{self.class.name.pluralize.downcase}/#{id}.json?method=getPublicationGroup"
      @unpublished = self.class.parse(CoreServer::Base.connection.get_request(path)).detect {|v|
        v.is_blist? && v.is_unpublished?}
      @got_unpublished = true
    end
    @unpublished
  end

  def published_dataset
    if @got_published.nil?
      path = "/#{self.class.name.pluralize.downcase}/#{id}.json?method=getPublicationGroup"
      @published = self.class.parse(CoreServer::Base.connection.get_request(path)).detect {|v|
        v.is_blist? && v.is_published?}
      @got_published = true
    end
    @published
  end

  def make_unpublished_copy
    path = "/views/#{id}/publication.json?method=copy"
    self.class.parse(CoreServer::Base.connection.create_request(path))
  end

  def publish
    path = "/views/#{id}/publication.json"
    self.class.parse(CoreServer::Base.connection.create_request(path))
  end

  def can_publish?
    return true if !columns.any? { |c| c.renderTypeName == 'location' }
    JSON.parse(CoreServer::Base.connection.get_request("/geocoding/#{id}.json?method=pending"))['view'] < 1
  end

  def can_replace?
    can_modify_data? || is_blobby? || is_geo?
  end

  # Maps this View to a JSON blob for use while selecting visualizations for embed.
  # Specific to relatedVisualizationChooser and VisualizationAddController javascript.
  def to_visualization_embed_blob
    visualization = {
      title: name,
      description: description,
      originalUid: id
    }

    # re-fetch the JSON to ensure we have column information (some core calls
    # like that used in find_related strip it out).
    json = fetch_json.deep_merge(
      'metadata' => {
        'renderTypeConfig' => {
          'visible' => {
            'table' => false
          }
        }
      }
    )

    real_view = View.new(json)

    visualization[:data] = json
    visualization[:columns] = real_view.display_format_columns
    visualization[:type] = real_view.displayFormat.chartType
    visualization[:format] = 'classic'

    visualization
  end


  @@default_categories = {
    '' => { text: "-- #{I18n.t 'core.no_category'} --", value: '' }
  }

  # Sorts are enabled and disabled by feature modules
  @@sorts = [
    { :key => "POPULAR",
      :name => "Popularity"
    },
    { :key => "AVERAGE_RATING",
      :name => "Rating",
      :module => :allow_comments
    },
    { :key => "ALPHA",
      :name => "A - Z"
    },
    { :key => "ALPHA_DESC",
      :name => "Z - A"
    },
    { :key => "NUM_OF_VIEWS",
      :name => "# of times Visited"
    },
    { :key => "COMMENTS",
      :name => "# of Comments",
      :module => :allow_comments
    },
    { :key => "LAST_CHANGED",
      :name => "Date"
    },
    { :key => "CATEGORY",
      :name => "Category"
    }
  ]

  def self.sorts
    sorts = Array.new
    @@sorts.each do |sort|
      next if(!sort[:module].nil? && !CurrentDomain.module_enabled?(sort[:module]))

      sorts.push [sort[:key], sort[:name]]
    end
    sorts
  end

  @@search_sorts = [
    { :key => "RELEVANCE",  :name => "Relevance" },
    { :key => "SCORE",      :name => "Popularity" },
    { :key => "NEWEST",     :name => "Recently updated" },
    { :key => "OLDEST",     :name => "Oldest" },
    { :key => "RATING",
      :name => "Rating",
      :module => :allow_comments
    },
    { :key => "COMMENTS",
      :name => "# of Comments",
      :module => :allow_comments
    }
  ]

  def self.search_sorts
    sorts = Array.new
    @@search_sorts.each do |sort|
      next if(!sort[:module].nil? && !CurrentDomain.module_enabled?(sort[:module]))

      sorts.push [sort[:key], sort[:name]]
    end
    sorts
  end

  @@filter_type1s = [
    { :key => "ALL",
      :name => "All"
    },
    { :key => "PARENT_DATASETS",
      :name => "Parent Datasets"
    },
    { :key => "FILTERED_VIEWS",
      :name => "Filtered Views"
    },
    { :key => "CHARTS",
      :name => "Charts"
    },
    { :key => "MAPS",
      :name => "Maps"
    },
    { :key => "CALENDARS",
      :name => "Calendars"
    }
  ]

  @@display_names = {
    'Blob' => 'File',
    'Href' => 'Linked Dataset',
    'Table' => 'Dataset'
  }

  protected
  def make_rows_request(req, is_anon, cache_req = true)
    if use_soda2?
      make_rows_request_using_soda2(req, is_anon)
    else
      make_rows_request_using_soda1(req, is_anon, cache_req)
    end
  end

  def make_rows_request_using_soda1(req, is_anon, cache_req = true)
    parse_json_with_max_nesting(
      CoreServer::Base.connection.create_request(
        req[:url],
        req[:request].to_json,
        { 'X-Socrata-Federation' => 'Honey Badger' },
        cache_req,
        false,
        is_anon
    ))
  end

  def make_rows_request_using_soda2(req, is_anon)
    parse_json_with_max_nesting(
      CoreServer::Base.connection.get_request(
        req[:url],
        { 'X-Socrata-Federation' => 'Honey Badger' },
        false,
        is_anon
    ))
  end

  def cache_row_results(result, options = {})
    @cached_rows ||= {}
    unless options[:only_meta]
      @cached_rows[:rows] = result[:rows]
      @cached_rows[:start] = options[:start]
    end
    unless options[:no_meta]
      @cached_rows[:total_count] = options[:total_count] || result['meta']['totalRows']
      @cached_rows[:meta_columns] = options[:meta_columns] ||
        result['meta']['view']['columns'].find_all { |c| c['dataTypeName'] == 'meta_data' }
    end
  end

  private

  def cache
    @@cache ||= Rails.cache
  end

  def parse_json_with_max_nesting(data, max_nesting = 25)
    JSON.parse(data, :max_nesting => max_nesting)
  end

end
