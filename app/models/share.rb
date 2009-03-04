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
end
