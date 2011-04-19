class View < Model
  cattr_accessor :licenses, :creative_commons, :merged_licenses,
    :filter_type1s, :overridable_features

  def self.find(options = nil, get_all=false)
    if get_all || options.is_a?(String)
      return super(options)
    else
      return self.find_under_user(options)
    end
  end

  def self.find_external(ext_id)
    return self.find({'method' => 'getByExternalId', 'externalId' => ext_id}, true)
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

  def self.find_shared_to_user(id)
    path = "/users/#{id}/views.json?method=getShared"
    parse(CoreServer::Base.connection.get_request(path))
  end

  def self.categories
    categories = CurrentDomain.configuration('view_categories').properties
    map = @@default_categories.clone
    categories.each { |c, enabled| map[c.titleize_if_necessary] = c.titleize_if_necessary if enabled }
    return map
  end

  def module_enabled?(name)
    return false if self.disabledFeatureFlags && self.disabledFeatureFlags.member?(name.to_s)
    return CurrentDomain.module_enabled?(name.to_s.downcase.to_sym)
  end

  def enabled_modules
    result = {}
    self.overridable_features.each do |feature|
      result[feature[:key]] = self.module_enabled?(feature[:key])
    end
    return result
  end

  def disabled_features
    features = @@overridable_features.select do |flag|
      CurrentDomain.module_enabled?(flag[:key].to_s.downcase.to_sym)
    end
    unless self.disabledFeatureFlags.blank?
      self.disabledFeatureFlags.each do |flag|
        feature_index = features.find_index {|f| f[:key] == flag}
        features[feature_index][:disabled] = true if feature_index
      end
    end
    features
  end

  def column_by_id(column_id)
    self.columns.find{ |c| c.id == column_id }
  end

  def visible_columns
    self.columns.reject {|c| c.flag?('hidden')}.sort_by {|c| c.position}
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
               :accessType => 'WEBSITE',
               :meta => true,
               :start => (page - 1) * per_page,
               :length => per_page }

    if conditions.empty?
      url = "/#{self.class.name.pluralize.downcase}/#{id}/rows.json?#{params.to_param}"
      meta_and_data = JSON.parse(CoreServer::Base.connection.create_request(url), {:max_nesting => 25})

      url = "/#{self.class.name.pluralize.downcase}/#{id}/rows.json?method=getAggregates"
      aggregates = JSON.parse(CoreServer::Base.connection.create_request(url))
    else
      merged_conditions = self.query.data.deep_merge(conditions)
      request_body = {
        'name' => self.name,
        'searchString' => merged_conditions.delete('searchString'),
        'query' => merged_conditions,
        'originalViewId' => self.id
      }.to_json

      url = "/#{self.class.name.pluralize.downcase}/INLINE/rows.json?#{params.to_param}"
      meta_and_data = JSON.parse(CoreServer::Base.connection.create_request(url, request_body), {:max_nesting => 25})

      url = "/#{self.class.name.pluralize.downcase}/INLINE/rows.json?method=getAggregates"
      aggregates = JSON.parse(CoreServer::Base.connection.create_request(url, request_body))
    end

    # grab viewable columns; this is inline rather than a separate method to
    # mitigate the need for another core server request
    viewable_columns =
      meta_and_data['meta']['view']['columns'].
        map{ |column_hash| Column.set_up_model(column_hash) }.
        each_with_index{ |column, i| column.data_position = i }.
        find_all{ |column| column.dataTypeName != 'meta_data' &&
                          !column.flag?("hidden") }.
        sort_by { |column| column.position }

    # grab other return values
    data = meta_and_data['data']['data'] # ask the core server gods.
    row_count = meta_and_data['meta']['totalRows']

    return data, viewable_columns, aggregates, row_count
  end

  def get_rows_by_ids(ids, req_body = nil)
    id_params = ids.inject(""){|mem, id| mem << "&ids[]=#{id}"}

    if req_body.nil?
      url = "/#{self.class.name.pluralize.downcase}/#{id}/rows.json?accessType=WEBSITE#{id_params}"
      return JSON.parse(CoreServer::Base.connection.get_request(url))['data']
    else
      url = "/#{self.class.name.pluralize.downcase}/INLINE/rows.json?accessType=WEBSITE#{id_params}"
      return JSON.parse(CoreServer::Base.connection.create_request(url, req_body))['data']
    end
  end

  def get_row(row_id)
    result = JSON.parse(CoreServer::Base.connection.create_request(
      "/#{self.class.name.pluralize.downcase}/#{id}/" +
      "rows.json?ids=#{row_id}&meta=true&method=getByIds"), {:max_nesting => 25})
    r = result['data']['data'][0]
    return nil if r.nil?

    return transform_row(r, result['meta']['view']['columns'])
  end

  def get_row_by_index(row_index)
    result = JSON.parse(CoreServer::Base.connection.create_request(
      "/#{self.class.name.pluralize.downcase}/#{id}/" +
      "rows.json?start=#{row_index}&length=1&meta=true&method=getByIds"),
        {:max_nesting => 25})
    r = result['data']['data'][0]
    return nil if r.nil?

    return transform_row(r, result['meta']['view']['columns'])
  end

  def get_row_index(row_id)
    result = JSON.parse(CoreServer::Base.connection.create_request(
      "/#{self.class.name.pluralize.downcase}/#{id}/" +
      "rows.json?ids=#{row_id}&indexesOnly=true&method=getByIds"))
    return result[row_id.to_s]
  end

  def get_sid_by_row_identifier(row_identifier)
    result = CoreServer::Base.connection.get_request(
      "/#{self.class.name.pluralize.downcase}/#{id}/" +
      "rows?method=getSidByRowIdentifier&id=#{row_identifier}")
    return result
  end


  def json(params)
    url = "/#{self.class.name.pluralize.downcase}/#{id}/rows.json"
    if !params.nil?
      url += '?' + params.to_param
    end
    escape_object(JSON.parse(CoreServer::Base.connection.get_request(url), {:max_nesting => 25})).
      to_json.html_safe!
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
        "/api/assets/#{featured_view['assetId']}?s=featured"
    end
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

  def to_json(opts = nil)
    dhash = data_hash
    dhash["numberOfComments"] = numberOfComments
    dhash["averageRating"] = averageRating
    dhash["totalTimesRated"] = totalTimesRated

    dhash.to_json(opts)
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

  def totalTimesRated
    data['totalTimesRated'] || 0
  end

  def last_activity
    if @last_activity.nil?
      @last_activity = [rowsUpdatedAt || 0, createdAt || 0, viewLastModified || 0].max
    end
    @last_activity
  end

  def last_viewed
    if @last_viewed.nil?
      @last_viewed = [lastOpenedDate || 0, createdAt || 0].max
    end
    @last_viewed
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
      updated_at = self.rowsUpdatedAt.nil? ? nil : blist_long_date(self.rowsUpdatedAt)
      if updated_at
        desc += ", last updated #{updated_at}"
      end
      return desc
    else
      return self.description
    end
  end

  def is_blist?
    flag?("default") && is_tabular?
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

  def last_updated_user
    begin
      return rowsUpdatedBy.blank? ? nil : User.find(rowsUpdatedBy)
    rescue CoreServer::ResourceNotFound
      return nil
    end
  end

  def federated?
    !domainCName.blank?
  end

  def href(port = 80)
    url_port = (port == 80) ? '' : ':' + port.to_s
    protocol = federated? ? "http://#{domainCName}#{url_port}" : ''
    prefix = self.category || 'dataset'
    "#{protocol}/#{prefix.convert_to_url}/#{name.convert_to_url}/#{id}"
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

  def tweet
    return "Check out the #{name} dataset on #{CurrentDomain.strings.company}: #{CurrentDomain.cname}#{short_href}"
  end

  def blobs
    return @blobs if !@blobs.nil?

    if is_blobby?
      opts = { :filename => URI.escape(blobFilename) }
      b = {'href' => "/api/file_data/#{blobId}?#{opts.to_param}",
        'type' => blobMimeType.gsub(/;.*/, ''), 'size' => blobFileSize}
      b['name'] =  blobFilename if blobFilename != name
      @blobs = [b]
    elsif is_href?
      b = []
      if !metadata.nil?
        if !metadata.data['accessPoints'].blank?
          metadata.data['accessPoints'].each do |k, v|
            if !k.end_with?('Size')
              b << {'href' => v, 'type' => k.upcase,
                'size' => metadata.data['accessPoints'][k + 'Size']}
            end
          end
          b.sort_by! {|a| a['type']}
        elsif !metadata.href.blank?
          b << {'href' => metadata.href, 'type' => 'Link', 'size' => 'Unknown'}
        end
      end
      @blobs = b
    end
    return @blobs
  end

  def domain_icon_href
    cname = federated? ? domainCName : CurrentDomain.cname
    "/api/domains/#{cname}/icons/smallIcon"
  end

  def user_role(user_id)
    if (user_id == tableAuthor.id)
      I18n.t(:blist_name).capitalize + " Author"
    elsif (user_id == owner.id)
      "View Author"
    elsif owner_users.any? {|cu| cu == user_id}
      I18n.t(:blist_name).capitalize + " Owner"
    elsif contributor_users.any? {|cu| cu == user_id}
      I18n.t(:blist_name).capitalize + " Contributor"
    elsif viewer_users.any? {|vu| vu == user_id}
      I18n.t(:blist_name).capitalize + " Viewer"
    else
      ""
    end
  end

  # Whether or not the user has priviliges above an anonymous user
  def user_granted?(user)
    if user
      return user_role(user.id).present?
    end
    false
  end

  def can_edit?
    data['rights'] && (data['rights'].include?('write') ||
      data['rights'].include?('add') ||
      data['rights'].include?('delete')) && !is_grouped?
  end

  def can_read?
    data['rights'] && data['rights'].include?('read')
  end

  def can_add?
    data['rights'] && data['rights'].include?('add')
  end

  def has_rights?(right)
    data['rights'] && data['rights'].include?(right)
  end


  def users_with_grant(grant_type)
    (grants || []).select {|g| !g.flag?('public') &&
      (g.type || '').downcase == grant_type}.
      collect do |g|
        if !g.userId.nil?
          g.userId
        else
          g.userEmail
        end
      end.flatten.sort.uniq
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
      reject {|l| l.is_blist? || l.is_blobby?}
  end

  def parent_dataset
    return @parent_dataset unless @parent_dataset.nil?
    if is_blist? || ((is_href? || is_blobby?) && flag?("default"))
      @parent_dataset = self
    else
      @parent_dataset = View.find({"method" => 'getByTableId', "tableId" => self.tableId}, true).
                             find{ |l| l.is_blist? || ((l.is_href? || l.is_blobby?) && l.flag?("default")) }
    end
    return @parent_dataset
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
    return columns.select {|c| c.renderTypeName == 'location' &&
      !c.flag?('hidden')}.length > 0
  end

  def is_tabular?
    viewType == 'tabular'
  end

  def is_blobby?
    viewType == 'blobby'
  end

  def is_href?
    viewType == 'href'
  end

  def can_email?
    is_tabular?
  end

  def can_print?
    !is_alt_view?
  end

  def modern_display_type
    return {
          'annotatedtimeline' => 'chart',
          'imagesparkline' => 'chart',
          'areachart' => 'chart',
          'barchart' => 'chart',
          'columnchart' => 'chart',
          'linechart' => 'chart',
          'piechart' => 'chart',

          'intensitymap' => 'map',
          'geomap' => 'map'
    }[displayType] || displayType
  end

  # Retrieve the display.  The display model represents the view's display and controls how the view is rendered.
  def display
    return @display if @display

    dt = modern_display_type

    # If we have a display attempt to load the implementing class
    if dt
      begin
        display_class = eval "Displays::#{dt.camelize}"
      rescue NameError
        Rails.logger.info "Ignoring invalid display type #{dt}"
      end
    end

    if !display_class
      if is_blobby?
        display_class = Displays::Blob
      elsif is_href?
        display_class = Displays::Href
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

  # A human readable form of what the view type is, e.g. 'Dataset' rather than 'Table'
  def display_name
    d = display
    return @@display_names[d.name] || d.name
  end

  def owned_by?(user)
    if user.nil?
      false
    else
      self.owner.id == user.id
    end
  end

  def can_modify_data?
    # The user can modify the data if:
    # - This is a blist
    # - They can edit it
    return (self.can_edit? && self.is_blist?)
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

  def email(email = nil)
    CoreServer::Base.connection.create_request("/#{self.class.name.pluralize.downcase}/#{id}" +
      ".json?method=sendAsEmail", { :message => '', :recipient => email }.to_json)
  end

  def flag(params = {})
    CoreServer::Base.connection.create_request("/#{self.class.name.pluralize.downcase}/#{id}.json" +
      "?method=flag&" + params.to_param)
  end

  def rdf_class
    metadata.nil? || metadata.rdfClass.nil? ? '(none)' : metadata.rdfClass
  end

  def rdf_subject
    if (!metadata.nil? && !metadata.rdfSubject.nil?)
      rdfSubj = metadata.rdfSubject
      rdfSubjCol = column_by_id(rdfSubj.to_i)
      if !rdfSubjCol.nil?
        return rdfSubjCol.name
      end
    end
    '(none)'
  end

  def rdf_class_display_name
    if (rdf_class.nil? || rdf_class == '')
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
      rdf_row_ident_col = column_by_id(metadata.rowIdentifier.to_i)
      if !rdf_row_ident_col.nil?
        return rdf_row_ident_col.name
      end
    end
    '(none)'
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
    (data['metadata']|| {}).deep_merge(data['privateMetadata'] || {})
  end

  def approval_history_batch
    CoreServer::Base.connection.get_request("/views/#{id}/approval.json", {}, true)
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

  def set_approval(approval, approved, comment = nil)
    next_stage = next_approval_stage(approval)
    return false if next_stage.nil?

    path = "/#{self.class.name.pluralize.downcase}/#{id}/approval.json"
    CoreServer::Base.connection.create_request(path,
          {:approvalStageId => next_stage['id'],
            :approvalTypeName => approved ? 'A' : 'R',
            :comment => comment}.to_json)
  end

  @@default_categories = {
    "" => "-- No category --"
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


  @@overridable_features = [
    { :key => 'allow_comments',
      :name => 'Commenting'
    }
  ]

  private
  def transform_row(r, columns)
    row = Hash.new
    columns.each_with_index do |c, i|
      if c['dataTypeName'] == 'meta_data'
        row[c['name']] = r[i]
      else
        if c['dataTypeName'] == 'nested_table'
          row[c['id']] = r[i].nil? ? nil : r[i].map {|cr| transform_row(cr, c['childColumns'])}
        else
          row[c['id']] = r[i]
        end
      end
    end
    return row
  end

  memoize :href
end
