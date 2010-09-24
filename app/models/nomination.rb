class Nomination < Model
  def self.find_page(page_no=1, limit=nil, status=nil)
    opts = {"page" => (page_no.to_i - 1).to_s, "limit" => limit}
    opts["status"] = status unless status.nil?
    path = "/nominations.json?#{opts.to_param}"
    parse(CoreServer::Base.connection.get_request(path))
  end

  def self.count(status=nil)
    opts = {"count" => true}
    opts["status"] = status unless status.nil?
    path = "/nominations" + "?#{opts.to_param}"
    parse(CoreServer::Base.connection.get_request(path)).count
  end

  def friendly_status()
    if (status == "pending" && Time.at(createdAt) > (Time.now() - 7.days))
      "new"
    elsif (status == "pending")
      "open"
    else
      status
    end
  end
end
