class Group < Model
  def self.find( options )
    self.find_under_user(options)
  end
end
