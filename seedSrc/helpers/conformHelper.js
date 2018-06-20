
module.exports = {
    doesFullyConform : function(object, schema) {
        let objectKeys = Object.keys(object);
        let schemaKeys = Object.keys(schema);
    
        // Object and Schema must be the same length
        if (objectKeys.length < schemaKeys.length) {
            return false;
        }
    
        for(let i = 0; i < schemaKeys.length; i++) {
            // The value of object.key must match the type in schema
            if (typeof object[schemaKeys[i]] != schema[schemaKeys[i]]) {
                return false;
            }
        }
        return true;
    },
    getFunctionArgs : function(func) {
        // First match everything inside the function argument parens.
        var args = func.toString().match(/function\s.*?\(([^)]*)\)/)[1];

        // Split the arguments string into an array comma delimited.
        return args.split(',').map(function(arg) {
            // Ensure no inline comments are parsed and trim the whitespace.
            return arg.replace(/\/\*.*\*\//, '').trim();
        }).filter(function(arg) {
            // Ensure no undefined values are added.
            return arg;
        });
    },
    deepCopy : function(obj) {
        let finalCopy = {};
        let copyObject = (o) => {
            let copy = {};
            let keys = Object.keys(o);
            for (let i = 0; i < keys.length; i++) {
                if (typeof o[keys[i]] === 'object')
                    copy[keys[i]] = copyObject(o[keys[i]]);
                else
                    copy[keys[i]] = o[keys[i]];
            }
            return copy;
        }
        finalCopy = copyObject(obj);
        return finalCopy;
    }
 }