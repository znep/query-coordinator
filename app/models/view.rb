class View < Model
  cattr_accessor :categories

  def self.find(options = nil, get_all=false)
    if get_all || options.is_a?(String)
      return super(options)
    else
      return self.find_under_user(options)
    end
  end

  def self.find_multiple(ids)
    path = "/#{self.name.pluralize.downcase}.json?" + {'ids' => ids}.to_param
    get_request(path)
  end

  #TODO: Make this find only popular views.
  def self.find_popular()
    self.find(nil, true)
  end
  
  def self.find_featured()
    path = "/views.json?featured=true"
    get_request(path)
  end

  def self.create_favorite(id)
    path = "/favorite_views?" + {"id" => id}.to_param
    self.create_request(path)
  end

  def create_favorite
    self.data['flags'] << "favorite"
    self.class.create_favorite(self.id)
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

  def update_rating(user_id, rating)
    rating = rating.to_i
    path = "/#{self.class.name.pluralize.downcase}/#{id}/ratings.json" +
      "?value=#{rating * 20}"
    if rating_for_user(user_id) != rating
      if rating_for_user(user_id) > 0
        result = self.class.update_request(path)
      else
        result = self.class.create_request(path)
      end
      data['averageRating'] = result.data['averageRating']
      data['totalTimesRated'] = result.data['totalTimesRated']
      @user_ratings[user_id] = rating
    end
    self
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
    grants.any? {|p| p.flag?('public')}
  end

  def is_private?
    grants.length == 0
  end

  def is_shared?
    grants.any? {|p| !p.flag?('public')}
  end

  def last_updated_user
    rowsUpdatedBy.blank? ? nil : User.find(rowsUpdatedBy)
  end

  def href
    prefix = self.category || 'blist'
    "/#{prefix.convert_to_url}/#{name.convert_to_url}/#{id}"
  end

  def user_role(user_id)
    if (user_id == blistOwner.id)
      I18n.t(:blist_name) + " Author"
    elsif (user_id == owner.id)
      "View Author"
    elsif contributor_users.any? {|cu| cu.id == user_id}
      I18n.t(:blist_name) + " Contributor"
    elsif viewer_users.any? {|vu| vu.id == user_id}
      I18n.t(:blist_name) + " Viewer"
    else
      ""
    end
  end

  def contributor_users
    grants.reject {|g| g.flag?('public') || g.type.downcase == 'read'}.
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
    view_grants = grants.reject {|g| g.flag?('public') ||
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
    grants.reject {|g| g.flag?('public')}.each do |g|
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
    # TODO: Pass get_all=true when the server supports blistId under /views
    if User.current_user
      View.find({"blistId" => self.blistId}).reject {|l| l.is_blist?}
    else
      []
    end
  end

  def comments
    Comment.find(id)
  end

  def rating_for_user(user_id)
    if !@user_ratings
      @user_ratings = Hash.new
      Rating.find(id).each {|r| @user_ratings[r.user.id] = r.rating}
    end
    @user_ratings[user_id] || 0
  end

  @@categories = {
    "" => "-- No category --",
    "Fun" => "Fun",
    "Personal" => "Personal",
    "Business" => "Business",
    "Education" => "Education"
  }

end
