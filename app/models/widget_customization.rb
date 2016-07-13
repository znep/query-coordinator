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

  def self.default_theme(version = 0)
    Marshal::load(Marshal.dump(@@default_themes[version.to_s]))
  end

  def self.merge_theme_with_default(theme, version = 0)
    @@default_themes[version.to_s].deep_merge(theme)
  end

  def customization
    # the server doesn't parse the JSON for us, so do it ourselves.
    if @customization_hash.nil?
      hash = JSON.parse(@data['customization']).deep_symbolize_keys
      @customization_hash = WidgetCustomization.merge_theme_with_default(hash, hash[:version] || 0)
    end

    @customization_hash
  end

  @@default_themes = {
    '0' => {
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
      :menu     => {
                     :top_fullscreen => true,

                     # Main menu
                     :print => true,
                     :fullscreen => true,
                     :download_menu => { :csv => true,
                                         :json => true,
                                         :xml => true },
                     :api => true,
                     :subscribe  => { :atom => true,
                                      :rss => true },
                     :basic_analytics => true,
                     :about => true,
                     :about_sdp => true,

                     # More Views menu
                     :show_tags => true,
                     :more_views => true,
                     :views_fullscreen => true,

                     # Share menu
                     :republish => true,
                     :email => true,
                     :socialize => { :delicious => true,
                                     :digg => true,
                                     :facebook => true,
                                     :twitter => true }
                   },
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
    },
  '1' => {
      :version => 1,
      :frame    => { :border     => { :color => 'dedede',
                                      :width => { :value => '1',
                                                  :unit => 'px' } },
                     :color      => 'f2f2f2',
                     :orientation => 'downwards',
                     :padding    => { :value => '3',
                                      :unit => 'px' },
                     :show_title => true },
      :toolbar  => { :color => '555555',
                     :input_color => 'fefbef' },
      :logo     => { :image      => { :type => 'static',
                                      :href => '/stylesheets/images/common/logo_with_name.svg',
                                      :width => '300',
                                      :height => '30' },
                     :href => 'http://socrata.com' },
      :menu     => { :button     => { :content => 'Menu',
                                      :background => [ { 'color' => 'ee3c39' }, { 'color' => 'b01e2d' } ],
                                      :background_hover => [ { 'color' => 'fe5855' }, { 'color' => 'c22f3e' } ],
                                      :border => 'b01e2d',
                                      :text => 'ffffff' },
                     :options    => { :more_views => true,
                                      :comments => true,
                                      :downloads => true,
                                      :embed => true,
                                      :print => true,
                                      :about_sdp => true,
                                      :api => true },
                     :share      => true,
                     :fullscreen => true },
      :grid     => { :font       => { :face => 'arial',
                                      :header_size => { :value => '1.2',
                                                        :unit => 'em' },
                                      :data_size   => { :value => '1.1',
                                                        :unit => 'em' } },
                     :row_numbers => true,
                     :wrap_header_text => false,
                     :header_icons => false,
                     :title_bold => false,
                     :zebra => 'e7ebf2' },
      :behavior => { :interstitial => false,
                     :ga_code => '' },
      :publish  => { :dimensions => { :width => 500,
                                      :height => 425 },
                     :show_title => false,
                     :show_powered_by => true }
    }
  }
end
