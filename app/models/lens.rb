class Lens < Model
  def self.find( options )
    user_id = User.current_user.id.to_s
    if !options['userId'].nil?
      user_id = options['userId']
      options.delete('userId')
    end

    path = nil
    if options.is_a? Hash
      path = "/users/#{user_id}/#{self.name.pluralize.downcase}.json?" +
        options_string(options)
    else
      path = "/users/#{user_id}/#{self.name.pluralize.downcase}/#{options}.json"
    end

    send_request(path)
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
