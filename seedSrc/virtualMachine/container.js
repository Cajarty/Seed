// Should it talk to the ledger directly and act as a window into that world? Maybe

module.exports = {
    createContainer: function(moduleData, sender, args) {
       return new Container(moduleData, sender, args);
    }
 }

class Container {
    constructor(moduleData, sender, args) {
        this.module = moduleData;
        this.args = args;
        this.sender = sender;
    }

    getModuleData(moduleName) {
        return this.module.data;
    }

    getUserData(moduleName, user) {
        return this.module.data["userData"][user];
    }
}