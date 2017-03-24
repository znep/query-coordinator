module CGIExtensions

  def escape_with_sentinel(value)
    escape(value).tap do |instance|
      instance.singleton_class.class_eval do
        def cgi_escaped?
          true
        end
      end
    end
  end

  def escape!(value)
    value.respond_to?(:cgi_escaped?) && value.cgi_escaped? ? value : escape_with_sentinel(value)
  end

end

CGI.send(:extend, CGIExtensions)
