
var lastSound = 0;
var LAST_SOUND_WINDOW = 10 * 1000;
var LAST_LIGHT_ON_WINDOW = 10 * 1000;
var lastLightOn = 0;

Notification.requestPermission(function (permission) {
});

function notifyMe() {
  var audio = new Audio();
  audio.src = "/assets/notification.wav";
  audio.play();

  var msg = "We need more players! Bring your arse downstairs :)";
  // Let's check if the browser supports notifications
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notification");
  }

  // Let's check if the user is okay to get some notification
  else if (Notification.permission === "granted") {
    // If it's okay let's create a notification
    var notification = new Notification(msg);
  }

  // Otherwise, we need to ask the user for permission
  // Note, Chrome does not implement the permission static property
  // So we have to check for NOT 'denied' instead of 'default'
  else if (Notification.permission !== 'denied') {
    Notification.requestPermission(function (permission) {
      // If the user is okay, let's create a notification
      if (permission === "granted") {
        var notification = new Notification(msg);
      }
    });
  }

  // At last, if the user already denied any notification, and you 
  // want to be respectful there is no need to bother them any more.
}

var lastSoundSecondTick = 0;
var nbSound = 0;
var nbSoundSamples = 0;

var temperatureSamples = [];
var humiditySamples = [];

var sensors = {
  "light": function (state) {
    if (state > 0)
      lastLightOn = Date.now();

    var playing = lastLightOn > Date.now() - LAST_LIGHT_ON_WINDOW && lastSound > Date.now() - LAST_SOUND_WINDOW;

    $("#lightValue")
      .text(playing ? "PLAYING" : "DEAD")
      .attr("class", "value "+(!!playing));

    $("#lightIcon")
     .html(
       state ?
       '<i id="lightIconOn" class="icon" data-icon="c"></i>'
       :
       '<i id="lightIconOff" class="icon" data-icon="j"></i>'
     );
  },
  "humidity": function (value) {
    humiditySamples.push(value);
    if (humiditySamples.length >= 8) {
      var mean = humiditySamples.reduce(function (a, b) {
        return a + b;
      }) / humiditySamples.length;
      humidityCurve.push([{ time: Date.now(), y: mean }]);
      humiditySamples = [];
    }
  },
  "temperature": function (value) {
    temperatureSamples.push(value);
    if (temperatureSamples.length >= 8) {
      var mean = temperatureSamples.reduce(function (a, b) {
        return a + b;
      }) / temperatureSamples.length;
      temperatureCurve.push([{ time: Date.now(), y: mean }]);
      temperatureSamples = [];
    }
    $("#temperatureValue").text(value+"°C");
  },
  "sound": function (value) {
    ++nbSoundSamples;
    if (value) {
      ++nbSound;
      lastSound = Date.now();
    }

    if (lastSoundSecondTick < Date.now()-1000) {
      lastSoundSecondTick = Date.now();
      var percent = nbSound / nbSoundSamples;
      nbSound = 0;
      nbSoundSamples = 0;
      soundCurve.push([{ time: Date.now(), y: percent }]);
    }

    $("#soundBarValue").css("height", (100*value)+"%");
  },
  "touch": function(v) {
    notifyMe();
  }
};

function MOCK () {
  setInterval(function () {
    $.post("/light/"+(Math.random() > 0.3 ? 1 : 0));
    $.post("/humidity/"+Math.floor(Math.random() * 100));
    $.post("/temperature/"+Math.floor(15 + Math.random() * 10));
    $.post("/sound/"+(Math.random() > 0.8 ? 1 : 0));
  }, 1000);
}

/*
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
var C = window.AudioContext || window.webkitAudioContext;
var ctx = new C();

navigator.getUserMedia({ audio: true }, function (stream) {
  var mic = ctx.createMediaStreamSource(stream);
  var gain = ctx.createGain();
  gain.gain.value = 10;
  var compr = ctx.createDynamicsCompressor();
  mic.connect(gain);
  gain.connect(compr);

  var array = new Uint8Array(16);
  var analyzer = ctx.createAnalyser();
  
}, function () {});
*/


////////// Connect and handle the Stream ///////

reconnectDelay = 1000;

function connect () {
  var source = new EventSource("//zen-catacomb.herokuapp.com/stream");

  source.addEventListener('message', function(e) {
    var json = JSON.parse(e.data);
    console.log(json);
    for (var key in json)
      if (key in sensors) {
        sensors[key](json[key]);
      }
  }, false);

  source.addEventListener('open', function(e) {
    // Connection was opened.
  }, false);

  source.addEventListener('error', function(e) {
    if (e.readyState == EventSource.CLOSED) {
      // Connection was closed.
      setTimeout(connect, reconnectDelay *= 1.3);
    }
  }, false);
}


// init charts
var temperatureCurve = $('#temperatureCurve').epoch({
  type: 'time.line',
  ticks: {left:4},
  axes: ['left'],
  historySize: 120,
  data: [{
    label: "Temperature",
    values: []
  }],
  range: [15,30]
});

var humidityCurve = $("#humidityCurve").epoch({
  type: 'time.line',
  ticks: {left:4},
  axes: ['left'],
  historySize: 120,
  data: [{
    label: "Humidity",
    values: []
  }],
  range: [0,1]
});

var soundCurve = $("#soundCurve").epoch({
  type: 'time.line',
  ticks: {left:4},
  axes: ['left'],
  historySize: 120,
  data: [{
    label: "Sound level",
    values: []
  }],
  range: [0,1]
});

if (location.hash == "#munin") {
  document.querySelector(".munin").style.display = 'block';
}

connect();
