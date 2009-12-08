require 'hashie'

class CurrentDomain
  def self.load_all
    @@property_store = {}

    domains = Domain.find
    domains.each do |domain|
      @@property_store[domain.cname] = { :data => domain }
    end
  end

  def self.set(cname)
    @@property_store = {} unless defined? @@property_store

    if !@@property_store.has_key?(cname)
      begin
        @@property_store[cname] = { :data => Domain.find(cname) }
      rescue CoreServer::ResourceNotFound
        return false
      end
    end

    return @@current_domain = @@property_store[cname]
  end

  # Main properties
  def self.domain_name
    @@current_domain[:data].name
  end

  def self.cname
    # We need to account for the case where we make a generic_request
    # before we know what domain we're on (eg to get the domain obj).
    if defined? @@current_domain
      @@current_domain[:data].CName
    else
      ''
    end
  end

  def self.accountTier
    @@current_domain[:data].accountTier
  end

  def self.theme
    if @@current_domain[:theme].nil?
      if self['theme'].nil?
        @@current_domain[:theme] = Hashie::Mash.new(@@default_theme)
      else
        self['theme'].deep_symbolize_keys!
        @@current_domain[:theme] = Hashie::Mash.new(@@default_theme.deep_merge(self['theme']))
      end
    end
    @@current_domain[:theme]
  end

  def self.modules
    if @@current_domain[:modules].nil?
      @@current_domain[:modules] = ((@@current_domain[:data].data['accountModules'] || []) +
        (@@current_domain[:data].accountTier.data['accountModules'] || [])).uniq
    end
    @@current_domain[:modules]
  end

  def self.module?(module_name)
    return false if self.modules.nil?
    self.modules.any?{ |account_module| account_module['name'] == module_name.to_s }
  end

  def self.feature?(feature_name)
    return false if self.features.nil?
    self.features[feature_name] == 'true'
  end

  # CurrentDomain['preference name'] returns preferences
  def self.[](key)
    if @@current_domain[:data].preferences.nil?
      return nil
    else
      @@current_domain[:data].preferences[key.to_s]
    end
  end

  def self.method_missing(key, *args)
    key = key.to_s

    # If they ask for .something?, assume they're asking about the something feature
    if key =~ /\?$/
      return (self['features.' + key.gsub(/\?$/, '')] == 'true')
    end

    # Otherwise, mash it up with themes
    self.theme.send key
  end

  @@default_theme = {
    :colors  => { :link => '0071bc',
                  :accent => '20608f',
                  :headers =>  [ '600', '600', '600', '666', '333' ],
                  :header =>   { :line => '06386a',
                                 :active =>     [ { :color => '2e5f8e', :position => '.286' },
                                                  { :color => '113e6b' } ],
                                 :inactive =>   [ { :color => '113f6c', :position => '.286' },
                                                  { :color => '509bdb' } ],
                                 :background => [ { :color => 'c7c8ca', :position => '.286' },
                                                  { :color => 'e6e7e7' } ] },
                  :carousel => { :background => [ { :color => '2f608f' },
                                                  { :color => '0f3c69' } ],
                                 :text => '0071bc' },
                  :buttons =>  { :hover =>      [ { :color => '2e5f8e', :position => '.5' },
                                                  { :color => '285987', :position => '.5' },
                                                  { :color => '113e6b' } ],
                                 :active =>     [ { :color => '113f6c' },
                                                  { :color => '164471', :position => '.5' },
                                                  { :color => '2f5f8e', :position => '.5' },
                                                  { :color => '509bdb' } ] },
                  :summary =>  { :active => 'cacaca',
                                 :inactive => 'ececec',
                                 :hover => 'e3ecf7' },
                  :welcome =>  { :border => '9ba5a1',
                                 :title =>      [ { :color => '2f608f', :position => '.286' },
                                                  { :color => '0f3c69' } ],
                                 :body => 'd7ecf9' } },
    :images  => { :logo =>     { :source => '/stylesheets/images/common/socrata_logo.png',
                                 :type => :static,
                                 :width => '129px',
                                 :height => '34px' },
                  :dialog_logo => { :source => '/stylesheets/images/common/socrata_logo_light.png',
                                    :type => :static },
                  :favicon =>  { :source => '/stylesheets/images/common/favicon.ico',
                                 :type => :static } },
    :strings => { :company => 'Socrata',
                  :site_title => 'Socrata | Making Data Social',
                  :discover_header => 'Discover useful, unique, and unusual dataset created by the community.',
                  :copyright_string => '&copy; 2009 Socrata, Inc.' },
    :urls    => { :header => [ { :text => 'About Socrata', :href => 'http://www.socrata.com/about' },
                               { :text => 'Help', :href => 'http://www.getsatisfaction.com/socrata' } ],
                  :footer => [ { :text => 'Blog', :href => 'http://blog.socrata.com/', :class => 'rss' },
                               { :text => 'Company Info', :href => 'http://www.socrata.com/company-info', :rel => 'nofollow' },
                               { :text => 'Terms of Service', :href => 'http://www.socrata.com/terms-of-service', :rel => 'nofollow' },
                               { :text => 'Privacy', :href => 'http://www.socrata.com/privacy', :rel => 'nofollow' },
                               { :text => 'Contact Us', :href => 'http://www.socrata.com/contact-us', :rel => 'nofollow' } ] }
  }
end