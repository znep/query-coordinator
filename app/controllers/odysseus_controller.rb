class OdysseusController < ApplicationController
  skip_before_filter :require_user

  def index
    render_odysseus_path(request.path)
  end

  def chromeless
    @suppress_chrome = true
    @suppress_govstat = true # remove background and other unnecessary styles
    render_odysseus_path(request.path, additional_style: 'govstat-chromeless')
  end

  def version
    odysseus_request('/version') do |res|
      render :json => res.body
    end
  end

  private

  def render_odysseus_path(path, options = {})
    odysseus_request(path) do |res|
      odysseus_response = JSON.parse(res.body)
      styles = odysseus_response['styles'] || []
      styles.push(options[:additional_style]) if options[:additional_style]

      @title = odysseus_response['title'] || ''
      @style_packages = styles
      @script_packages = odysseus_response['scripts'] || []
      @objects = odysseus_response['objects']
      @contents = odysseus_response['markup']
      @client_version = odysseus_response['client_version']

      render 'index'
    end
  end

  def odysseus_request(path)
    odysseus_addr = ::ZookeeperDiscovery.get(:odysseus)
    return render_error(502) if odysseus_addr.nil?

    odysseus_uri = URI.parse('http://' + odysseus_addr)
    uri = URI::HTTP.build(host: odysseus_uri.host, port: odysseus_uri.port, path: path)
    req = Net::HTTP::Get.new(uri.request_uri)

    req['X-Socrata-Host'] = req['Host'] = CurrentDomain.cname
    req['X-Socrata-Locale'] = I18n.locale
    req['X-Socrata-Default-Locale'] = CurrentDomain.default_locale
    req['Cookie'] = request.headers['Cookie']

    begin
      res = Net::HTTP.start(uri.host, uri.port){ |http| http.request(req) }
    rescue
      return render_error(502)
    end

    if res.code == '400'
      return render_error(400)
    elsif res.code == '401'
      return current_user.nil? ? require_user : render_403
    elsif res.code == '403'
      return render_403
    elsif res.code == '404'
      return render_404
    elsif res.code == '500'
      return render_500
    else
      yield(res) if block_given?
    end
  end
end

