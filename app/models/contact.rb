class Contact < User
  def self.find( options = nil )
    self.find_under_user(options)
  end
end
