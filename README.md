# Swagger Model

## generate(swaggerDefinition, templatePath, outPath)
Generate Javascript class files from swagger definition
- swaggerDefinition: JSON of Swagger definition
- templatePath: Path of language template
- outPath: Output path

## loadClasses()
Load JavaScript class into memory

## json2Model(object, className)
Build model instance from JSON object
- object JSON object, it can be either Swagger request or response object
- className JSON object type

## model2Json(object)
Build JSON object from model instance
- object Model object