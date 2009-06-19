xml.instruct! :xml, :version=>"1.0", :encoding=>"UTF-8"
xml.urlset (:xmlns=>"http://www.sitemaps.org/schemas/sitemap/0.9") do

  # For each element, generate the appropriate url entry.  The accessors
  # for the location and last modification time are required, but change
  # frequency and priority are optional, and will be left out if the accessors
  # are null.
  unless @elements == nil
    @elements.each do |entry|
      xml.url do
        xml.loc @url_accessor.call(entry)
        xml.lastmod @lastmod_accessor.call(entry)
        xml.changefreq @changefreq_accessor.call(entry) \
                unless @changefreq_accessor == nil
        xml.priority @priority_accessor.call(entry) \
                unless @priority_accessor == nil
      end
    end
  end
end
