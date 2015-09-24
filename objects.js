tv({

  wall: {
    floor: false,
    graphic: 'white',
    solid: _.constant(true)
  },

  floor: {
    floor: false,
    graphic: {
      bg: 'midnight',
      fg: 'rgba(255, 255, 255, 0.5)',
      glyph: '.'
    }
  },

  start: {
    floor: false,
    graphic: {
      bg: 'midnight',
      fg: 'rgba(255, 255, 255, 0.5)',
      glyph: '.'
    }
  },

  door: {
    floor: false,
    graphic: {
      bg: 'brown',
      fg: 'white',
      glyph: '…'
    },
    init: function(ng, door) {

      if (door.href == '#')
        door.graphic = {glyph: '#', fg: 'black', bg: 'brown'};
      else
        ng.getRoomSpec(ng.url(door.href), function(err, subSpec) {
          if (err) {
            door.graphic = {glyph: 'x', fg: 'white', bg: 'red'};
          }
          else {
            door.graphic = {glyph: ' ', fg: 'red', bg: 'brown'};
            door.spec = subSpec;
          }
          ng.redraw();
        });
    },
    solid: function(ng, door) {
      return !door.spec;
    },
    enter: function(ng, door) {
      var spec = door.spec;
      var state = ng.state;
      if (spec)
        ng.gotoRoomSpec(spec, function(room) {
          var from = ng.urlparse(state.room.spec.location);

          from = ng.urlfmt(from);

          var door = _.find(room.objects, function(obj) {
            return ng.urleq(from, ng.absurl(obj.href, spec.location));
          });

          if (door)
            return ng.spaceNear(room, door.pos, state.player);

          console.error(
            'No door?', spec, from,
            _.filter(room.objects, {tile: 'door'}).map(function(x) {
              return ng.absurl(x.href, spec.location);
            })
          );
          return [0, 0];
        });
    }
  }

});
