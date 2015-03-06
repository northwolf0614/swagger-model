var path = require('path');
var expect = require('chai').expect;
var fs = require('fs-extra');

var swagger = require('./swagger.json');
var swaggerModel = require('./../generator');

var root = path.resolve(__dirname);
var outPath = path.join(root, 'out');

describe('Swagger generator', function () {
    beforeEach(function () {
        fs.remove(outPath);
        fs.mkdirpSync(outPath);
    });

    it('should generate', function () {
        // Generate
        swaggerModel.generate(swagger, outPath);

        // Should generate a file for each class in definiitions plus a ModelBase.js
        expect(fs.readdirSync(path.join(outPath, 'base'))).to.have.length(Object.keys(swagger.definitions).length + 1);
    });

    it('should filter output', function () {
       var option = {
           outPath: outPath,
           filters: [
               '^portal\\.suite\\.dto'
           ]
       };

       // Generate
       swaggerModel.generate(swagger, option);

       expect(fs.readdirSync(path.join(outPath, 'base'))).to.be.deep.equal([
           'ModelBase.js',
           'ReferenceDataDrivingHistoryEventPattern_ExtBase.js',
           'ReferenceDataFinanceCompany_ExtBase.js'
       ]);
    });

    it('should filter multiple', function () {
        var option = {
            outPath: outPath,
            filters: [
                '^portal\\.suite\\.dto',
                'QPMVehicleDTO'
            ]
        };

        // Generate
        swaggerModel.generate(swagger, option);

        expect(fs.readdirSync(path.join(outPath, 'base'))).to.be.deep.equal([
            'ModelBase.js',
            'QPMVehicleBase.js',
            'ReferenceDataDrivingHistoryEventPattern_ExtBase.js',
            'ReferenceDataFinanceCompany_ExtBase.js'
        ]);
    });

    it('should filter exclude', function () {
        var option = {
            outPath: outPath,
            filters: [
                '^portal\\.suite\\.dto',
                'QPMVehicleDTO',
                '!QPMVehicleDTO',
                '!FinanceCompany'
            ]
        };

        // Generate
        swaggerModel.generate(swagger, option);

        expect(fs.readdirSync(path.join(outPath, 'base'))).to.be.deep.equal([
            'ModelBase.js',
            'ReferenceDataDrivingHistoryEventPattern_ExtBase.js'
        ]);
    })
});