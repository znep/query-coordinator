class Rating < Model
  cattr_accessor :average_field

  def self.create(view_id, attributes)
    if attributes[:rating].blank? || attributes[:rating].to_i == 0
      return nil
    else
      attributes[:rating] = attributes[:rating].to_i * 20
    end

    attributes[:type] ||= @@default_type

    path = "/views/#{view_id}/#{self.name.pluralize.downcase}.json"
    return parse(CoreServer::Base.connection.create_request(path, attributes.to_json))
  end

  def rating
    (data['rating'] || 0) / 20.0
  end

  @@default_type = 'rating'
end
