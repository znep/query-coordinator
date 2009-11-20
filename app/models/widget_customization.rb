class WidgetCustomization < Model
  def self.create(attributes)
    path = "/widget_customization.json"
    unless attributes['customization'].nil?
      attributes['customization'] = attributes['customization'].to_json
    end
    parse(CoreServer::Base.connection.create_request(path, attributes.to_json))
  end
  
  def self.find(options = nil, custom_headers = {})
    if options.nil?
      options = Hash.new
    end
    path = nil
    if options.is_a? String
      path = "/widget_customization/#{options}.json"
    elsif options.respond_to?(:to_param)
      path = "/widget_customization.json"
      path += "?#{options.to_param}" unless options.to_param.blank?
    end

    parse(CoreServer::Base.connection.get_request(path, custom_headers))
  end
  
  def save!
    unless @customization_hash.nil?
      @update_data['customization'] = @customization_hash.to_json
    end
    path = "/widget_customization/#{self.uid}.json"
    WidgetCustomization.parse(CoreServer::Base.connection.update_request(path, @update_data.to_json))
  end
  
  def self.default_theme
    Marshal::load(Marshal.dump(@@default_theme))
  end
  
  def self.merge_theme_with_default(theme)
    @@default_theme.deep_merge(theme)
  end

  def customization
    # the server doesn't parse the JSON for us, so do it ourselves.
    if @customization_hash.nil?
      hash = JSON.parse(@data['customization'])
      hash.deep_symbolize_keys!
      @customization_hash = WidgetCustomization.merge_theme_with_default(hash)
    end

    @customization_hash
  end

  @@default_theme = {
    :style    => { :custom_stylesheet => 'normal',
                   :font => { :face => 'arial',
                              :grid_header_size => { :value => '1.2',
                                                     :unit => 'em' },
                              :grid_data_size =>   { :value => '1.1',
                                                     :unit => 'em' } } },
    :frame    => { :color => '#06386A',
                   :gradient => true,
                   :border => '#c9c9c9',
                   :icon_color => 'blue',      #TODO+
                   :logo => 'default',
                   :logo_url => 'http://www.socrata.com/',
                   :footer_link => { :show => true,
                                     :url => 'http://www.socrata.com/try-it-free',
                                     :text => 'Get a Data Player of Your Own' } },
    :grid     => { :row_numbers => true,
                   :wrap_header_text => false,
                   :header_icons => false,
                   :title_bold => false,
                   :row_height => { :value => '16',
                                    :unit => 'px' },
                   :zebra => '#e7ebf2' },
    :menu     => { :email => true,
                   :subscribe  => { :rss => true,
                                    :atom => true },
                   :api => true,
                   :download => true,
                   :print => true,
                   :fullscreen => true,
                   :republish => true },
    :meta     => { :comments   => { :show => true, :order => 0, :display_name => 'Comments' },
                   :filtered   => { :show => true, :order => 1, :display_name => 'More Views' },
                   :publishing => { :show => true, :order => 2, :display_name => 'Publishing' },
                   :activity   => { :show => true, :order => 3, :display_name => 'Activity' },
                   :summary    => { :show => true, :order => 4, :display_name => 'Summary' } },
    :behavior => { :rating => true,             #TODO
                   :save_public_views => true,
                   :interstitial => false,
                   :ga_code => '' },
    :publish  => { :dimensions => { :width => 500,
                                    :height => 425 },
                   :show_title => true,
                   :show_powered_by => true }
  }
end
