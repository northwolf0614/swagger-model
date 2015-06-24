var test = {
    "anyClaimsQuestion": "no",
    "anyConvictionsQuestion": "no",
    "anyInfringementsQuestion": "no",
    "anyLostLicencesQuestion": "no",
    "periodStartDate": "2015-02-02",
    "account": {
        "ID": "portal:Account-pgvxjduise",
        "accountHolder": {
            "ID": "portal:Person-dwkryfk63p",
            "firstName": "Rapid",
            "lastName": "Estimate",
            "primaryAddress": {
                "ID": "portal:Address-1",
                "city": "SYDNEY",
                "state": "AU_NSW",
                "postalCode": "2000",
                "addressLine1": ""
            },
            "dateOfBirth": "1990-03-02",
            "gender": "M",
            "emailAddress1": "test@test.com"
        }
    },
    "vehicles": [
        {
            "ID": "portal:QPMVehicle-eocbpgyl3r",
            "vehicleInfo": {
                "bodyStyle": "Hatchback",
                "engineSize": "1800",
                "make": "Toyota",
                "model": "Corolla",
                "modelYear": 2014,
                "redbookID": "Redbook0"
            },
            "unrepairedDamage": "none",
            "primaryUsage": "private",
            "afterMarketModifications": false,
            "colour": "black",
            "garageType": "car_port",
            "garageAddress": {
                "ID": "portal:Address-7ult757hqv",
                "city": "SYDNEY",
                "state": "AU_NSW",
                "postalCode": "2000",
                "addressLine1": ""
            },
            "purchasePrice": 10000,
            "purchaseDate": "2015-02-02",
            "drivers": [
                {
                    "ID": "portal:QPMVehicleDriver-fshp4hww1p",
                    "driver": {
                        "ID": "portal:QPMPolicyDriver-oyh6ch20x3",
                        "person": {
                            "ID": "portal:Person-5qd87o8vbj",
                            "firstName": "Ran",
                            "lastName": "Ding",
                            "primaryAddress": {
                                "ID": "portal:Address-1",
                                "city": "SYDNEY",
                                "state": "AU_NSW",
                                "postalCode": "2000",
                                "addressLine1": ""
                            },
                            "dateOfBirth": "1990-03-02",
                            "gender": "M",
                            "emailAddress1": "test@test.com"
                        },
                        "licenceType": "full",
                        "noClaimBonus": "rating_1",
                        "previousInsurer": "none",
                        "yearsLicenced": 3
                    },
                    "driverUsage": "main"
                }
            ],
            "originalOwner": true,
            "coverType": "comprehensive",
            "excess": {
                "voluntaryVehicleExcess": 0
            },
            "sumInsuredType": "market"
        }
    ]
};

var path = require('path');
var expect = require('chai').expect;
var _ = require('lodash');
var fs = require('fs-extra');

var swagger = require('./swagger.json');
var swaggerModel = require('./../generator');
var swaggerModelRuntime = require('./../runtime');

var root = path.resolve(__dirname);
var outPath = path.join(root, 'out');
var basePath = path.join(outPath, 'base');

describe('Swagger runtime', function () {
    describe('normal mode', function () {
        before(function () {
            fs.remove(outPath);
            fs.mkdirpSync(outPath);

            swaggerModel.generate(swagger, outPath);

            // Add Classes
            _.each(fs.readdirSync(outPath), function (fileName) {
                if (fileName.endsWith('.js')) {
                    var filePath = path.join(outPath, fileName);

                    // Include files
                    swaggerModelRuntime.register(require(filePath));
                }
            });

            // Add Base class
            swaggerModelRuntime.register(require(path.join(basePath, 'ModelBase.js')));
        });

        it('should convert json to model then convert back', function () {
            var model = swaggerModelRuntime.json2Model(test, 'QPMQuoteData');
            var json = swaggerModelRuntime.model2Json(model);

            expect(json).to.deep.equal(test);
        });

        it('should valid mandatory fields when convert json to model', function () {
            try {
                swaggerModelRuntime.json2Model({}, 'Address');
            } catch (e) {
                expect(e.message).to.match(/addressLine1,city,state,postalCode/);
            }

            var model = swaggerModelRuntime.json2Model({
                addressLine1: '',
                city: '',
                state: '',
                postalCode: ''
            }, 'Address');

            expect(model).to.be.ok;
        });

        it('should valid mandatory fields when convert model to json', function () {
            var Address = swaggerModelRuntime.get('Address');
            var model = new Address();

            try {
                swaggerModelRuntime.model2Json(model);
            } catch (e) {
                expect(e.message).to.match(/addressLine1,city,state,postalCode/);
            }

            model.addressLine1 = '';
            model.city = '';
            model.state = '';
            model.postalCode = '';
            var json = swaggerModelRuntime.model2Json(model);

            expect(json).to.be.ok;
        });

        it('should reuse instance if IDs are same', function () {
            var options = {objectID: 'ID'};
            var model = swaggerModelRuntime.json2Model(test, 'QPMQuoteData', options);

            expect(model.account.accountHolder.primaryAddress).to.equal(model.vehicles[0].drivers[0].driver.person.primaryAddress);
            expect(model.account.accountHolder.primaryAddress).to.not.equal(model.vehicles[0].garageAddress);

            // Test they are sharing same object
            model.account.accountHolder.primaryAddress.addressLine1 = 'test';
            expect(model.vehicles[0].drivers[0].driver.person.primaryAddress.addressLine1).to.equal('test');
            expect(model.vehicles[0].garageAddress.addressLine1).to.not.equal('test');
        });

        it('should get all classes', function () {
            expect(Object.keys(swaggerModelRuntime.get())).to.be.length(Object.keys(swagger.definitions).length + 1);
        });

        it('should process date, date-time and time json to model', function () {
            var dateTime = new Date(2014, 11, 5, 6, 10, 20);
            var dateTimeInString = '2014-12-04T19:10:20.000Z';

            var date = new Date(2014, 11, 5);
            var dateInString = '2014-12-05';

            var testJson = {
                date: date,
                dateInString: dateInString,
                time: dateTime,
                dateTime: dateTime,
                dateTimeInString: dateTimeInString
            };

            var model = swaggerModelRuntime.json2Model(testJson, 'DateTime');

            expect(+model.date).to.be.equal(+date);
            expect(+model.dateInString).to.be.equal(+date);
            expect(+model.time).to.be.equal(+dateTime);
            expect(+model.dateTime).to.be.equal(+dateTime);
            expect(+model.dateTimeInString).to.be.equal(+new Date(dateTimeInString));
        });

        it('should process date, date-time and time model to json', function () {
            var dateTimeObj = new Date(2014, 1, 2, 3, 4, 5);
            var dateObj = new Date(2014, 11, 5);

            var DateTime = swaggerModelRuntime.get('DateTime');
            var dateTime = new DateTime();

            dateTime.date = dateObj;
            dateTime.time = dateTimeObj;
            dateTime.dateTime = dateTimeObj;

            var json = swaggerModelRuntime.model2Json(dateTime);

            expect(json.date).to.be.equal('2014-12-05');
            expect(json.time).to.be.equal(JSON.stringify(dateTimeObj).replace(/"/g, ''));
            expect(json.dateTime).to.be.equal(JSON.stringify(dateTimeObj).replace(/"/g, ''));
        });

        it('should clone', function () {
            var modelA = swaggerModelRuntime.json2Model(test, 'QPMQuoteData');
            var modelB = swaggerModelRuntime.clone(modelA);

            expect(modelB).to.be.deep.equal(modelA);
        });

        it('should report missing property when converting json to model', function () {
            var json = {
                propertyNotInDefinition: 1,
                anotherProperty: 1
            };

            expect(function () {
                swaggerModelRuntime.json2Model(json, 'QPMQuoteData');
            }).to.throw(/propertyNotInDefinition|anotherProperty/i);
        });

        it('should return if given object is not swagger model', function () {
            var model = {};

            expect(swaggerModelRuntime.model2Json(model)).to.be.equal(model);
        });

        it('should not keep property that is empty', function () {
            var Address = swaggerModelRuntime.get('Address');
            var address = new Address();

            var QuoteList = swaggerModelRuntime.get('QuoteListQPMQuoteData');
            var QPMQuoteData = swaggerModelRuntime.get('QPMQuoteData');
            var quoteList = new QuoteList();
            var quoteList2 = new QuoteList();
            quoteList2.results.push(new QPMQuoteData());


            expect(swaggerModelRuntime.model2Json(address)).to.be.deep.equal({});
            expect(swaggerModelRuntime.model2Json(quoteList)).to.be.deep.equal({});
            expect(swaggerModelRuntime.model2Json(quoteList2)).to.be.deep.equal({results: []});
        });

        it('should erport error if not specify root class name', function () {
            var func = function () {
                swaggerModelRuntime.json2Model({});
            };

            expect(func).to.throw(/root class name/i);
        });

        it('should ignore undefined object when convert', function () {
            var func = function () {
                swaggerModelRuntime.json2Model({primaryAddress: undefined}, 'Person');
            };

            expect(func).to.not.throw(Error);
        });

        it('should handle timezone in model to json', function () {
            var DateTime = swaggerModelRuntime.get('DateTime');

            var sydneyDate = new Date('2014-12-04T19:10:00.000Z'); // Friday, 5 December 2014 at 6:10:00 AM Sydney
            var sydneyDateInString = '2014-12-05';
            var nycDate = new Date('2014-12-05T11:10:00.000Z'); // Friday, 5 December 2014 at 6:10:00 AM NYC
            var nycDateInString = '2014-12-05';
            var delhiDate = new Date('2014-12-05T16:40:00.000Z'); // Friday, 5 December 2014 at 22:10:00 AM New Delhi
            var delhiDateInString = '2014-12-05';

            var dateTime = new DateTime();
            var dateTime2 = new DateTime();
            var dateTime3 = new DateTime();
            dateTime.date = sydneyDate;
            dateTime.dateInString = sydneyDateInString;
            dateTime2.date = nycDate;
            dateTime2.dateInString = nycDateInString;
            dateTime3.date = delhiDate;
            dateTime3.dateInString = delhiDateInString;

            var json = swaggerModelRuntime.model2Json(dateTime, {
                modelTimezone: 'Australia/Sydney',
                jsonTimezone: 'America/New_York'
            });
            var json2 = swaggerModelRuntime.model2Json(dateTime2, {
                modelTimezone: 'America/New_York',
                jsonTimezone: 'Asia/Shanghai'
            });
            var json3 = swaggerModelRuntime.model2Json(dateTime3, {
                modelTimezone: 'Asia/Delhi',
                jsonTimezone: 'Australia/Sydney'
            });

            expect(json.date).to.be.equal('2014-12-04');
            expect(json.dateInString).to.be.equal('2014-12-05'); // If there is no time info, keeps original
            expect(json2.date).to.be.equal('2014-12-05');
            expect(json2.dateInString).to.be.equal('2014-12-05'); // If there is no time info, keeps original
            expect(json3.date).to.be.equal('2014-12-06');
            expect(json3.dateInString).to.be.equal('2014-12-05'); // If there is no time info, keeps original
        });

        it('should set option', function () {
            var DateTime = swaggerModelRuntime.get('DateTime');

            var sydneyDate = new Date('2014-12-04T19:10:00.000Z'); // Friday, 5 December 2014 at 6:10:00 AM Sydney
            var sydneyDateInString = '2014-12-05';
            var nycDate = new Date('2014-12-05T11:10:00.000Z'); // Friday, 5 December 2014 at 6:10:00 AM NYC
            var nycDateInString = '2014-12-05';
            var delhiDate = new Date('2014-12-05T16:40:00.000Z'); // Friday, 5 December 2014 at 22:10:00 AM New Delhi
            var delhiDateInString = '2014-12-05';

            var dateTime = new DateTime();
            var dateTime2 = new DateTime();
            var dateTime3 = new DateTime();
            dateTime.date = sydneyDate;
            dateTime.dateInString = sydneyDateInString;
            dateTime2.date = nycDate;
            dateTime2.dateInString = nycDateInString;
            dateTime3.date = delhiDate;
            dateTime3.dateInString = delhiDateInString;

            swaggerModelRuntime.setOptions({
                modelTimezone: 'Australia/Sydney',
                jsonTimezone: 'America/New_York'
            });
            var json = swaggerModelRuntime.model2Json(dateTime);

            swaggerModelRuntime.setOptions({
                modelTimezone: 'America/New_York',
                jsonTimezone: 'Asia/Shanghai'
            });
            var json2 = swaggerModelRuntime.model2Json(dateTime2);

            swaggerModelRuntime.setOptions({
                modelTimezone: 'Asia/Delhi',
                jsonTimezone: 'Australia/Sydney'
            });
            var json3 = swaggerModelRuntime.model2Json(dateTime3);

            expect(json.date).to.be.equal('2014-12-04');
            expect(json.dateInString).to.be.equal('2014-12-05'); // If there is no time info, keeps original
            expect(json2.date).to.be.equal('2014-12-05');
            expect(json2.dateInString).to.be.equal('2014-12-05'); // If there is no time info, keeps original
            expect(json3.date).to.be.equal('2014-12-06');
            expect(json3.dateInString).to.be.equal('2014-12-05'); // If there is no time info, keeps original
        });

        it('should support Object type to json', function () {
            var ObjectNestedTest = swaggerModelRuntime.get('ObjectNestedTest');
            var ObjectTest = swaggerModelRuntime.get('ObjectTest');


            var objectNested = new ObjectNestedTest();

            var object1 = new ObjectTest();
            object1.object = 123;
            object1.objectArray.push(123);
            object1.objectArray.push('123');
            object1.objectArray.push(true);
            objectNested.objects.push(object1);


            var object2 = new ObjectTest();
            object2.object = '567';
            object2.objectArray.push(567);
            object2.objectArray.push('890');
            object2.objectArray.push(false);
            objectNested.objects.push(object2);

            var json = swaggerModelRuntime.model2Json(objectNested);
            expect(json.objects).to.be.deep.equal([
                {object: 123, objectArray: [123, '123', true]},
                {object: '567', objectArray: [567, '890', false]}
            ]);
        });

        it('should support json to Object type', function () {
            var json = {
                objects: [
                    {object: 123, objectArray: [123, '123', true]},
                    {object: '567', objectArray: [567, '890', false]}
                ]
            };
            var object = swaggerModelRuntime.json2Model(json, 'ObjectNestedTest');

            expect(object.objects[0].object).to.be.equal(123);
            expect(object.objects[0].objectArray).to.be.deep.equal([123, '123', true]);
            expect(object.objects[1].object).to.be.equal('567');
            expect(object.objects[1].objectArray).to.be.deep.equal([567, '890', false]);
        });

        it('should generate field with specified default value', function () {
            var contactType1 = new (swaggerModelRuntime.get('ContactType1'))();
            var contactType2 = new (swaggerModelRuntime.get('ContactType2'))();

            expect(contactType1.stringField).to.be.equal('contactType1');
            expect(contactType1.numberField).to.be.equal(123.45);
            expect(contactType1.booleanField).to.be.equal(true);
            expect(contactType2.stringField).to.be.equal('contactType2');
            expect(contactType2.numberField).to.be.equal(56789);
            expect(contactType2.booleanField).to.be.equal(false);
        });

        it('should allow field with specified default value to change', function () {
            var contactType1 = new (swaggerModelRuntime.get('ContactType1'))();
            var contactType2 = new (swaggerModelRuntime.get('ContactType2'))();

            contactType1.stringField = 1;
            contactType1.numberField = 1;
            contactType1.booleanField = 1;

            contactType2.stringField = 1;
            contactType2.numberField = 1;
            contactType2.booleanField = 1;

            expect(contactType1.stringField).to.be.equal('contactType1');
            expect(contactType1.numberField).to.be.equal(123.45);
            expect(contactType1.booleanField).to.be.equal(true);
            expect(contactType2.stringField).to.be.equal('contactType2');
            expect(contactType2.numberField).to.be.equal(56789);
            expect(contactType2.booleanField).to.be.equal(false);
        });

        it('should allow assign to generic type field', function () {
            var genericTest = new (swaggerModelRuntime.get('GenericTest'))();
            var contactType1 = new (swaggerModelRuntime.get('ContactType1'))();
            var contactType2 = new (swaggerModelRuntime.get('ContactType2'))();

            expect(genericTest.contact.constructor.name).to.be.equal('Contact');

            genericTest.contact = contactType1;
            expect(genericTest.contact.constructor.name).to.be.equal('ContactType1');

            genericTest.contact = contactType2;
            expect(genericTest.contact.constructor.name).to.be.equal('ContactType2');
        });

        it('should be able to convert to json for generic type', function () {
            var genericTest1 = new (swaggerModelRuntime.get('GenericTest'))();
            var genericTest2 = new (swaggerModelRuntime.get('GenericTest'))();
            var contactType1 = new (swaggerModelRuntime.get('ContactType1'))();
            var contactType2 = new (swaggerModelRuntime.get('ContactType2'))();

            genericTest1.contact = contactType1;
            genericTest1.contact.contactType1Field = '1';

            genericTest2.contact = contactType2;
            genericTest2.contact.contactType2Field = '2';

            var genericTest1Json = swaggerModelRuntime.model2Json(genericTest1);
            var genericTest2Json = swaggerModelRuntime.model2Json(genericTest2);

            expect(genericTest1Json.contact.contactType1Field).to.be.equal('1');
            expect(genericTest2Json.contact.contactType2Field).to.be.equal('2');
        });

        it('should be able to convert from json for generic type', function () {
            var genericTest1Json = {
                contact: {
                    stringField: 'contactType1',
                    numberField: 123,
                    booleanField: true,
                    contactType1Field: 'test1'
                }
            };

            var genericTest2Json = {
                contact: {
                    stringField: 'contactType2',
                    numberField: 123,
                    booleanField: true,
                    contactType2Field: 'test2'
                }
            };

            var genericTest1 = swaggerModelRuntime.json2Model(genericTest1Json, 'GenericTest');
            var genericTest2 = swaggerModelRuntime.json2Model(genericTest2Json, 'GenericTest');

            expect(genericTest1.contact.constructor.name).to.be.equal('ContactType1');
            expect(genericTest1.contact.contactType1Field).to.be.equal('test1');
            expect(genericTest1.contact.contactType2Field).to.be.equal(undefined);

            expect(genericTest2.contact.constructor.name).to.be.equal('ContactType2');
            expect(genericTest2.contact.contactType1Field).to.be.equal(undefined);
            expect(genericTest2.contact.contactType2Field).to.be.equal('test2');
        });

        it('should report error if subTypeProperty is missing', function () {
            var func = function () {
                swaggerModelRuntime.json2Model({contact: {}}, 'GenericTest');
            };

            expect(func).to.throw(/Can not determine subtype/);
        });

        it('should generate read meta', function () {
            var ReadOnly = swaggerModelRuntime.get('ReadOnly');
            expect(ReadOnly._readonly).to.be.deep.equal(['readonlyField']);
        });
    });

    describe('enforceReadOnly mode', function () {
        before(function () {
            fs.remove(outPath);
            fs.mkdirpSync(outPath);

            swaggerModel.generate(swagger, outPath, { enforceReadOnly: true });

            // Add Classes
            _.each(fs.readdirSync(outPath), function (fileName) {
                if (fileName.endsWith('.js')) {
                    var filePath = path.join(outPath, fileName);

                    // Include files
                    swaggerModelRuntime.register(require(filePath));
                }
            });

            // Add Base class
            swaggerModelRuntime.register(require(path.join(basePath, 'ModelBase.js')));
        });

        it('should support read only field', function () {
            var json = {
                'readonlyField': 'test'
            };
            var readOnlyInstance = swaggerModelRuntime.json2Model(json, 'ReadOnly');
            expect(readOnlyInstance.readonlyField).to.be.equal('test');

            readOnlyInstance.readonlyField = 'test2';
            expect(readOnlyInstance.readonlyField).to.be.equal('test');
        });
    });
});