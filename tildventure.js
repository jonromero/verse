void function() {

/* API */

var ng = {
  urlparse: urlparse,
  urlfmt: urlfmt,
  urleq: urleq,
  absurl: absurl,
  get: get,
  getRoomSpec: getRoomSpec,
  spaceNear: spaceNear,
  neighbours: neighbours,
  save: save,
  load: load,
  objectsAt: objectsAt,
  removeObject: removeObject,
  moveObject: moveObject,
  solidAt: solidAt,
  addObject: addObject,
  choose: choose
};


/* Utilities */

function addToList(obj, key, item) {
  var list = obj[key] = obj[key] || [];
  list.push(item);
}

function table(hdr) {
  var rows = _.toArray(arguments).slice(1);
  return rows.map(_.partial(_.object, hdr));
}

function randint(n) {
  return Math.floor(Math.random() * n);
}

function choose(xs) {
  return xs[Math.floor(Math.random() * xs.length)];
}


/* URLs */

function joinpath(a, b) {
  if (b.charAt(0) == '/')
    return b;
  return a.replace(/\/[^\/]*$/, '/') + b;
}

function absurl(url, relativeTo) {
  url = urlparse(url);
  relativeTo = urlparse(relativeTo);

  /* If running locally, interpret abs. URLs as server URLs */
  if (relativeTo.proto == 'file' && url.path.charAt(0) == '/') {
    relativeTo = urlparse('http://totallynuclear.club' + relativeTo.path);
  }

  var path = joinpath(relativeTo.path, url.path);
  return _.assign(_.defaults({}, url, relativeTo), {path: path});
}

function urlparse(url) {
  if (typeof(url) == 'object') return url;
  var m = /^((?:([a-z]+):)?\/\/([^\/]*))?(.*?)?(?:#(.*))?$/.exec(url);

  var r = {
    proto: m[2],
    domain: m[3],
    path: m[4],
    hash: m[5]
  };

  /* If running locally, interpret links to my stuff as file: links */
  if (window.location.href.indexOf('file://') == 0) {
    m = /^\/~rogual\/(.*)$/.exec(m[4]);
    if (m) {
      r = _.assign({}, clientUrl, {
        path: joinpath(clientUrl.path, m[1]),
        hash: r.hash
      });
    }
  }

  return r;
}

function urlfmt(o) {
  if (typeof(o) == 'string')
    return o;

  var r = '';
  if (o.proto) r += o.proto + ':';
  if (o.domain !== undefined) r += '//' + o.domain;
  if (o.path) r += o.path;
  if (o.hash) r += '#' + o.hash;
  return r;
}

function urleq(a, b) {
  return urlfmt(urlparse(a)) == urlfmt(urlparse(b));
}

var clientUrl = urlparse(window.location.href);

function localurl(url) {
  return urlfmt(absurl(url, clientUrl));
}


/* JSONP */

var jsonpQueue = [];

function doJsonp() {
  var item = jsonpQueue[0];
  var script = document.createElement('script');
  script.setAttribute('src', item.url);

  var to = setTimeout(fail, 1000);

  function fail() {
    item.cb('JSONP load failed');
    next();
  }

  function next() {
    jsonpQueue.shift();
    if (jsonpQueue.length)
      doJsonp();
  }

  window.tv = function(data) {
    document.body.removeChild(script);
    clearTimeout(to);
    item.cb(null, data);
    next();
  };
  _.assign(window.tv, ng);
  document.body.appendChild(script);
}

function jsonp(url, cb) {
  jsonpQueue.push({url: urlfmt(url), cb: cb});
  if (jsonpQueue.length == 1)
    doJsonp();
}


/* Comms */

var moduleCache = {};

function get(url, cb) {

  url = urlparse(url);

  var urlStr = urlfmt(url);

  if (moduleCache[urlStr]) {
    cb(null, moduleCache[urlStr]);
    return;
  }

  jsonp(url, function(err, result) {
    url = urlparse(url);
    if (err)
      return cb(err);

    // Module style
    if (result.type == 'module' && result.version == 1 && result.def) {
      var r = {};
      result.def(r);
      _.forEach(r, function(value) {
        value._moduleUrl = urlfmt(_.assign({}, url, {hash: undefined}));
      });
      result = r;
    }

    if (url.hash)
      result = result[url.hash];

    moduleCache[urlStr] = result;

    cb(null, result);
  });
}


/* Vectors */

function vadd(a, b) { return [a[0]+b[0], a[1]+b[1]]; }
function vsub(a, b) { return [a[0]-b[0], a[1]-b[1]]; }
function vscale(a, f) { return [a[0]*f, a[1]*f]; }

function iterect(p0, p1, cb) {
  for (var x=p0[0]; x<p1[0]; x++)
  for (var y=p0[1]; y<p1[1]; y++) cb([x, y]);
}


/* Persistence */

var ns = '~rogual/tildventure';

function save(obj) {
  localStorage[ns] = JSON.stringify(_.merge({}, load(), obj));
}

function load() {
  try {
    return JSON.parse(localStorage[ns]);
  }
  catch (e) {
    return {};
  }
}

function reset() {
  localStorage[ns] = '{}';
}


/* Graphics */

function mkscreen(canvas) {
  canvas.webkitImageRendering = '-webkit-optimize-contrast';
  var context = canvas.getContext('2d');
  return {canvas: canvas, context: context, ts: 20};
}

var colors = _.indexBy(table(
  ['name', 'h', 's', 'l'],
  ['red', 0, 50, 50],
  ['crimson', 350, 50, 25],
  ['brown', 20, 20, 40],
  ['orange', 20, 50, 50],
  ['yellow', 45, 75, 50],
  ['green', 90, 50, 50],
  ['cyan', 165, 55, 60],
  ['blue', 180, 50, 50],
  ['white', 20, 20, 90],
  ['grey', 20, 5, 45],
  ['earth', 20, 20, 45],
  ['midnight', 180, 40, 10]
), 'name');

function col(hsl, object) {
  if (!object._light)
    object._light = {
      h: randint(10),
      s: randint(10),
      l: randint(10)
    };
  var h = hsl.h + object._light.h;
  var s = hsl.s + object._light.s;
  var l = hsl.l + object._light.l;
  return 'hsl(' + h + ', ' + s + '%, ' + l + '%)';
}

function parseColor(str, obj) {
  var hsl = colors[str];
  if (hsl)
    return col(hsl, obj);
  return str;
}

function worldToScreen(screen, pos) {
  return vscale(vsub(pos, screen.offset), screen.ts);
}

function drawColor(screen, pos, color) {
  var xy = worldToScreen(screen, pos);
  var ts = screen.ts;
  screen.context.fillStyle = color;
  screen.context.fillRect(xy[0], xy[1], ts, ts);
}

function drawGraphic(screen, pos, graphic, obj) {
  if (graphic.bg)
    drawColor(screen, pos, parseColor(graphic.bg, obj));

  var xy = worldToScreen(screen, vadd(pos, [.5, .5]));
  var ts = screen.ts;

  if (graphic.glyph) {
    screen.context.fillStyle = graphic.fg ? parseColor(graphic.fg, obj) : '#fff';
    screen.context.textAlign = 'center';
    screen.context.textBaseline = 'middle';
    screen.context.font = '16px Monaco, Consolas, monospace';
    screen.context.fillText(graphic.glyph, xy[0], xy[1], ts);
  }
}

function drawEmpty(screen, room, pos) {
  drawColor(screen, pos, '#222');
}

function drawObject(screen, room, pos, object) {
  if (object.graphic) {
    if (typeof(object.graphic) == 'string')
      drawColor(screen, pos, col(colors[object.graphic], object));
    else
      drawGraphic(screen, pos, object.graphic, object);
  }
}

function drawCell(screen, room, pos) {
  var cell = room.cells[pos] || [];

  if (cell.length === 0) {
    drawEmpty(screen, room, pos);
  }
  else {
    cell.forEach(function(object) {
      drawObject(screen, room, pos, object);
    });
  }
}

function draw(state) {
  var screen = state.screen;
  var room = state.room;

  var ts = screen.ts;

  var cam = state.player ? state.player.pos : [0, 0];

  var screenSize = [
    Math.ceil(screen.width / ts),
    Math.ceil(screen.height / ts)
  ];

  var halfSize = [
    Math.ceil(screenSize[0] / 2),
    Math.ceil(screenSize[1] / 2)
  ];

  var pos0 = vsub(cam, halfSize);
  var pos1 = vadd(cam, halfSize);

  screen.offset = pos0;

  iterect(pos0, pos1, _.partial(drawCell, screen, room));
}

function resize(state) {
  var screen = state.screen;
  var r = screen.canvas.getBoundingClientRect();
  var b = document.body.getBoundingClientRect();

  var w = screen.width = b.width;
  var h = screen.height = b.height - r.top;

  screen.canvas.style.width = w + 'px';
  screen.canvas.style.height = h + 'px';

  var ratio = window.devicePixelRatio || 1;

  screen.canvas.width = w * ratio;
  screen.canvas.height = h * ratio;

  screen.context.scale(ratio, ratio);

  draw(state);
}


/* Room */

function makeEmptyRoom() {
  return {objects: [], dead: [], cells: {}};
}

function syscall(room, funcName) {
  var args = _.toArray(arguments).slice(2);
  (room.systems || []).forEach(function(sys) {
    (sys[funcName] || _.identity).apply(null, args);
  });
}

function addObject(room, object) {
  room.objects.push(object);
  addToList(room.cells, object.pos, object);
}

function removeObjectNow(room, object) {
  _.remove(room.objects, object);
  _.remove(room.cells[object.pos], object);
}

function moveObject(room, object, pos) {
  removeObjectNow(room, object);
  object.pos = pos;
  addObject(room, object);
}

function removeObject(room, object) {
  room.dead.push(object);
}

function removeDeadObjects(room) {
  room.dead.forEach(function(o) {
    _.remove(room.cells[o.pos], o);
  });
  room.objects = room.objects.filter(function(o) {
    return !_.contains(room.dead, o);
  });
  room.dead = [];
}

function withObjects(room, cb) {
  cb(room.objects);
}

function objectsAt(room, pos) {
  return room.cells[pos] || [];
}

var defaultRefs = _.object(_.map(
  ['wall', 'floor', 'player', 'start', 'door'],
  function(name) {
    return [name, localurl('objects.js') + '#' + name];
  }
));


function resolveRefs(spec, cb) {

  if (spec.resolved) {
    cb(null, spec);
    return;
  }
  spec.resolved = true;

  async.map(
    _.pairs(_.assign({}, defaultRefs, spec.refs)),
    function(item, cb) {
      var name = item[0], url = item[1];

      url = absurl(url, spec.location);
      get(url, function(err, result) {
        if (err)
          cb(err);
        else
          cb(null, [name, result]);
      });
    },
    function(err, results) {
      if (err)
        cb(err);
      else {
        spec.refs = _.object(results);
        cb(null, spec);
      }
    }
  );
}

function loadSystems(spec, cb) {

  if (spec.loadedSystems) {
    cb(null, spec);
    return;
  }

  async.map(
    _.pairs(spec.systems || {}),
    function(item, cb) {
      var url = item[0];
      var sysSpec = item[1];
      url = absurl(url, spec.location);
      get(url, function(err, sysdef) {
        if (err)
          cb(err);
        else {
          cb(null, {def: sysdef, spec: sysSpec});
        }
      });
    },
    function(err, systems) {
      if (err)
        cb(err);
      else {
        spec.systems = systems;
        spec.loadedSystems = true;
        cb(null, spec);
      }
    }
  );
}

function getRoomSpec(url, cb) {
  get(url, function(err, spec) {

    if (err)
      return cb(err);

    spec.location = urlfmt(url);

    async.series(
      [
        _.partial(resolveRefs, spec),
        _.partial(loadSystems, spec)
      ],
      function(err) {
        cb(err, spec);
      }
    );
  });
}

function neighbours(x) {
  var r = [];
  iterect([-1, -1], [2, 2], function(d) {
    if (!d[0] != !d[1])
      r.push(vadd(x, d));
  });
  return r;
}

function solidAt(room, pos, interloper) {
  var objs = objectsAt(room, pos);

  if (objs.length == 0)
    return true;

  return _.any(objs, function(obj) {
    return obj.solid && obj.solid(ng, obj, interloper);
  });
}

function spaceNear(room, pos, vagrant) {
  return _.find(neighbours(pos), function(pos) {
    return !solidAt(room, pos, vagrant);
  });
}

function makeRoomFromSpec(spec) {
  var room = makeEmptyRoom();

  room.spec = spec;

  var width = _.max(spec.map.map(function(line) { return line.length; }));

  var sz = [
    width,
    spec.map.length
  ];

  var autoIds = {};

  iterect([0, 0], sz, function(pos) {
    var glyph = spec.map[pos[1]].charAt(pos[0]);

    if (glyph == '')
      return;

    var tile = spec.legend[glyph];

    if (tile) {

      if (!tile.tile) {
        console.warn("'" + glyph + "' does not appear to be a map tile");
      }

      var object = _.assign({}, tile, {pos: pos});
      var ref = (spec.objects || {})[object.tile] || spec.refs[object.tile];

      _.assign(object, ref);

      if (object.floor !== false) {
        addObject(room, _.assign({}, spec.refs.floor, {pos:pos}));
      }

      if (!object.id) {
        var i = autoIds[object.tile] || 0;
        autoIds[object.tile] = i + 1;
        object.id = spec.location + '#' + object.tile + '.' + i;
      }

      addObject(room, object);

      if (object.init) {
        var ong = _.assign({
          url: _.partialRight(absurl, spec.location)
        }, ng);
        object.init(ong, object);
      }
    }
    else if (glyph != ' ') {
      console.warn("Symbol '" + glyph +"' in map has no meaning");
    }
  });

  return room;
}


/* Init */

function init() {
  var state = ng.state = {};

  ng.redraw = _.partial(draw, state);

  var startingRoom = load().room;

  if (!startingRoom)
    if (window.location.href.indexOf('tilde.camp') != -1)
      startingRoom = localurl('byzantine-hall.js');
    else
      startingRoom = localurl('test-room.js');

  getRoomSpec(startingRoom, function(err, roomSpec) {

    if (err) {
      return;
    }

    function getStartPos(room) {
      return load().pos || _.find(room.objects, {tile: 'start'}).pos;
    }

    function gotoRoomSpec(roomSpec, getStartPos) {

      var room = makeRoomFromSpec(roomSpec);

      var startPos = getStartPos(room);

      if (state.room)
        syscall(state.room, 'cleanup', state, room);

      state.room = room;

      var player = state.player = {
        tile: 'player',
        graphic: {
          bg: 'yellow',
          fg: 'red',
          glyph: '@'
        },
        pos: startPos
      };
      addObject(room, player);

      var m;
      m = /(~.*?)(\/|$)/.exec(roomSpec.location);
      var ownerName = m ? m[1] : "~nobody";

      m = /^[a-z]+:\/+(.*?)\//.exec(roomSpec.location);
      var domain = m ? m[1] : "nowhere";

      var domainElem = document.getElementById('domain');
      domainElem.textContent = domain;

      var ownerElem = document.getElementById('owner');
      ownerElem.href = '/' + ownerName;
      ownerElem.textContent = ownerName;

      var locationElem = document.getElementById('location');
      locationElem.textContent = roomSpec.title || "The Room Without A Name";

      /* Load room systems */
      room.systems = roomSpec.systems.map(
        function (sys) { return sys.def.init(ng, sys.spec); }
      );

      /* Load sticky systems */
      _.forEach(load().systems || {}, function(spec, url) {
        get(url, function(err, sysdef) {
          if (!_.contains(_.map(roomSpec.systems, 'def'), sysdef))
            room.systems.push(sysdef.init(ng, spec));
        });
      });

      if (roomSpec.init)
        room.systems.push(roomSpec.init(ng, room));

      syscall(room, 'enterRoom', state, room);

      save({room: roomSpec.location, pos: state.player.pos});
      removeDeadObjects(room);
      draw(state);
    }

    ng.gotoRoomSpec = gotoRoomSpec;

    function move(diff) {
      var room = state.room;
      var player = state.player;

      var next = vadd(player.pos, diff);
      if (solidAt(room, next)) {
        _.forEach(objectsAt(room, next), function(obj) {
          if (obj.bump)
            obj.bump(ng, obj, player);
        });
        return;
      }

      moveObject(room, player, next);

      _.forEach(objectsAt(room, next), function(obj) {
        if (obj.enter)
          obj.enter(ng, obj, player);
      });

      syscall(room, 'playerMoved', player, state, room);

      removeDeadObjects(room);
      draw(state);
    }

    window.addEventListener('keydown', function(e) {
      var ch = String.fromCharCode(e.keyCode);
      if (ch == 'W') move([0, -1]);
      if (ch == 'S') move([0,  1]);
      if (ch == 'A') move([-1, 0]);
      if (ch == 'D') move([ 1, 0]);
      if (ch == 'R') {
        reset();
        window.location.reload();
      }

      syscall(state.room, 'keydown', e, ch);
    });

    var canvas = document.getElementById('game');
    state.screen = mkscreen(canvas);

    gotoRoomSpec(roomSpec, getStartPos);

    resize(state);
    window.addEventListener('resize', _.partial(resize, state));

  });
}

init();


}();
