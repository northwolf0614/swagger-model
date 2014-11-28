var test = {
    "account": {
        "accountHolder": {
            "dateOfBirth": "2014-11-27T23:15:41.394Z",
            "emailAddress1": "string",
            "firstName": "string",
            "gender": "string",
            "lastName": "string",
            "primaryAddress": {
                "addressLine1": "string",
                "addressLine2": "string",
                "addressLine3": "string",
                "addressType": "string",
                "city": "string",
                "postalCode": "string",
                "publicID": "string",
                "state": "string"
            },
            "publicID": "string"
        },
        "accountNumber": "string",
        "accountPublicID": "string"
    },
    "anyClaimsQuestion": "string",
    "anyConvictionsQuestion": "string",
    "anyInfringementsQuestion": "string",
    "anyLostLicencesQuestion": "string",
    "paymentPlans": [
        {
            "billingID": "string",
            "downPayment": 0,
            "installment": 0,
            "name": "string",
            "numberOfPayments": 0,
            "selected": true,
            "total": 0
        }
    ],
    "periodStartDate": "2014-11-27T23:15:41.394Z",
    "quoteID": "string",
    "quoteResult": {
        "decline": true,
        "premiumAfterDiscount": 0,
        "referral": true,
        "totalFSL": 0,
        "totalGST": 0,
        "totalPremium": 0,
        "totalStampDuty": 0
    },
    "vehicles": [
        {
            "afterMarketModifications": true,
            "businessUsage": "string",
            "colour": "string",
            "coverType": "string",
            "coverageOption": {
                "excessFreeWindscreen": true,
                "hireCarAfterAccident": true,
                "lifetimeNCBProtection": true,
                "nCBProtection": true
            },
            "drivers": [
                {
                    "driver": {
                        "driverHistory": [
                            {
                                "markedForDelete": true,
                                "pattern": {
                                    "code": "string",
                                    "description": "string",
                                    "filter1": "string",
                                    "name": "string",
                                    "publicID": "string"
                                },
                                "publicID": "string",
                                "year": 0
                            }
                        ],
                        "licenceType": "string",
                        "noClaimBonus": "string",
                        "previousInsurer": "string",
                        "publicID": "string",
                        "yearsLicenced": "string"
                    },
                    "driverUsage": "string",
                    "markedForDelete": true,
                    "publicID": "string"
                }
            ],
            "excess": {
                "standardVehicleExcess": 0,
                "voluntaryVehicleExcess": 0,
                "voluntaryVehicleExcessOptions": [
                    0
                ]
            },
            "financeType": "string",
            "garageType": "string",
            "licenceState": "string",
            "licenseNumber": "string",
            "make": "string",
            "markedForDelete": true,
            "model": "string",
            "modelYear": 0,
            "originalOwner": true,
            "primaryUsage": "string",
            "publicID": "string",
            "purchaseDate": "2014-11-27T23:15:41.394Z",
            "purchasePrice": 0,
            "recentPurchase": true,
            "redbookID": "string",
            "sumInsuredAmount": 0,
            "sumInsuredType": "string",
            "unrepairedDamage": "string"
        }
    ]
};

var path = require('path');
var expect = require('chai').expect;

var swagger = require('./swagger.json');
var swaggerModel = require('./index');


describe('Swagger to model', function () {
   it('should convert json to model then convert back', function () {
       var root = path.resolve(__dirname);
       var templatePath = path.join(root, 'template');
       var outPath = path.join(root, 'out');

       swaggerModel.generate(swagger, templatePath, outPath);
       swaggerModel.loadClasses(outPath);

       var model = swaggerModel.json2Model(test, 'QPMQuoteData');
       var json = swaggerModel.model2Json(model);

       expect(json).to.deep.equal(test);
   });
});