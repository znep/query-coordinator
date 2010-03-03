class View < Model
  cattr_accessor :categories, :licenses, :creative_commons, :merged_licenses

  def self.find(options = nil, get_all=false)
    if get_all || options.is_a?(String)
      return super(options)
    else
      return self.find_under_user(options)
    end
  end
  
  def viewable_columns
    result = self.meta_data_columns.find_all do |column|
      if column.respond_to?(:flags)
        column.data_type_name != 'meta_data' and not column.flags{|flag| flag == "hidden"}
      else
        column.data_type_name != 'meta_data'
      end
    end
    result = result.sort_by{|column| column.id.to_i}
    result
  end

  
  def search_and_sort_viewable_columns(data_rows)
    result = []
    data_rows.each do |data_row|
      sorted_and_viewable_data_column = []
      self.viewable_columns.each do |viewable_column|
        orig_column = self.meta_data_columns.find{|column| column.id == viewable_column.id}
        orig_index = self.meta_data_columns.rindex(orig_column)
        sorted_and_viewable_data_column << data_row[orig_index]
      end
      #add row number to the last column
      sorted_and_viewable_data_column << data_row[0]
      result << sorted_and_viewable_data_column
    end
    result
  end
  
  def self.find_filtered(options)
    path = "/views.json?#{options.to_param}"
    parse(CoreServer::Base.connection.get_request(path))
  end

  def self.find_multiple(ids)
    path = "/#{self.name.pluralize.downcase}.json?" + {'ids' => ids}.to_param
    parse(CoreServer::Base.connection.get_request(path))
  end

  def self.find_for_user(id)
    path = "/users/#{id}/views.json"
    parse(CoreServer::Base.connection.get_request(path))
  end

  def self.find_recent(count)
    return self.find_under_user({'recentlyViewed' => count})
  end

  def self.find_favorites()
    path = "/favorite_views.json"
    parse(CoreServer::Base.connection.get_request(path))
  end

  def column_by_id(column_id)
    self.columns.reject {|c| c.id != column_id}[0]
  end

  def html
    CoreServer::Base.connection.get_request("/#{self.class.name.pluralize.downcase}/#{id}/" +
      "rows.html?template=bare_template.html", {})
  end
  
  def meta_data_columns
    @meta_data_columns ||= get_meta_data_columns
  end
    
  def get_meta_data_columns(params = {})
    # default params
    params = {:_ => Time.now.to_f, :accessType => 'WEBSITE', :include_aggregates => true}.merge params
  
    url = "/#{self.class.name.pluralize.downcase}/#{id}/rows.json?#{params.to_param}"
    parsed_data = JSON.parse(CoreServer::Base.connection.get_request(url, {}))
    parsed_data['meta']['view']['columns'].inject([]){|array, column_hash| array << MetaDataColumn.new(column_hash)}
  end
  
  def get_rows_by_ids(params={})
    ids = params[:ids]
    ids = ids.inject(""){|mem, id| mem << "&ids[]=#{id}"}
    params.delete(:ids)
    # default params
    params = {:_ => Time.now.to_f, :accessType => 'WEBSITE', :include_aggregates => true}.merge params

    url = "/#{self.class.name.pluralize.downcase}/#{id}/rows.json?#{params.to_param}#{ids}"
    JSON.parse(CoreServer::Base.connection.get_request(url, {}))['data']
  end
  
  
  def save_query(params = {})
    query = JSON.parse(params[:query_json])
    query['name'] = params[:name]
    params = {:_ => Time.now.to_f, :accessType => 'WEBSITE', :include_aggregates => true}.merge params
    url = "/views.json?#{params.to_param}"
 
    JSON.parse(CoreServer::Base.connection.create_request(url, query.to_json))
  end

  def find_data(*arguments)
    scope = arguments.slice!(0)
    options = arguments.slice!(0) || {}
    data, aggregates = find_all_data(options);
    return data, aggregates
  end
  
  def find_all_data(options)
    page = options[:page] || 1
    data, aggregates, total_entries = find_row_data(page, options[:conditions])
    data = search_and_sort_viewable_columns(data)
    data = paginate_rows(data, page, total_entries)
    return data, aggregates
  end
  
    def find_row_data_with_conditions(params)
    #build from posted form params
    if params[:query_json].nil?
      fq = FilterQuery.new(self.id, params)
      query = fq.build
      query = query.to_json
    else
      #build from passed in parameter
      query = params[:query_json]
    end
    result = self.get_rows_by_query(query)    
    return result['data'], result['meta']['aggregates']
  end

  def find_row_data(page, conditions = nil)
    if conditions.nil?
      result = self.get_rows
      data = result['data']
      aggregates = result['meta']['aggregates']
      total_entries = data.size
      data = data.paginate(:per_page => PER_PAGE, :page => page)
    else
      data, aggregates = find_row_data_with_conditions(conditions)
      total_entries = data.size
    end
    return data, aggregates, total_entries
  end

  def get_rows_by_query(query, params = {})
    params = {:_ => Time.now.to_f, :accessType => 'WEBSITE', :include_aggregates => true}.merge params
    url = "/#{self.class.name.pluralize.downcase}/INLINE/rows.json?method=index&#{params.to_param}"
    JSON.parse(CoreServer::Base.connection.create_request(url, query))
  end
  
  def get_rows(params = {})
    # default params
    params = {:_ => Time.now.to_f, :accessType => 'WEBSITE', :include_aggregates => true}.merge params

    url = "/#{self.class.name.pluralize.downcase}/#{id}/rows.json?#{params.to_param}"
    JSON.parse(CoreServer::Base.connection.get_request(url, {}))
  end
  
  def find_all_row_data_ids
    self.get_rows(:row_ids_only => true)
  end
    
  def paginate_rows(row_data, page, total_entries)
    paginated_data = WillPaginate::Collection.create(page, PER_PAGE, total_entries) do |pager|
      pager.replace(row_data)
    end
    paginated_data
  end
  
  def json(params)
    url = "/#{self.class.name.pluralize.downcase}/#{id}/rows.json"
    if !params.nil?
      url += '?' + params.to_param
    end
    escape_object(JSON.parse(CoreServer::Base.connection.get_request(url, {}))).
      to_json.html_safe!
  end

  def self.notify_all_of_changes(id)
    path = "/#{self.name.pluralize.downcase}/#{id}.json?" + 
        {"method" => "notifyUsers"}.to_param
    parse(CoreServer::Base.connection.create_request(path))
  end

  def notify_all_of_changes
    self.class.create_favorite(self.id)
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

  def delete_favorite
    self.data['flags'].delete("favorite")
    self.class.delete_favorite(self.id)
  end

  def register_opening
    View.parse(CoreServer::Base.connection.create_request("/#{self.class.name.pluralize.downcase}/#{id}.json" +
      "?method=opening"))
  end

  def set_permissions(perm_value)
    CoreServer::Base.connection.
      update_request("/#{self.class.name.pluralize.downcase}/#{id}.json" +
                     "?method=setPermission&value=#{perm_value}")
  end

  def to_json
    dhash = data_hash
    dhash["numberOfComments"] = numberOfComments
    dhash["averageRating"] = averageRating
    dhash["totalTimesRated"] = totalTimesRated

    dhash.to_json
  end


  def numberOfComments
    data['numberOfComments'] || 0
  end

  def averageRating
    (data['averageRating'] || 0) / 20.0
  end

  def totalTimesRated
    data['totalTimesRated'] || 0
  end

  def last_activity
    if @last_activity.nil?
      @last_activity = [rowsUpdatedAt || 0, createdAt || 0].max
    end
    @last_activity
  end

  def last_viewed
    if @last_viewed.nil?
      @last_viewed = [lastOpenedDate || 0, createdAt || 0].max
    end
    @last_viewed
  end

  def is_blist?
    flag?("default")
  end

  def is_public?
    display.is_public?
  end
  memoize :is_public?

  def is_private?
    grants.nil? || grants.length == 0
  end

  def is_shared?
    grants && grants.any? {|p| !p.flag?('public')}
  end

  def is_grouped?
    !self.query.nil? && !self.query.groupBys.nil? && self.query.groupBys.length > 0
  end

  def is_invalid?
    !message.blank?
  end

  def last_updated_user
    begin
      return rowsUpdatedBy.blank? ? nil : User.find(rowsUpdatedBy)
    rescue CoreServer::ResourceNotFound
      return nil
    end
  end

  def href
    prefix = self.category || 'dataset'
    "/#{prefix.convert_to_url}/#{name.convert_to_url}/#{id}"
  end

  def alt_href
    "#{self.href}/alt"
  end

  def short_href
    "/d/#{id}"
  end

  def about_href
    self.href + "/about"
  end

  def user_role(user_id)
    if (user_id == tableAuthor.id)
      I18n.t(:blist_name).capitalize + " Author"
    elsif (user_id == owner.id)
      "View Author"
    elsif contributor_users.any? {|cu| cu == user_id}
      I18n.t(:blist_name).capitalize + " Contributor"
    elsif viewer_users.any? {|vu| vu == user_id}
      I18n.t(:blist_name).capitalize + " Viewer"
    else
      ""
    end
  end

  def can_edit()
    data['rights'] && (data['rights'].include?('write') ||
      data['rights'].include?('add') ||
      data['rights'].include?('delete')) && !is_grouped?
  end

  def can_read()
    data['rights'] && data['rights'].include?('read')
  end

  def can_add()
    data['rights'] && data['rights'].include?('add')
  end

  def contributor_users
    (grants || []).select {|g| !g.flag?('public') && g.type.downcase == 'contributor'}.
      collect do |g|
        if !g.userId.nil?
          g.userId
        else
          g.userEmail
        end
      end.flatten.sort.uniq
  end

  def viewer_users
    contributors = contributor_users
    view_grants = (grants || []).select {|g| !g.flag?('public') &&
      g.type.downcase == 'viewer'}.
      collect do |g|
        if !g.userId.nil?
          g.userId
        else
          g.userEmail
        end
      end.flatten.sort.uniq.reject {|u| contributors.include? u}
  end

  def shares
    filtered_grants = (grants || []).reject {|g| g.flag?('public')}
    user_ids = Hash.new
    filtered_grants.each do |g|
      if !g.userId.nil?
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
      s = Share.new(g.type.capitalize, user_id, 
                    g.userId.nil? ? g.userEmail : users[g.userId].displayName, users[g.userId],
                    !g.userId.nil?, false)
      user_shares[user_id] = s
    end
    user_shares.values
  end

  def filters
    View.find({"method" => 'getByTableId', "tableId" => self.tableId}, true).
      reject {|l| l.is_blist?}
  end

  def parent_dataset
    return self if is_blist?
    View.find({"method" => 'getByTableId', "tableId" => self.tableId}, true).
      find {|l| l.is_blist?}
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
    !display.is_a?(Displays::Table)
  end

  def is_form?
    display.is_a?(Displays::Form)
  end

  def can_add_form?
    columns.any? {|c| !c.flag?('hidden')}
  end

  def can_add_calendar?
    columns.any? {|c| c.renderTypeName == 'date' && !c.flag?('hidden')} &&
      columns.any? {|c| c.renderTypeName == 'text' && !c.flag?('hidden')}
  end

  # Retrieve the display.  The display model represents the view's display and controls how the view is rendered.
  def display
    return @display if @display

    dt = self.displayType

    # Map legacy types to the proper implementing class
    # TODO - migrate legacy views and remove this code
    if dt
        if dt == 'map'
            dt = 'google' if !displayFormat || !displayFormat.layers
        else
            config = Displays::Config[dt]
            dt = config['display'] if config && config['display']
        end
    end

    # If we have a display attempt to load the implementing class
    if dt
      begin
        display_class = eval "Displays::#{dt.camelize}"
      rescue NameError
        Rails.logger.info "Ignoring invalid display type #{dt}"
      end
    end

    # Table display is the default if the display type is absent or invalid
    display_class = Displays::Table unless display_class

    # Create the display
    @display = display_class.new(self)
  end

  def can_add_visualization?
    Displays::Config.each_public do |k, v|
      return true if can_create_visualization_type?(k)
    end
    return false
  end

  def can_create_visualization_type?(viz_type, include_hidden = false)
    config = Displays::Config[viz_type]
    return false if config.nil? || (!include_hidden && config['hidden'])

    return has_columns_for_visualization_type?(viz_type, include_hidden)
  end

  def has_columns_for_visualization_type?(viz_type, include_hidden = false)
    config = Displays::Config[viz_type]

    # If there's no configuration defined then treat as invalid
    return false if config.nil?

    to_check = []
    if config.has_key?('fixedColumns')
      to_check.concat(config['fixedColumns'])
    end
    if config.has_key?('dataColumns')
      to_check.concat(config['dataColumns'])
    end

    to_check.each do |tc|
      next if tc['optional']

      if columns_for_datatypes(tc['dataType'], include_hidden).length < 1
        return false
      end
    end
    return true
  end

  def owned_by?(user)
    if user.nil?
      false
    else
      self.owner.id == user.id
    end
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

  @@categories = {
    "" => "-- No category --",
    "Fun" => "Fun",
    "Personal" => "Personal",
    "Business" => "Business",
    "Education" => "Education",
    "Government" => "Government"
  }

  @@licenses = {
    "" => "-- No License --",
    "PUBLIC_DOMAIN" => "Public Domain",
    "CC" => "Creative Commons"
  }

  @@creative_commons = {
    "CC0_10" => "1.0 Universal",
    "CC_30_BY" => "Attribution 3.0 Unported",
    "CC_30_BY_SA" => "Attribution | Share Alike 3.0 Unported",
    "CC_30_BY_ND" => "Attribution | No Derivative Works 3.0 Unported",
    "CC_30_BY_NC" => "Attribution | Noncommercial 3.0 Unported",
    "CC_30_BY_NC_SA" => "Attribution | Noncommercial | Share Alike 3.0 Unported",
    "CC_30_BY_NC_ND" => "Attribution | Noncommercial | No Derivative Works 3.0 Unported"
  }

  @@merged_licenses = {
    "" => "-- No License --",
    "PUBLIC_DOMAIN" => "Public Domain",
    "CC" => "Creative Commons",
    "CC0_10" => "1.0 Universal",
    "CC_30_BY" => "Attribution 3.0 Unported",
    "CC_30_BY_SA" => "Attribution | Share Alike 3.0 Unported",
    "CC_30_BY_ND" => "Attribution | No Derivative Works 3.0 Unported",
    "CC_30_BY_NC" => "Attribution | Noncommercial 3.0 Unported",
    "CC_30_BY_NC_SA" => "Attribution | Noncommercial | Share Alike 3.0 Unported",
    "CC_30_BY_NC_ND" => "Attribution | Noncommercial | No Derivative Works 3.0 Unported"
  }

  FILTER_CONDITIONS = {
    :text =>     [ { :operator => "EQUALS", :label => "equals" },
                   { :operator => "NOT_EQUALS", :label => "does not equal" },
                   { :operator => "STARTS_WITH", :label => "starts with" },
                   { :operator => "CONTAINS", :label => "contains" } ],
    :date =>     [ { :operator => "EQUALS", :label => "on" },
                   { :operator => "NOT_EQUALS", :label => "not on" },
                   { :operator => "LESS_THAN", :label => "before" },
                   { :operator => "GREATER_THAN", :label => "after" },
                   { :operator => "BETWEEN", :label => "between" } ],
    :checkbox => [ { :operator => "EQUALS", :label => "equals" } ],
    :photo =>    [ { :operator => "IS_BLANK", :label => "is empty" },
                   { :operator => "IS_NOT_BLANK", :label => "exists" } ],
    :number =>   [ { :operator => "EQUALS", :label => "equals" }, 
                   { :operator => "NOT_EQUALS", :label => "not equals" },
                   { :operator => "LESS_THAN", :label => "less than" },
                   { :operator => "LESS_THAN_OR_EQUALS", :label => "less than or equal to" },
                   { :operator => "GREATER_THAN", :label => "greater than" },
                   { :operator => "GREATER_THAN_OR_EQUALS", :label => "greater than or equal to" },
                   { :operator => "BETWEEN", :label => "between"} ]
  }
  PER_PAGE = 50


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


  memoize :href
end
