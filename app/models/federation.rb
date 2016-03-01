class Federation < Model
  def self.find( options = nil, custom_headers = {})
    if options.nil?
      options = Hash.new
    end
    path = nil
    if options.is_a? String
      path = "/federations/#{options}.json"
    elsif options.respond_to?(:to_param)
      path = "/federations.json"
      path += "?#{options.to_param}" unless options.to_param.blank?
    end

    parse(CoreServer::Base.connection.get_request(path, custom_headers))
  end

  def self.accept(id)
    self.update_attributes!(id, { "acceptedUserId" => User.current_user.oid })
  end

  def self.reject(id)
    self.update_attributes!(id, { "acceptedUserId" => nil })
  end

  # Fetches active federations for current domain
  def self.federations
    find.select do |f|
      f.targetDomainCName == CurrentDomain.cname &&
        f.lensName.empty? &&
        f.acceptedUserId.present? &&
        f.sourceDomainCName != CurrentDomain.cname # protect against degenerate case
    end
  end

  # Produces hash of cname => searchBoost for active federations
  def self.federated_search_boosts
    federations.each_with_object({}) do |f, hash|
      hash[f.sourceDomainCName] = f.searchBoost
    end
  end

  # Looks up domain cnames for Cetera
  def self.federated_domain_cnames(federated_domain_id)
    home_cname = [CurrentDomain.cname]
    home_domain_id = CurrentDomain.domain.id

    if federated_domain_id.blank?
      # All domains in the federation
      home_cname + federations
        .find_all { |fed| fed.targetDomainId == home_domain_id }
        .map(&:sourceDomainCName)

    elsif federated_domain_id.to_i == home_domain_id
      # Just the home domain
      home_cname

    else
      # Just a federated domain--potentially empty
      federations
        .find_all { |fed| fed.sourceDomainId == federated_domain_id.to_i }
        .map(&:sourceDomainCName)
    end
  end
end
