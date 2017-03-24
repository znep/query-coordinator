class Group < Model
  def self.find( options = nil )
    self.find_under_user(options)
  end
end
