tv({
  type: "module",
  version: 1,
  def: function(module) {

    var ns = '~rogual/inventory';
    var nsSel = ns + '/sel';


    var elem = document.createElement('div');
    elem.id = 'rogual-inventory';
    elem.className = 'popup';
    _.assign(elem.style, {
      position: 'absolute',
      bottom: '80px',
      left: '20px',
      display: 'none'
    });
    document.body.appendChild(elem);


    /* Show item as element in inv window */
    function show(item, selected) {
      var el = document.createElement('span');
      _.assign(el.style, {
        color: 'cyan',
        cursor: 'help'
      });

      if (selected)
        el.style.backgroundColor = '#555';

      el.textContent = item.graphic.glyph;
      el.title = item.name || '???';
      return el;
    }


    /* Update inv window */
    function redraw(ng) {
      elem.textContent = 'Inventory: ';
      var sel = getsel(ng);
      module.get(ng).forEach(function(item, i) {
        var on = (i == sel);
        elem.appendChild(show(item, on));
      });
    }


    /* get index of selected item */
    function getsel(ng) {
      return ng.load()[nsSel] || 0;
    }


    /* change which item is selected */
    function setsel(ng, i) {
      var n = module.get(ng).length;
      var s = {};
      s[nsSel] = i % n;
      ng.save(s);
      redraw(ng);
    }


    /* move selection cursor */
    function movesel(ng, diff) {
      setsel(ng, getsel(ng) + diff);
    }


    function getSelectedItem(ng, player) {
      var i = getsel(ng);
      var inv = module.get(ng, player);
      return inv[i];
    }


    /* Items are stuffed wholesale into local storage so we can't just
       have a use() method on the item. This workaround is a bit long-
       winded... */
    function useSelectedItem(ng, player) {
      var item = getSelectedItem(ng, player);
      var url = item.use;
      if (url) {

        if (url.charAt(0) != '#')
          throw new Error("Bad use URL -- local IDs only for now");

        var name = url.substr(1);

        ng.get(item._moduleUrl, function(err, mod) {
          if (err) {
            return;
          }
          var use = mod[name];
          use(ng, player);
        });
      }
    }


    module.canPickUp = function(player, item) {
      return item[ns] ? true : false;
    };


    /* Call this to add an item to the player's inventory. The 'player'
       param is ignored for now and items always go to the player. Other
       objects may be able to have inventories later. */
    module.add = function(ng, player, item) {
      var inv = module.get(ng, player);
      inv.push(item);

      var s = {};
      s[ns] = inv;
      ng.save(s);
      redraw(ng);
    };


    /* Get all objects in inventory */
    module.get = function(ng) {
      return ng.load()[ns] || [];
    };


    /* Simple item to test inventory system */
    module.pebble = {
      "~rogual/inventory": {
        weight: 1
      },
      name: "Pebble",
      graphic: {
        glyph: ',',
        fg: '#0ff',
        bg: 'midnight'
      }
    };


    /* System allowing picking up of items */
    module.system = {
      init: function(ng) {
        elem.style.display = '';
        redraw(ng);

        /* Stick this system to the player so it loads in all
           future rooms they visit. */
        ng.save({
          systems: {
            '/~rogual/inventory.js#system': {}
          }
        });

        return {
          cleanup: function() {
            elem.style.display = 'none';
          },
          enterRoom: function(state, room) {
            var inv = module.get(ng);
            var ids = _.indexBy(inv, 'id');
            _.forEach(room.objects, function(obj) {
              if (obj.id && ids[obj.id]) {
                ng.removeObject(room, obj);
              }
            });
          },
          playerMoved: function(player, state, room) {
            _.forEach(ng.objectsAt(room, player.pos), function(o) {
              if (module.canPickUp(player, o)) {
                ng.removeObject(room, o);
                module.add(ng, player, o);
              }
            });
          },
          keydown: function(e, str) {
            if (str == 'Z') {
              e.preventDefault();
              movesel(ng, -1);
            }
            if (str == 'X') {
              e.preventDefault();
              movesel(ng, 1);
            }
            if (str == 'E' || str == 'J') {
              e.preventDefault();
              useSelectedItem(ng);
            }
          }
        };
      }
    };

  }

});
