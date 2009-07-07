require 'json'

class CoreServerError < RuntimeError
  attr :source
  attr :error_code
  attr :error_message
  def initialize(source, error_code, error_message)
    @source = source
    @error_code = error_code
    @error_message = error_message
  end
end

class Model
  extend ActiveSupport::Memoizable

  attr_accessor :data
  attr_accessor :update_data

  # Override super.id and return the id of the model
  def id
    data['id']
  end

  #options - the primary lookup of the model object.  Usually id except for users where it is login
  #options could also be a hash of parameters.  see: user_test.rb
  def self.find( options = nil, custom_headers = {})
    if options.nil?
      options = Hash.new
    end
    path = nil
    if options.is_a? String
      path = "/#{self.name.pluralize.downcase}/#{options}.json"
    elsif options.respond_to?(:to_param)
      path = "/#{self.name.pluralize.downcase}.json"
      path += "?#{options.to_param}" unless options.to_param.blank?
    end

    get_request(path, custom_headers)
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
      path = "/#{self.name.pluralize.downcase}/#{options}.json"
    elsif options.respond_to?(:to_param)
      path = "/users/#{user_id}/#{self.name.pluralize.downcase}.json"
      path += "?#{options.to_param}" unless options.to_param.blank?
    end

    get_request(path)
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
      if data[assign_key].nil?
        raise TypeError.new("#{assign_key} is not a valid property")
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
        klass = Object.const_get(method_name.capitalize.to_sym)
        define_hash_accessor(method_name, klass)
        return send(method_name)
      elsif value.is_a?(Array)
        klass = Object.const_get(method_name.singularize.capitalize.to_sym)
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
        @update_data['#{attribute}'] || @data['#{attribute}']
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

  def to_json
    data_hash.to_json
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

  def update_attributes!(attributes)
    attributes.each do |key, value|
      if value.blank? || value == '""' ||
        value == "''" || value == "null"
        attributes[key] = nil
      end
    end
    new_model = self.class.update_attributes!(self.id, attributes)
    self.data = new_model.data
    update_data.reject! {|key,value| value == data[key]}
    return self
  end

  def self.update_attributes!(id, attributes)
    attributes.reject! {|key,v| non_serializable_attributes.include?(key)}
    attributes.each do |key, value|
      if value.blank? || value == '""' ||
        value == "''" || value == "null"
        attributes[key] = nil
      end
    end
    # Special parsing for updated tags
    if !attributes['tags'].nil?
      attributes['tags'] = parse_tags(attributes['tags'])
    end
    path = "/#{self.name.pluralize.downcase}/#{id}.json"
    return self.update_request(path, JSON.generate(attributes))
  end

  def save!
    updates = update_data.clone
    if flags_modified?
      updates['flags'] = combined_flags
    end
    update_attributes!(updates)
  end

  def self.create(attributes)
    attributes.reject! {|key,v| non_serializable_attributes.include?(key)}
    if !attributes['tags'].nil?
      attributes['tags'] = parse_tags(attributes['tags'])
    end
    path = "/#{self.name.pluralize.downcase}.json"
    return self.create_request(path, JSON.generate(attributes))
  end

  def self.parse(data)
    if data.blank?
      return nil
    end

    json_data = JSON.parse(data)
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

    model
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

  def self.get_request(path, custom_headers = {}, skip_parse = false)
    result_body = cache.read(path)
    if result_body.nil?
      result_body = generic_request(Net::HTTP::Get.new(path),
                                    nil, custom_headers).body
      cache.write(path, result_body)
    end

    skip_parse ? result_body : parse(result_body)
  end

  def self.create_request(path, payload = "{}")
    parse(generic_request(Net::HTTP::Post.new(path), payload).body)
  end

  def self.update_request(path, payload = "")
    parse(generic_request(Net::HTTP::Put.new(path), payload).body)
  end

  def self.delete_request(path, payload = "")
    parse(generic_request(Net::HTTP::Delete.new(path), payload).body)
  end

  def self.multipart_post_file(path, file)
    req = Net::HTTP::Post::Multipart.new path,
      'file' => UploadIO.new(file, file.content_type, File.basename(file.original_path))
    parse(generic_request(req).body)
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

  def self.generic_request(request, json = nil, custom_headers = {})
    requestor = User.current_user
    if requestor && requestor.session_token
      request['Cookie'] = "_blist_session_id=#{requestor.session_token.to_s}"
    end
    custom_headers.each { |key, value| request[key] = value }

    if (!json.blank?)
      request.body = json
      request.content_type = "application/json"
    end

    result = Net::HTTP.start(CORESERVICE_URI.host, CORESERVICE_URI.port) do |http|
      http.request(request)
    end

    if !result.is_a?(Net::HTTPSuccess)
      parsed_body = self.parse(result.body)
      pp result.body
      Rails.logger.info("Error: " +
                    "#{request.method} #{CORESERVICE_URI.to_s}#{request.path}: " +
                    (parsed_body.nil? ? 'No response' :
                      (parsed_body.data['code'] || '')) + " : " +
                    (parsed_body.nil? ? 'No response' :
                      (parsed_body.data['message'] || '')))
      raise CoreServerError.new(
        "#{request.method} #{CORESERVICE_URI.to_s}#{request.path}",
        parsed_body.data['code'],
        parsed_body.data['message'])
    end

    result
  end

  def self.cache
    @cache ||= ActiveSupport::Cache::RequestStore.new
  end
end
