require 'rails_helper'

describe WhatsNewHelper do
  it 'should parse dates properly' do
    news = {}
    news['articles'] = [
      { 'updated_at' => '2016-05-01T00:00:00Z' },
      { 'updated_at' => '2250-01-01T16:20:00Z' },
      { 'updated_at' => '1992-03-23T10:10:10Z' }
    ]

    parse_dates(news)

    expect(news['articles'][0]['parsed_datetime']).to eq ' 1 May 2016'
    expect(news['articles'][1]['parsed_datetime']).to eq ' 1 Jan 2250'
    expect(news['articles'][2]['parsed_datetime']).to eq '23 Mar 1992'
  end
end
