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

describe('Swagger to model', function () {
    before(function () {
        fs.remove(outPath);
    });

    beforeEach(function () {
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

    it('should valid mandatory fields when convert json to model', function() {
        try {
            swaggerModelRuntime.json2Model({}, 'Address');
        } catch (e) {
            expect(e.message).to.match(/addressLine1,city,state,postalCode/);
        }

        var model = swaggerModelRuntime.json2Model({ addressLine1: '', city: '', state: '', postalCode: '' }, 'Address');

        expect(model).to.be.ok;
    });

    it('should valid mandatory fields when convert model to json', function() {
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
        var options = { objectID: 'ID' };
        var model = swaggerModelRuntime.json2Model(test, 'QPMQuoteData', options);

        expect(model.account.accountHolder.primaryAddress).to.equal(model.vehicles[0].drivers[0].driver.person.primaryAddress);
        expect(model.account.accountHolder.primaryAddress).to.not.equal(model.vehicles[0].garageAddress);

        // Test they are sharing same object
        model.account.accountHolder.primaryAddress.addressLine1 = 'test';
        expect(model.vehicles[0].drivers[0].driver.person.primaryAddress.addressLine1).to.equal('test');
        expect(model.vehicles[0].garageAddress.addressLine1).to.not.equal('test');
    });

    it('should clone', function () {
        var modelA = swaggerModelRuntime.json2Model(test, 'QPMQuoteData');
        var modelB = swaggerModelRuntime.clone(modelA);

        expect(modelB).to.be.deep.equal(modelA);
    });
});