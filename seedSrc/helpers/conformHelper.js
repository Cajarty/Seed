/********************
 * conformHelper.js *
 ********************
 * 
 * Exports functions focused around data conforming to certain schemas or analyzing objects/functions.
 * 
 * Exported Functions:
 *      doesFunnyConform(object, schema)
 *          - Confirms that an object has the appropriate variables found in the schema
 *          - e.g. object { a : 10, b : "Hello", c : {} } and schema { a : "number", b : "string", c : "object" } are true
 *      getFunctionArgs(func)
 *          - Returns the arguments for the passed in function as an array
 *          - e.g. function(a,b,c){} returns the parameters ["a","b","c"]
 *      deepCopy(obj)
 *          - Returns a deep copy/clone of the object passed in, done recursively by copying fully by value rather than by reference.
 *          - e.g. { a : { b : { c : 5 } } } would return a new object that matches it fully, however modifying the new object wont affect the old one
 */

module.exports = {
    /**
     * Confirms that an object has the appropriate variables found in the schema
     * 
     * e.g. object { a : 10, b : "Hello", c : {} } and schema { a : "number", b : "string", c : "object" } are true
     * 
     * @param {object} - JSON object to check the depth-1 values of to confirm it matches the schema
     * @param {object} - JSON object representing the schema to patch, where the keys match the object to check and the values are the string name of the values
     * 
     * @return {bool} - Returns true or false depending on whether the object matches the schema at a shallow level
     */
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
    /**
     * Returns the arguments for the passed in function as an array
     * 
     * e.g. function(a,b,c){} returns the parameters ["a","b","c"]
     * 
     * @param {object} - Function that has parameters we are searching for
     * 
     * @return {array} - Array of parameters from the passed in function
     */
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
    /**
     * Returns a deep copy/clone of the object passed in, done recursively by copying fully by value rather than by reference.
     * 
     * e.g. { a : { b : { c : 5 } } } would return a new object that matches it fully, however modifying the new object wont affect the old one
     * 
     * @param {object} - Object we are copying
     * 
     * @return {object} - Deep-copy of the object passed in
     */
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
    },
    /**
     * Gives options (or other shallow object) with default values where otherwise undefined
     * 
     * e.g. object { a : 10, b : "z" }, defaultValues { a : 5, b : "b", c : -1 }
     *      - object becomes { a : 10, b : "z", c : -1 }
     * 
     * @param {*} object - Object to modify and give default values to
     * @param {*} defaultValues - Object to grab the default values from
     */
    defaults(options, defaultValues) {
        let keys = defaultValues.keys;
        for(let i = 0; i < keys.length; i++) {
            if (object[keys[i]] == undefined) {
                object[keys[i]] = defaultValues[keys[i]];
            }
        }
    }
 }