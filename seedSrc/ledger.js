
const conformHelper = require("./helpers/conformHelper.js");
let ledger = null;

module.exports = {
    getLedger : function() {
        if (ledger == null) {
            ledger = new Ledger();
        }
        return ledger;
    }
 }

 class Ledger {
    constructor() {
        this.moduleData = {};
        this.moduleInitialUserDatas = {};
    }

    addModule(moduleName, initialData, initialUserData) {
        this.moduleData[moduleName] = conformHelper.deepCopy(initialData);
        this.moduleInitialUserDatas[moduleName] = conformHelper.deepCopy(initialUserData);
    }

    addUserData(moduleName, user) {
        
    }

    applyChanges(moduleName, changeSet) {

    }

    getModuleData(moduleName) {

    }

    getUserData(moduleName, user) {

    }

    revertChanges(changeSet) {

    }
 }