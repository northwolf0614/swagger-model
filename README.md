# Swagger Model

[![Build Status](https://travis-ci.org/randing89/swagger-model.svg?branch=master)](https://travis-ci.org/randing89/swagger-model)
[![Coverage Status](https://coveralls.io/repos/randing89/swagger-model/badge.svg?branch=master)](https://coveralls.io/r/randing89/swagger-model?branch=master)
[![Dependency Status](https://gemnasium.com/randing89/swagger-model.svg)](https://gemnasium.com/randing89/swagger-model)

# Installation
`npm install swagger-model --save-dev` (for class file generation)

`bower install swagger-model` (for runtime)

# Usage
## Compile time (generator.js)
### generate(swaggerDefinition, templatePath, outPath)
Generate Javascript class files from swagger definition
- swaggerDefinition: JSON of Swagger definition
- templatePath: Path of language template
- outPath: Output path


## Runtime (runtime.js)
### register(className, definition) or register(definition)
Register a swagger model class
- className String of class name
- definition Constractor function of a model class

### json2Model(object, className)
Build model instance from JSON object
- object A JSON object
- className The model class name you are mapping to

### model2Json(object)
Build JSON object from model instance
- object Model object


# Test
```
npm test
```
