class Share
  VIEWER = 'Viewer'
  CONTRIBUTOR = 'Contributor'

  attr_accessor :type, :member_id, :member_name, :is_user, :is_group

  def initialize(_type, _member_id, _member_name, _is_user, _is_group)
    self.type = _type
    self.member_id = _member_id
    self.member_name = _member_name
    self.is_user = _is_user
    self.is_group = _is_group
  end

  def member_image(size = "small")
    out = "/images/#{size}-profile.png"
    if (self.is_user)
      if (!member_id.nil?)
        user_member = User.find(member_id)
        if (!user_member.nil?)
          out = user_member.profile_image(size)
        end
      end
    else
      out = "/images/icon_group.png"
    end
    out
  end
end
