tv({
  version: 1,
  title: "Small Hall",

  map: [
    "                            ######       ",
    "                            #....C       ",
    "                    #E#######.####       ",
    "                    #............#       ",
    "                    #.#........#.###     ",
    "                    #.#....@...#...B     ",
    "             ########.#........#.###     ",
    "             D........#........#.#       ",
    "             #######.............#       ",
    "                   ######A########       ",
    "                                         "
  ],

  legend: {
    "#": {tile: "wall"},
    ".": {tile: "floor"},
    "@": {tile: "start"},
    "A": {tile: "door", href: "test-room.js"},
    "B": {tile: "door", href: "http://totallynuclear.club/~marcomastri/square.js"},
    "C": {tile: "door", href: "http://tilde.camp/~rogual/tildventure/byzantine-hall.js"},
    "D": {tile: "door", href: "interesting.js"},
    "E": {tile: "door", href: "/~mkaminsky/rooms/r1.js"}
  }


});
