module VersionAuthority
  def self.resource(name)
    Rails.cache.read("_dataset.version.#{CurrentDomain.domain.id}.#{name}", :raw => true)
  end
end
