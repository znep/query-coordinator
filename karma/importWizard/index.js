import React from 'react'; // eslint-disable-line no-unused-vars
import _ from 'lodash';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

function requireAll(context) {
  context.keys().forEach(context);
}

window.datasetCategories = [
  [ 'Business', 'Business' ],
  [ 'Government', 'Government' ]
];
window.importableTypes = ['text', 'date', 'date', 'number'];
window.enabledModules = ['geospatial', 'esri_integration'];
window.customMetadataSchema = [
  {
    'name': 'jack',
    'fields': [
      {
        'name': '1',
        'required': true,
        'type': 'fixed',
        'options': [
          'ant',
          'b',
          'c',
          'd'
        ]
      },
      {
        'name': '2',
        'required': false,
        'private': true
      },
      {
        'name': '3',
        'required': false
      }
    ]
  },
  {
    'name': 'second',
    'fields': [
      {
        'name': 'mars',
        'required': false
      },
      {
        'name': 'venus',
        'required': true
      },
      {
        'name': 'neptune',
        'required': false,
        'type': 'fixed',
        'options': [
          '50',
          '100'
        ],
      },
      {
        'name': 'jupiter',
        'required': false
      }
    ]
  }
];
window.licenses = {
   "Public Domain":"PUBLIC_DOMAIN",
   "Italian Open Data License 2.0":"IODL",
   "UK Open Government Licence v3":"UK_OGLV3.0",
   "Creative Commons 1.0 Universal (Public Domain Dedication)":"CC0_10",
   "Creative Commons Attribution 3.0 Unported":"CC_30_BY",
   "Creative Commons Attribution | Share Alike 3.0 Unported":"CC_30_BY_SA",
   "Creative Commons Attribution | No Derivative Works 3.0 Unported":"CC_30_BY_ND",
   "Creative Commons Attribution | Noncommercial 3.0 Unported":"CC_30_BY_NC",
   "Creative Commons Attribution | Noncommercial | Share Alike 3.0 Unported":"CC_30_BY_NC_SA",
   "Creative Commons Attribution | Noncommercial | No Derivative Works 3.0 Unported":"CC_30_BY_NC_ND",
   "Creative Commons Attribution 3.0 Australia":"CC_30_BY_AUS",
   "Creative Commons Attribution 3.0 IGO":"CC_30_BY_IGO",
   "Creative Commons Attribution 3.0 New Zealand":"CC_30_BY_NZ",
   "Creative Commons Attribution | Noncommercial 3.0 New Zealand":"CC_30_BY_NC_NZ",
   "Creative Commons Attribution | Noncommercial | Share Alike 3.0 New Zealand":"CC_30_BY_NC_SA_NZ",
   "Creative Commons Attribution 4.0 International":"CC_40_BY",
   "Creative Commons Attribution | Share Alike 4.0 International":"CC_40_BY_SA",
   "Open Data Commons Public Domain Dedication and License":"PDDL",
   "Open Data Commons Open Database License":"ODBL",
   "Open Data Commons Attribution License":"ODC_BY",
   "Public Domain U.S. Government":"USGOV_WORKS",
   "Standard Reference Data Copyright U.S. Secretary of Commerce":"NIST_SRD",
   "Nova Scotia Open Government Licence":"OGL_NOVA_SCOTIA",
   "Canada Open Government Licence":"OGL_CANADA",
   "-- No License --":""
};
window.enabledModules = ['geospatial', 'esri_integration'];
window.I18n = require('mockTranslations');
window.renderComponent = _.flow(TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
window.blist = {
  currentUser: {
    id: 'abcd-1234',
    email: 'test@example.com'
  }
};
window.blistLicenses = [
  {
     "id":"",
     "name":"-- No License --"
  },
  {
     "id":"PUBLIC_DOMAIN",
     "name":"Public Domain"
  },
  {
     "id":"IODL",
     "name":"Italian Open Data License 2.0",
     "logo":"images/licenses/iodl.png",
     "terms_link":"http://www.dati.gov.it/iodl/2.0/"
  },
  {
     "id":"UK_OGLV3.0",
     "name":"UK Open Government Licence v3",
     "logo":"images/licenses/ogl.png",
     "terms_link":"http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
  },
  {
     "id":"CC",
     "name":"Creative Commons",
     "licenses":[
        {
           "id":"CC0_10",
           "name":"1.0 Universal (Public Domain Dedication)",
           "logo":"images/licenses/ccZero.png",
           "terms_link":"http://creativecommons.org/publicdomain/zero/1.0/legalcode"
        },
        {
           "id":"CC_30_BY",
           "name":"Attribution 3.0 Unported",
           "logo":"images/licenses/cc30by.png",
           "terms_link":"http://creativecommons.org/licenses/by/3.0/legalcode",
           "attribution_required":true
        },
        {
           "id":"CC_30_BY_SA",
           "name":"Attribution | Share Alike 3.0 Unported",
           "logo":"images/licenses/cc30bysa.png",
           "terms_link":"http://creativecommons.org/licenses/by-sa/3.0/legalcode",
           "attribution_required":true
        },
        {
           "id":"CC_30_BY_ND",
           "name":"Attribution | No Derivative Works 3.0 Unported",
           "logo":"images/licenses/cc30bynd.png",
           "terms_link":"http://creativecommons.org/licenses/by-nd/3.0/legalcode",
           "attribution_required":true
        },
        {
           "id":"CC_30_BY_NC",
           "name":"Attribution | Noncommercial 3.0 Unported",
           "logo":"images/licenses/cc30bync.png",
           "terms_link":"http://creativecommons.org/licenses/by-nc/3.0/legalcode",
           "attribution_required":true
        },
        {
           "id":"CC_30_BY_NC_SA",
           "name":"Attribution | Noncommercial | Share Alike 3.0 Unported",
           "logo":"images/licenses/cc30byncsa.png",
           "terms_link":"http://creativecommons.org/licenses/by-nc-sa/3.0/legalcode",
           "attribution_required":true
        },
        {
           "id":"CC_30_BY_NC_ND",
           "name":"Attribution | Noncommercial | No Derivative Works 3.0 Unported",
           "logo":"images/licenses/cc30byncnd.png",
           "terms_link":"http://creativecommons.org/licenses/by-nc-nd/3.0/legalcode",
           "attribution_required":true
        },
        {
           "id":"CC_30_BY_AUS",
           "name":"Attribution 3.0 Australia",
           "logo":"images/licenses/cc30by.png",
           "terms_link":"http://creativecommons.org/licenses/by/3.0/au/deed.en",
           "attribution_required":true
        },
        {
           "id":"CC_30_BY_IGO",
           "name":"Attribution 3.0 IGO",
           "logo":"images/licenses/cc30by.png",
           "terms_link":"https://creativecommons.org/licenses/by/3.0/igo/legalcode",
           "attribution_required":true
        },
        {
           "id":"CC_30_BY_NZ",
           "name":"Attribution 3.0 New Zealand",
           "logo":"images/licenses/cc30by.png",
           "terms_link":"https://creativecommons.org/licenses/by/3.0/nz/legalcode",
           "attribution_required":true
        },
        {
           "id":"CC_30_BY_NC_NZ",
           "name":"Attribution | Noncommercial 3.0 New Zealand",
           "logo":"images/licenses/cc30bync.png",
           "terms_link":"https://creativecommons.org/licenses/by-nc/3.0/nz/legalcode",
           "attribution_required":true
        },
        {
           "id":"CC_30_BY_NC_SA_NZ",
           "name":"Attribution | Noncommercial | Share Alike 3.0 New Zealand",
           "logo":"images/licenses/cc30byncsa.png",
           "terms_link":"https://creativecommons.org/licenses/by-nc-sa/3.0/nz/legalcode",
           "attribution_required":true
        },
        {
           "id":"CC_40_BY",
           "name":"Attribution 4.0 International",
           "logo":"images/licenses/cc30by.png",
           "terms_link":"http://creativecommons.org/licenses/by/4.0/legalcode",
           "attribution_required":true
        },
        {
           "id":"CC_40_BY_SA",
           "name":"Attribution | Share Alike 4.0 International",
           "logo":"images/licenses/cc30bysa.png",
           "terms_link":"http://creativecommons.org/licenses/by-sa/4.0/legalcode",
           "attribution_required":true
        }
     ]
  },
  {
     "id":"ODC",
     "name":"Open Data Commons",
     "licenses":[
        {
           "id":"PDDL",
           "name":"Public Domain Dedication and License",
           "terms_link":"http://opendatacommons.org/licenses/pddl/1.0/"
        },
        {
           "id":"ODBL",
           "name":"Open Database License",
           "terms_link":"http://opendatacommons.org/licenses/odbl/1.0/"
        },
        {
           "id":"ODC_BY",
           "name":"Attribution License",
           "terms_link":"http://opendatacommons.org/licenses/by/1.0/",
           "attribution_required":true
        }
     ]
  },
  {
     "id":"USGOV_WORKS",
     "name":"Public Domain U.S. Government",
     "terms_link":"https://www.usa.gov/government-works"
  },
  {
     "id":"NIST_SRD",
     "name":"Standard Reference Data Copyright U.S. Secretary of Commerce",
     "terms_link":"http://www.nist.gov/data/license.cfm"
  },
  {
     "id":"OGL_NOVA_SCOTIA",
     "name":"Nova Scotia Open Government Licence",
     "terms_link":"http://novascotia.ca/opendata/licence.asp"
  },
  {
     "id":"OGL_CANADA",
     "name":"Canada Open Government Licence",
     "terms_link":"http://open.canada.ca/en/open-government-licence-canada"
  }
];

// Run all the tests
requireAll(require.context('./components', true, /\.js$/));
