try {
    var recognition = new webkitSpeechRecognition();
} catch (e) {
    console.error(e);
    $('.no-browser-support').show();
    $('.app').hide();
}

var noteTextarea = $('#note-textarea');
var instructions = $('#recording-instructions');
var notesList = $('ul#notes');

var noteContent = '';

// Get all notes from previous sessions and display them.
var notes = getAllNotes();
renderNotes(notes);

/*-----------------------------
      Voice Recognition 
------------------------------*/

// If false, the recording will stop after a few seconds of silence.
// When true, the silence period is longer (about 15 seconds),
// allowing us to keep recording even when the user pauses. 
recognition.continuous = true;

function startRecognition() {
    recognition.lang = $('#select-language').val();
    recognition.start();
}

function stopRecognition() {
    recognition.stop();
}

recognition.onresult = function (event) {
    var current = event.resultIndex;
    var transcript = event.results[current][0].transcript;

    var mobileRepeatBug = (current == 1 && transcript == event.results[0][0].transcript);

    if (!mobileRepeatBug) {
        noteContent += transcript;
        noteTextarea.val(noteContent);
    }
};

recognition.onstart = function () {
    instructions.text('Voice recognition activated. Try speaking into the microphone.');
};

recognition.onspeechend = function () {
    instructions.text('You were quiet for a while so voice recognition turned itself off.');
};

recognition.onerror = function (event) {
    if (event.error == 'no-speech') {
        instructions.text('No speech was detected. Try again.');
    }
};

/*-----------------------------
      App buttons and input 
------------------------------*/

$('#start-record-btn').on('click', function (e) {
    if (noteContent.length) {
        noteContent += ' ';
    }
    startRecognition();
});

$('#pause-record-btn').on('click', function (e) {
    stopRecognition();
    instructions.text('Voice recognition paused.');
});

$('#save-note-btn').on('click', function (e) {
    stopRecognition();

    if (!noteContent.length) {
        instructions.text('Could not save an empty note. Please add a message to your note.');
    } else {
        saveNote(new Date().toLocaleString(), noteContent);
        noteContent = '';
        renderNotes(getAllNotes());
        noteTextarea.val('');
        instructions.text('Note saved successfully.');
    }
});

notesList.on('click', function (e) {
    e.preventDefault();
    var target = $(e.target);

    if (target.hasClass('listen-note')) {
        var content = target.closest('.note').find('.content').text();
        readOutLoud(content);
    }

    if (target.hasClass('delete-note')) {
        var dateTime = target.siblings('.date').text();
        deleteNote(dateTime);
        target.closest('.note').remove();
    }
});

/*-----------------------------
      Speech Synthesis 
------------------------------*/

function readOutLoud(message) {
    var speech = new SpeechSynthesisUtterance();

    speech.text = message;
    speech.volume = 1;
    speech.rate = 1;
    speech.pitch = 3;

    window.speechSynthesis.speak(speech);
}

/*-----------------------------
      Helper Functions 
------------------------------*/

function renderNotes(notes) {
    var html = '';
    if (notes.length) {
        notes.forEach(function (note) {
            html += `<li class="note">
                <p class="header">
                    <span class="date">${note.date}</span>
                    <a href="#" class="listen-note" title="Listen to Note">Listen to Note</a>
                    <a href="#" class="delete-note" title="Delete">Delete</a>
                </p>
                <p class="content">${note.content}</p>
            </li>`;
        });
    } else {
        html = '<li><p class="content">You don\'t have any notes yet.</p></li>';
    }
    notesList.html(html);
}

function saveNote(dateTime, content) {
    localStorage.setItem('note-' + dateTime, content);
}

function getAllNotes() {
    var notes = [];
    var key;
    for (var i = 0; i < localStorage.length; i++) {
        key = localStorage.key(i);

        if (key.substring(0, 5) == 'note-') {
            notes.push({
                date: key.replace('note-', ''),
                content: localStorage.getItem(localStorage.key(i))
            });
        }
    }
    return notes;
}

function deleteNote(dateTime) {
    localStorage.removeItem('note-' + dateTime);
}

$('#send-record-btn').on('click', function(e) {
    recognition.stop();

    if (!noteContent.length) {
        instructions.text('Could not save empty note. Please add a message to your note.');
    } else {
        // Save note to MySQL database
        sendRecordToServer(noteContent);

        // Reset variables and update UI.
        noteContent = '';
        renderNotes(getAllNotes());
        noteTextarea.val('');
        instructions.text('Note saved successfully.');
    }
})

function sendRecordToServer(record) {
    $.ajax({
        type: 'POST',
        url: 'save_results.php',
        data: { resultsValue: record },
        success: function(response) {
            console.log(response);
        },
        error: function(error) {
            console.error(error);
        }
    });
}
