class Tag < Model
  
  def initialize()
    self.data = Hash.new
    self.update_data = Hash.new
  end
  
  def self.find(opts)
    path = "/tags"
    if (opts)
      path += "?#{opts.to_param}"
    end
    get_request(path)
  end

end
