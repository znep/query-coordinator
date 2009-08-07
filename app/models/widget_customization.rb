class WidgetCustomization < Model
  def self.create(attributes)
    path = "/widget_customization.json"
    unless attributes['customization'].nil?
      attributes['customization'] = JSON.generate(attributes['customization'])
    end
    create_request(path, JSON.generate(attributes))
  end
  
  def self.find( options = nil, custom_headers = {})
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

    get_request(path, custom_headers)
  end
  
  def save!
    unless @customization_hash.nil?
      @update_data['customization'] = JSON.generate(@customization_hash)
    end
    path = "/widget_customization/#{self.uid}.json"
    update_request(path, JSON.generate(@update_data))
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
                   :font => { :face => 'arial, sans-serif',
                              :grid_header_size => '1.2em',
                              :grid_data_size => '1.1em' } },
    :frame    => { :color => '#06386A',
                   :gradient => true,
                   :border => '#c9c9c9',
                   :icon_color => 'blue',      #TODO+
                   :logo => { :show => true,
                              :type => 'default',
                              :url => '' },
                   :powered_by => true },
    :grid     => { :row_numbers => true,
                   :wrap_header_text => false,
                   :header_icons => true,
                   :row_height => '16px',
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
    :publish  => { :dimensions => { :width => 425,
                                    :height => 344 },
                   :show_title => true,
                   :show_footer_link => true }
  }
end
