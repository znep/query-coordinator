class OdysseusController < ApplicationController
  def index
    uri = URI::HTTP.build({ host: ODYSSEUS_URI.host, port: ODYSSEUS_URI.port, path: request.path })
    req = Net::HTTP::Get.new(uri.request_uri)

    req['X-Socrata-Host'] = req['Host'] = CurrentDomain.cname
    req['Cookie'] = request.headers['Cookie']

    res = Net::HTTP.start(uri.host, uri.port){ |http| http.request(req) }
    contents = JSON.parse(res.body)

    @title = contents['title'] || ''
    @style_packages = contents['styles'] || []
    @script_packages = contents['scripts'] || []
    @contents = contents['markup']
  end
end

