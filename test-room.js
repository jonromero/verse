tv({

  /* Version of the game you're supporting, and the title of your room. */
  version: 1,
  title: "First room",


  /* This is where you can import objects to use in your room. Some objects
     like "floor" and "wall" are imported automatically. */
  refs: {
    pebble: "inventory.js#pebble"
  },


  /* This is where you define the layout of your room. */
  map: [
    "       ###########################       ", 
    "       #.........................#       ",
    "       #.........................#       ",
    "       #.........................#       ",
    "       #.........................#       ",
    "       #.........................#       ",
    "       #.........................#       ",
    "       #.........................#       ",
    "       #............@............#       ",
    "       #.........................#       ",
    "       #.........................#       ",
    "       #.........................#       ",
    "       #.........................#       ",
    "       #.........................#       ",
    "       #.........................#       ",
    "       #.........................#       ",
    "       #.........................#       ",     
    "       ###########################       "
  ],


  /* The legend tells the game how to interpret the map. Each character
     corresponds to a type of object. */
  legend: {
    "#": {tile: "wall"},
    ".": {tile: "floor"},
    ",": {tile: "pebble", id: "magic-pebble"},
    "@": {tile: "start"},
    "A": {tile: "door", href: "/~yeti/yetiRoom.js"},
    "B": {tile: "door", href: "/~rogual/rooms/invmaze.js"},
    "C": {tile: "door", href: "/~rogual/hall.js"},
    "D": {tile: "door", href: "/~wootasaurus/tildventure/w-room.js"},
    "E": {tile: "door", href: "/~mayafish/dungeon.js"},
    "F": {tile: "door", href: "/~rogual/rooms/courtyard.js"},
    "G": {tile: "door", href: "/~troutcolor/thermal.js"},
    "H": {tile: "door", href: "/~owise1/js/room.js"}
  },


  /* Systems add new code to the game. In this object, you can specify which
     systems you want to use in your room, and give each one some arbitrary
     data.

     You don't have to stick to my systems; keys in this object are URLs so you
     can write your own systems, host them, and anyone can use them. */
  systems: {
    "systems/info.js": {
      info: "Welcome to PixelClub! Use WASD keys to move. " +
            " " +
            "columns support a vaulted stone ceiling."
    },
    "inventory.js#system": {
    }
  },

  init: function(ng) {
    console.log(ng.state.room.spec.refs);
    console.log('n',ng.state);
    return {enterRoom: function() {}};
  }

});
