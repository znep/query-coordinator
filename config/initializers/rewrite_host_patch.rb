# Monkey patch the Rails rewriting code
# There's a latent bug in Rails where if you are running on a custom port and
# specify a new port in the parameter, you end up with a URL containing two
# ports.
module ActionController
  class UrlRewriter
    private
      def rewrite_url(options)
        rewritten_url = ""

        unless options[:only_path]
          rewritten_url << (options[:protocol] || @request.protocol)
          rewritten_url << "://" unless rewritten_url.match("://")
          rewritten_url << rewrite_authentication(options)
          if options.key?(:port)
            rewritten_url << (options[:host] || @request.host)
            rewritten_url << ":#{options.delete(:port)}"
          else
            rewritten_url << (options[:host] || @request.host_with_port)
          end
        end

        path = rewrite_path(options)
        rewritten_url << ActionController::Base.relative_url_root.to_s unless options[:skip_relative_url_root]
        rewritten_url << (options[:trailing_slash] ? path.sub(/\?|\z/) { "/" + $& } : path)
        rewritten_url << "##{options[:anchor]}" if options[:anchor]

        rewritten_url
      end
  end
end
