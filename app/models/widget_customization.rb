class WidgetCustomization < Model
  cattr_accessor :default_theme
  
  def self.find_customization(id)
    path = "/widgetCustomization/#{id}"
    result = get_request(path)
    
    # the server doesn't parse the JSON for us, so do it ourselves
    result.customization = JSON.parse(result.customization)
    result
  end
  
  def initialize
    self.data = Hash.new
    self.update_data = Hash.new
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
    :grid     => { :row_numbers => false,
                   :wrap_header_text => false, #TODO
                   :header_icons => false,
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
                   :save_public_views => true,  #TODO+
                   :interstitial => false,
                   :ga_code => '' }
  }

end
