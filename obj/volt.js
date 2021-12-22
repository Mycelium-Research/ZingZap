module.exports = class Volt {
	constructor(zingzap, to, amount, hash, address) {
		this.index = 0;
		this.to = to;
		this.amount = amount;
		this.executed = false;
		this.from = address;
		this.hash = hash;
		// TODO: find a way to create a new address at MAX_TRANSACTIONS_CONDUCTOR and transfer funds to new address
		for (let j = 0; j < zingzap.station[this.from.charCodeAt(0)].length; j++) {
			if (zingzap.station[this.from.charCodeAt(0)][j].address === this.from) {
				this.index = ++zingzap.station[this.from.charCodeAt(0)][j].numVolts;
			}
		}
	}

	addVolt = zingzap => {
		zingzap.addVolt(this);
	}
}
