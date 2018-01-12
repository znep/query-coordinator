require 'rails_helper'

describe Clytemnestra do

  include TestHelperMethods

  it 'retrieves anticipated results' do
    payload = fixture('catalog_search_results.json')
    expected = Clytemnestra::ViewSearchResult.from_result(payload)

    search_options = {
      category: 'Public Safety',
      datasetView: 'dataset',
      federation_filter: '1',
      limit: 10,
      limitTo: 'tables',
      page: 1,
      q: 'pale moonlight',
      sortBy: 'relevance',
      tags: 'crime'
    }

    # This is necessary instead of a hash because current behavior
    # does not convert colon to %3A
    query_string = [
      'category=Public%20Safety',
      'datasetView=dataset',
      'federation_filter=1',
      'limit=10',
      'limitTo=tables',
      'page=1',
      'q=pale%20moonlight',
      'sortBy=relevance',
      'tags=crime'
    ].join('&')

    stub_request(:get, "#{APP_CONFIG.coreservice_uri}/search/views.json?#{query_string}").
      to_return(status: 200, body: payload, headers: {})

    expect(Clytemnestra.search_views(search_options).results).to eq(expected.results)
  end

  it 'raises a custom timeout error on timeout' do
    init_current_domain
    stub_request(:get, "#{APP_CONFIG.coreservice_uri}/search/views.json").
      with(query: {}, headers: { 'X-Socrata-Host' => 'localhost' }).
      to_timeout

    expect { Clytemnestra.search_views({}) }.to raise_error(CoreServer::TimeoutError)
  end

end
