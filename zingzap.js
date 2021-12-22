const express = require('express');
const app = express();
const path = require('path');
app.use(express.static(path.join(__dirname, "public/")));

const Pulse = require('./obj/pulse.js');
const Volt = require('./obj/volt.js');

// Maximum number of transactions a conductor can submit before they are re-assigned
const MAX_VOLTS_CONDUCTOR = 16384;

let zingzap = new Pulse();

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '/public/view/index.html'));
});

app.get('/logon', (req, res) => {
	res.send({ 
		numConductors: zingzap.numConductors, 
		maxVolts: MAX_VOLTS_CONDUCTOR 
	});
});

app.get('/conductor', (req, res) => {
	console.log(`Conductor ${req.query.address} has been registered or logged in.\r\n`);
	res.send({ 
		statusMsg: zingzap.addConductor(decodeURIComponent(req.query.address)), 
		numVolts: zingzap.numVolts(req.query.address) 
	});
});

app.get('/volt', (req, res) => {
	console.log(`Conductor ${req.query.address} has proposed a volt to ${req.query.to} of amount $${req.query.amount} USD.\r\n`)
	let statusMsg = (new Volt(zingzap, decodeURIComponent(req.query.to), parseFloat(decodeURIComponent(req.query.amount)), decodeURIComponent(req.query.hashing), decodeURIComponent(req.query.address))).addVolt(zingzap);
	res.send({ 
		statusMsg: "Volt has been added successfully."
	});
});

app.get('/zingzap', (req, res) => {
	res.send({ zingzap: zingzap })
});

app.listen(process.env.PORT, () => {
	console.log(`ZingZap is running on port ${process.env.PORT}.\r\n`)
});
