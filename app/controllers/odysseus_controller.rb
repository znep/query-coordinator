class OdysseusController < ApplicationController
  def index
    contents = JSON.parse(Net::HTTP.get(URI::HTTP.build({ host: ODYSSEUS_URI.host, port: ODYSSEUS_URI.port, path: request.path })))

    @title = contents['title'] || ''
    @style_packages = contents['styles'] || []
    @script_packages = contents['scripts'] || []
    @contents = contents['markup']
  end
end

