class Share
  cattr_accessor :types
  VIEWER = 'viewer'
  CONTRIBUTOR = 'contributor'
  OWNER = 'owner'

  attr_accessor :type, :member_id, :member_name, :user_member, :is_user, :is_group

  def initialize(_type, _member_id, _member_name, _user_member, _is_user, _is_group)
    self.type = _type
    self.member_id = _member_id
    self.member_name = _member_name
    self.user_member = _user_member
    self.is_user = _is_user
    self.is_group = _is_group
  end

  def member_image(size = "small")
    out = "/images/#{size}-profile.png"
    if (self.is_user)
      if (!user_member.nil?)
        out = user_member.profile_image_path(size)
      end
    else
      out = "/images/icon_group.png"
    end
    out
  end

  @@types = [VIEWER, CONTRIBUTOR, OWNER]
end
