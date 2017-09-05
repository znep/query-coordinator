require 'rails_helper'

describe BrowseHelper do

  let(:feature_flag_mock) { double('feature_flag_mock') }

  before do
    allow(FeatureFlags).
      to receive(:derive).
      and_return(feature_flag_mock)
  end

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

  describe '#federated_site_title' do
    it 'should return the cname when the feature flag is false' do
      allow(feature_flag_mock).to receive(:[]).with(:show_federated_site_name_instead_of_cname).and_return(false)

      result = helper.federated_site_title('data.seattle.gov')
      expect(result).to eq('data.seattle.gov')
    end

    it 'should return the site_title when the feature flag is true' do
      allow(feature_flag_mock).to receive(:[]).with(:show_federated_site_name_instead_of_cname).and_return(true)
      test_hash = { 'strings' => { 'site_title' => 'Seattle Open Data' } }
      allow(Configuration).
        to receive(:find_by_type).
        and_return([ Hashie::Mash.new(test_hash) ])

      result = helper.federated_site_title('data.seattle.gov')
      expect(result).to eq('Seattle Open Data')
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
      @params = { :foo => 'bar', :page => 6 }
      link = helper.link_for_facet(@facet, @facet_option, @options, @params)
      regex = /<a href=\"\/browse\?foo=bar&amp;page=6\">.*<\/a>/
      expect(link).to match(regex)
    end

    it 'creates a link to the base_url and adds the active class' do
      @facet[:param] = 'cars'
      @options['cars'] = 'TRUCKASAURUS'
      @facet_option[:value] = 'TRUCKASAURUS'
      link = helper.link_for_facet(@facet, @facet_option, @options, @params)
      class_regex = /class=\"active\"/
      href_regex = /href=\"\/browse/
      expect(link).to match(class_regex)
      expect(link).to match(href_regex)
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

  describe '#view_formatted_description' do
    let(:description) { nil }
    let(:view) { View.new('description' => description) }

    it 'returns if description is nil' do
      expect(helper.view_formatted_description(view)).to eql(nil)
    end

    context 'simple_format description' do
      let(:description) { 'basic plain text description' }

      it 'returns the plain text description formatted with simple_format' do
        expect(helper.view_formatted_description(view)).to eql(%(<div>basic plain text description</div>))
      end
    end

    context 'sanitizing html tags in description' do
      let(:description) do
        %(<script>alert('bad things');</script>my rich text description \n http://google.com <b>bold!</b>")
      end

      it 'returns the description sanitized from evil tags' do
        display = double
        allow(display).to receive('type').and_return('data_lens')
        allow(view).to receive('display').and_return(display)
        expect(helper.view_formatted_description(view)).to eql(
          %(<div>alert('bad things');my rich text description \n) <<
          %(<br> <a href="http://google.com" rel="nofollow noreferrer external">http://google.com</a> <b>bold!</b>") <<
          %(</div>)
        )
      end
    end
  end

end
