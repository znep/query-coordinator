class View < Model
  def self.find( options = nil )
    self.find_under_user(options)
  end

  def self.find_multiple(ids)
    path = "/#{self.name.pluralize.downcase}.json?" + {'ids' => ids}.to_param
    get_request(path)
  end
  
  def self.create_favorite(id)
    path = "/favorite_views/"
    self.create_request(path, { "id" => id })
  end
  
  def create_favorite
    self.class.create_favorite(self.id)
  end
  
  def self.delete_favorite(id)
    path = "/favorite_views/#{id}"
    self.delete_request(path)
  end
  
  def delete_favorite
    self.class.delete_favorite(self.id)
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

  def tag_display_string
    self.tags.map { |tag| tag.data }.join(", ")
  end

  def last_updated_user
    rowsUpdatedBy.blank? ? nil : User.find(rowsUpdatedBy)
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
          s = Share.new(nil, user_id, g.userId.nil? ?
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
    View.find( {"blistId" => self.blistId} ).reject {|l| l.is_blist?}
  end

end
