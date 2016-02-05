require 'rails_helper'

describe BrowseHelper do

  describe '#join_and_truncate_array' do
    it 'does not change a joined string shorter than requested length' do
      expect(helper.join_and_truncate_array(%w(one two))).to eql('one, two')
    end

    it 'appends ellipses to a truncated string' do
      expect(helper.join_and_truncate_array(%w(one two three), 8)).to eql('one, two, ...')
    end

    it 'truncates and appends ellipses a string shorter than the requested length' do
      expect(helper.join_and_truncate_array(%w(antidisestablishmentism), 10)).to eql('antidisest...')
    end

    it 'does not change a joined string exactly the length desired' do
      expect(helper.join_and_truncate_array(%w(one two), 8)).to eql('one, two')
    end

    it 'works with nil values' do
      input = ['one', 'two', nil, 'three']
      expect(helper.join_and_truncate_array(input, 8)).to eql('one, two, ...')
    end

    it 'works with a nil array' do
      expect(helper.join_and_truncate_array(nil, 1)).to eql('')
    end

    it 'works with a nil in the first position' do
      input = [nil, 'one', 'two', 'three']
      expect(helper.join_and_truncate_array(input, 3)).to eql(', ...')
    end

    it 'works with a tag that starts with ","' do
      input = [',what']
      expect(helper.join_and_truncate_array(input, 3)).to eql(',w...')
    end

    it 'works with a tag that ends with ","' do
      input = ['what,']
      expect(helper.join_and_truncate_array(input, 3)).to eql('wha...')
    end

    it 'works with tags with "/"' do
      input = ['this/that']
      expect(helper.join_and_truncate_array(input, 3)).to eql('thi...')
    end

    it 'works with > 50 character tags' do
      input = ['planning consolidated plan 2013 action plan housing and community development']
      expect(helper.join_and_truncate_array(input)).to eql('planning consolidated plan 2013 action plan housin...')
    end

    it 'works with tag objects' do
      tag = Tag.new
      tag.data = 'a tag'
      input = [tag]
      expect(helper.join_and_truncate_array(input, 2)).to eql('a ...')
    end
  end

  describe '#view_rel_type' do
    it 'handles federated with feature flag "federated_interstitial"' do
      view = instance_double('View', :federated? => true)
      current_domain = class_double('CurrentDomain', :feature? => true)
      opts = { :rel_type => 'my rel type' }
      expect(view_rel_type(view, current_domain, opts)).to eql('externalDomain')
    end

    it 'handles federated without feature flag "federated_interstitial"' do
      view = instance_double('View', :federated? => true)
      current_domain = class_double('CurrentDomain', :feature? => false)
      opts = { :rel_type => 'my rel type' }
      expect(view_rel_type(view, current_domain, opts)).to eql('external')
    end

    it 'handles non-federated with rel_type option' do
      view = instance_double('View', :federated? => false)
      current_domain = class_double('CurrentDomain')
      opts = { :rel_type => 'my rel type' }
      expect(view_rel_type(view, current_domain, opts)).to eql('my rel type')
    end

    it 'handles non-federated with no rel_type option' do
      view = instance_double('View', :federated? => false)
      current_domain = class_double('CurrentDomain')
      opts = { }
      expect(view_rel_type(view, current_domain, opts)).to eql('')
    end
  end

  describe '#view_img_alt' do
    it 'works with federated sites' do
      view = double('View', :federated? => true, :domainCName => 'federated.example.com')
      current_domain_cname = class_double('CurrentDomain', :cname => 'example.com')
      expect(helper.view_img_alt(view, current_domain_cname)).to eql('Federated from federated.example.com')
    end

    it 'works without federated sites' do
      view = double('View', :federated? => false, :domainCName => 'federated.example.com')
      current_domain_cname = 'example.com'
      expect(helper.view_img_alt(view, current_domain_cname)).to eql('example.com')
    end
  end

  describe '#link_for_facet' do
    before(:each) do
      @facet = {}
      @facet_option = {
        :value => 'foo'
      }
      @options = {
        :base_url => '/browse'
      }
      @params = {}
    end

    it 'creates a link to the base_url' do
      link = helper.link_for_facet(@facet, @facet_option, @options, @params)
      regex = /<a href=\"\/browse\?\">.*<\/a>/
      expect(link).to match(regex)
    end

    it 'creates a link to the base_url with url parameters' do
      @params = {
        :foo => 'bar',
        :page => 6,
        :view_type => 'browse2'
      }
      link = helper.link_for_facet(@facet, @facet_option, @options, @params)
      regex = /<a href=\"\/browse\?foo=bar&amp;page=6&amp;view_type=browse2\">.*<\/a>/
      expect(link).to match(regex)
    end

    it 'creates a link to the base_url and adds the active class' do
      @facet[:param] = 'cars'
      @options['cars'] = 'TRUCKASAURUS'
      @facet_option[:value] = 'TRUCKASAURUS'
      link = helper.link_for_facet(@facet, @facet_option, @options, @params)
      regex = /<a href=\"\/browse\?\" class=\"active\">.+<\/a>/
      expect(link).to match(regex)
    end

    it 'creates a link to the base_url with the image icon' do
      @facet_option[:icon] = {
        :type => 'static',
        :href => '/image/of/monster/truck.jpg'
      }
      link = helper.link_for_facet(@facet, @facet_option, @options, @params)
      regex = /<a href=\"\/browse\?\"><img alt=\"icon\" class=\"customIcon\" src=\"\/image\/of\/monster\/truck.jpg\" \/><\/a>/
      expect(link).to match(regex)
    end

    it 'creates a link to the base_url with custom text' do
      @facet_option[:text] = 'Jorts'
      link = helper.link_for_facet(@facet, @facet_option, @options, @params)
      regex = /<a href=\"\/browse\?\">Jorts<\/a>/
      expect(link).to match(regex)
    end
  end

  describe '#view_format_text' do
    it 'formats the text converting newlines into html breaks' do
      description = %(my description \n http://google.com <b>bold!</b>)
      expect(helper.view_format_description_text(description)).to eql(%(<p>my description \n<br> <a href="http://google.com" rel="nofollow noreferrer external">http://google.com</a> <b>bold!</b></p>))
    end

    it 'formats the description ignoring newline html formatting' do
      description = %(my description http://google.com\n <b>bold!</b>)
      expect(helper.view_format_description_text(description, false)).to eql(%(my description <a href="http://google.com" rel="nofollow noreferrer external">http://google.com</a>\n <b>bold!</b>))
    end
  end

end
