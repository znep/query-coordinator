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

  # Override super.id and return the id of the model
  def id
    data['id']
  end

  def persisted?
    !@id.nil?
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

    result = CoreServer::Base.connection.get_request(path, custom_headers, batch, is_anon)
    batch ? nil : parse(result)
  end

  def self.find_under_user(options = nil, custom_headers = {}, batch = false, is_anon = false)
    if options.nil?
      options = Hash.new
    end
    user_id = get_user_id(options)
    if !options['userId'].nil?
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

  #
  # Find a cached model, delegating to cached_user_user if there is a user
  # find* provides much of the user-level permissioning we need for things
  # so find_cached should be used sparingly where there are clear advantages
  #
  def self.find_cached(options = nil, is_anon = false, cache_ttl = Rails.application.config.cache_ttl_model)
    return find_cached_under_user(options, cache_ttl) if !User.current_user.nil?
    cache_string = options.nil? ? "none" : options.to_json
    cache_string += ':anon' if is_anon
    do_cached(method(:find), options, cache_string, is_anon, cache_ttl)
  end

  def self.find_cached_under_user(options = nil, cache_ttl = Rails.application.config.cache_ttl_model)
    user_id = get_user_id(options) || ""
    cache_string = options.nil? ? "" : options.to_json
    cache_string = cache_string + ":" + user_id
    do_cached(method(:find_under_user), options, cache_string, cache_ttl)
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
      if self.frozen?
        raise TypeError.new("Can't modify frozen object")
      end
      if assign_key == 'flags'
        raise TypeError.new("Flags can only be set through set_flag and unset_flag")
      end
      if self.class.non_serializable_attributes.include?(assign_key)
        raise "Cannot set non-serializeable attribute"
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
          @cached_#{attribute}.freeze
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
    (klass || self.class).parse(self.to_json)
  end

  def as_json(options={})
    data_hash
  end

  def flag?(flag_name)
    flags = data['flags']
    !flags.nil? && flags.include?(flag_name)
  end

  def set_flag(flag)
    if !data['flags'].include?(flag)
      @added_flags ||= Array.new
      @added_flags << flag
    end
    if !@deleted_flags.nil?
      @deleted_flags.delete(flag)
    end
  end

  def unset_flag(flag)
    if data['flags'].include?(flag)
      @deleted_flags ||= Array.new
      @deleted_flags << flag
    end
    if !@added_flags.nil?
      @added_flags.delete(flag)
    end
  end

  def update_attributes(attributes)
    # todo: handle tags

    update_data.merge!(attributes)
  end

  def update_attributes!(attributes)
    new_model = self.class.update_attributes!(self.id, attributes)
    # Requests should return a copy of the object, but some don't. If they
    # don't, don't break (and go complain to the author!)
    if !new_model.nil?
      self.data = new_model.data
      update_data.reject! {|key,value| value == data[key]}
    end
    return self
  end

  def self.update_attributes!(id, attributes)
    attributes.reject! {|key,v| non_serializable_attributes.include?(key)}
    attributes.each do |key, value|
      if value.nil? || value == '""' ||
        (value.respond_to?(:empty?) && value.empty?) ||
        value == "''" || value == "null"
        attributes[key] = nil
      end
    end
    # Special parsing for updated tags
    if !attributes['tags'].nil?
      attributes['tags'] = parse_tags(attributes['tags'])
    end
    path = "/#{self.service_name}/#{id}.json"
    return parse(CoreServer::Base.connection.update_request(path, attributes.fix_key_encoding.to_json))
  end

  def save!
    updates = update_data.clone
    if flags_modified?
      updates['flags'] = combined_flags
    end
    update_attributes!(updates)
  end

  def self.create(attributes, custom_headers = {})
    attributes.reject! {|key,v| non_serializable_attributes.include?(key)}
    if !attributes['tags'].nil?
      attributes['tags'] = parse_tags(attributes['tags'])
    end
    path = "/#{self.service_name}.json"
    return parse(CoreServer::Base.connection.
                 create_request(path, attributes.to_json, custom_headers))
  end

  def self.parse(data)
    if data.blank?
      return nil
    end

    return self.set_up_model(JSON.parse(data, {:max_nesting => 25}))
  end

  def parse(*args)
    raise "You probably wanted the class method instead."
  end

  def self.delete(id)
    path = "/#{self.service_name}/#{id}"
    return parse(CoreServer::Base.connection.delete_request(path))
  end

  def self.set_up_model(json_data)
    if json_data.is_a?(Array)
      model = json_data.collect do | item |
        m = self.new
        m.data = item
        m.update_data = Hash.new
        m
      end
    else
      model = self.new
      model.data = json_data
      model.update_data = Hash.new
    end

    return model
  end

  def self.batch(reqs)
    reqs.each {|r| r['body'] = r['body'].to_json if !r['body'].nil? }
    resp = JSON.parse(CoreServer::Base.connection.
                 create_request('/batches', {'requests' => reqs}.to_json))
    r_count = 0
    resp.map do |r|
      req = reqs[r_count]
      r_count += 1
      if r['error']
        Rails.logger.info("Error: #{req['requestType']} " +
                      "#{CORESERVICE_URI.to_s}#{req['url']}: " +
                      (r['errorCode'] || '') + " : " +
                        (r['errorMessage'] || ''))
        raise CoreServer::CoreServerError.new(
          "#{req['requestType']} #{CORESERVICE_URI.to_s}#{req['url']}",
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
      return CGI.escapeHTML(obj)
    elsif obj.is_a?(Array)
      return obj.map {|v| escape_object(v)}
    elsif obj.is_a?(Hash)
      return obj.merge(obj) {|k, v| escape_object(v)}
    else
      return obj
    end
  end

protected

  def self.parse_tags(val)
    if val.is_a?(String)
      return val.split(',').map {|t| t.strip}
    else
      return val
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
    flags_array = @data['flags'] || Array.new
    if !@deleted_flags.nil?
      flags_array = flags_array - @deleted_flags
    end
    if !@added_flags.nil?
      flags_array = flags_array + @added_flags
    end
    return flags_array
  end

  def flags_modified?
    (!@added_flags.nil? && @added_flags.length > 0) ||
      (!@deleted_flags.nil? && @deleted_flags.length > 0)
  end

protected
  # Turn class name into core server service name
  def self.service_name
    return self.name.gsub(/[A-Z]/){ |c| "_#{c.downcase}" }.gsub(/^_/, '').pluralize
  end

private

  # Mark one or more attributes as non-serializable -- that is, they shouldn't be
  # serialized back to the core server
  def self.non_serializable(*attributes)
    # write_inheritable_attribute("non_serializable",
    #                             Set.new(attributes.map(&:to_s)) +
    #                               (non_serializable_attributes || []))
  end

  # Obtain a list of all non-serializable attributes
  def self.non_serializable_attributes
    # read_inheritable_attribute("non_serializable") || Array.new
    Array.new
  end

  def self.do_cached(finder, options, cache_string, is_anon = false, cache_ttl=Rails.application.config.cache_ttl_model)
    #
    # If the model is requesting a simple string id; lookup the modification time in
    # memcached and return a model which is cached by the core server-set mtime.
    # If the core server has not set a modification time for this resource, check the
    # default cache key. We only cache for 15 minutes so it's not the end of the world
    # if the core server has not blessed us.
    #
    check_time = 0
    if options.is_a?(String)
      check_time = VersionAuthority.resource(options) || 0
    end
    model_cache_key = "model:" + Digest::MD5.hexdigest(cache_string + ":" + check_time.to_s)
    model_cache_key += ':anon' if is_anon
    result = cache.read(model_cache_key)
    if result.nil?
      result = finder.call(options, {}, false, is_anon)
      cache.write(model_cache_key, result, :expires_in => cache_ttl)
    end
    result.model_cache_key = model_cache_key
    result.check_time = check_time == 0 ? Time.now.to_i : check_time
    result
  end

  def self.cache
    @@cache ||= Rails.cache
  end

end
