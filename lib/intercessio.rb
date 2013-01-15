module Intercessio
  class Connection
    def request(path, headers, user)
      Rails.logger.info("Requesting async (intercessio) " + CurrentDomain.cname + "/" + path)
      get = Net::HTTP::Get.new("/" + CurrentDomain.cname + "/" + path)
      headers.each { |h, v|
        if (/HTTP_.*/.match(h))
          Rails.logger.info("    Adding header " + /HTTP_(.*)/.match(h)[1] + " => " + v.to_s)
           get[/HTTP_(.*)/.match(h)[1]] = v.to_s
        end
      }
      get['X-Intercessio-User'] = user.id if user
      #requestor = User.current_user
      #request['X-Intercessio-Email'] = requestor
      result = Net::HTTP.start(INTERCESSIO_URI.host, INTERCESSIO_URI.port) do |http|
        http.request(get)
      end
      Rails.logger.info("Got respo " + result.body)
      return JSON.parse(result.body, {:max_nesting => 25})
    end

    def receive(token, user)
      Rails.logger.info("Requesting async status (intercessio) for token " + token)
      get = Net::HTTP::Get.new("/intercessio/receive/" + token)
      get['X-Intercessio-User'] = user.id if user
      result = Net::HTTP.start(INTERCESSIO_URI.host, INTERCESSIO_URI.port) do |http|
        http.request(get)
      end
      Rails.logger.info("Performed request async status (intercessio) for token " + token)
      result
    end

    def status(token, user)
      Rails.logger.info("Requesting async status (intercessio) for token " + token)
      get = Net::HTTP::Get.new("/intercessio/status/" + token)
      get['X-Intercessio-User'] = user.id if user
      result = Net::HTTP.start(INTERCESSIO_URI.host, INTERCESSIO_URI.port) do |http|
        http.request(get)
      end
      return JSON.parse(result.body, {:max_nesting => 25})
    end
  end

end
