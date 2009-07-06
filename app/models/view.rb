class View < Model
  cattr_accessor :categories, :licenses, :creative_commons, :sorts

  def self.find(options = nil, get_all=false)
    if get_all || options.is_a?(String)
      return super(options)
    else
      return self.find_under_user(options)
    end
  end
  
  def self.find_filtered(options)
    path = "/views.json?#{options.to_param}"
    get_request(path)
  end

  def self.find_multiple(ids)
    path = "/#{self.name.pluralize.downcase}.json?" + {'ids' => ids}.to_param
    get_request(path)
  end
  
  def self.find_for_user(id)
    path = "/users/#{id}/views.json"
    get_request(path)
  end

  def html
    self.class.get_request("/#{self.class.name.pluralize.downcase}/#{id}/" +
      "rows.html?template=bare_template.html", {}, true)
  end

  def self.notify_all_of_changes(id)
    path = "/#{self.name.pluralize.downcase}/#{id}.json?" + 
        {"method" => "notifyUsers"}.to_param
    self.create_request(path)
  end

  def notify_all_of_changes
    self.class.create_favorite(self.id)
  end

  def self.create_favorite(id)
    path = "/favorite_views?" + {"id" => id}.to_param
    self.create_request(path)
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
    super(attributes)
  end

  def self.delete(id)
    path = "/#{self.name.pluralize.downcase}.json?" + {"id" => id, "method" => "delete"}.to_param
    self.delete_request(path)
  end

  def self.delete_favorite(id)
    path = "/favorite_views/#{id}"
    self.delete_request(path)
  end

  def delete_favorite
    self.data['flags'].delete("favorite")
    self.class.delete_favorite(self.id)
  end

  def register_opening
    self.class.create_request("/#{self.class.name.pluralize.downcase}/#{id}.json" +
      "?method=opening")
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
    rowsUpdatedBy.blank? ? nil : User.find(rowsUpdatedBy)
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
    if (user_id == tableOwner.id)
      I18n.t(:blist_name).capitalize + " Author"
    elsif (user_id == owner.id)
      "View Author"
    elsif contributor_users.any? {|cu| cu.id == user_id}
      I18n.t(:blist_name).capitalize + " Contributor"
    elsif viewer_users.any? {|vu| vu.id == user_id}
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
    (grants || []).reject {|g| g.flag?('public') || g.type.downcase == 'read'}.
      collect do |g|
        if !g.groupId.nil?
          Group.find(g.groupId).users.collect {|u| u.id}
        elsif !g.userId.nil?
          g.userId
        else
          g.userEmail
        end
      end.flatten.sort.uniq
  end

  def viewer_users
    contributors = contributor_users
    view_grants = (grants || []).reject {|g| g.flag?('public') ||
      g.type.downcase != 'read'}.
      collect do |g|
        if !g.groupId.nil?
          Group.find(g.groupId).users.collect {|u| u.id}
        elsif !g.userId.nil?
          g.userId
        else
          g.userEmail
        end
      end.flatten.sort.uniq.reject {|u| contributors.include? u}
  end

  def shares
    user_shares = Hash.new
    group_shares = Hash.new
    (grants || []).reject {|g| g.flag?('public')}.each do |g|
      if !g.groupId.nil?
        if !group_shares[g.groupId]
          s = Share.new(nil, g.groupId, Group.find(g.groupId).name,
                        false, true)
          s.type = g.type.downcase == 'read' ? Share::VIEWER : Share::CONTRIBUTOR
          group_shares[g.groupId] = s
        elsif g.type.downcase != 'read'
          group_shares[g.groupId].type = Share::CONTRIBUTOR
        end
      else
        user_id = g.userId.nil? ? g.userEmail : g.userId
        if !user_shares[user_id]
          s = Share.new(nil, g.userId, g.userId.nil? ?
                        g.userEmail : User.find(g.userId).displayName,
                        true, false)
          s.type = g.type.downcase == 'read' ? Share::VIEWER : Share::CONTRIBUTOR
          user_shares[user_id] = s
        elsif g.type.downcase != 'read'
          user_shares[user_id].type = Share::CONTRIBUTOR
        end
      end
    end

    group_shares.values.concat(user_shares.values)
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

  # return true if this view is a visualization (not a table)
  # the displayType contains the type of visualization
  # a nil value indicates that it needs to be rendered as a table
  def is_visualization?
    !self.displayType.nil?
  end

  def chart_class
    case self.displayType
    when 'geomap'
      'google.visualization.GeoMap'
    when 'annotatedtimeline'
      'google.visualization.AnnotatedTimeLine'
    when 'imagesparkline'
      'google.visualization.ImageSparkLine'
    when 'areachart'
      'google.visualization.AreaChart'
    when 'barchart'
      'google.visualization.BarChart'
    when 'columnchart'
      'google.visualization.ColumnChart'
    when 'intensitymap'
      'google.visualization.IntensityMap'
    when 'linechart'
      'google.visualization.LineChart'
    when 'map'
      'google.visualization.Map'
    when 'piechart'
      'google.visualization.PieChart'
    else
      nil
    end
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
    "" => "",
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

  memoize :href
end
