
var lastSound = 0;
var LAST_SOUND_WINDOW = 10 * 1000;
var LAST_LIGHT_ON_WINDOW = 10 * 1000;
var lastLightOn = 0;

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
    humidityCurve.push([{time: Date.now(), y: value}]);
  },
  "temperature": function (value) {
    temperatureCurve.push([{time: Date.now(), y: value}]);
    $("#temperatureValue").text(value+"°C");
  },
  "sound": function (value) {
    if (value > 0) {
      lastSound = Date.now();
    }
    var percent = value;
    $("#soundBarValue").css("height", (100*percent)+"%");
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

////////// Connect and handle the Stream ///////

function connect () {
  var source = new EventSource("http://zen-catacomb.herokuapp.com/stream");

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
    values: [{time: Date.now, y: 20}]
  }]
});

var humidityCurve = $("#humidityCurve").epoch({
  type: 'time.line',
  ticks: {left:4},
  axes: ['left'],
  historySize: 120,
  data: [{
    label: "Humidity",
    values: [{time: Date.now, y: 0.35}]
  }]
});

if (location.hash == "#munin") {
  document.querySelector(".munin").style.display = 'block';
}


connect();
