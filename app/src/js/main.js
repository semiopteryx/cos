const invoke = window.__TAURI__.core.invoke;
const listen = window.__TAURI__.event.listen;



var keyboards;
var currentLang;
var currentLangObject;
var currentOrient;
var currentOrientObject;
var currentKeyboard;

var bleDevices;

var currentCase = 0;
var totalCaseCount = 0;
var totalRows = 0;
var totalCols = 0;
var currentSquircle = {row: 0, col: 0};

const dirNames = ["left", "up", "right", "down"];



function getSvg(path) {
	let foo;
	$.ajax({
		async: false,
		type: "GET",
		dataType: "xml",
		url: path,
		success: function(svgData) {
			foo = $(svgData).contents();
		}
	});
	return foo;
}

var squircleBtnBackEl = getSvg("img/squircles/outlines/straight.svg");
var squircleBtn = $(`
	<div class="squircle-btn">
		${squircleBtnBackEl[0].outerHTML}
		<div class="squircle-btn-label"></div>
	</div>
`);



var currentScreen = "";
function changeScreen(screen) {
	currentScreen = screen;
	$(".screen").removeClass("current-screen");
	setTimeout(function() {
		$(`#${screen}-screen`).addClass("current-screen");
	}, 500);
}


$(document).ready(async function() {
	invoke("disconnect_ble_device");

	await fetch("keyboards.json").then(response => response.json()).then(data => {
		keyboards = data.sort((a, b) => a.exonym - b.exonym);
	});

	generateLangOptions();
});
