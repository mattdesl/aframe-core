var registerComponent = require('../core/register-component').registerComponent;
var requestInterval = require('request-interval');
var THREE = require('../../lib/three');

module.exports.Component = registerComponent('raycaster', {
  init: {
    value: function () {
      this.raycaster = new THREE.Raycaster();
      this.intersectedEl = null;
      this.pollForHoverIntersections();
    }
  },

  pollForHoverIntersections: {
    value: function () {
      requestInterval(100, this.getIntersections.bind(this));
    }
  },

  getIntersections: {
    value: function () {
      var closest = this.getClosestIntersected();
      if (closest) {
        this.handleIntersection(closest);
        return;
      }
      // If we have no intersections other than the cursor itself,
      // but we still have a previously intersected element, clear it.
      if (this.intersectedEl) {
        this.clearExistingIntersection();
      }
    }
  },

  intersect: {
    value: function (objects) {
      var el = this.el;
      var raycaster = this.raycaster;
      var cursor = el.object3D;
      var parent = el.parentNode.object3D;
      var originPosition = new THREE.Vector3().setFromMatrixPosition(parent.matrixWorld);
      var cursorPosition = new THREE.Vector3().setFromMatrixPosition(cursor.matrixWorld);
      var direction = cursorPosition.sub(originPosition).normalize();
      raycaster.set(originPosition, direction);
      return raycaster.intersectObjects(objects, true);
    }
  },

  /**
   * Returns the closest intersected object.
   *
   * @returns {Object|null}
   *   The closest intersected element that is not the cursor itself.
   *   If no objects are intersected, `null` is returned.
   */
  getClosestIntersected: {
    value: function () {
      var scene = this.el.sceneEl.object3D;
      var cursorEl = this.el;
      var inersectedObj;
      var intersectedObjs = this.intersect(scene.children);
      for (var i = 0; i < intersectedObjs.length; ++i) {
        inersectedObj = intersectedObjs[i];
        // If the intersected object is the cursor itself
        // or the object is further than the max distance
        if (inersectedObj.object.el === cursorEl) { return; }
        return intersectedObjs[i];
      }
      return null;
    }
  },

  /**
   * Remembers the last intersected element
   */
  setExistingIntersection: {
    value: function (el, distance) {
      this.intersectedEl = el;
      this.el.emit('intersection', { el: el, distance: distance });
    }
  },

  /**
   * Emits a `mouseleave` event and clears info about the last intersection.
   */
  clearExistingIntersection: {
    value: function () {
      var intersectedEl = this.intersectedEl;
      this.el.emit('intersectioncleared', { el: intersectedEl });
      this.intersectedEl = null;
    }
  },

  handleIntersection: {
    value: function (obj) {
      var el = obj.object.el;

      // A new intersection where previously a different element was
      // and now needs a mouseleave event.
      if (this.intersectedEl !== el) {
        this.clearExistingIntersection();
      }
      this.setExistingIntersection(el, obj.distance);
    }
  }

});