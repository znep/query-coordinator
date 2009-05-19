class Contact < User
  def self.find( options = nil )
    self.find_under_user(options)
  end
  
  def self.create(attributes)
    path = "/contacts.json"
    self.create_request(path, JSON.generate(attributes))
  end
  
  def self.delete(id)
    path = "/contacts/#{id}.json"
    self.delete_request(path, nil)
  end
end
