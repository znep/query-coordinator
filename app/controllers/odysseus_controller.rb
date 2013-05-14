class OdysseusController < ApplicationController
  layout 'odysseus'

  def index
    @contents = Net::HTTP.get(URI::HTTP.build({ host: ODYSSEUS_URI.host, port: ODYSSEUS_URI.port, path: request.path }))
  end
end

