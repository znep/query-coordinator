require 'rails_helper'

describe Browse2Helper do

  def setup(overrides = {})
    {
      :facet_param => :category,
      :opts => {
        :base_url => '/browse',
        :category => nil,
        :user_params => {}
      },
      :facet_option => {
        :text => 'Education',
        :value => 'Education'
      },
      :is_child_option => false,
      :has_child_options => false,
      :params => {}
    }.merge(overrides)
  end

  describe '#facet_option_classes' do
    it 'returns classnames for a facet option that is not active and has no child options' do
      page = setup
      expect(helper.facet_option_classnames(
        page[:opts],
        page[:facet_param],
        page[:facet_option],
        page[:is_child_option],
        page[:has_child_options]
      )).to eq('browse2-facet-section-option')
    end

    it 'returns classnames for a facet option that is not active and has child options' do
      page = setup({
        :has_child_options => true
      })
      classnames = helper.facet_option_classnames(
        page[:opts],
        page[:facet_param],
        page[:facet_option],
        page[:is_child_option],
        page[:has_child_options]
      )

      expect(classnames).to match(/browse2-facet-section-option/)
      expect(classnames).to match(/has-child-options/)
    end

    it 'returns classnames for a facet option that is active and has child options' do
      page = setup({
        :has_child_options => true,
        :opts => {
          :category => 'Police'
        },
        :facet_option => {
          :text => 'Police',
          :value => 'Police'
        }
      })
      classnames = helper.facet_option_classnames(
        page[:opts],
        page[:facet_param],
        page[:facet_option],
        page[:is_child_option],
        page[:has_child_options]
      )

      expect(classnames).to match(/browse2-facet-section-option/)
      expect(classnames).to match(/active/)
      expect(classnames).to match(/has-child-options/)
    end

    it 'returns classnames for a facet option that is a child option' do
      page = setup({
        :is_child_option => true
      })
      expect(helper.facet_option_classnames(
        page[:opts],
        page[:facet_param],
        page[:facet_option],
        page[:is_child_option],
        page[:has_child_options]
      )).to eq('browse2-facet-section-child-option')
    end

  end

  describe '#facet_option_url' do
    it 'creates an empty search string given no params' do
      page = setup({
        :facet_option => {
          :text => nil,
          :value => nil
        }
      })
      expect(helper.facet_option_url(
        page[:opts],
        page[:facet_param],
        page[:facet_option],
        page[:params]
      )).to eq('/browse?')
    end

    it 'creates a search string filtering on the given facet param and facet option' do
      page = setup({
        :facet_param => :category,
        :facet_option => {
          :text => 'Police',
          :value => 'Police'
        }
      })
      expect(helper.facet_option_url(
        page[:opts],
        page[:facet_param],
        page[:facet_option],
        page[:params]
      )).to eq('/browse?category=Police')
    end

    it 'creates a search string without the filter if the facet option is active' do
      page = setup({
        :opts => {
          :base_url => '/browse',
          :user_params => {},
          :category => 'Fire'
        },
        :facet_option => {
          :text => 'Fire',
          :value => 'Fire'
        }
      })
      expect(helper.facet_option_url(
        page[:opts],
        page[:facet_param],
        page[:facet_option],
        page[:params]
      )).to eq('/browse?')
    end
  end

  describe '#active_facet_option' do

    def test_facet
      {
        :param => 'category',
        :options => [
          { :value => 'Police', :text => 'Police' },
          { :value => 'Public Safety', :text => 'Public Safety' },
          { :value => 'Education', :text => 'Education' },
          { :value => 'Fun', :text => 'Fun', :children => [
            { :value => 'Beer', :text => 'Beer' },
            { :value => 'Guns', :text => 'Guns' }
          ] }
        ]
      }
    end

    it 'returns nil if there is no active option' do
      expect(helper.active_facet_option(nil, test_facet)).to eq(nil)
      expect(helper.active_facet_option('', test_facet)).to eq(nil)
      expect(helper.active_facet_option({}, test_facet)).to eq(nil)
      expect(helper.active_facet_option([], test_facet)).to eq(nil)
    end

    it 'returns nil if it cannot find the active option in the facet options' do
      expect(helper.active_facet_option('Blah blah blah blah', test_facet)).to eq(nil)
    end

    it 'returns the option if it is active' do
      expect(helper.active_facet_option('Education', test_facet)).to eq({
        :value => 'Education',
        :text => 'Education'
      })
    end

    it 'returns the child option if it is active' do
      expect(helper.active_facet_option('Beer', test_facet)).to eq({
        :value => 'Beer',
        :text => 'Beer'
      })
    end
  end
end
