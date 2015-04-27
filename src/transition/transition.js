import "../arrays/map";
import "../core/subclass";
import "../core/true";
import "../event/dispatch";
import "../event/timer";
import "../selection/selection";
import "../selection/transition";
import "../selection/interrupt";

export function subUnitTransition(groups, ns, id) {
  d3_subclass(groups, subUnitTransitionPrototype);

  // Note: read-only!
  groups.namespace = ns;
  groups.id = id;

  return groups;
}

var subUnitTransitionPrototype = [],
    subUnitTransitionId = 0,
    subUnitTransitionInheritId,
    subUnitTransitionInherit;

subUnitTransitionPrototype.call = d3_selectionPrototype.call;
subUnitTransitionPrototype.empty = d3_selectionPrototype.empty;
subUnitTransitionPrototype.node = d3_selectionPrototype.node;
subUnitTransitionPrototype.size = d3_selectionPrototype.size;

d3.transition = function(selection, name) {
  return selection && selection.transition
      ? (subUnitTransitionInheritId ? selection.transition(name) : selection)
      : d3.selection().transition(selection);
};

d3.transition.prototype = subUnitTransitionPrototype;

import "select";
import "selectAll";
import "filter";
import "attr";
import "style";
import "text";
import "remove";
import "ease";
import "delay";
import "duration";
import "each";
import "subtransition";
import "tween";

function subUnitTransitionNamespace(name) {
  return name == null ? "__transition__" : "__transition_" + name + "__";
}

function subUnitTransitionNode(node, i, ns, id, inherit) {
  var lock = node[ns] || (node[ns] = {active: 0, count: 0}),
      transition = lock[id];

  if (!transition) {
    var time = inherit.time;

    transition = lock[id] = {
      tween: new d3_Map,
      time: time,
      delay: inherit.delay,
      duration: inherit.duration,
      ease: inherit.ease,
      index: i
    };

    inherit = null; // allow gc

    ++lock.count;

    d3.timer(function(elapsed) {
      var delay = transition.delay,
          duration,
          ease,
          timer = d3_timer_active,
          tweened = [];

      timer.t = delay + time;
      if (delay <= elapsed) return start(elapsed - delay);
      timer.c = start;

      function start(elapsed) {
        if (lock.active > id) return stop();

        var active = lock[lock.active];
        if (active) {
          --lock.count;
          delete lock[lock.active];
          active.event && active.event.interrupt.call(node, node.__data__, active.index);
        }

        lock.active = id;

        transition.event && transition.event.start.call(node, node.__data__, i);

        transition.tween.forEach(function(key, value) {
          if (value = value.call(node, node.__data__, i)) {
            tweened.push(value);
          }
        });

        // Deferred capture to allow tweens to initialize ease & duration.
        ease = transition.ease;
        duration = transition.duration;

        d3.timer(function() { // defer to end of current frame
          timer.c = tick(elapsed || 1) ? d3_true : tick;
          return 1;
        }, 0, time);
      }

      function tick(elapsed) {
        if (lock.active !== id) return 1;

        var t = elapsed / duration,
            e = ease(t),
            n = tweened.length;

        while (n > 0) {
          tweened[--n].call(node, e);
        }

        if (t >= 1) {
          transition.event && transition.event.end.call(node, node.__data__, i);
          return stop();
        }
      }

      function stop() {
        if (--lock.count) delete lock[id];
        else delete node[ns];
        return 1;
      }
    }, 0, time);
  }
}