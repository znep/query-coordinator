class Lens < Model
  def self.find( options )
    self.find_under_user(options)
  end

  def is_blist?
    flag?("default")
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

  #TODO: This is not yet working correctly. Currently returns all blists for the user.
  def filters
    ret_filters = Lens.find( {"blist" => self.blistId} )

    #Filter out all but the filters for this particular blist until the above query works.
    ret_filters.delete_if do |b|
      b.blistId != self.blistId || ( b.is_blist?)
    end

    ret_filters
  end

end
