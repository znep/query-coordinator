require 'json'

class Model
  attr_accessor :data
  attr_accessor :update_data

  cattr_accessor :model_cache_key
  cattr_accessor :check_time

  def initialize(data = {})
    @data = data
    self.data = @data
    self.update_data = {}
    self.check_time = Time.now.to_i
  end

  def self.get(id, batch_id:nil, is_anon:false, timeout:60, **args)
    path = "/#{service_name}.json?#{(args || {}).merge(:id => id).to_param}"

    begin
      result = CoreServer::Base.connection.get(:path => path, batch_id: batch_id, is_anon: is_anon, timeout: timeout, **args)
    rescue => e
      Rails.logger.debug("CoreServer::Base.connection.get_request ERROR: #{e.inspect}")
      raise e
    end

    # This is to deal with Core returning the following HTML error response instead of JSON:
    # <html><body><h1>503 Service Unavailable</h1> No server is available to handle this request. </body></html>
    # Ref: https://socrata.airbrake.io/projects/6553/groups/1697160411655803097
    begin
      batch_id ? nil : result = parse(result)
    rescue JSON::ParserError
      if result.to_s =~ /service unavailable/i
        result = nil
      end
    end

    result
  end

  # Override super.id and return the id of the model
  def id
    data['id']
  end

  def persisted?
    @id.present?
  end

  #options - the primary lookup of the model object.  Usually id except for users where it is login
  #options could also be a hash of parameters.  see: user_test.rb
  def self.find( options = nil, custom_headers = {}, batch = nil, is_anon = false )
    if options.nil?
      options = Hash.new
    end
    path = nil
    if options.is_a? String
      path = "/#{self.service_name}/#{options}.json"
    elsif options.respond_to?(:to_param)
      path = "/#{self.service_name}.json"
      path += "?#{options.to_param}" unless options.to_param.blank?
    end

    begin
      result = CoreServer::Base.connection.get_request(path, custom_headers, batch, is_anon)
    rescue => e
      Rails.logger.debug("CoreServer::Base.connection.get_request ERROR: #{e.inspect}")
      raise e
    end

    # This is to deal with Core returning the following HTML error response instead of JSON:
    # <html><body><h1>503 Service Unavailable</h1> No server is available to handle this request. </body></html>
    # Ref: https://socrata.airbrake.io/projects/6553/groups/1697160411655803097
    begin
      batch ? nil : result = parse(result)
    rescue JSON::ParserError
      if result.to_s =~ /service unavailable/i
        result = nil
      end
    end

    result
  end

  def self.find_under_user(options = nil, custom_headers = {}, batch = false, is_anon = false)
    if options.nil?
      options = Hash.new
    end
    user_id = get_user_id(options)
    unless options['userId'].nil?
      options.delete('userId')
    end

    path = nil
    if options.is_a? String
      path = "/#{self.service_name}/#{options}.json"
    elsif options.respond_to?(:to_param)
      path = "/users/#{user_id}/#{self.service_name}.json"
      path += "?#{options.to_param}" unless options.to_param.blank?
    end

    parse(CoreServer::Base.connection.get_request(path))
  end

  def self.needs_api_call(*api_dependent_attributes)
    api_dependent_attributes.each do |attribute|
      class_eval <<-EOS, __FILE__, __LINE__
        def #{attribute}
          return data_hash['#{attribute}'] if data_hash.key?('#{attribute}')
          @cached_instance ||= self.class.find(self.id)
          @cached_instance.data['#{attribute}']
        end
      EOS
    end
  end

  #
  # Preferentially get the user id from model options; otherwise the user model
  #
  def self.get_user_id(options)
    if options.nil? && !options['userId'].nil?
      options['userId']
    else
      User.current_user.id
    end
  end

  def ==(other)
    self.class == other.class && data_hash == other.data_hash
  end

  def method_missing(method_symbol, *args)
    method_name = method_symbol.to_s
    predicate_method = false
    if method_name =~ /\?$/
      method_name.chop!
      predicate_method = true
    end

    assign_key = method_name.sub!(/=$/,"")
    if assign_key
      if frozen?
        raise TypeError.new("Can't modify frozen object")
      end
      if assign_key == 'flags'
        raise TypeError.new("Flags can only be set through set_flag and unset_flag")
      end
      if args.length != 1
        raise ArgumentError.new("Wrong number of arguments: #{args.length} for 1")
      else
        define_attr_writer(assign_key)
        send("#{assign_key}=", args[0])
      end
    else
      value = data_hash[method_name]
      return nil if value.nil?

      if predicate_method
        define_predicate_method(method_symbol)
        return send(method_name)
      elsif value.is_a?(Hash)
        klass = Object.const_get(method_name.capitalize_first.to_sym)
        define_hash_accessor(method_name, klass)
        return send(method_name)
      elsif value.is_a?(Array)
        begin
          klass = Object.const_get(method_name.singularize.capitalize_first.to_sym)
        rescue NameError
          return value
        end
        define_array_accessor(method_name, klass)
        return send(method_name)
      else
        define_value_accessor(method_name)
        return send(method_name)
      end
    end
  end

  def respond_to_missing?(name, include_private = false)
    responds_to = super(name, include_private)
    responds_to ||= data_hash.key?(name.to_s.sub(/[?=]$/, '')) if @data.respond_to?(:keys)
    responds_to
  end

  def define_predicate_method(method)
    self.class.send(:define_method, method) do
      attribute_name = method.to_s.chop
      update_data.fetch(attribute_name, data.fetch(attribute_name, false))
    end
  end

  def define_attr_writer(attribute)
    self.class.class_eval <<-EOS, __FILE__, __LINE__
      def #{attribute}=(value)
        if value == data['#{attribute}']
          update_data.delete('#{attribute}')
        else
          update_data['#{attribute}'] = value
        end
        @cached_#{attribute} = nil
        return value
      end
    EOS
  end

  def define_hash_accessor(attribute, klass)
    self.class.class_eval <<-EOS, __FILE__, __LINE__
      def #{attribute}
        unless @cached_#{attribute}.nil?
          return @cached_#{attribute}
        end

        unless @data['#{attribute}'].nil?
          @cached_#{attribute} = #{klass}.new
          @cached_#{attribute}.data = @data['#{attribute}']
          @cached_#{attribute}.update_data = Hash.new
        end
        return @cached_#{attribute}
      end
    EOS
  end

  def define_array_accessor(attribute, klass)
    self.class.class_eval <<-EOS, __FILE__, __LINE__
      def #{attribute}
        unless @cached_#{attribute}.nil?
          return @cached_#{attribute}
        end
        unless data_hash['#{attribute}'].nil?
          @cached_#{attribute} = Array.new
          data_hash['#{attribute}'].each do | item |
            model = #{klass}.new
            model.data = item
            model.update_data = Hash.new
            @cached_#{attribute}.push(model)
          end
          @cached_#{attribute}.freeze
        end
        return @cached_#{attribute}
      end
    EOS
  end

  def define_value_accessor(attribute)
    self.class.class_eval <<-EOS, __FILE__, __LINE__
      def #{attribute}
        update_data.fetch('#{attribute}', @data.fetch('#{attribute}', nil))
      end
    EOS
  end

  def tag_display_string
    tags.nil? ? '' : tags.join(", ")
  end

  def to_s
    if data.is_a?(Hash)
      to_json
    else
      data.to_s
    end
  end

  def to_json(options = nil)
    as_json.to_json(options)
  end

  def deep_clone(klass = nil)
    # Hack...
    (klass || self.class).parse(to_json)
  end

  def as_json(options={})
    data_hash
  end

  def flag?(flag_name)
    data['flags'].to_a.include?(flag_name)
  end

  def set_flag(flag)
    unless data['flags'].include?(flag)
      @added_flags ||= Array.new
      @added_flags << flag
    end
    unless @deleted_flags.nil?
      @deleted_flags.delete(flag)
    end
  end

  def unset_flag(flag)
    if data['flags'].include?(flag)
      @deleted_flags ||= Array.new
      @deleted_flags << flag
    end
    unless @added_flags.nil?
      @added_flags.delete(flag)
    end
  end

  def update_attributes(attributes)
    # todo: handle tags

    update_data.merge!(attributes)
  end

  def update_attributes!(attributes)
    new_model = self.class.update_attributes!(id, attributes)
    # Requests should return a copy of the object, but some don't. If they
    # don't, don't break (and go complain to the author!)
    unless new_model.nil?
      self.data = new_model.data
      update_data.reject! {|key,value| value == data[key]}
    end
    return self
  end

  def self.update_attributes!(id, attributes)
    attributes.each do |key, value|
      if value.nil? || value == '""' ||
        (value.respond_to?(:empty?) && value.empty?) ||
        value == "''" || value == "null"
        attributes[key] = nil
      end
    end
    # Special parsing for updated tags
    unless attributes['tags'].nil?
      attributes['tags'] = parse_tags(attributes['tags'])
    end
    parse(CoreServer::Base.connection.update_request(
      "/#{service_name}/#{id}.json",
      attributes.fix_key_encoding.to_json)
    )
  end

  def save!
    updates = update_data.clone
    if flags_modified?
      updates['flags'] = combined_flags
    end
    update_attributes!(updates)
  end

  def self.create(attributes, custom_headers = {}, query_params = {})
    unless attributes['tags'].nil?
      attributes['tags'] = parse_tags(attributes['tags'])
    end
    path = "/#{service_name}.json"
    if query_params.length > 0
      path = "#{path}?#{query_params.to_query}"
    end
    parse(CoreServer::Base.connection.create_request(
      path,
      attributes.to_json,
      custom_headers
    ))
  end

  def self.parse(data)
    setup_model(JSON.parse(data, :max_nesting => 25)) if data.present?
  end

  def parse(*args)
    self.class.parse(*args)
  end

  def self.delete(id)
    parse(CoreServer::Base.connection.delete_request("/#{service_name}/#{id}"))
  end

  def self.setup_model(json_data)
    return json_data if json_data.is_a?(self)
    if json_data.is_a?(Array)
      model = json_data.collect do | item |
        m = new
        m.data = item
        m.update_data = Hash.new
        m
      end
    else
      model = new
      model.data = json_data
      model.update_data = Hash.new
    end

    model
  end

  def self.batch(reqs)
    reqs.each {|r| r['body'] = r['body'].to_json unless r['body'].nil? }
    resp = JSON.parse(CoreServer::Base.connection.
                 create_request('/batches', {'requests' => reqs}.to_json))
    r_count = 0
    resp.map do |r|
      req = reqs[r_count]
      r_count += 1
      if r['error']
        Rails.logger.info("Error: #{req['requestType']} " +
                      "#{CORESERVICE_URI}#{req['url']}: " +
                      (r['errorCode'] || '') + " : " +
                        (r['errorMessage'] || ''))
        raise CoreServer::CoreServerError.new(
          "#{req['requestType']} #{CORESERVICE_URI}#{req['url']}",
          r['errorCode'],
          r['errorMessage'])
      else
        klass = req['class'] || self
        klass.parse(r['response'])
      end
    end
  end

  def escape_object(obj)
    if obj.is_a?(String)
      CGI.escapeHTML(obj)
    elsif obj.is_a?(Array)
      obj.map {|v| escape_object(v)}
    elsif obj.is_a?(Hash)
      obj.merge(obj) {|k, v| escape_object(v)}
    else
      obj
    end
  end

  protected

  def self.parse_tags(val)
    if val.is_a?(String)
      val.split(',').map(&:strip)
    else
      val
    end
  end

  def data_hash
    dcopy = @data.clone
    if dcopy.is_a?(Hash)
      dcopy.merge!(update_data)
      dcopy['flags'] = combined_flags
    end
    dcopy
  end

  def combined_flags
    flags_array = @data.to_h['flags'].to_a
    unless @deleted_flags.nil?
      flags_array = flags_array - @deleted_flags
    end
    unless @added_flags.nil?
      flags_array = flags_array + @added_flags
    end
    flags_array
  end

  def flags_modified?
    (!@added_flags.nil? && @added_flags.length > 0) ||
      (!@deleted_flags.nil? && @deleted_flags.length > 0)
  end

  # Turn class name into core server service name
  def self.service_name
    name.gsub(/[A-Z]/){ |c| "_#{c.downcase}" }.gsub(/^_/, '').pluralize
  end

  private

  def self.cache
    @@cache ||= Rails.cache
  end

end
