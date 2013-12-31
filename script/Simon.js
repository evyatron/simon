function Simon(options) {
  var elContainer,
      el,
      elButtons,

      size,
      synth,

      userSequence = [],
      sequence = [],

      onNewNote,
      onSuccess,
      onFailure,

      BORDER_WIDTH = 0,
      NUMBER_OF_BUTTONS = 4,
      NOTE_DURATION = 300,
      COLORS = [
                'green',
                'rgb(200, 0, 0)',
                'blue',
                'yellow',
                'purple',
                'orange'
               ];

  // expose public functions
  this.init = init;
  this.reset = reset;
  this.start = start;
  this.addNote = addNote;
  this.hitNote = hitNote;
  this.getSequence = getSequence;
  this.setVolume = setVolume;

  // allow both
  // var game = new Simon();
  // game.init({...});
  // and
  // var game = new Simon({...});
  if (options) {
    init(options);
  }

  // initialize the game!
  function init(options) {
    !options && (options = {});

    elContainer = options.elContainer;

    elContainer.innerHTML = '';

    size = options.size || elContainer.offsetWidth;
    if (size % 2 === 1) {
      size -= 1;
    }

    BORDER_WIDTH = Math.ceil(size / 30);

    options.numberOfButtons && (NUMBER_OF_BUTTONS = options.numberOfButtons);
    options.noteDuration && (NOTE_DURATION = options.noteDuration);

    onNewNote = options.onNewNote || function() {};
    onSuccess = options.onSuccess || function() {};
    onFailure = options.onFailure || function() {};

    if (options.colors instanceof Array) {
      COLORS = options.colors;
    }

    // create the audio module
    synth = new Synth(options.synth);

    // create the actual game UI
    createUI();

    // listen to clicks on buttons
    el.addEventListener('ontouchstart' in window? 'touchstart' : 'click', checkUserClick);
  }

  // start the game - reset current sequence and start generating notes
  function start() {
    reset();
    computerTurn();
  }

  // reset current game
  function reset() {
    sequence = [];
    userSequence = [];
    synth && synth.stop();
  }

  // return the current notes sequence (array of integers)
  function getSequence() {
    return sequence;
  }

  // change the volume
  function setVolume(volume) {
    synth && synth.setVolume(volume);
  }

  //
  function hitNote(note) {
    markNote(note, onNoteDone);

    if (!sequence.length) {
      return;
    }

    userSequence.push(note);

    var userOK = checkUserSequence();

    if (userOK) {
      if (userSequence.length === sequence.length) {
        onSuccess(userSequence.length, sequence.length);
        window.setTimeout(computerTurn, NOTE_DURATION * 3);
      }
    }

    function onNoteDone() {
      if (sequence.length && !userOK) {
        onFailure(userSequence.length, sequence.length);
        reset();
      }
    }
  }

  // check if the current user sequence matches the computer's one
  // note that this is also used for mid-turn checks, so:
  // user: [1,2,3] computer: [1,2,3,4] = true
  function checkUserSequence() {
    for (var i = 0, len = userSequence.length; i < len; i++) {
      if (userSequence[i] !== sequence[i]) {
        return false;
      }
    }

    return true;
  }

  // when it's the computer's turn to generate another note,
  // first reset the user's current sequence, since they'll need to start
  // again after the computer is done
  function computerTurn() {
    userSequence = [];
    addNote();
  }

  // generate a new random note and add it to the current sequence
  function addNote() {
    var newNote = getRandomNote();

    sequence.push(newNote);

    markNotes(sequence);

    onNewNote(sequence);
  }

  // play through a series of notes
  function markNotes(sequence, callback) {
    var index = -1;

    function onNoteDone() {
      index++;
      if (index < sequence.length) {
        markNote(sequence[index], onNoteDone);
      } else {
        callback && callback();
      }
    }

    onNoteDone();
  }

  // play a single note - both UI and sound
  function markNote(note, callback) {
    elButtons[note].classList.add('active');

    synth.play({
      note: note,
      duration: NOTE_DURATION
    });

    window.setTimeout(function() {
      elButtons[note].classList.remove('active');

      if (callback) {
        window.setTimeout(callback, 200);
      }
    }, NOTE_DURATION);
  }

  // generate a random note
  function getRandomNote() {
    return Math.floor(Math.random() * NUMBER_OF_BUTTONS);
  }

  // create the actual game UI
  function createUI() {
    el = document.createElement('div');
    el.id = 'game-simon';
    el.style.cssText += [
      'width: ' + size + 'px',
      'height: ' + size + 'px'
    ].join(';');

    var html = '<span class="inner-border" ' +
                'style="border-width: ' + BORDER_WIDTH * 2 + 'px;"></span>';

    for (var i = 0; i < NUMBER_OF_BUTTONS; i++) {
      html += '<b ' +
                'data-note="' + i + '"' +
                'class="button"' +
                'style="' + getButtonStyle(i) + '"' +
              '></b>';
    }

    html += '<span class="outer-border" ' +
            'style="border-width: ' + BORDER_WIDTH * 2 + 'px;"></span>';

    el.innerHTML = html;

    elButtons = el.querySelectorAll('.button');
    elButtons = Array.prototype.slice.call(elButtons, 0);

    elContainer.appendChild(el);
  }

  // since the event listener is attached to the entire container,
  // we need to make sure a note button was clicked, and get the note
  function checkUserClick(e) {
    var elButtonClicked = e.target,
        note = elButtonClicked && elButtonClicked.dataset.note;

    if (note) {
      hitNote(note * 1);
    }
  }

  // create the style of each button according to its index
  function getButtonStyle(index) {
    var angle = 360 / NUMBER_OF_BUTTONS,
        transform = 'rotate(' + angle * index + 'deg) ' +
                    'skewX(' + (90 - angle) + 'deg)'

    // TODO: special design for 2 buttons
    if (NUMBER_OF_BUTTONS === 2) {

    }

    return [
      'background-color: ' + (COLORS[index] || getRandomColor()),
      '-webkit-transform: ' + transform,
      'transform: ' + transform,
      'border-bottom-width: ' + BORDER_WIDTH + 'px',
      'border-right-width: ' + BORDER_WIDTH + 'px'
    ].join(';');
  }

  // generate a random color - used when playing at a higher level
  // than those we have colors for
  function getRandomColor() {
    return 'rgb(' + c() + ',' + c() + ',' + c() + ')';

    function c() {
      return Math.round(Math.random() * 196) + 30;
    }
  }
}

function Synth(options) {
  var myAudioContext,

      oscillator,
      gainNode,
      currentType = '',
      currentVolume = 0,
      currentNote = 0,

      DEFAULT_OSCILLATOR_TYPE = 'square',
      DEFAULT_VOLUME = 0.5,
      NOTES = [
        261.63, 277.18, 293.66, 311.13, 329.63, 349.23,
        369.99, 392.00, 415.30, 440.00, 466.16, 493.88,
        523.25, 554.37, 587.33, 622.25, 659.26, 698.46,
        739.99, 783.99, 830.61, 880.00, 932.33, 987.77
      ];

  this.play = play;
  this.stop = stop;
  this.setVolume = setVolume;
  this.setNote = setNote;
  this.setType = setType;

  init(options);

  function init(options) {
    !options && (options = {});

    myAudioContext = new (window.webkitAudioContext || window.AudioContext)();

    setVolume(('volume' in options)? options.volume : DEFAULT_VOLUME);
    setType(('oscillatorType' in options)? options.oscillatorType : DEFAULT_OSCILLATOR_TYPE);
  }

  function play(options) {
    !options && (options = {});

    var oscillator = myAudioContext.createOscillator(),
        gainNode = myAudioContext.createGain();

    oscillator.type = currentType;

    gainNode.connect(myAudioContext.destination);
    oscillator.connect(gainNode);

    if (options.note !== undefined) {
      setNote(options.note);
    }
    if (options.volume !== undefined) {
      setVolume(options.volume);
    }

    gainNode.gain.value = currentVolume;
    oscillator.frequency.value = currentNote;

    oscillator.start(0);

    if (options.duration !== undefined) {
      window.setTimeout(function() {
        oscillator.stop(0);
      }, options.duration);
    }
  }

  function stop() {
    oscillator && oscillator.stop(0);
  }

  function setVolume(volume) {
    currentVolume = volume;
  }

  function setNote(note) {
    currentNote = NOTES[note];
  }

  function setType(type) {
    currentType = type;
  }
}