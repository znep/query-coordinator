describe('table', function() {
  var testHelpers, q, scope, data;

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));
  beforeEach(module('/angular_templates/common/table.html'));
  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    q = $injector.get('$q');
    scope = $injector.get('$rootScope').$new();
    data = [{"beat":"1014","block":"016XX S CENTRAL PARK AVE","case_number":"HW584825","community_area":"29","date":"2013-12-26T20:01:00.000","description":"FIRST DEGREE MURDER","district":"010","fbi_code":"01A","id":"21205","iucr":"0110","latitude":"41.85757140779365","location_description":"APARTMENT","longitude":"-87.71531758124088","primary_type":"HOMICIDE","updated_on":"2013-12-27T06:12:29.000","ward":"24","x_coordinate":"1152609","y_coordinate":"1891295","year":"2013"}
,{"beat":"1131","block":"007XX S 764","case_number":"HW584861","community_area":"26","date":"2013-12-26T20:14:00.000","description":"FIRST DEGREE MURDER","district":"011","fbi_code":"01A","id":"21206","iucr":"0110","latitude":"41.87055597715509","location_description":"STREET","longitude":"-87.73793776878065","primary_type":"HOMICIDE","updated_on":"2014-02-19T10:02:46.000","ward":"24","x_coordinate":"1146414","y_coordinate":"1895983","year":"2013"}
,{"beat":"1512","block":"059XX W MIDWAY PARK","case_number":"HW585094","community_area":"25","date":"2013-12-27T03:40:00.000","description":"FIRST DEGREE MURDER","district":"015","fbi_code":"01A","id":"21207","iucr":"0110","latitude":"41.88885087975557","location_description":"PORCH","longitude":"-87.77431761552849","primary_type":"HOMICIDE","updated_on":"2014-02-19T10:04:47.000","ward":"29","x_coordinate":"1136462","y_coordinate":"1902583","year":"2013"}
,{"beat":"0215","block":"045XX S INDIANA AVE","case_number":"HW586359","community_area":"38","date":"2013-12-28T04:09:00.000","description":"FIRST DEGREE MURDER","district":"002","fbi_code":"01A","id":"21208","iucr":"0110","latitude":"41.81256080042236","location_description":"STREET","longitude":"-87.62115413741721","primary_type":"HOMICIDE","updated_on":"2013-12-29T05:27:09.000","ward":"3","x_coordinate":"1178397","y_coordinate":"1875092","year":"2013"}
,{"beat":"1235","block":"013XX W CERMAK RD","case_number":"HW588498","community_area":"31","date":"2013-12-30T02:05:00.000","description":"FIRST DEGREE MURDER","district":"012","fbi_code":"01A","id":"21209","iucr":"0110","latitude":"41.85256382732571","location_description":"AUTO","longitude":"-87.65886552765248","primary_type":"HOMICIDE","updated_on":"2014-02-22T05:51:56.000","ward":"25","x_coordinate":"1168002","y_coordinate":"1889586","year":"2013"}
,{"beat":"0731","block":"071XX S VINCENNES AVE","case_number":"HW590546","community_area":"69","date":"2013-12-31T20:18:00.000","description":"FIRST DEGREE MURDER","district":"007","fbi_code":"01A","id":"21211","iucr":"0110","latitude":"41.76469050298816","location_description":"PARKING LOT","longitude":"-87.62843929362126","primary_type":"HOMICIDE","updated_on":"2014-04-24T07:34:04.000","ward":"6","x_coordinate":"1176554","y_coordinate":"1857632","year":"2013"}
,{"beat":"0522","block":"003XX W 307","case_number":"HX102390","community_area":"49","date":"2014-01-03T16:08:00.000","description":"FIRST DEGREE MURDER","district":"005","fbi_code":"01A","id":"21212","iucr":"0110","latitude":"41.6869374756627","location_description":"STREET","longitude":"-87.63050416286787","primary_type":"HOMICIDE","updated_on":"2014-02-22T06:07:08.000","ward":"34","x_coordinate":"1176222","y_coordinate":"1829295","year":"2014"}
,{"beat":"0212","block":"005XX E 530","case_number":"HX104147","community_area":"35","date":"2014-01-05T05:40:00.000","description":"FIRST DEGREE MURDER","district":"002","fbi_code":"01A","id":"21213","iucr":"0110","latitude":"41.824936377111115","location_description":"HOUSE","longitude":"-87.6134956921907","primary_type":"HOMICIDE","updated_on":"2014-02-18T11:54:12.000","ward":"4","x_coordinate":"1180447","y_coordinate":"1879619","year":"2014"}
,{"beat":"0823","block":"029XX W 63RD ST","case_number":"HX105434","community_area":"66","date":"2014-01-06T23:12:00.000","description":"FIRST DEGREE MURDER","district":"008","fbi_code":"01A","id":"21214","iucr":"0110","latitude":"41.77894458064449","location_description":"APARTMENT","longitude":"-87.69761685801507","primary_type":"HOMICIDE","updated_on":"2014-03-05T11:00:18.000","ward":"15","x_coordinate":"1157643","y_coordinate":"1862679","year":"2014"}
,{"beat":"0825","block":"064XX S CAMPBELL AVE","case_number":"HX107078","community_area":"66","date":"2014-01-08T17:24:00.000","description":"FIRST DEGREE MURDER","district":"008","fbi_code":"01A","id":"21215","iucr":"0110","latitude":"41.77722040963924","location_description":"STREET","longitude":"-87.68617695745638","primary_type":"HOMICIDE","updated_on":"2014-02-22T05:52:25.000","ward":"15","x_coordinate":"1160768","y_coordinate":"1862074","year":"2014"}
,{"beat":"0313","block":"062XX S ST LAWRENCE AVE","case_number":"HX111217","community_area":"42","date":"2014-01-12T00:05:00.000","description":"FIRST DEGREE MURDER","district":"003","fbi_code":"01A","id":"21216","iucr":"0110","latitude":"41.7817649895435","location_description":"APARTMENT","longitude":"-87.61068992882824","primary_type":"HOMICIDE","updated_on":"2014-05-17T12:34:21.000","ward":"20","x_coordinate":"1181344","y_coordinate":"1863894","year":"2014"}
,{"beat":"1132","block":"039XX W CONGRESS PKWY","case_number":"HX114974","community_area":"26","date":"2014-01-15T01:25:00.000","description":"FIRST DEGREE MURDER","district":"011","fbi_code":"01A","id":"21220","iucr":"0110","latitude":"41.874279657369364","location_description":"STREET","longitude":"-87.72324553521032","primary_type":"HOMICIDE","updated_on":"2014-02-19T10:05:27.000","ward":"24","x_coordinate":"1150406","y_coordinate":"1897368","year":"2014"}
,{"beat":"1024","block":"032XX W 23RD ST","case_number":"HX115965","community_area":"30","date":"2014-01-15T19:24:00.000","description":"FIRST DEGREE MURDER","district":"010","fbi_code":"01A","id":"21221","iucr":"0110","latitude":"41.850035517838066","location_description":"STREET","longitude":"-87.70718316736269","primary_type":"HOMICIDE","updated_on":"2014-01-21T10:42:47.000","ward":"22","x_coordinate":"1154845","y_coordinate":"1888565","year":"2014"}
,{"beat":"0733","block":"070XX S HALSTED ST","case_number":"HX116487","community_area":"68","date":"2014-01-16T11:59:00.000","description":"FIRST DEGREE MURDER","district":"007","fbi_code":"01A","id":"21222","iucr":"0110","latitude":"41.76683301802789","location_description":"STREET","longitude":"-87.6445995569294","primary_type":"HOMICIDE","updated_on":"2014-03-24T08:15:47.000","ward":"6","x_coordinate":"1172139","y_coordinate":"1858377","year":"2014"}
,{"beat":"1531","block":"049XX W HURON ST","case_number":"HX118283","community_area":"25","date":"2014-01-17T17:22:00.000","description":"FIRST DEGREE MURDER","district":"015","fbi_code":"01A","id":"21223","iucr":"0110","latitude":"41.89323869679696","location_description":"STREET","longitude":"-87.74945456121489","primary_type":"HOMICIDE","updated_on":"2014-02-19T10:06:05.000","ward":"37","x_coordinate":"1143221","y_coordinate":"1904227","year":"2014"}
,{"beat":"0622","block":"082XX S PRINCETON AVE","case_number":"HX118404","community_area":"44","date":"2014-01-17T20:06:00.000","description":"FIRST DEGREE MURDER","district":"006","fbi_code":"01A","id":"21224","iucr":"0110","latitude":"41.74439355862245","location_description":"PARK PROPERTY","longitude":"-87.63156350520609","primary_type":"HOMICIDE","updated_on":"2014-02-22T06:08:23.000","ward":"21","x_coordinate":"1175762","y_coordinate":"1850229","year":"2014"}
,{"beat":"0825","block":"062XX S CAMPBELL AVE","case_number":"HX116936","community_area":"66","date":"2014-01-18T05:45:00.000","description":"FIRST DEGREE MURDER","district":"008","fbi_code":"01A","id":"21225","iucr":"0110","latitude":"41.78086924676815","location_description":"STREET","longitude":"-87.68598628036347","primary_type":"HOMICIDE","updated_on":"2014-01-21T10:42:37.000","ward":"15","x_coordinate":"1160810","y_coordinate":"1863404","year":"2014"}
,{"beat":"0424","block":"091XX S COMMERCIAL AVE","case_number":"HX119907","community_area":"46","date":"2014-01-19T04:55:00.000","description":"FIRST DEGREE MURDER","district":"004","fbi_code":"01A","id":"21226","iucr":"0110","latitude":"41.72918907813859","location_description":"APARTMENT","longitude":"-87.5510885864079","primary_type":"HOMICIDE","updated_on":"2014-03-05T12:11:51.000","ward":"10","x_coordinate":"1197774","y_coordinate":"1844878","year":"2014"}
,{"beat":"0424","block":"091XX S COMMERCIAL AVE","case_number":"HX119907","community_area":"46","date":"2014-01-19T04:55:00.000","description":"FIRST DEGREE MURDER","district":"004","fbi_code":"01A","id":"21227","iucr":"0110","latitude":"41.72918907813859","location_description":"APARTMENT","longitude":"-87.5510885864079","primary_type":"HOMICIDE","updated_on":"2014-03-05T12:12:36.000","ward":"10","x_coordinate":"1197774","y_coordinate":"1844878","year":"2014"}
,{"beat":"1624","block":"043XX N MILWAUKEE AVE","case_number":"HX121804","community_area":"15","date":"2014-01-21T04:42:00.000","description":"FIRST DEGREE MURDER","district":"016","fbi_code":"01A","id":"21228","iucr":"0110","latitude":"41.95898029878231","location_description":"STREET","longitude":"-87.7528733568068","primary_type":"HOMICIDE","updated_on":"2014-03-20T07:10:56.000","ward":"45","x_coordinate":"1142128","y_coordinate":"1928177","year":"2014"}
,{"beat":"0734","block":"069XX S RACINE AVE","case_number":"HX123611","community_area":"67","date":"2014-01-22T13:25:00.000","description":"FIRST DEGREE MURDER","district":"007","fbi_code":"01A","id":"21229","iucr":"0110","latitude":"41.76800516851296","location_description":"PORCH","longitude":"-87.65433775171677","primary_type":"HOMICIDE","updated_on":"2014-04-09T08:59:19.000","ward":"17","x_coordinate":"1169479","y_coordinate":"1858783","year":"2014"}
,{"beat":"0832","block":"070XX S CLAREMONT AVE","case_number":"HX123338","community_area":"66","date":"2014-01-22T09:50:00.000","description":"FIRST DEGREE MURDER","district":"008","fbi_code":"01A","id":"21230","iucr":"0110","latitude":"41.7654517255389","location_description":"APARTMENT","longitude":"-87.68209085783768","primary_type":"HOMICIDE","updated_on":"2014-03-05T10:50:17.000","ward":"17","x_coordinate":"1161915","y_coordinate":"1857794","year":"2014"}
,{"beat":"1013","block":"038XX W 26TH ST","case_number":"HX126814","community_area":"30","date":"2014-01-25T02:55:00.000","description":"FIRST DEGREE MURDER","district":"010","fbi_code":"01A","id":"21231","iucr":"0110","latitude":"41.84440753331454","location_description":"STREET","longitude":"-87.72101909158059","primary_type":"HOMICIDE","updated_on":"2014-01-25T09:41:33.000","ward":"22","x_coordinate":"1151090","y_coordinate":"1886487","year":"2014"}
,{"beat":"0935","block":"051XX S UNION AVE","case_number":"HX126764","community_area":"61","date":"2014-01-25T00:52:00.000","description":"FIRST DEGREE MURDER","district":"009","fbi_code":"01A","id":"21232","iucr":"0110","latitude":"41.80144659496947","location_description":"TAVERN","longitude":"-87.64274730958067","primary_type":"HOMICIDE","updated_on":"2014-04-21T09:09:24.000","ward":"3","x_coordinate":"1172543","y_coordinate":"1870994","year":"2014"}
,{"beat":"1031","block":"041XX W 30TH ST","case_number":"HX128524","community_area":"30","date":"2014-01-26T16:48:00.000","description":"FIRST DEGREE MURDER","district":"010","fbi_code":"01A","id":"21233","iucr":"0110","latitude":"41.83879371009255","location_description":"STREET","longitude":"-87.72792767079791","primary_type":"HOMICIDE","updated_on":"2014-03-06T07:21:18.000","ward":"22","x_coordinate":"1149222","y_coordinate":"1884428","year":"2014"}
,{"beat":"0624","block":"007XX E 720","case_number":"HX131480","community_area":"69","date":"2014-01-29T13:37:00.000","description":"FIRST DEGREE MURDER","district":"006","fbi_code":"01A","id":"21259","iucr":"0110","latitude":"41.75136656352794","location_description":"APARTMENT","longitude":"-87.60679454738315","primary_type":"HOMICIDE","updated_on":"2014-03-24T08:16:21.000","ward":"6","x_coordinate":"1182500","y_coordinate":"1852826","year":"2014"}
,{"beat":"1234","block":"019XX S WOOD ST","case_number":"HX134921","community_area":"31","date":"2014-02-01T03:19:00.000","description":"FIRST DEGREE MURDER","district":"012","fbi_code":"01A","id":"21270","iucr":"0110","latitude":"41.85581065161051","location_description":"STREET","longitude":"-87.67119066269763","primary_type":"HOMICIDE","updated_on":"2014-02-22T05:55:07.000","ward":"25","x_coordinate":"1164635","y_coordinate":"1890743","year":"2014"}
,{"beat":"0621","block":"076XX S WALLACE ST","case_number":"HX138414","community_area":"69","date":"2014-02-04T02:11:00.000","description":"FIRST DEGREE MURDER","district":"006","fbi_code":"01A","id":"21271","iucr":"0110","latitude":"41.75536550631099","location_description":"STREET","longitude":"-87.63927969496469","primary_type":"HOMICIDE","updated_on":"2014-03-24T08:16:49.000","ward":"17","x_coordinate":"1173624","y_coordinate":"1854210","year":"2014"}
,{"beat":"1421","block":"032XX W ARMITAGE AVE","case_number":"HX135032","community_area":"22","date":"2014-02-04T12:55:00.000","description":"FIRST DEGREE MURDER","district":"014","fbi_code":"01A","id":"21273","iucr":"0110","latitude":"41.9174860379786","location_description":"STREET","longitude":"-87.70914397753761","primary_type":"HOMICIDE","updated_on":"2014-02-10T05:26:41.000","ward":"35","x_coordinate":"1154132","y_coordinate":"1913140","year":"2014"}
,{"beat":"2432","block":"067XX N CLARK ST","case_number":"HX140222","community_area":"1","date":"2014-02-05T16:33:00.000","description":"FIRST DEGREE MURDER","district":"024","fbi_code":"01A","id":"21274","iucr":"0110","latitude":"42.00470906576349","location_description":"STREET","longitude":"-87.67304122462518","primary_type":"HOMICIDE","updated_on":"2014-03-20T07:25:14.000","ward":"49","x_coordinate":"1163713","y_coordinate":"1944998","year":"2014"}
,{"beat":"0614","block":"081XX S MARSHFIELD AVE","case_number":"HX140789","community_area":"71","date":"2014-02-06T03:15:00.000","description":"FIRST DEGREE MURDER","district":"006","fbi_code":"01A","id":"21275","iucr":"0110","latitude":"41.74561295307531","location_description":"STREET","longitude":"-87.66438337954953","primary_type":"HOMICIDE","updated_on":"2014-03-24T08:17:30.000","ward":"21","x_coordinate":"1166802","y_coordinate":"1850602","year":"2014"}
,{"beat":"0922","block":"025XX W 45TH ST","case_number":"HX142789","community_area":"58","date":"2014-02-07T13:52:00.000","description":"FIRST DEGREE MURDER","district":"009","fbi_code":"01A","id":"21276","iucr":"0110","latitude":"41.812133112033266","location_description":"HOUSE","longitude":"-87.68761940182523","primary_type":"HOMICIDE","updated_on":"2014-04-21T09:10:01.000","ward":"12","x_coordinate":"1160279","y_coordinate":"1874793","year":"2014"}
,{"beat":"1113","block":"045XX W MONROE ST","case_number":"HX144647","community_area":"26","date":"2014-02-09T05:30:00.000","description":"FIRST DEGREE MURDER","district":"011","fbi_code":"01A","id":"21277","iucr":"0110","latitude":"41.8794918475569","location_description":"STREET","longitude":"-87.73911067105962","primary_type":"HOMICIDE","updated_on":"2014-03-20T07:25:40.000","ward":"28","x_coordinate":"1146072","y_coordinate":"1899237","year":"2014"}
,{"beat":"1233","block":"013XX W HASTINGS ST","case_number":"HX145191","community_area":"28","date":"2014-02-09T16:14:00.000","description":"FIRST DEGREE MURDER","district":"012","fbi_code":"01A","id":"21278","iucr":"0110","latitude":"41.86417090711562","location_description":"STREET","longitude":"-87.65960994857554","primary_type":"HOMICIDE","updated_on":"2014-04-21T09:12:16.000","ward":"2","x_coordinate":"1167766","y_coordinate":"1893814","year":"2014"}
,{"beat":"0313","block":"061XX S VERNON AVE","case_number":"HX149173","community_area":"42","date":"2014-02-12T20:11:00.000","description":"FIRST DEGREE MURDER","district":"003","fbi_code":"01A","id":"21279","iucr":"0110","latitude":"41.78287456300661","location_description":"STREET","longitude":"-87.61432933618634","primary_type":"HOMICIDE","updated_on":"2014-04-28T06:41:24.000","ward":"20","x_coordinate":"1180348","y_coordinate":"1864290","year":"2014"}
,{"beat":"1512","block":"003XX N 312","case_number":"HX150373","community_area":"25","date":"2014-02-13T21:00:00.000","description":"FIRST DEGREE MURDER","district":"015","fbi_code":"01A","id":"21280","iucr":"0110","latitude":"41.88617998147819","location_description":"ALLEY","longitude":"-87.76521854294964","primary_type":"HOMICIDE","updated_on":"2014-03-20T07:26:08.000","ward":"29","x_coordinate":"1138946","y_coordinate":"1901626","year":"2014"}
,{"beat":"0712","block":"009XX W 900","case_number":"HX150821","community_area":"68","date":"2014-02-14T10:10:00.000","description":"FIRST DEGREE MURDER","district":"007","fbi_code":"01A","id":"21281","iucr":"0110","latitude":"41.781529511442265","location_description":"NURSING HOME","longitude":"-87.6474854707814","primary_type":"HOMICIDE","updated_on":"2014-03-23T09:17:54.000","ward":"16","x_coordinate":"1171309","y_coordinate":"1863726","year":"2014"}
,{"beat":"0332","block":"069XX S CORNELL AVE","case_number":"HX150345","community_area":"43","date":"2014-02-15T16:38:00.000","description":"FIRST DEGREE MURDER","district":"003","fbi_code":"01A","id":"21282","iucr":"0110","latitude":"41.76928136170727","location_description":"APARTMENT","longitude":"-87.5845722376665","primary_type":"HOMICIDE","updated_on":"2014-04-21T09:14:24.000","ward":"5","x_coordinate":"1188507","y_coordinate":"1859406","year":"2014"}
,{"beat":"1513","block":"0000X S MASON AVE","case_number":"HX158733","community_area":"25","date":"2014-02-20T22:41:00.000","description":"FIRST DEGREE MURDER","district":"015","fbi_code":"01A","id":"21286","iucr":"0110","latitude":"41.87988253022876","location_description":"PORCH","longitude":"-87.7731619668253","primary_type":"HOMICIDE","updated_on":"2014-02-21T05:22:10.000","ward":"29","x_coordinate":"1136798","y_coordinate":"1899317","year":"2014"}
,{"beat":"0915","block":"037XX S PRINCETON AVE","case_number":"HX160329","community_area":"34","date":"2014-02-22T05:45:00.000","description":"FIRST DEGREE MURDER","district":"009","fbi_code":"01A","id":"21287","iucr":"0110","latitude":"41.82649090524716","location_description":"STREET","longitude":"-87.6336872475034","primary_type":"HOMICIDE","updated_on":"2014-04-21T09:15:12.000","ward":"3","x_coordinate":"1174939","y_coordinate":"1880140","year":"2014"}
,{"beat":"1523","block":"002XX N 213","case_number":"HX161133","community_area":"25","date":"2014-02-22T22:08:00.000","description":"FIRST DEGREE MURDER","district":"015","fbi_code":"01A","id":"21288","iucr":"0110","latitude":"41.88478810577909","location_description":"AUTO","longitude":"-87.75630335179461","primary_type":"HOMICIDE","updated_on":"2014-02-25T05:43:44.000","ward":"28","x_coordinate":"1141377","y_coordinate":"1901135","year":"2014"}
,{"beat":"0424","block":"083XX S BAKER AVE","case_number":"HX158889","community_area":"46","date":"2014-02-21T06:41:00.000","description":"FIRST DEGREE MURDER","district":"004","fbi_code":"01A","id":"21289","iucr":"0110","latitude":"41.7422599731522","location_description":"APARTMENT","longitude":"-87.54863982549314","primary_type":"HOMICIDE","updated_on":"2014-03-24T08:18:55.000","ward":"7","x_coordinate":"1198399","y_coordinate":"1849647","year":"2014"}
,{"beat":"1121","block":"006XX N 622","case_number":"HX159580","community_area":"23","date":"2014-02-21T15:00:00.000","description":"FIRST DEGREE MURDER","district":"011","fbi_code":"01A","id":"21290","iucr":"0110","latitude":"41.89258112853088","location_description":"ALLEY","longitude":"-87.71149470956418","primary_type":"HOMICIDE","updated_on":"2014-03-20T07:27:16.000","ward":"27","x_coordinate":"1153558","y_coordinate":"1904060","year":"2014"}
,{"beat":"1133","block":"009XX S 917","case_number":"HX166613","community_area":"26","date":"2014-02-27T16:21:00.000","description":"FIRST DEGREE MURDER","district":"011","fbi_code":"01A","id":"21291","iucr":"0110","latitude":"41.86928489480236","location_description":"APARTMENT","longitude":"-87.72268723657413","primary_type":"HOMICIDE","updated_on":"2014-03-20T08:56:06.000","ward":"24","x_coordinate":"1150571","y_coordinate":"1895549","year":"2014"}
,{"beat":"0934","block":"054XX S LAFLIN ST","case_number":"HX167048","community_area":"61","date":"2014-02-28T00:36:00.000","description":"FIRST DEGREE MURDER","district":"009","fbi_code":"01A","id":"21292","iucr":"0110","latitude":"41.79515201550019","location_description":"APARTMENT","longitude":"-87.66233191495365","primary_type":"HOMICIDE","updated_on":"2014-03-19T05:29:30.000","ward":"16","x_coordinate":"1167221","y_coordinate":"1868658","year":"2014"}
,{"beat":"0621","block":"080XX S SANGAMON ST","case_number":"HX167246","community_area":"71","date":"2014-02-28T11:02:00.000","description":"FIRST DEGREE MURDER","district":"006","fbi_code":"01A","id":"21293","iucr":"0110","latitude":"41.747877747417235","location_description":"ALLEY","longitude":"-87.64774849053836","primary_type":"HOMICIDE","updated_on":"2014-03-24T08:19:21.000","ward":"21","x_coordinate":"1171335","y_coordinate":"1851463","year":"2014"}
,{"beat":"0924","block":"017XX W 46TH ST","case_number":"HX168705","community_area":"61","date":"2014-03-01T13:32:00.000","description":"FIRST DEGREE MURDER","district":"009","fbi_code":"01A","id":"21294","iucr":"0110","latitude":"41.81049730380304","location_description":"STREET","longitude":"-87.66881474231039","primary_type":"HOMICIDE","updated_on":"2014-04-21T08:44:33.000","ward":"20","x_coordinate":"1165410","y_coordinate":"1874236","year":"2014"}
,{"beat":"0824","block":"023XX W 57TH ST","case_number":"HX168795","community_area":"63","date":"2014-03-01T14:22:00.000","description":"FIRST DEGREE MURDER","district":"008","fbi_code":"01A","id":"21295","iucr":"0110","latitude":"41.79011864804681","location_description":"STREET","longitude":"-87.68133520903278","primary_type":"HOMICIDE","updated_on":"2014-04-21T08:45:14.000","ward":"16","x_coordinate":"1162053","y_coordinate":"1866784","year":"2014"}
,{"beat":"0512","block":"0000X E 104TH ST","case_number":"HX167538","community_area":"49","date":"2014-02-28T13:08:00.000","description":"FIRST DEGREE MURDER","district":"005","fbi_code":"01A","id":"21296","iucr":"0110","latitude":"41.705486466459234","location_description":"HOUSE","longitude":"-87.62115417589061","primary_type":"HOMICIDE","updated_on":"2014-03-24T08:19:45.000","ward":"9","x_coordinate":"1178720","y_coordinate":"1836075","year":"2014"}
,{"beat":"0522","block":"004XX W 418","case_number":"HX169342","community_area":"53","date":"2014-03-02T00:20:00.000","description":"FIRST DEGREE MURDER","district":"005","fbi_code":"01A","id":"21297","iucr":"0110","latitude":"41.68165750309737","location_description":"PORCH","longitude":"-87.63322300988305","primary_type":"HOMICIDE","updated_on":"2014-03-24T08:23:22.000","ward":"34","x_coordinate":"1175495","y_coordinate":"1827365","year":"2014"}
]
  }));
  afterEach(function() {
    testHelpers.TestDom.clear();
  });
  var createTableCard = function(expanded, getRows) {
    if (!expanded) expanded = false;
    var html =
      '<div class="card ' + (expanded ? 'expanded': '') + '" style="width: 640px; height: 480px;">' +
        '<div table class="table" row-count="rowCount" get-rows="getRows" where-clause="whereClause" filtered-row-count="filteredRowCount" expanded="expanded"></div>' +
      '</div>';
    var compiledElem = testHelpers.TestDom.compileAndAppend(html, scope);
    scope.expanded = expanded;
    scope.rowCount = 200;
    scope.filteredRowCount = 170;
    if(getRows) {
      scope.getRows = getRows;
    } else {
      scope.getRows = function() {
        return q.when(data);
      }
    }
    scope.$digest();
    return compiledElem;
  }
  describe('when not expanded', function() {
    it('should create', function() {
      var el = createTableCard(false);
    });
  });
  describe('when expanded', function() {
    it('should create and load data', function(done) {
      var el = createTableCard(true);
      var columnCount = _.keys(data[0]).length;
      _.defer(function() {
        scope.$digest();
        expect($('.row-block .cell').length).to.equal(columnCount * 150);
        expect($('.th').length).to.equal(columnCount);
        done();
      });
    });
    it('should be able to scroll', function(done) {
      var el = createTableCard(true);
      $(el).find('.table-body').scrollTop($.relativeToPx('2rem')*51);
      scope.$digest();
      _.defer(function() {
        scope.$digest();
        var columnCount = _.keys(data[0]).length;
        expect($('.th').length).to.equal(columnCount);
        expect($('.row-block .cell').length).to.equal(columnCount * 200);
        done();
      });
    });
    it('should be able to sort using the caret', function(done) {
      var sort = '';
      var el = createTableCard(true, function(offset, limit, order, timeout, whereClause) {
        sort = order;
        return q.when(data);
      });
      $(el).find('.caret').eq(0).click();
      expect($('.row-block .cell').length).to.equal(0);
      expect(sort).to.equal('beat DESC');
      scope.$digest();
      _.defer(function() {
        scope.$digest();
        var columnCount = _.keys(data[0]).length;
        expect($('.th').length).to.equal(columnCount);
        expect($('.row-block .cell').length).to.equal(columnCount * 150);
        done();
      });
    });
    it('should be able to sort using the flyout', function(done) {
      var sort = '';
      var el = createTableCard(true, function(offset, limit, order, timeout, whereClause) {
        sort = order;
        return q.when(data);
      });
      $(el).find('.th').eq(0).trigger('mouseenter');
      expect($('.flyout a').length).to.equal(1);
      $('.flyout a').click();
      expect($('.row-block .cell').length).to.equal(0);
      expect(sort).to.equal('beat DESC');
      scope.$digest();
      _.defer(function() {
        scope.$digest();
        var columnCount = _.keys(data[0]).length;
        expect($('.th').length).to.equal(columnCount);
        expect($('.row-block .cell').length).to.equal(columnCount * 150);
        done();
      });
    });
    it('should be able to sort ASC', function() {
      var sort = '';
      var el = createTableCard(true, function(offset, limit, order, timeout, whereClause) {
        sort = order;
        return q.when(data);
      });
      expect(sort).to.equal('');
      $(el).find('.caret').eq(0).click();
      expect(sort).to.equal('beat DESC');
      scope.$digest();
      $(el).find('.caret').eq(0).click();
      expect(sort).to.equal('beat ASC');
    });
    it('should be able to filter', function(done) {
      var hasCorrectWhereClause = false;
      var el = createTableCard(true, function(offset, limit, order, timeout, whereClause) {
        if(!hasCorrectWhereClause) hasCorrectWhereClause = whereClause == 'district=004';
        return q.when(data);
      });
      scope.$digest();
      scope.whereClause = 'district=004';
      scope.$digest();
      _.defer(function() {
        scope.$digest();
        var columnCount = _.keys(data[0]).length;
        expect($('.th').length).to.equal(columnCount);
        expect($('.row-block .cell').length).to.equal(columnCount * 150);
        expect(hasCorrectWhereClause).to.equal(true);
        done();
      });
    });
    it('should format numbers correctly', function(done) {
      var el = createTableCard(true);
      var columnCount = _.keys(data[0]).length;
      _.defer(function() {
        scope.$digest();
        expect($('.row-block .cell').length).to.equal(columnCount * 150);
        expect($('.th').length).to.equal(columnCount);
        _.each($('.row-block .cell'), function(cell) {
          var text = $(cell).text();
          // TODO: Use metadata to determine if should be number.
          var stripped = text.replace(/,/g, '');
          if (!_.isNaN(Number(stripped))) {
            expect($(cell).hasClass('number')).to.be.true;
          }
        });
        done();
      });
    });
  });
});
