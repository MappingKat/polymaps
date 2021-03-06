po.compass = function() {
  var compass = {},
      g,
      ticks = {},
      r = 30,
      speed = 16,
      last = 0,
      repeatDelay = 250,
      repeatInterval = 50,
      position = "top-left", // top-left, top-right, bottom-left, bottom-right
      zoomStyle = "small", // none, small, big
      panStyle = "small", // none, small
      panTimer,
      panDirection,
      map;

  function panStart(e) {
    g.setAttribute("class", "compass active");
    if (!panTimer) {
      panTimer = setInterval(function() {
        if (panDirection && (Date.now() > last + repeatDelay)) {
          map.panBy(panDirection);
        }
      }, repeatInterval);
    }
    if (panDirection) map.panBy(panDirection);
    last = Date.now();
    cancel(e);
  }

  function panStop() {
    g.setAttribute("class", "compass");
    if (panTimer) {
      clearInterval(panTimer);
      panTimer = 0;
    }
  }

  function panBy(x) {
    return function() {
      x ? this.setAttribute("class", "active") : this.removeAttribute("class");
      panDirection = x;
    };
  }

  function zoomBy(x) {
    return function(e) {
      g.setAttribute("class", "compass active");
      var z = map.zoom();
      map.zoom(x < 0 ? Math.ceil(z) - 1 : Math.floor(z) + 1);
      cancel(e);
    };
  }

  function zoomTo(x) {
    return function(e) {
      map.zoom(x);
      cancel(e);
    };
  }

  function zoomOver() {
    this.setAttribute("class", "active");
  }

  function zoomOut() {
    this.removeAttribute("class");
  }

  function cancel(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  function pan(by) {
    var x = Math.SQRT1_2 * r,
        y = r * .7,
        z = r * .2,
        g = po.svg("g"),
        dir = g.appendChild(po.svg("path")),
        chv = g.appendChild(po.svg("path"));
    dir.setAttribute("class", "direction");
    dir.setAttribute("pointer-events", "all");
    dir.setAttribute("d", "M0,0L" + x + "," + x + "A" + r + "," + r + " 0 0,1 " + -x + "," + x + "Z");
    chv.setAttribute("class", "chevron");
    chv.setAttribute("d", "M" + z + "," + (y - z) + "L0," + y + " " + -z + "," + (y - z));
    chv.setAttribute("pointer-events", "none");
    g.addEventListener("mousedown", panStart, false);
    g.addEventListener("mouseover", panBy(by), false);
    g.addEventListener("mouseout", panBy(null), false);
    g.addEventListener("dblclick", cancel, false);
    return g;
  }

  function zoom(by) {
    var x = r * .4,
        y = x / 2,
        g = po.svg("g"),
        back = g.appendChild(po.svg("path")),
        dire = g.appendChild(po.svg("path")),
        chev = g.appendChild(po.svg("path")),
        fore = g.appendChild(po.svg("path"));
    back.setAttribute("class", "back");
    back.setAttribute("d", "M" + -x + ",0V" + -x + "A" + x + "," + x + " 0 1,1 " + x + "," + -x + "V0Z");
    dire.setAttribute("class", "direction");
    dire.setAttribute("d", back.getAttribute("d"));
    chev.setAttribute("class", "chevron");
    chev.setAttribute("d", "M" + -y + "," + -x + "H" + y + (by > 0 ? "M0," + (-x - y) + "V" + -y : ""));
    fore.setAttribute("class", "fore");
    fore.setAttribute("fill", "none");
    fore.setAttribute("d", back.getAttribute("d"));
    g.addEventListener("mousedown", zoomBy(by), false);
    g.addEventListener("mouseover", zoomOver, false);
    g.addEventListener("mouseout", zoomOut, false);
    g.addEventListener("dblclick", cancel, false);
    return g;
  }

  function tick(i) {
    var x = r * .2,
        y = r * .4,
        g = po.svg("g"),
        back = g.appendChild(po.svg("rect")),
        chev = g.appendChild(po.svg("path"));
    back.setAttribute("pointer-events", "all");
    back.setAttribute("fill", "none");
    back.setAttribute("x", -y);
    back.setAttribute("y", -.75 * y);
    back.setAttribute("width", 2 * y);
    back.setAttribute("height", 1.5 * y);
    chev.setAttribute("class", "chevron");
    chev.setAttribute("d", "M" + -x + ",0H" + x);
    g.addEventListener("mousedown", zoomTo(i), false);
    g.addEventListener("dblclick", cancel, false);
    return g;
  }

  function move() {
    if (!g) return;
    var x = r + 6,
        y = x,
        size = map.size();
    switch (position) {
      case "top-left": break;
      case "top-right": x = size.x - x; break;
      case "bottom-left": y = size.y - y; break;
      case "bottom-right": x = size.x - x; y = size.y - y; break;
    }
    g.setAttribute("transform", "translate(" + x + "," + y + ")");
    for (var i in ticks) {
      i == map.zoom()
          ? ticks[i].setAttribute("class", "active")
          : ticks[i].removeAttribute("class");
    }
  }

  function draw() {
    g = map.container().appendChild(po.svg("g"));
    g.setAttribute("class", "compass");

    if (panStyle != "none") {
      var d = g.appendChild(po.svg("g"));
      d.setAttribute("class", "pan");

      var back = d.appendChild(po.svg("circle"));
      back.setAttribute("class", "back");
      back.setAttribute("r", r);

      var s = d.appendChild(pan({x: 0, y: -speed}));
      s.setAttribute("transform", "rotate(0)");

      var w = d.appendChild(pan({x: speed, y: 0}));
      w.setAttribute("transform", "rotate(90)");

      var n = d.appendChild(pan({x: 0, y: speed}));
      n.setAttribute("transform", "rotate(180)");

      var e = d.appendChild(pan({x: -speed, y: 0}));
      e.setAttribute("transform", "rotate(270)");

      var fore = d.appendChild(po.svg("circle"));
      fore.setAttribute("fill", "none");
      fore.setAttribute("class", "fore");
      fore.setAttribute("r", r);

      window.addEventListener("mouseup", panStop, false);
    }

    if (zoomStyle != "none") {
      var z = g.appendChild(po.svg("g"));
      z.setAttribute("class", "zoom");

      var j = -.5;
      if (zoomStyle == "big") {
        ticks = {};
        for (var i = map.zoomRange()[0], j = 0; i <= map.zoomRange()[1]; i++, j++) {
          (ticks[i] = z.appendChild(tick(i)))
              .setAttribute("transform", "translate(0," + (-(j + .75) * r * .4) + ")");
        }
      }

      var p = panStyle == "none" ? .4 : 2;
      z.setAttribute("transform", "translate(0," + r * (/^top-/.test(position) ? (p + (j + .5) * .4) : -p) + ")");
      z.appendChild(zoom(+1)).setAttribute("transform", "translate(0," + (-(j + .5) * r * .4) + ")");
      z.appendChild(zoom(-1)).setAttribute("transform", "scale(-1)");
    }
  }

  compass.radius = function(x) {
    if (!arguments.length) return r;
    r = x;
    return compass;
  };

  compass.speed = function(x) {
    if (!arguments.length) return r;
    speed = x;
    return compass;
  };

  compass.position = function(x) {
    if (!arguments.length) return position;
    position = x;
    return compass;
  };

  compass.pan = function(x) {
    if (!arguments.length) return panStyle;
    panStyle = x;
    return compass;
  };

  compass.zoom = function(x) {
    if (!arguments.length) return zoomStyle;
    zoomStyle = x;
    return compass;
  };

  compass.map = function(x) {
    if (!arguments.length) return map;
    map = x;
    map.on("move", move);
    map.on("resize", move);
    draw();
    move();
    return compass;
  };

  return compass;
};
