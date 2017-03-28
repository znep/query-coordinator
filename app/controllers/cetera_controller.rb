# used for serving up fake search results
class CeteraController < ApplicationController
  # these results are from a search for "lottery" on data.ny.gov on 3/20/2017
  def autocomplete
    render json: {
      'results': [
        {
          'title': 'Lottery Take 5 Winning Numbers',
          'display_title': "<span class=highlight>Lottery<\/span> Take 5 Winning Numbers"
        },
        {
          'title': 'Lottery Cash 4 Life Winning Numbers: Beginning 2014',
          'display_title': "<span class=highlight>Lottery<\/span> Cash 4 Life Winning Numbers: Beginning 2014"
        },
        {
          'title': 'NYS Lottery Retailers',
          'display_title': "NYS <span class=highlight>Lottery<\/span> Retailers"
        },
        {
          'title': 'Lottery Pick 10 Winning Numbers: Beginning 1987',
          'display_title': "<span class=highlight>Lottery<\/span> Pick 10 Winning Numbers: Beginning 1987"
        },
        {
          'title': "Lottery Daily Numbers\/Win-4 Winning Numbers: Beginning 1980",
          'display_title': "<span class=highlight>Lottery<\/span> Daily Numbers\/Win-4 Winning Numbers: Beginning 1980"
        },
        {
          'title': 'Lottery Mega Millions Winning Numbers: Beginning 2002',
          'display_title': "<span class=highlight>Lottery<\/span> Mega Millions Winning Numbers: Beginning 2002"
        },
        {
          'title': 'Lottery Powerball Winning Numbers: Beginning 2010',
          'display_title': "<span class=highlight>Lottery<\/span> Powerball Winning Numbers: Beginning 2010"
        },
        {
          'title': 'Lottery NY Lotto Winning Numbers: Beginning 2001',
          'display_title': "<span class=highlight>Lottery<\/span> NY Lotto Winning Numbers: Beginning 2001"
        },
        {
          'title': 'NYS Lottery Retailers Map',
          'display_title': "NYS <span class=highlight>Lottery<\/span> Retailers Map"
        },
        {
          'title': 'Lottery Aid to Education',
          'display_title': "<span class=highlight>Lottery<\/span> Aid to Education"
        },
        {
          'title': 'OTDA LIM - Lottery Intercept Match',
          'display_title': "OTDA LIM - <span class=highlight>Lottery<\/span> Intercept Match"
        },
        {
          'title': 'Lottery Quick Draw Winning Numbers: Beginning 2013',
          'display_title': "<span class=highlight>Lottery<\/span> Quick Draw Winning Numbers: Beginning 2013"
        },
        {
          'title': 'Lottery Aid to Education, Dollars by County',
          'display_title': "<span class=highlight>Lottery<\/span> Aid to Education, Dollars by County"
        },
        {
          'title': 'Lottery Sweet Million Winning Numbers: 2009 - 2014 (Retired Game)',
          'display_title': "<span class=highlight>Lottery<\/span> Sweet Million Winning Numbers: 2009 - 2014 (Retired Game)"
        },
        {
          'title': 'Lottery Aid to Education, Total Dollars Statewide',
          'display_title': "<span class=highlight>Lottery<\/span> Aid to Education, Total Dollars Statewide"
        }
      ],
      'resultSetSize': 15,
      'timings': {
        'serviceMillis': 12,
        'searchMillis': [
          2,
          4
        ]
      }
    }
  end
end
