class Comment < Model

  def self.find(view_id)
    path = "/views/#{view_id}/#{self.name.pluralize.downcase}.json"
    get_request(path)
  end

  def self.create(view_id, attributes)
    if attributes[:viewRating].blank? || attributes[:viewRating].to_i == 0
      attributes[:viewRating] = nil
    else
      attributes[:viewRating] = attributes[:viewRating].to_i * 20
    end
    if attributes[:title].blank?
      attributes[:title] = nil
    end
    if attributes[:body].blank?
      attributes[:body] = nil
    end

    if attributes[:body].nil? && attributes[:viewRating].nil?
      return nil
    end

    path = "/views/#{view_id}/#{self.name.pluralize.downcase}.json"
    return self.create_request(path, JSON.generate(attributes))
  end

  def self.update(view_id, attributes)
    path = "/views/#{view_id}/#{self.name.pluralize.downcase}/" +
      "#{attributes[:id]}.json"
    attributes.delete(:id)
    if (attributes.length < 1)
      return nil
    end

    if !attributes[:flags].nil? && !attributes[:flags].is_a?(Array)
      attributes[:flags] = [attributes[:flags]]
    end
    return self.update_request(path, JSON.generate(attributes))
  end

  def self.rate(view_id, comment_id, rating)
    return self.create_request("/views/#{view_id}/" +
      "#{self.name.pluralize.downcase}/#{comment_id}/ratings?" +
      "thumbsUp=" + rating)
  end

  def viewRating
    (data['viewRating'] || 0) / 20
  end

  def rated?
    !data['currentUserRating'].nil?
  end

  def rated_up?
    rated? && data['currentUserRating']['thumbUp']
  end

  def rated_down?
    rated? && !data['currentUserRating']['thumbUp']
  end
end
