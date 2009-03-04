class Lens < Model
  def self.find( options = nil )
    self.find_under_user(options)
  end

  def is_blist?
    flag?("default")
  end

  def is_public?
    grants.any? {|p| p.isPublic}
  end

  def is_private?
    grants.length == 0
  end

  def is_shared?
    grants.any? {|p| !p.isPublic}
  end

  def tag_display_string
    self.tags.map { |tag| tag.data }.join(", ")
  end

  def last_updated_user
    User.find(rowsUpdatedBy)
  end

  def contributor_users
    grants.find_all {|g| !g.isPublic && g.type != 'read'}.
      collect do |g|
        if !g.groupId.nil?
          Group.find(g.groupId.to_s).users.collect {|u| u.id.to_s}
        elsif !g.userId.nil?
          g.userId.to_s
        else
          g.userEmail
        end
      end.flatten.sort.uniq
  end

  def viewer_users
    contributors = contributor_users
    grants.find_all {|g| !g.isPublic && g.type == 'read'}.
      collect do |g|
        if !g.groupId.nil?
          Group.find(g.groupId.to_s).users.collect {|u| u.id.to_s}
        elsif !g.userId.nil?
          g.userId.to_s
        else
          g.userEmail
        end
      end.flatten.sort.uniq.reject {|u| contributors.include? u}
  end

  def shares
    user_shares = Hash.new
    group_shares = Hash.new
    grants.reject {|g| g.isPublic}.each do |g|
      if !g.groupId.nil?
        if !group_shares[g.groupId.to_s]
          s = Share.new(nil, g.groupId.to_s, Group.find(g.groupId.to_s).name,
                        false, true)
          s.type = g.type == 'read' ? Share::VIEWER : Share::CONTRIBUTOR
          group_shares[g.groupId.to_s] = s
        elsif g.type != 'read'
          group_shares[g.groupId.to_s].type = Share::CONTRIBUTOR
        end
      else
        user_id = g.userId.nil? ? g.userEmail : g.userId.to_s
        if !user_shares[user_id]
          s = Share.new(nil, user_id, g.userId.nil? ?
                        g.userEmail : User.find(g.userId.to_s).displayName,
                        true, false)
          s.type = g.type == 'read' ? Share::VIEWER : Share::CONTRIBUTOR
          user_shares[user_id] = s
        elsif g.type != 'read'
          user_shares[user_id].type = Share::CONTRIBUTOR
        end
      end
    end

    group_shares.values.concat(user_shares.values)
  end

  def filters
    Lens.find( {"blistId" => self.blistId} ).reject {|l| l.is_blist?}
  end

end
