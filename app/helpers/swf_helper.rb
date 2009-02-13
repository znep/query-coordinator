module SwfHelper
  # Returns a set of tags that display a SWF in HTML page.
  #
  # Options:
  # * <tt>:id</tt> - The HTML +id+ of the +div+ element that is used to contain 
  #     the Flash object, the content of this DIV will be replaced for Flash 
  #     content.
  # * <tt>:flash_version</tt> - The minimum version of flash that's required. 
  # * <tt>:width</tt> - The width of the swf object.
  # * <tt>:height</tt> - The height of the swf object.
  # * <tt>:variables</tt> - A Hash of initialization variables that are passed 
  #     to the object as flash vars
  # * <tt>:install</tt> - If user don't had required flash version it will be 
  #     installed. To use this feature you need copy expressinstal.swf from 
  #     assets plugin folder to your app public folder.
  def swfobject_tag(source, options={})
    options = {
                :id => "swfContent",
                :version => "9.0.0",
                :width => "100%", :height => "100%",
                :install => "/expressinstall.swf",
                :variables => {},
                :parameters => {:allowScriptAccess => :always, :wmode => :opaque, :bgcolor => "#ffffff"}
              }.merge(options)

    #NOTE!!!!! we need wmode opaque for showing the publish widgets dialog on IE FF2

    def to_object(h)
      object = h.collect { |k, v| "#{k}:\"#{v}\"" }.join(',')
      return "{#{object}}"
    end

    embed = <<HTML
<script type="text/javascript">
    swfobject.embedSWF("#{source}",
                       "#{options[:id]}",
                       "#{options[:width]}", "#{options[:height]}",
                       "#{options[:version]}",
                       "#{options[:install]}",
                       #{to_object(options[:variables])},
                       #{to_object(options[:parameters])},
                       {id:"#{options[:id]}",name:"#{options[:id]}"});
</script>
HTML

    return embed
  end
end
