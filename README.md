# Swagger Model

Generate Javascript model class code from swagger definition and convert between JSON and model instance

[![Build Status](https://travis-ci.org/randing89/swagger-model.svg?branch=master)](https://travis-ci.org/randing89/swagger-model)
[![Coverage Status](https://coveralls.io/repos/randing89/swagger-model/badge.svg?branch=master)](https://coveralls.io/r/randing89/swagger-model?branch=master)
[![Dependency Status](https://gemnasium.com/randing89/swagger-model.svg)](https://gemnasium.com/randing89/swagger-model)

# Installation
`npm install swagger-model --save-dev` (for class file generation)

`bower install swagger-model` (for runtime)

# Usage
## Compile time (generator.js)
### generate(swaggerDefinition, outPath | option)
Generate Javascript class files from swagger definition
- swaggerDefinition: JSON of Swagger definition
- outPath: Output path string OR option: Detailed options
```javascript
  option: {
    outPath: 'Output path',
    filters: [
      'Array of regular expression strings, generate if class name matches the regexp. eg: "^includeThisClass$"'
      'Skip class if class name matches expression begins with `!`.  eg: "!^skipThisClass$'"]
  }
```


## Runtime (runtime.js)
### register(className, definition) or register(definition)
Register a swagger model class
- className: String of class name
- definition: Constractor function of a model class

### isRegistered(className)
Check if a model class has been registered

### json2Model(object, className, [options])
Build model instance from JSON object
- object: A JSON object
- className: The model class name you are mapping to
- options:
```javascript
{
    // Specify property name of the objectID
    // Json with same objectID will share same object in model instance
    objectID: 'ID'
}
```

### model2Json(object)
Build JSON object from model instance
- object: Model object

### isModel(object)
Determine if object is a model instance

### clone(object)
Make deep clone of a model instance


# Test
```
npm test
```
