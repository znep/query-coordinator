class Configuration < Model
  def self.find_by_type(type, default_only = false)
    path = "/#{self.name.pluralize.downcase}.json?type=#{type}&" +
      "defaultOnly=#{default_only.to_s}"
    parse(CoreServer::Base.connection.get_request(path))
  end

  def properties
    props = Hashie::Mash.new
    data['properties'].each do |p|
      name_parts = p['name'].split('.')
      p_hash = props
      while name_parts.length > 1 do
        n = name_parts.shift
        p_hash[n] = Hashie::Mash.new if p_hash[n].nil?
        p_hash = p_hash[n]
      end
      p_hash[name_parts[0]] = p['value']
    end
    return props
  end
end
