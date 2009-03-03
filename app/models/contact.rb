class Contact < User
  def self.find( options )
    self.find_under_user(options)
  end
end
