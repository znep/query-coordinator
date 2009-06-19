xml.instruct! :xml, :version=>"1.0", :encoding=>"UTF-8"
xml.sitemapindex (:xmlns=>"http://www.sitemaps.org/schemas/sitemap/0.9") do

  # Link each one of the user sitemap pages...
  for page in 0.. @user_pages - 1
    xml.sitemap do
      xml.loc url_for(:controller => 'sitemap',
                      :action => 'users',
                      :page => page,
                      :only_path => false)
      #xml.lastmod(...)
    end
  end

  # Link each one of the dataset sitemap pages...
  for page in 0.. @dataset_pages - 1
    xml.sitemap do
      xml.loc url_for(:controller => 'sitemap',
                      :action => 'datasets',
                      :page => page,
                      :only_path => false)
      #xml.lastmod(...)
    end
  end

end
