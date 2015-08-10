require 'addressable/uri'

class VersionRequestHelper

  def self.is_version_json_request?(request_uri)
    Addressable::URI.parse(request_uri).path == '/version.json'
  end

end
