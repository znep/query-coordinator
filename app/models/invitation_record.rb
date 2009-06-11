class InvitationRecord < Model
  
  def self.create(attributes)
    path = "/invites"
    return self.create_request(path, JSON.generate(attributes))
  end
  
end