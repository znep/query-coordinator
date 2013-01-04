class Manifest
  attr_accessor :max_age
  attr_accessor :last_mtime, :first_mtime, :manifest

  def add_resource(name, mtime)
    if !name.is_a?(String) || !mtime.is_a?(Integer)
      Rails.logger.info("INVALID MANIFEST for key #{name} mtime #{mtime.to_s}")
      return
    end
    @manifest ||= {}
    @manifest[name] = mtime
    @first_mtime = mtime if @first_mtime.nil? || @first_mtime < mtime
    @last_mtime = mtime if @last_mtime.nil? || @last_mtime > mtime
  end

  def hash
    # Even an empty manifest needs to be unique
    @manifest ||= { :default_empty => Time.now.to_i }
    Digest::MD5.hexdigest(@manifest.sort.to_json)
  end

  def set_manifest(manifest)
    @manifest ||= {}
    manifest.each { |k,v|
      add_resource(k, v)
    }
  end

  def manifest
    return @manifest ||= {}
  end

  def first_mtime
    return Time.at(@first_mtime) if !@first_mtime.nil?
    Time.at(0)
  end

  def last_mtime
    return Time.at(@last_mtime) if !@last_mtime.nil?
    Time.at(0)
  end

  def each(&block)
    @manifest.each(&block)
  end

  def keys
    manifest.keys
  end

  def [](name)
    @manifest[name]
  end
end