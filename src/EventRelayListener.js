var objectReject = function (object, callable) {
  if (callable === undefined) {
    throw new Error('[EventRelayListener] Could not find callable.');
  }

  for (var key in object) {
    if (callable(object[key], key, object)) {
      delete object[key];
    }
  }

  return object;
};

var initActions = function (isGlobal) {
  if (!EventRelayListener.__proto__._actions) {
    EventRelayListener.__proto__._actions = {};
  }

  return isGlobal ? EventRelayListener.__proto__._actions : {};
};

window.EventRelayListener = function (isGlobal) {
  var _actionListener = new Function();
  var _actionDto = function (index, type, action, responseDto) {
    return {
      index: index,
      type: type,
      action: action,
      time: new Date(),
      response: responseDto
    };
  };
  var _responseDto = function (isPassed, message) {
    return {
      isPassed: isPassed === true,
      message: message || ''
    };
  };

  var _actions = initActions(isGlobal === true);

  return {
    initActions: function (actions) {
      _actions = objectReject(_actions, function () {
        return true;
      });

      for(var key in actions) {
        _actions[key] = actions[key];
      }
      return true;
    },
    addAction: function (action, callable) {
      if (_actions[action]) {
        throw new Error('[EventRelayListener] Action already exists.');
      }
      _actions[action] = callable;
      return true;
    },
    removeAction: function (actionToRemove) {
      if (!_actions[actionToRemove]) {
        throw new Error('[EventRelayListener] Can not find action type: ' + actionToRemove);
      }

      _actions = objectReject(_actions, function (action, key) {
        return key === actionToRemove;
      });

      return true;
    },
    on: function (eventType, callable) {
      if (typeof eventType === 'function') {
        _actionListener = callable;
      }
    },
    listener: function (event, actions) {
      var eventResponse = false;
      actions = actions || (event.currentTarget.getAttribute('data-actions') || '').split(' ');

      actions.every(function (actionType, index) {
        var actionEvent = _actions[actionType];
        var rawResponse = [false, 'Unknown Error!'];
        var response = new _responseDto();

        if (!actionEvent) {
          window.console.warn('[EventRelayListener] Can not find action type: ' + actionType);
          return true;
        }

        try {
          rawResponse = actionEvent(event);
        } catch (error) {
          rawResponse = [false, error.message];
        }

        response = _responseDto.apply(null, rawResponse);
        _actionListener(new _actionDto(index, actionType, actionEvent, response));

        return eventResponse = response.isPassed;
      });

      return eventResponse;
    }
  };
};