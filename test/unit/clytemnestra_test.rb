require 'test_helper'

include Clytemnestra

class ClytemnestraTest < Test::Unit::TestCase
  # yes, this is a little silly
  def test_check_time_and_id_are_there_yo
    searchView = ViewSearchResult.new
    searchView.check_time = 1
    searchView.id = "blahblah"
  end

  def test_to_core_param
    input_output_pairs = {
      '' => '',
      'identity' => 'identity',
      -123 => '-123',
      0 => '0',
      1.23 => '1.23',
      Hashie::Mash.new(a: 1, b: 2) => 'a=1&b=2',
      [1, 2, 3] => '[1, 2, 3]',
      [] => '[]',
      { a: 1 } => 'a=1',
      { b: [:c, :d, :e] } => 'b=c&b=d&b=e',
      # NOTE: the metadata_tag isn't passing through to_core_param before going to core
      { metadata_tag: ['key1:value1', 'key2:value2'] } =>
        'metadata_tag=key1%3Avalue1&metadata_tag=key2%3Avalue2',
      {} => ''
    }

    input_output_pairs.each do |input, expected|
      assert_equal expected, input.to_core_param
    end
  end

  def test_search_views
    payload = File.read('test/fixtures/catalog_search_results.json')
    expected = Clytemnestra::ViewSearchResult.from_result(payload)

    search_options = {
      limit: 10,
      page: 1,
      category: 'Public Safety',
      federation_filter: '1',
      limitTo: 'tables',
      q: 'pale moonlight',
      sortBy: 'relevance',
      tags: 'crime',
      metadata_tag: [
        'Dataset-Information_Superhero:Batman',
        'Dataset-Information_Ultrahero:Fruitbatman'
      ],
      datasetView: 'dataset'
    }

    # This is necessary instead of a hash because current behavior leaves
    # : as : instead of converting it to %3A
    param_string = [
      'category=Public%20Safety',
      'datasetView=dataset',
      'federation_filter=1',
      'limit=10',
      'limitTo=tables',
      'metadata_tag=Dataset-Information_Superhero:Batman',
      'metadata_tag=Dataset-Information_Ultrahero:Fruitbatman',
      'page=1',
      'q=pale%20moonlight',
      'sortBy=relevance',
      'tags=crime'
    ].join('&')

    stub_request(:get, "#{APP_CONFIG.coreservice_uri}/search/views.json?#{param_string}")
      .with(headers: { 'Accept' => '*/*', 'User-Agent' => 'Ruby' })
      .to_return(status: 200, body: payload, headers: {})

    # Really what we're testing is that the generated URL matches our stubbed URL
    assert_equal expected.results, Clytemnestra.search_views(search_options).results
  end
end
