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
  end

  describe '#view_rel_type' do
    it 'handles federated with feature flag "federated_interstitial"' do
      view = instance_double('View', :federated? => true)
      current_domain = instance_double('CurrentDomain', :feature? => true)
      opts = { :rel_type => 'my rel type' }
      expect(view_rel_type(view, current_domain, opts)).to eql('externalDomain')
    end

    it 'handles federated without feature flag "federated_interstitial"' do
      view = instance_double('View', :federated? => true)
      current_domain = instance_double('CurrentDomain', :feature? => false)
      opts = { :rel_type => 'my rel type' }
      expect(view_rel_type(view, current_domain, opts)).to eql('external')
    end

    it 'handles non-federated with rel_type option' do
      view = instance_double('View', :federated? => false)
      current_domain = instance_double('CurrentDomain')
      opts = { :rel_type => 'my rel type' }
      expect(view_rel_type(view, current_domain, opts)).to eql('my rel type')
    end

    it 'handles non-federated with no rel_type option' do
      view = instance_double('View', :federated? => false)
      current_domain = instance_double('CurrentDomain')
      opts = { }
      expect(view_rel_type(view, current_domain, opts)).to eql('')
    end
  end

  describe '#view_img_alt' do
    it 'works with federated sites' do
      view = double('View', :federated? => true, :domainCName => 'federated.example.com')
      current_domain_cname = instance_double('CurrentDomain', :cname => 'example.com')
      expect(helper.view_img_alt(view, current_domain_cname)).to eql('Federated from federated.example.com')
    end

    it 'works without federated sites' do
      view = double('View', :federated? => false, :domainCName => 'federated.example.com')
      current_domain_cname = 'example.com'
      expect(helper.view_img_alt(view, current_domain_cname)).to eql('example.com')
    end
  end

  describe '#view_format_text' do
    it 'formats the text converting newlines into html breaks' do
      description = %(my description \n http://google.com <b>bold!</b>)
      expect(helper.view_format_description_text(description)).to eql(%(<p>my description \n<br /> <a href="http://google.com" rel="nofollow external">http://google.com</a> <b>bold!</b></p>))
    end

    it 'formats the description ignoring newline html formatting' do
      description = %(my description http://google.com\n <b>bold!</b>)
      expect(helper.view_format_description_text(description, false)).to eql(%(my description <a href="http://google.com" rel="nofollow external">http://google.com</a>\n <b>bold!</b>))
    end
  end

end
