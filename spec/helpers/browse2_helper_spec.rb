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

  describe '#browse2_sort_opts' do
    it 'returns empty array if opts[:sort_opts] is nil or empty' do
      test_opts_1 = {}
      test_opts_2 = { :sort_opts => [] }
      expect(helper.browse2_sort_opts(test_opts_1)).to eq([])
      expect(helper.browse2_sort_opts(test_opts_2)).to eq([])
    end

    it 'returns an array of only the accepted sort options' do
      test_opts = { :sort_opts => [
        { :value=>'relevance', :name=>'Most Relevant' },
        { :value=>'most_accessed', :name=>'Most Accessed' },
        { :value=>'alpha', :name=>'Alphabetical' },
        { :value=>'newest', :name=>'Newest' },
        { :value=>'oldest', :name=>'Oldest' },
        { :value=>'last_modified', :name=>'Recently Updated' },
        { :value=>'rating', :name=>'Highest Rated' },
        { :value=>'comments', :name=>'Most Comments' }
      ] }
      expect(helper.browse2_sort_opts(test_opts)).to eq([
        { :value=>'relevance', :name=>'Most Relevant' },
        { :value=>'most_accessed', :name=>'Most Accessed' },
        { :value=>'newest', :name=>'Newest' },
        { :value=>'last_modified', :name=>'Recently Updated' }
      ])
    end
  end

  describe '#facet_sort_option_classes' do
    it 'returns classnames for a sort option' do
      page = setup
      expect(helper.facet_sort_option_classnames(
        page[:opts],
        page[:facet_option]
      )).to eq('browse2-facet-section-option')
    end

    it 'returns classnames for a sort option that is active because it is a url param' do
      page = setup({
        :facet_option => {
          :name => 'Alphabetical',
          :value => 'alpha'
        }
      })
      page[:opts][:sortBy] = 'alpha'
      expect(helper.facet_sort_option_classnames(
        page[:opts],
        page[:facet_option]
      )).to eq('browse2-facet-section-option active')
    end

    it 'returns classnames for a sort option that is active because it is the default sort' do
      page = setup({
        :facet_option => {
          :name => 'Most Relevant',
          :value => 'relevance'
        }
      })
      page[:opts][:sortBy] = nil
      expect(helper.facet_sort_option_classnames(
        page[:opts],
        page[:facet_option]
      )).to eq('browse2-facet-section-option active')
    end
  end

  describe '#facet_sort_option' do
    it 'returns a facet sort option' do
      page = setup({
        :facet_option => {
          :name => 'Most Relevant',
          :value => 'relevance'
        }
      })

      output = helper.facet_sort_option(
        page[:opts],
        page[:facet_option],
        page[:params]
      )
      expect(output).to match(/^<li><a/)
      expect(output).to match(/href=\"\/browse\?sortBy=relevance\"/)
      expect(output).to match(/class=\"browse2-facet-section-option active\"/)
      expect(output).to match(/data-facet-option-value=\"relevance\"/)
      expect(output).to match(/<span class=\"browse2-facet-option-clear-icon icon-check-2\"><\/span>Most Relevant<\/a><\/li>$/)
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

  describe '#browse2_facet_cutoff' do
    it 'defaults to 5' do
      facet = { :singular_description => 'category' }
      allow(CurrentDomain).to receive(:property).and_return({})
      expect(helper.browse2_facet_cutoff(facet)).to eq(5)
    end

    it 'returns the property set in domain configuration if available' do
      facet = { :singular_description => 'category' }
      allow(CurrentDomain).to receive(:property).and_return({ 'category' => 13 })
      expect(helper.browse2_facet_cutoff(facet)).to eq(13)
    end

    it 'returns 100 for the view type facet' do
      facet = { :singular_description => 'type' }
      allow(CurrentDomain).to receive(:property).and_return({})
      expect(helper.browse2_facet_cutoff(facet)).to eq(100) # Browse2Helper::MAX_FACET_CUTOFF
    end

    # See EN-3383
    it 'identifies custom facets and respects custom cutoff' do
      facet = {
        'singular_description' => 'superhero',
        'title' => 'Superhero',
        'param' => :'Dataset-Information_Superhero',
        'options' => [
          { 'summary' => false, 'text' => 'Superman', 'value' => 'Superman' },
          { 'summary' => false, 'text' => 'Batman', 'value' => 'Batman' },
          { 'summary' => false, 'text' => 'Flash', 'value' => 'Flash' }
        ],
        'extra_options' => [
          { 'summary' => false, 'text' => 'Spiderman', 'value' => 'Spiderman' },
          { 'summary' => false, 'text' => 'Hulk', 'value' => 'Hulk' }
        ]
      }

      0.upto(6) do |cutoff|
        facet_cutoffs_catalog = {
          'topic' => cutoff,
          'category' => cutoff,
          'custom' => cutoff
        }

        allow(CurrentDomain).
          to receive(:property).
          with(:facet_cutoffs, :catalog).
          and_return(facet_cutoffs_catalog)

        expect(helper.browse2_facet_cutoff(facet)).to eq(cutoff)
      end
    end

    it 'provides default value to custom facets if not defined' do
      facet = { :singular_description => 'something custom' }
      allow(CurrentDomain).to receive(:property).and_return({})
      expect(helper.browse2_facet_cutoff(facet)).to eq(5) # Browse2Helper::DEFAULT_FACET_CUTOFF
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
        { :value => 'Parks', :text => 'Parks' },
        { :value => 'Police', :text => 'Police' },
        { :value => 'Public Safety', :text => 'Public Safety' },
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

  describe '#sort_facet_options' do
    def facet_options
      [ { :value => 'b', :text => 'b', :count => 4 }, { :value => 'c', :text => 'c', :count => 2 },
        { :value => 'a', :text => 'a', :count => 0 }, { :value => 'd', :text => 'd', :count => 4 } ]
    end

    def facet_options_without_count
      [ { :value => 'b', :text => 'b' }, { :value => 'c', :text => 'c' },
        { :value => 'a', :text => 'a' }, { :value => 'd', :text => 'd' } ]
    end

    it 'returns the options sorted by count, then name' do
      sorted_by_count = [{:value => 'b', :text => 'b', :count => 4}, {:value => 'd', :text => 'd', :count => 4}, {:value => 'c', :text => 'c', :count => 2}, {:value => 'a', :text => 'a', :count => 0}]
      expect(helper.sort_facet_options(facet_options)).to match_array(sorted_by_count)
    end

    it 'returns the options sorted by name if count is not present' do
      sorted_by_text = [{:value => 'a', :text => 'a'}, {:value => 'b', :text => 'b'}, {:value => 'c', :text => 'c'}, {:value => 'd', :text => 'd'}]
      expect(helper.sort_facet_options(facet_options_without_count)).to match_array(sorted_by_text)
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

    it 'works with catalog configuration limitTo facets' do
      opts = @opts.dup
      opts[:limitTo] = 'datasets'
      result = helper.get_clear_facet_options(opts)
      expect(result).to match_array([
        {
          :label => 'View Types > Datasets',
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

  describe '#truncate_result_topics' do
    before(:each) do
      @result_topics = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o']
      @limit = 5
    end

    it 'truncates to limit with no active filtered tags' do
      user_params = {}
      result = helper.truncate_result_topics(@result_topics, user_params, @limit)
      expect(result).to match_array(['a', 'b', 'c', 'd', 'e'])
    end

    it 'truncates to limit with an active filtered tag before the limit' do
      user_params = { :tags => 'b' }
      result = helper.truncate_result_topics(@result_topics, user_params, @limit)
      expect(result).to match_array(['a', 'b', 'c', 'd', 'e'])
    end

    it 'truncates to limit with an active filtered tag after the limit and the result contains the active filtered tag' do
      user_params = { :tags => 'j' }
      result = helper.truncate_result_topics(@result_topics, user_params, @limit)
      expect(result).to match_array(['a', 'b', 'c', 'd', 'j'])
    end
  end
end
