class View < Model
  cattr_accessor :visualization_config, :categories, :licenses,
    :creative_commons, :sorts, :search_sorts

  def self.find(options = nil, get_all=false)
    if get_all || options.is_a?(String)
      return super(options)
    else
      return self.find_under_user(options)
    end
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

  def column_by_id(column_id)
    self.columns.reject {|c| c.id != column_id}[0]
  end

  def html
    CoreServer::Base.connection.get_request("/#{self.class.name.pluralize.downcase}/#{id}/" +
      "rows.html?template=bare_template.html", {})
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
    if attributes['viewFilters'].blank? || attributes['viewFilters'] == '""' ||
      attributes['viewFilters'] == "''" || attributes['viewFilters'] == "null"
      attributes['viewFilters'] = nil
    else
      attributes['viewFilters'] = JSON.parse(attributes['viewFilters'])
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
    grants && grants.any? {|p| p.flag?('public')}
  end
  memoize :is_public?

  def is_private?
    grants.nil? || grants.length == 0
  end

  def is_shared?
    grants && grants.any? {|p| !p.flag?('public')}
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
      data['rights'].include?('delete'))
  end

  def can_read()
    data['rights'] && data['rights'].include?('read')
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
    users_list = User.find({'ids' => user_ids.keys})
    users = Hash.new
    users_list.each {|u| users[u.id] = u }
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
    !self.displayType.nil?
  end

  def is_calendar?
    self.displayType == 'calendar'
  end

  def can_add_calendar?
    columns.any? {|c| c.dataTypeName == 'date' && !c.flag?('hidden')} &&
      columns.any? {|c| c.dataTypeName == 'text' && !c.flag?('hidden')}
  end

  # return true if this view is a visualization (not a table)
  # the displayType contains the type of visualization
  # a nil value indicates that it needs to be rendered as a table
  def is_visualization?
    is_fusion_map? || @@visualization_config.has_key?(self.displayType)
  end

  def is_map?
    self.displayType == "map" || self.displayType == "geomap"
  end

  def is_fusion_map?
    !self.displayType.nil? && !self.displayType[/^FCMap_/].nil?
  end

  def can_add_visualization?
    # TODO: Implement me
    true
  end

  def owned_by?(user)
    self.owner.id == user.id
  end

  # HACK: NYSS wanted the comments tab hidden, so we're manually hiding comments for them
  # Org ID 2 => NYSS
  # Org ID 5 => Ohio AG // The saga continues
  ORGS_WITH_COMMENTS_HIDDEN = [ 2, 5 ]
  def hide_comments?
    ORGS_WITH_COMMENTS_HIDDEN.include? self.owner.organizationId.to_i
  end

  def chart_class
    @@visualization_config.has_key?(self.displayType) ?
      @@visualization_config[self.displayType]['library'] : nil
  end

  @@color_defaults = ['#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff',
    '#0000ff', '#9900ff', '#ff00ff']

  @@visualization_config = {
    'barchart' => {
      'library' => 'google.visualization.BarChart',
      'label' => 'Bar Chart',
      'groupName' => 'Bar',
      'fixedColumns' => [{'dataType' => 'text', 'label' => 'Groups'}],
      'dataColumns' => [{'dataType' => 'number', 'label' => 'Values'}],
      'dataColumnOptions' => [{'label' => 'Bar Color', 'name' => 'colors',
        'type' => 'color', 'default' =>  @@color_defaults[0],
        'colorArray' => @@color_defaults}],
      'mainOptions' => [
        {'label' => 'X-Axis Title', 'name' => 'titleX', 'type' => 'string'},
        {'label' => 'Y-Axis Title', 'name' => 'titleY', 'type' => 'string'}
      ],
      'advancedOptions' => [
        {'label' => 'Legend', 'name' => 'legend',
        'type' => 'dropdown', 'dropdownOptions' => [
          {'value' => 'right', 'label' => 'Right'},
          {'value' => 'left', 'label' => 'Left'},
          {'value' => 'top', 'label' => 'Top'},
          {'value' => 'bottom', 'label' => 'Bottom'},
          {'value' => 'none', 'label' => 'Hidden'}
        ],
        'default' => 'right'},
        {'label' => 'Log Scale', 'name' => 'logScale', 'type' => 'boolean',
        'default' => false}
      ]
    },
    'geomap' => {'library' => 'google.visualization.GeoMap',
      'hidden' => true},
    'annotatedtimeline' => {'library' => 'google.visualization.AnnotatedTimeLine',
      'hidden' => true},
    'imagesparkline' => {'library' => 'google.visualization.ImageSparkLine',
      'hidden' => true},
    'areachart' => {'library' => 'google.visualization.AreaChart',
      'hidden' => true},
    'columnchart' => {'library' => 'google.visualization.ColumnChart',
      'hidden' => true},
    'intensitymap' => {'library' => 'google.visualization.IntensityMap',
      'hidden' => true},
    'linechart' => {'library' => 'google.visualization.LineChart',
      'hidden' => true},
    'map' => {'library' => 'google.visualization.Map',
      'hidden' => true},
    'piechart' => {'library' => 'google.visualization.PieChart',
      'hidden' => true},
    'motionchart' => {'library' => 'google.visualization.MotionChart',
      'hidden' => true}
  }

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

  @@sorts = [
    ["POPULAR", "Popularity"],
    ["AVERAGE_RATING", "Rating"],
    ["ALPHA", "A - Z"],
    ["ALPHA_DESC", "Z - A"],
    ["NUM_OF_VIEWS", "# of times Visited"],
    ["COMMENTS", "# of Comments"],
    ["LAST_CHANGED", "Date"],
    ["CATEGORY", "Category"]
  ]

  @@search_sorts = [
    ["RELEVANCE", "Relevance"],
    ["SCORE", "Popularity"],
    ["NEWEST", "Recently updated"],
    ["OLDEST", "Oldest"],
    ["RATING", "Rating"],
    ["COMMENTS", "# of Comments"]
  ]


  memoize :href
end
