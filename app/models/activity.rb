class Activity < Model
  
  def self.find(opts = nil)
    path = "/activities.json"
    if (opts)
      path += "?#{opts.to_param}"
    end
    get_request(path)
  end
  
end