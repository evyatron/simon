var app = (function() {
  var simon,
      highScore = 0,

      elContainer,
      elLevel,
      elDifficulty,
      elVolume,
      elStart,
      elHighScore;

  // initialize the actual app
  function init() {
    welcomeLog();

    elContainer = document.getElementById('container');
    elLevel = document.getElementById('level');

    elRangeIndicator = document.getElementById('range-value');
    elDifficulty = document.getElementById('difficulty');
    elVolume = document.getElementById('volume');
    elStart = document.getElementById('start');

    elHighScore = document.querySelector('#high-score b');

    getFromStorage();

    addEventListeners();

    createGame();
  }

  // get user's stuff from storage
  function getFromStorage() {
    elHighScore.innerHTML = highScore = Storage.get('highScore') || 0;

    var volumeFromStorage = Storage.get('volume');
    if (volumeFromStorage * 1 == volumeFromStorage) {
      elVolume.value = volumeFromStorage;
    }

    var difficultyFromStorage = Storage.get('difficulty');
    if (difficultyFromStorage * 1 == difficultyFromStorage) {
      elDifficulty.value = difficultyFromStorage;
    }
  }

  // attach all event listeners to control settings
  function addEventListeners() {
    elVolume.addEventListener('change', onVolumeChange);
    elDifficulty.addEventListener('change', onDifficultyChange);
    elVolume.addEventListener('blur', hideRangeIndicator);
    elDifficulty.addEventListener('blur', hideRangeIndicator);

    document.addEventListener('keydown', checkUserInput);

    elStart.addEventListener('ontouchstart' in window? 'touchstart' : 'click', start);
  }

  // create a Simon game from the user's settings
  function createGame() {
    simon = new Simon({
      elContainer: elContainer,
      size: Math.min(elContainer.offsetWidth, elContainer.offsetHeight),
      numberOfButtons: elDifficulty.value,
      synth: {
        volume: elVolume.value
      },
      onNewNote: onNewNote,
      onSuccess: onSuccess,
      onFailure: onFailure
    });
  }

  // when a new note is played - player advanced -
  // indicate that on screen
  function onNewNote(sequence) {
    elLevel.innerHTML = '<span>' + sequence.length + '</span>';
  }

  // as the player progresses, save their high score
  function onSuccess(userProgress, numberOfNotes) {
    highScore = Math.max(highScore, userProgress);

    if (highScore === userProgress) {
      elHighScore.innerHTML = highScore;

      Storage.set('highScore', highScore);
    }
  }

  // player failed to follow the sequence
  function onFailure(userProgress, numberOfNotes) {
    alert('BOOM! You failed.');
    simon.reset();
    elLevel.innerHTML = '0';
  }

  // start the game
  function start() {
    simon && simon.start();
  }

  // when the player changes the volume - save in storage
  function onVolumeChange(e) {
    var value = e.target.value;

    elRangeIndicator.innerHTML = value;
    Storage.set('volume', value);
    simon && simon.setVolume(value);
  }

  // when the player changes the difficulty - save in storage
  // and create a new game from the new value
  function onDifficultyChange(e) {
    var value = e.target.value;

    elRangeIndicator.innerHTML = value;
    Storage.set('difficulty', value);

    createGame();
  }

  // hide the HTML element which indicates the current range input value
  function hideRangeIndicator() {
    elRangeIndicator.innerHTML = '';
  }

  // on key press - allow using keyboard numbers to play (0-9)
  function checkUserInput(e) {
    if (!simon) {
      return;
    }

    var keyCode = e.keyCode,
        digit = keyCode - 49;

    if (digit >= 0 && digit < elDifficulty.value*1) {
      simon.hitNote(digit);
    }
  }

  // quick local storage helper to avoid errors
  var Storage = {
    get: function get(key) {
      var value = null;

      try {
        value = localStorage[key];
      } catch(ex) {

      }

      return value;
    },
    set: function set(key, value) {
      try {
        localStorage[key] = value;
      } catch(ex) {

      }
    }
  };

  // some welcoming log messages for developers
  function welcomeLog() {
    if (!window.console) {
      return;
    }

    console.log('Hello, and welcome to %cS%ci%cm%co%cn%c!', c('green'), c('red'), c('blue'), c('gold'), c('purple'), 'color: #000;');
    console.log('You can check out the code on GitHub: http://github.com/evyatron/simon');
    console.log('Have fun!');

    function c(color) {
      return 'font-weight: bold; color: ' + color + ';';
    }
  }

  // expose some functions, so we can have fun debugging
  return {
    init: init,
    createGame: createGame,
    start: start
  };
}());