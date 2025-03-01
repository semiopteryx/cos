// Motion events
var isRecentered = false;
var isCalibrating = false;
var justCalibrated = false;

var remote;
var pitch, yaw, roll, pitchOffset, yawOffset, rollOffset;
var pitchDelta = 8;
var yawDelta = 8;



function recenter() {
	isRecentered = true;
	isCalibrating = false;
	justCalibrated = true;

	pitchOffset = pitch - pitchDelta;
	yawOffset = yaw;
	rollOffset = roll;

	console.log("Recentered!");
}

function changeSquircle() {
	$(".squircle").attr("data-bump-dir", "");
	$(".squircle").removeClass("current-squircle");
	$(`[data-row="${currentSquircle.row}"] [data-col="${currentSquircle.col}"]`).addClass("current-squircle");
}

function type(char) {
	let text = $("#keyboard-input-text").text();
	$("#keyboard-input-text").text(text + char);
}

var Buttons = {
	stack: [],

	downStart: 0,
	downTime: 0,
	calibrateTime: 700,

	add: function(el) {
		this.stack.unshift(el);
	},
	remove: function(key) {
		let index = this.stack.indexOf(key);
		if (index > -1) this.stack.splice(index, 1);
	},
	top: function() {
		if (this.stack.length > 0) return this.stack[0];
		return "";
	},
	isPressing: function(key) {
		return this.stack.includes(key);
	},
	dir: function(code) {
		return Object.keys(this.dpad).find(dir => this.dpad[dir] === code)
	}
}



listen("arduino-update", function(data) {
	let newRemote = JSON.parse(data.payload);


	//* IMU
	pitch = newRemote.imu.pitch;
	yaw = newRemote.imu.yaw;
	roll = newRemote.imu.roll;

	if (isRecentered) {
		let numRows = currentKeyboard.length;
		let rowRaw = Math.round((p - po) / pd + (numRows / 2));
		let newRow = Math.max(0, Math.min(rowRaw, numRows - 1));
	
		let numCols = currentKeyboard[currentSquircle.row].length;
		let colRaw = Math.round((y - yo) / yd + (numCols / 2));
		let newCol = Math.max(0, Math.min(colRaw, numCols - 1));
	
		if (newRow !== currentSquircle.row || newCol !== currentSquircle.col) {
			currentSquircle.row = newRow;
			currentSquircle.col = newCol;
			changeSquircle();
		}
	}


	//* Dpad buttons
	for (let dir in newRemote.btns.dpad) {
		if (remote.btns.dpad[dir] !== newRemote.btns.dpad[dir]) {
			// On dpad button down
			if (newRemote.btns.dpad[dir] == true) {
				let quadEl = $(`.current-squircle .squircle-quad[data-dir="${dir}"]`);
				if (quadEl.length) {
					let ctrl = quadEl.attr("data-ctrl");
					switch (ctrl) {
						case "space":
							type("\u00A0");
							break;
	
						case "backspace":
							$("#keyboard-input-text").text((_, txt) => txt.slice(0, -1));
							break;
	
						default:
							let char = "";
							if (quadEl.children().length > 1) {
								char = quadEl.find(`.squircle-char[data-case="${currentCase}"]`).attr("data-char");
							} else {
								char = quadEl.find(".squircle-char").attr("data-char");
							}
							Buttons.add(dir);
							type(char);
							break;
					}
	
					$(".current-squircle").attr("data-bump-dir", dir);
				}
			}
			
			// On dpad button up
			else {
				Buttons.remove(dir);
				$(".current-squircle").attr("data-bump-dir", Buttons.top());
			}
		}
	}


	//* Select button
	if (remote.btns.select !== newRemote.btns.select) {
		// On select button down
		if (newRemote.btns.select == true) {
			if (!justCalibrated) {
				if (!isCalibrating) {
					isCalibrating = true;
					Buttons.downStart = Date.now();
				} else {
					Buttons.downTime = Date.now() - Buttons.downStart;
					if (Buttons.downTime >= Buttons.calibrateTime) {
						recenter();
						if (currentScreen == "calib") changeScreen("keyboard");
					}
				}
			}
		}

		// On select button up
		else {
			if (!justCalibrated) toggleCase();
			isCalibrating = false;
			justCalibrated = false;
		}
	}


	remote = newRemote;
});
