var final_transcript = '';
var recognizing = false;
var ignore_onend;
var start_timestamp;
var recognition;

$( document ).ready(function() {
	for (var i = 0; i < langs.length; i++) {
		select_language.options[i] = new Option(langs[i][0], i);
	}

	// Set default language / dialect.
	select_language.selectedIndex = 10;
	updateCountry();
	select_dialect.selectedIndex = 2;

	if (!('webkitSpeechRecognition' in window)) {
		upgrade();
	} else {
		showInfo('start');
		start_button.style.display = 'inline-block';
		recognition = new webkitSpeechRecognition();
		recognition.continuous = true;
		recognition.interimResults = true;

		recognition.onstart = function() {
			recognizing = true;
			showInfo('speak_now');
			addMicAnimation();
		};

		recognition.onerror = function(event) {
			if (event.error == 'no-speech') {
				showInfo('no_speech');
				ignore_onend = true;
			}
			if (event.error == 'audio-capture') {
				showInfo('no_microphone');
				ignore_onend = true;
			}
			if (event.error == 'not-allowed') {
				if (event.timeStamp - start_timestamp < 100) {
					showInfo('blocked');
				} else {
					showInfo('denied');
				}
				ignore_onend = true;
			}
			removeMicAnimation();
		};

		recognition.onend = function() {
			recognizing = false;
			// recognizing = true;
			if (ignore_onend) {
				return;
			}
			removeMicAnimation();
			if (!final_transcript) {
				showInfo('start');
				return;
			}
			showInfo('stop');
			if (window.getSelection) {
				window.getSelection().removeAllRanges();
				var range = document.createRange();
				range.selectNode(document.getElementById('final_span'));
				window.getSelection().addRange(range);
			}
		};

		recognition.onresult = function(event) {
			var interim_transcript = '';
			if (typeof (event.results) == 'undefined') {
				recognition.onend = null;
				recognition.stop();
				upgrade();
				return;
			}
			for (var i = event.resultIndex; i < event.results.length; ++i) {
				if (event.results[i].isFinal) {
					if(isMobile()){
						final_transcript = event.results[i][0].transcript;
					} else {
						final_transcript += event.results[i][0].transcript;
					}
				} 
				else {
					if(isMobile()){
						interim_transcript = event.results[i][0].transcript;
					} else {
						interim_transcript += event.results[i][0].transcript;
					}
				}
			}
			final_transcript = capitalize(final_transcript);
			final_span.innerHTML = linebreak(final_transcript);
			interim_span.innerHTML = linebreak(interim_transcript);
		};
	}
});

function updateCountry() {
	for (var i = select_dialect.options.length - 1; i >= 0; i--) {
		select_dialect.remove(i);
	}
	var list = langs[select_language.selectedIndex];
	for (var i = 1; i < list.length; i++) {
		select_dialect.options.add(new Option(list[i][1], list[i][0]));
	}
	select_dialect.style.visibility = list[1].length == 1 ? 'hidden' : 'visible';
}

function upgrade() {
	start_button.style.visibility = 'hidden';
	showInfo('upgrade');
}

var two_line = /\n\n/g;
var one_line = /\n/g;
function linebreak(s) {
	return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
}

var first_char = /\S/;
function capitalize(s) {
	return s.replace(first_char, function(m) {return m.toUpperCase();});
}

$("#start_button").click(function () {
	if (recognizing) {
	   recognition.stop();
	   removeMicAnimation();
//	   recognizing = false;
//	   showInfo('start');
	   return;
	}
	final_transcript = '';
	recognition.lang = select_dialect.value;
	recognition.start();
	ignore_onend = false;
	final_span.innerHTML = '';
	interim_span.innerHTML = '';
	addMicAnimation();
	showInfo('allow');
	start_timestamp = event.timeStamp;
});

function showInfo(s) {
	if (s) {
	    var message = messages[s];
	    $("#message").removeClass();
	    $("#message").html(message.msg);
	    $("#message").addClass(message.class);
	} else {
	    $("#message").removeClass();
	    $("#message").addClass('d-none');
	}
}

function removeMicAnimation() {
	$("#micIcon").removeClass("circle");
	$("#micIcon").removeClass("pulse");
}

function addMicAnimation(){
	$("#micIcon").addClass("circle");
	$("#micIcon").addClass("pulse");
}

function isMobile(){
	return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}


//currently not used
function copyToClipboard() {
  if (document.selection) { 
      var range = document.body.createTextRange();
      range.moveToElementText(document.getElementById('results'));
      range.select().createTextRange();
      document.execCommand("copy");   
  } else if (window.getSelection) {
      var range = document.createRange();
       range.selectNode(document.getElementById('results'));
       window.getSelection().addRange(range);
       document.execCommand("copy");
  }
  showInfo('copy');
}