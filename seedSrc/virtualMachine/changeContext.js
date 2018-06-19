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
        #####################################################
        ### Public Functions Used To Modify ChangeContext ###
        #####################################################
    */

    /**
     * 
     * Subtracts data from the changeset using various options. Only works with numeric data.
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
        //console.log("subtract", amount, options);
    }

    /**
     * 
     * Add data from the changeset using various options. Only works with numeric data.
     * 
     * e.g's:
     *      add(10, { user : "0xABC", key : "balance" })
     *          Seed.0xABC.balance += 10
     *      add(10, { user : "0xABC", outerKey : "allowance", innerKey : "0xDEF" })
     *          Seed.0xABC.allowance.0xDEF += 10
     *      add(10, { key : "totalSupply" })
     *          Seed.totalSupply += 10
     *      add(10, { outerKey : "population", innerKey : "falador" })
     *          Game.population.falador += 10
     * 
     * 
     * @param {*} amount - Amount to subtract
     * @param {*} options - The options determining which piece of data to subtract from
     */
    add(amount, options) {
        switch(this.routeOption(options)) {
            case routes.MODULE_BASIC:
                this.addToModuleData(amount, options);
                break;
            case routes.MODULE_DEEP:
                this.addToModuleDataDeep(amount, options);
                break;
            case routes.USER_BASIC:
                this.addToUserData(amount, options);
                break;
            case routes.USER_DEEP:
                this.addToUserDataDeep(amount, options);
                break;
        }
        //console.log("add", amount, options);
    }

    /**
     * 
     * Set data to the changeset using various options. Works with any data type, however is treated as a "set the relative increase" for numbers.
     * 
     * e.g's:
     *      set(10, { user : "0xABC", key : "balance" })
     *          Seed.0xABC.balance += 10
     *      set(10, { user : "0xABC", outerKey : "allowance", innerKey : "0xDEF" })
     *          Seed.0xABC.allowance.0xDEF += 10
     *      set(10, { key : "symbol" })
     *          Seed.symbol = "SEED"
     *      set(10, { outerKey : "population", innerKey : "falador" })
     *          Game.citySlogans.falador = "Home of the brave"
     * 
     * 
     * @param {*} value - Value to set
     * @param {*} options - The options determining which piece of data to set
     */
    set(value, options) {
        switch(this.routeOption(options)) {
            case routes.MODULE_BASIC:
                this.setModuleData(value, options);
                break;
            case routes.MODULE_DEEP:
                this.setModuleDataDeep(value, options);
                break;
            case routes.USER_BASIC:
                this.setUserData(value, options);
                break;
            case routes.USER_DEEP:
                this.setUserDataDeep(value, options);
                break;
        }
        //console.log("set", value, options);
    }

    /* 
        ###############################################################
        ### Private Functions Used To Directly Modify ChangeContext ###
        ###############################################################
    */

    /**
     * Subtract moduleData[key] by amount
     * 
     * e.g. Seed.totalSupply -= amount
     * 
     * @param {number} amount - Amount to subtract
     * @param {*} options.key - Key in moduleData to subtract from
     */ 
    subtractFromModuleData(amount, options) {
        //console.info("Subtract", "Seed.totalSupply -= amount");
        this.ensureModuleDataCreated(options.key, "number");
        this.moduleData[options.key] -= amount;
    }

    /**
     * Add to moduleData[key] by amount
     * 
     * e.g. Seed.totalSupply += amount
     * 
     * @param {number} amount - Amount to increase
     * @param {*} options.key - Key in moduleData to add to
     */ 
    addToModuleData(amount, options) {
        //console.info("Add", "Seed.totalSupply += amount");
        this.ensureModuleDataCreated(options.key, "number");
        this.moduleData[options.key] += amount;
    }

    /**
     * Set moduleData[key] to value
     * 
     * e.g. Seed.symbol = "SEED"
     * 
     * @param {number} value - What to set the value to
     * @param {*} options.key - Key in moduleData to set to
     */ 
    setModuleData(value, options) {
        //console.info("Set", "Seed.symbol = \"SEED\"");
        this.ensureModuleDataCreated(options.key, typeof value);
        this.moduleData[options.key] = value;
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
        //console.info("Subtract", "Seed.totalSupply -= amount");
        this.ensureModuleInnerDataCreated(options.outerKey, options.innerKey, "number");
        this.moduleData[options.outerKey][options.innerKey] -= amount;
    }

    /**
     * Add to moduleData[outerKey][innerKey] by amount
     * 
     * e.g. Game.population.falador += amount
     * 
     * @param {number} amount - Amount to subtract
     * @param {*} options.outerKey - Key in moduleData to add to
     * @param {*} options.innerKey - Key in moduleData to add to
     */ 
    addToModuleDataDeep(amount, options) {
        //console.info("Add", "Seed.totalSupply += amount");
        this.ensureModuleInnerDataCreated(options.outerKey, options.innerKey, "number");
        this.moduleData[options.outerKey][options.innerKey] += amount;
    }

    /**
     * Set moduleData[outerKey][innerKey] to value
     * 
     * e.g. Game.citySlogans.falador = "Home Of The Brave"
     * 
     * @param {number} value - Value to set to
     * @param {*} options.outerKey - Key in moduleData to set
     * @param {*} options.innerKey - Key in moduleData.outerKey to set
     */ 
    setModuleDataDeep(value, options) {
        //console.info("Set", "Game.citySlogans.falador = \"Home Of The Brave\"");
        this.ensureModuleInnerDataCreated(options.outerKey, options.innerKey, typeof value);
        this.moduleData[options.outerKey][options.innerKey] = value;
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
        //console.info("Subtract", "Seed.0xABC.balance -= amount", this);
        this.ensureUserDataCreated(options.user, options.key, "number");
        this.userData[options.user][options.key] -= amount;
    }

    /**
     * Add to userData[key] by amount
     * 
     * e.g. Seed.0xABC.balance += amount
     * 
     * @param {number} amount - Amount to add
     * @param {string} options.user - User to add the variable of
     * @param {*} options.key - Key in userData to add to
     */ 
    addToUserData(amount, options) {
        //console.info("Add", "Seed.0xABC.balance += amount", this);
        this.ensureUserDataCreated(options.user, options.key, "number");
        this.userData[options.user][options.key] += amount;
    }

    /**
     * Set userData[key] to value
     * 
     * e.g. Seed.0xABC.balance += value or Game.0xABC.username = "Gandolf"
     * 
     * @param {number} value - Value to set to
     * @param {string} options.user - User to set the variable of
     * @param {*} options.key - Key in userData to set
     */ 
    setUserData(value, options) {
        //console.info("Set", "Game.0xABC.username = \"Gandolf\"", this);
        this.ensureUserDataCreated(options.user, options.key, typeof value);
        this.userData[options.user][options.key] = value;
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
        //console.info("Subtract", "Seed.0xABC.allowance.0xDEF -= amount", options.user, options.outerKey, options.innerKey, amount);
        this.ensureUserInnerDataCreated(options.user, options.outerKey, options.innerKey, "number");
        this.userData[options.user][options.outerKey][options.innerKey] -= amount;
    }

    /**
     * Add to userData[outerKey][innerKey] by amount
     * 
     * e.g. Seed.0xABC.allowance.0xDEF += amount
     * 
     * @param {number} amount - Amount to add
     * @param {string} options.user - User to increase the amount to
     * @param {*} options.outerKey - Key to mapping in userData that has the value to add to
     * @param {*} options.innerKey - Key in in userData.outerKey to add to
     */ 
    addToUserDataDeep(amount, options) {
        //console.info("Add", "Seed.0xABC.allowance.0xDEF += amount", options.user, options.outerKey, options.innerKey, amount);
        this.ensureUserInnerDataCreated(options.user, options.outerKey, options.innerKey, "number");
        this.userData[options.user][options.outerKey][options.innerKey] += amount;
    }

    /**
     * Set userData[outerKey][innerKey] to value
     * 
     * e.g. Seed.0xABC.allowance.0xDEF += value or Game.0xABC.notes.0xDEF = "Coward"
     * 
     * @param {number} value - Value to set to
     * @param {string} options.user - User to set the value of
     * @param {*} options.outerKey - Key to mapping in userData that has the value to set to
     * @param {*} options.innerKey - Key in userData.outerKey to set
     */ 
    setUserDataDeep(value, options) {
        //console.info("Set", "Game.0xABC.notes.0xDEF = \"Coward\"", options.user, options.outerKey, options.innerKey, value);
        this.ensureUserInnerDataCreated(options.user, options.outerKey, options.innerKey, typeof value);
        this.userData[options.user][options.outerKey][options.innerKey] = value;
    }

    /* 
        #################################################
        ### To Ensure Proper Data Structure & Routing ###
        #################################################
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