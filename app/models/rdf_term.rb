# To change this template, choose Tools | Templates
# and open the template in the editor.

class RdfTerm < Model
  def initialize
  end

  #options - the primary lookup of the model object.  Usually id except for users where it is login
  #options could also be a hash of parameters.  see: user_test.rb
  def self.find( options = nil, custom_headers = {})
    if options.nil?
      options = Hash.new
    end
    path = nil
    if options.is_a? String
      path = "/rdfTerms/#{options}.json"
    elsif options.respond_to?(:to_param)
      path = "/rdfTerms.json"
      path += "?#{options.to_param}" unless options.to_param.blank?
    end

    parse(CoreServer::Base.connection.get_request(path, custom_headers))
  end
end
