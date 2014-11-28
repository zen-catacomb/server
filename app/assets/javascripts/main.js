
var sensors = {
  "light": function (state) {
    $("#lightValue")
      .text(state ? "PLAYING" : "DEAD")
      .attr("class", "value "+(!!state));

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
  }
};

function MOCK () {
  setInterval(function () {
    $.post("/light/"+(Math.random() > 0.3 ? 1 : 0));
    $.post("/humidity/"+Math.floor(Math.random() * 100));
    $.post("/temperature/"+Math.floor(15 + Math.random() * 10));
    $.post("/sound/"+Math.floor(15 + Math.random() * 40));
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
  ticks: 5,
  axes: ['left'],
  data: [{
    label: "Temperature",
    values: [{time: Date.now, y: 0}]
  }]
});

var humidityCurve = $("#humidityCurve").epoch({
  type: 'time.line',
  ticks: 5,
  axes: ['left'],
  data: [{
    label: "Humidity",
    values: [{time: Date.now, y: 0}]
  }]
});


connect();
