require 'rails_helper'
require 'spec_helper'

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

  describe '#get_all_facet_options' do
    def test_facet
      {
        :param => 'category',
        :options => [
          { :value => 'Police', :text => 'Police' },
          { :value => 'Public Safety', :text => 'Public Safety' }
        ],
        :extra_options => [
          { :value => 'Parks', :text => 'Parks' },
          { :value => 'Police', :text => 'Police' },
          { :value => 'Wizards', :text => 'Wizards' }
        ]
      }
    end

    def combined_options
      [
        { :value => 'Police', :text => 'Police' },
        { :value => 'Public Safety', :text => 'Public Safety' },
        { :value => 'Parks', :text => 'Parks' },
        { :value => 'Wizards', :text => 'Wizards' }
      ]
    end

    it 'returns an array of the options is there are no extra_options' do
      facet = test_facet
      facet[:extra_options] = nil
      expect(helper.get_all_facet_options(facet)).to match_array(facet[:options])
    end

    it 'returns an array combining options and extra options and removes duplicates' do
      expect(helper.get_all_facet_options(test_facet)).to match_array(combined_options)
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

  describe '#get_clear_facet_options' do
    before(:each) do
      @opts = json_fixture('browse_options.json')
    end

    it 'returns an empty array if there are no active facet options' do
      expect(helper.get_clear_facet_options(@opts)).to match_array([])
    end

    it 'returns an array containing an object with the active facet option label and a url that clears the option' do
      opts = @opts.dup
      opts[:user_params][:category] = 'fun'
      result = helper.get_clear_facet_options(opts)
      expect(result).to match_array([
        {
          :label => 'Categories > fun',
          :url => '/browse?'
        }
      ])
    end

    it 'returns an array containing multiple objects that clear each other' do
      opts = @opts.dup
      opts[:user_params][:category] = 'business'
      opts[:user_params][:tags] = 'arnold'
      result = helper.get_clear_facet_options(opts)
      expect(result).to match_array([
        {
          :label => 'Categories > business',
          :url => '/browse?tags=arnold'
        },
        {
          :label => 'Topics > arnold',
          :url => '/browse?category=business'
        }
      ])
    end

    it 'does not duplicate any active values that are below the fold (in extra_options)' do
      opts = @opts.dup
      opts[:user_params][:tags] = 'shake weights'
      result = helper.get_clear_facet_options(opts)
      expect(result).to match_array([
        {
          :label => 'Topics > shake weights',
          :url => '/browse?'
        }
      ])
    end
  end

  describe '#flatten_facet_options' do
    def facet_options_without_children
      [
        { :value => 'Business', :text => 'Business' },
        { :value => 'Fun', :text => 'Fun' },
        { :value => 'Finance', :text => 'Finance' },
        { :value => 'Parks', :text => 'Parks' }
      ]
    end

    def facet_options_without_children_with_count
      [
        { :value => 'Business', :text => 'Business', :count => 0 },
        { :value => 'Fun', :text => 'Fun', :count => 0 },
        { :value => 'Finance', :text => 'Finance', :count => 0 },
        { :value => 'Parks', :text => 'Parks', :count => 0 }
      ]
    end

    def facet_options_with_children
      [
        { :value => 'Business', :text => 'Business', :children => [
          { :value => 'Books', :text => 'Books' },
          { :value => 'Paper', :text => 'Paper' }
        ] },
        { :value => 'Fun', :text => 'Fun', :children => [
          { :value => 'Beer', :text => 'Beer' },
          { :value => 'Music', :text => 'Music' },
          { :value => 'Coffee', :text => 'Coffee' }
        ] }
      ]
    end

    def facet_options_with_children_flattened
      [
        { :value => 'Business', :text => 'Business', :count => 0 },
        { :value => 'Books', :text => 'Books', :count => 0 },
        { :value => 'Paper', :text => 'Paper', :count => 0 },
        { :value => 'Fun', :text => 'Fun', :count => 0 },
        { :value => 'Beer', :text => 'Beer', :count => 0 },
        { :value => 'Music', :text => 'Music', :count => 0 },
        { :value => 'Coffee', :text => 'Coffee', :count => 0 }
      ]
    end

    it 'returns an empty array given empty input' do
      result = helper.flatten_facet_options([])
      expect(result).to eq([])

      result2 = helper.flatten_facet_options(nil)
      expect(result2).to eq([])
    end

    it 'returns the same array (with count) if there are no child options' do
      result = helper.flatten_facet_options(facet_options_without_children)
      expect(result).to match_array(facet_options_without_children_with_count)
    end

    it 'returns a flattened array of top level and child options' do
      result = helper.flatten_facet_options(facet_options_with_children)
      expect(result).to match_array(facet_options_with_children_flattened)
    end
  end
end
