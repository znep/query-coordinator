class Tag < Model
  
  def self.find(opts)
    path = "/tags"
    if (opts)
      path += "?#{opts.to_param}"
    end
    get_request(path)
  end

end
