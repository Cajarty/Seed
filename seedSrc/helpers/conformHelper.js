
module.exports = {
    doesFullyConform : function(object, schema) {
        let objectKeys = Object.keys(object);
        let schemaKeys = Object.keys(schema);
    
        // Object and Schema must be the same length
        if (objectKeys.length < schemaKeys.length) {
            console.info("doesNOTConform", "not enough keys", object, schema);
            return false;
        }
    
        for(let i = 0; i < schemaKeys; i++) {
            // The value of object.key must match the type in schema
            if (typeof object[schemaKeys[i]] != schema[schemaKeys[i]]) {
                console.info("doesNOTConform", "differing keys", object, schema);
                return false;
            }
        }
    
        console.info("doesFullyConform", object, schema);
        return true;
    }
 }