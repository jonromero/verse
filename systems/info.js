tv({
  version: 1,
  type: "system",

  init: function(ng, spec) {

    var elem = document.createElement('div');
    elem.className = 'popup';
    document.body.appendChild(elem);
    _.assign(elem.style, {
      position: 'absolute',
      top: '100px',
      right: '30px',
      width: '200px',
    });

    return {

      cleanup: function() {
        document.body.removeChild(elem);
      },

      enterRoom: function() {
        elem.textContent = spec.info;
      }

    };

  }

});
