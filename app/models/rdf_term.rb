# To change this template, choose Tools | Templates
# and open the template in the editor.

class RdfTerm < Model
  @@allClasses = nil;
  @@allClassOptions = nil;

  def initialize
  end

  # cache all rdf classes
  def self.all_classes
    @@allClasses ||= self.find({:type => 'class'})
  end

  # cache all classes in a format ready for HTML select option
  def self.all_class_options
    if @@allClassOptions.nil?
      @@allClassOptions = []
      self.all_classes.each do |m|
        @@allClassOptions.push([
          (m.namespace.blank? ? '' : (m.namespace + ': ')) +
            (m.displayName.empty? ? m.name : m.displayName),
          m.CName]);
      end
    end

    @@allClassOptions
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
