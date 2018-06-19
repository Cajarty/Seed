module.exports = {
    createChangeContext: function(user) {
       return new ChangeContext(user);
    }
 }

const routes  = { 
    MODULE_BASIC : "moduleBasic",
    MODULE_DEEP : "moduleDeep",
    USER_BASIC : "userBasic",
    USER_DEEP : "userDeep"
}

class ChangeContext {
    constructor(user) {
        this.moduleData = {};
        this.userData = {};
        this.user = user;
    }

    /* 
        ##############################################
        ### Functions Used To Modify ChangeContext ###
        ##############################################
    */

    /**
     * Used internally for routing between "module vs user" data and "basic vs deep" data
     * 
     * Options can contain user to determine if its for user data or module data
     * Key vs InnerKey+OuterKey to determine if its for basic data or deep data
     * 
     * @param {*} options - Options used to determine routing
     */
    routeOption(options) {
        let forBasicData = options.key != undefined;
        let forUserData = options.user != undefined;
        let forDeepData = options.innerKey != undefined && options.outerKey != undefined;

        //If user data
        if (forUserData) {
            //If it's for basic data
            if (forBasicData) {
                return routes.USER_BASIC;
            } 
            //if its for deep data
            else if (forDeepData) {
                return routes.USER_DEEP;
            }
        } 
        //If module data
        else {
            //If it's for basic data
            if (forBasicData) {
                return routes.MODULE_BASIC;
            } 
            //if its for deep data
            else if (forDeepData) {
                return routes.MODULE_DEEP;
            }
        }
    }

    /**
     * 
     * Subtracts data from the changeset using various options
     * 
     * e.g's:
     *      subtract(10, { user : "0xABC", key : "balance" })
     *          Seed.0xABC.balance -= 10
     *      subtract(10, { user : "0xABC", outerKey : "allowance", innerKey : "0xDEF" })
     *          Seed.0xABC.allowance.0xDEF -= 10
     *      subtract(10, { key : "totalSupply" })
     *          Seed.totalSupply -= 10
     *      subtract(10, { outerKey : "population", innerKey : "falador" })
     *          Game.population.falador -= 10
     * 
     * 
     * @param {*} amount - Amount to subtract
     * @param {*} options - The options determining which piece of data to subtract from
     */
    subtract(amount, options) {
        switch(this.routeOption(options)) {
            case routes.MODULE_BASIC:
                this.subtractFromModuleData(amount, options);
                break;
            case routes.MODULE_DEEP:
                this.subtractFromModuleDataDeep(amount, options);
                break;
            case routes.USER_BASIC:
                this.subtractFromUserData(amount, options);
                break;
            case routes.USER_DEEP:
                this.subtractFromUserDataDeep(amount, options);
                break;
        }
        console.log("subtract", amount, options);
    }

    /**
     * Subtract moduleData[key] by amount
     * 
     * e.g. Seed.totalSupply -= amount
     * 
     * @param {number} amount - Amount to subtract
     * @param {*} options.key - Key in moduleData to subtract from
     */ 
    subtractFromModuleData(amount, options) {
        console.info("Subtract", "Seed.totalSupply -= amount");
        this.ensureModuleDataCreated(options.key, "number");
        this.moduleData[options.key] -= amount;
    }

    /**
     * Subtract moduleData[outerKey][innerKey] by amount
     * 
     * e.g. Game.population.falador -= amount
     * 
     * @param {number} amount - Amount to subtract
     * @param {*} options.outerKey - Key in moduleData to subtract from
     * @param {*} options.innerKey - Key in moduleData to subtract from
     */ 
    subtractFromModuleDataDeep(amount, options) {
        console.info("Subtract", "Seed.totalSupply -= amount");
        this.ensureModuleInnerDataCreated(options.outerKey, options.innerKey, "number");
        this.moduleData[options.outerKey][options.innerKey] -= amount;
    }

    /**
     * Subtract userData[key] by amount
     * 
     * e.g. Seed.0xABC.balance -= amount
     * 
     * @param {number} amount - Amount to subtract
     * @param {string} options.user - User to subtract the amount from
     * @param {*} options.key - Key in userData to subtract from
     */ 
    subtractFromUserData(amount, options) {
        console.info("Subtract", "Seed.0xABC.balance -= amount", this);
        this.ensureUserDataCreated(options.user, options.key, "number");
        this.userData[options.user][options.key] -= amount;
    }

    /**
     * Subtract userData[outerKey][innerKey] by amount
     * 
     * e.g. Seed.0xABC.allowance.0xDEF -= amount
     * 
     * @param {number} amount - Amount to subtract
     * @param {string} options.user - User to subtract the amount from
     * @param {*} options.outerKey - Key to mapping in userData that has the value to subtract from
     * @param {*} options.innerKey - Key in in userData.outerKey to subtract from
     */ 
    subtractFromUserDataDeep(amount, options) {
        console.info("Subtract", "Seed.0xABC.allowance.0xDEF -= amount", options.user, options.outerKey, options.innerKey, amount);
        this.ensureUserInnerDataCreated(options.user, options.outerKey, options.innerKey, "number");
        this.userData[options.user][options.outerKey][options.innerKey] -= amount;
    }

    /* 
        #######################################
        ### To Ensure Proper Data Structure ###
        #######################################
    */

    /**
     * Gets the default value for a given type
     * 
     * @param {*} type 
     */
    getDefault(type) {
        let defaultValue = null;
        switch(type) {
            case "number":
                defaultValue = 0;
                break;
            case "string":
                defaultValue = "";
                break;
            case "object":
                defaultValue = {};
                break;
        }
        return defaultValue;
    }

    /**
     * Ensure "key" exists in module data
     * 
     * e.g. Seed.totalSupply exists, if not, default it to the int value 0
     * 
     * @param key - Key in moduleData
     * @param type - Variable type the data is supposed to be
     */ 
    ensureModuleDataCreated(key, type) {
        if (this.moduleData[key] == undefined) {
            this.moduleData[key] = this.getDefault(type);
        }
    }

    /**
     * Ensure "innerKey" exists in moduleData.outerKey
     * 
     * e.g. Game.population.falador exists, if not, default it to the int value 0
     * 
     * @param key - Key in moduleData
     * @param type - Variable type the data is supposed to be
     */ 
    ensureModuleInnerDataCreated(outerKey, innerKey, type) {
        if (this.moduleData[outerKey] == undefined) {
            this.moduleData[outerKey] = {};
        }
        if (this.moduleData[outerKey][innerKey] == undefined) {
            this.moduleData[outerKey][innerKey] = this.getDefault(type);
        }
    }

    /**
     * Ensure "key" exists in userData
     * 
     * e.g. Seed.0xABC.balance exists, if not, default it to the int value 0
     * 
     * @param user - User whos data we are ensuring
     * @param key - Key in userData
     * @param type - Variable type the data is supposed to be
     */ 
    ensureUserDataCreated(user, key, type) {
        if (this.userData[user] == undefined) {
            this.userData[user] = {};
        }
        if (this.userData[user][key] == undefined) {
            this.userData[user][key] = this.getDefault(type);
        }
    }

    /**
     * Ensure "innerKey" exists in userData.outerKey
     * 
     * e.g. Seed.0xABC.allowance.0xDEF exists, if not, default it to the int value 0
     * 
     * @param user - User whos data we are ensuring
     * @param outerKey - Key in userData that contains the innerKey
     * @param innerKey - Key in userData.outerKey which we are ensuring exists
     * @param type - Variable type the data is supposed to be
     */ 
    ensureUserInnerDataCreated(user, outerKey, innerKey, type) {
        if (this.userData[user] == undefined) {
            this.userData[user] = {};
        }
        if (this.userData[user][outerKey] == undefined) {
            this.userData[user][outerKey] = {};
        }
        if (this.userData[user][outerKey][innerKey] == undefined) {
            this.userData[user][outerKey][innerKey] = this.getDefault(type);
        }
    }


    toString() {
        return "User: " + this.user + " | ModuleData: " + JSON.stringify(this.moduleData) + " | UserData: " + JSON.stringify(this.userData);
    }
}