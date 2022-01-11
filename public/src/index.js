let address = '';
let password = '';
let usd = 0;
let numVolts = 0;

const windowAlert = (msg, error = false) => {
	if (error) {
		document.getElementById("alertHeader").style.backgroundColor = '#f12929';
	} else {
		document.getElementById("alertHeader").style.backgroundColor = '#008a00';
	}
	document.getElementById("alertMsg").textContent = msg;
	document.getElementById("modal").style.display = 'block';
}

window.onclick = event => {
	if (event.target == document.getElementById("modal") || event.target == document.getElementById("infoModal")) {
		document.getElementById("modal").style.display = "none";
		document.getElementById("infoModal").style.display = "none";
	}
}

document.getElementById("closeModal").addEventListener("click", () => {
	document.getElementById("modal").style.display = "none";
});

document.getElementById("closeInfoModal").addEventListener("click", () => {
	document.getElementById("infoModal").style.display = "none";
});

// TODO: add 'info' button for copying address and password, and 'history' button for checking the history of the last 16 blocks.

document.getElementById("infoBtn").addEventListener("click", () => {
	getNumVolts();
	document.getElementById("infoModal").style.display = 'block';
	document.getElementById("amountText").textContent = `Balance: $${usd} USD`;
});

document.getElementById("copyAddress").addEventListener("click", () => {
	navigator.clipboard.writeText(address);
	document.getElementById("copyAddress").textContent = 'Copied';
	setTimeout(() => {
		document.getElementById("copyAddress").textContent = 'Copy';
	}, 1500);
});

document.getElementById("copyPassword").addEventListener("click", () => {
	navigator.clipboard.writeText(password);
	document.getElementById("copyPassword").textContent = 'Copied';
	setTimeout(() => {
		document.getElementById("copyPassword").textContent = 'Copy';
	}, 1500);
});

document.getElementById("historyBtn").addEventListener("click", () => {
	window.location.href = `${window.location.href}history`;
})

// TODO: add a way to onboard from USDC to ZingZap.

const getNumVolts = () => {
	fetch(`${window.location.href}logon?address=${encodeURIComponent(address)}`)
		.then(result => result.json())
		.then(result => {
			numVolts = result.numVolts;
			usd = result.amount;
			if (!result.statusMsg) {
				windowAlert("Logon has failed, possibly due to an incorrect password or address.", true);
			}
			windowAlert("You can now logon using the 'Logon' button. Once logged in, click the '!' button in the top-right-hand corner to copy your address and password.");
		})
		.catch(error => windowAlert(error, true))
}

const genAddress = async maxVolts => {
	address = document.getElementById("logonInput").value;
	for (let i = 0; i < maxVolts; i++) {
		address = new Uint8Array(await window.crypto.subtle.digest('SHA-256', (new TextEncoder).encode(`${address}`)));
		output = '';
		for (let j = 0; j < address.byteLength; j++) output += String.fromCharCode(address[j]);
		address = window.btoa(output);
		if (i === maxVolts - 1) {
			getNumVolts();
		}
	}
}

document.getElementById("logonForm").addEventListener("submit", () => {
	event.preventDefault();
	if (document.getElementById("logonInput").value.length !== 44) {
		fetch(`${window.location.href}logon`)
			.then(res => res.json())
			.then(async res => {
				let rand = window.crypto.getRandomValues(new Uint32Array(1))[0];
				let hashing = new Uint8Array(await window.crypto.subtle.digest('SHA-256', (new TextEncoder).encode(`${rand}${res.numConductors}`)));
				let output = '';
				for (let i = 0; i < hashing.byteLength; i++) output += String.fromCharCode(hashing[i]);
				document.getElementById("logonInput").value = window.btoa(output);
				genAddress(res.maxVolts);
			})
			.catch(err => windowAlert(err, true))
	} else {
		fetch(`${window.location.href}logon`)
			.then(res => res.json())
			.then(res => {
				genAddress(res.maxVolts);
				document.getElementById("logonForm").style.display = 'none';
				document.getElementById("payForm").style.display = 'block';
				document.getElementById("logonInput").value = '';
				document.getElementById("historyBtn").style.display = 'none';
				document.getElementById("infoBtn").style.display = 'block';
			})
			.catch(err => windowAlert(err, true))
	}
	password = document.getElementById("logonInput").value;
});

document.getElementById("payBtn").addEventListener("click", () => {
	document.getElementById("payBtn").disabled = true;
	numVolts++;
	fetch(`${window.location.href}logon`)
		.then(res => res.json())
		.then(async res => {
			let hashing = password;
			for (let i = 0; i < (res.maxVolts - numVolts); i++) {
				hashing = new Uint8Array(await window.crypto.subtle.digest('SHA-256', (new TextEncoder).encode(`${hashing}`)));
				let output = '';
				for (let j = 0; j < hashing.byteLength; j++) output += String.fromCharCode(hashing[j]);
				hashing = window.btoa(output);
			}
			document.getElementById("payBtn").disabled = false;
			let to = document.getElementById("toInput").value;
			let data = document.getElementById("amountInput").value;
			fetch(`${window.location.href}transaction?to=${encodeURIComponent(to)}&data=${encodeURIComponent(data)}&hashing=${encodeURIComponent(hashing)}&address=${encodeURIComponent(address)}`)
				.then(result => result.json())
				.then(result => windowAlert(result.statusMsg))
				.catch(error => windowAlert(error, true))
			if (numVolts === res.maxVolts - 1) {
				windowAlert("You have reached your transaction limit for this account. All future transactions will fail unless directed to the host which will allow you to withdraw your funds.", true);
			}
		})
		.catch(err => {
			windowAlert(err, true);
			document.getElementById("payBtn").disabled = false;
		})
	usd -= document.getElementById("amountInput").value;
});
