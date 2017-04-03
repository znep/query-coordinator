module StoryMetadata
  def title
    metadata[:title] || default_title
  end

  def description
    metadata[:description]
  end

  def uid
    metadata[:uid]
  end

  def tile_config
    metadata[:tile_config]
  end

  def grants
    metadata[:grants]
  end

  def permissions
    metadata[:permissions]
  end

  def owner_id
    metadata[:owner_id]
  end

  def public?
    permissions[:isPublic]
  end
end
