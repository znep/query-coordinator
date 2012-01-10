require 'json'

class Model
  extend ActiveSupport::Memoizable

  attr_accessor :data
  attr_accessor :update_data


  def initialize(data = {})
    @data = data
    self.data = @data
    self.update_data = {}
  end

  # Override super.id and return the id of the model
  def id
    data['id']
  end

  def new_record?
    id.nil?
  end


  #options - the primary lookup of the model object.  Usually id except for users where it is login
  #options could also be a hash of parameters.  see: user_test.rb
  def self.find( options = nil, custom_headers = {}, batch = false)
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

    result = CoreServer::Base.connection.get_request(path, custom_headers, batch)
    batch ? nil : parse(result)
  end

  def self.find_under_user(options = nil)
    if options.nil?
      options = Hash.new
    end
    user_id = User.current_user.id
    if !options['userId'].nil?
      user_id = options['userId']
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

  def method_missing(method_symbol, *args)
    method_name = method_symbol.to_s

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

      if value.is_a?(Hash)
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
        update_data['#{attribute}'] || @data['#{attribute}']
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
    data_hash.to_json(options)
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
    return parse(CoreServer::Base.connection.update_request(path, attributes.to_json))
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
    write_inheritable_attribute("non_serializable",
                                Set.new(attributes.map(&:to_s)) +
                                  (non_serializable_attributes || []))
  end

  # Obtain a list of all non-serializable attributes
  def self.non_serializable_attributes
    read_inheritable_attribute("non_serializable") || Array.new
  end

end
