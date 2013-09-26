class OdysseusController < ApplicationController
  skip_before_filter :require_user

  def index
    uri = URI::HTTP.build({ host: ODYSSEUS_URI.host, port: ODYSSEUS_URI.port, path: request.path })
    req = Net::HTTP::Get.new(uri.request_uri)

    req['X-Socrata-Host'] = req['Host'] = CurrentDomain.cname
    req['Cookie'] = request.headers['Cookie']

    res = Net::HTTP.start(uri.host, uri.port){ |http| http.request(req) }

    if res.code == '400'
      render_error(400)
    elsif res.code == '401'
      require_user
    elsif res.code == '403'
      render_403
    elsif res.code == '404'
      render_404
    else
      contents = JSON.parse(res.body)

      @title = contents['title'] || ''
      @style_packages = contents['styles'] || []
      @script_packages = contents['scripts'] || []
      @objects = contents['objects']
      @contents = contents['markup']
    end
  end
end

