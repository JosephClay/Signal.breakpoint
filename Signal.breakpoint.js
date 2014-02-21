/**!
 * Breakpoints.js
 *
 * Modified from:
 * https://github.com/xoxco/breakpoints.git
 *
 * Original plugin worked on a setInterval loop with
 * one giant function, where none of the jQuery variables
 * (notably window and body) were stored and were constantly
 * re-retrieved from the DOM.
 * 
 *  • Updated to work on window.resize which allows binding and unbinding of the window.
 *  • Array indexes were incorrectly being looped through by a for in statement, changed to for loop.
 *  • Added functionality for the plugin to clean its classes off of the body.
 *  • Created a proper defaults object and fixed $.extend so that defaults don't get polluted.
 *  • Sorted breakpoints on start instead of continually and setup a reverse loop to remove a sort step.
 *  • Variables are stored on start.
 *
 * Documentation:
 * http://xoxco.com/projects/code/breakpoints
 */
(function(Signal, $, window, undefined) {

	var _observable = Signal.core.construct(),
		
		/** @type {jQuery} */
		_window = $(window),

		/** @type {Number} */
		_width = Signal.window.getDimensions().width,
		
		/** @type {Number} */
		_currentBreakpoint,

		/**
		 * Timeout used for throttling
		 * @type {timeout}
		 */
		_timeout,
		
		_options,
		_defaults = {
			classBody: true,
			breakpoints: [ 320, 480, 768, 992, 1200 ]
		};

	// Configure | Get | Reset ------------------------------

	var _configure = function(settings) {
		_options = $.extend({}, _defaults, settings);
		
		/**
		 * Breakpoints are sorted so that smaller points
		 * fired in early and larger ones fired out early,
		 * which are the main use cases.
		 */
		_options.breakpoints = _numericSort(_options.breakpoints);

		_bind();
		_currentBreakpoint = _determineCurrentBreakpoint();
		_enterBreakpoint(_currentBreakpoint);
	};

	var _getConfig = function() {
		return JSON.parse(JSON.stringify(_options));
	};

	var _getCurrent = function() {
		return (_currentBreakpoint = _determineCurrentBreakpoint());
	};

	var _numericSort = function(arr) {
		return arr.sort(function(a, b) {
			return a - b;
		});
	};

	var _reset = function() {
		_unbind();		
		_exitBreakpoint(_currentBreakpoint);
		_currentBreakpoint = null;
		clearTimeout(_timeout);
	};

	// Bind | Unbind ------------------------------

	var _bind = function() {
		/**
		 * Instead of an interval set to run every 250ms,
		 * the 250ms is a configurable option to throttle
		 * the resize event.
		 */
		Signal.window.on('resize.breakpoint', function(e) {
			_width = e.width; // keep width up-to-date
			_resize();
		});
		
		_window.on('focus.breakpoint', _resize);
	};

	var _unbind = function() {
		Signal.window.off('resize.breakpoint');
		_window.off('focus.breakpoint');
	};

	/**
	 * Loop through breakpoints, going from the smallest
	 * to the largest, to determine which breakpoint the window
	 * is currently at.
	 * @return {Number} breakpoint || -1
	 */
	var _determineCurrentBreakpoint = function() {
		var breakpoints = _options.breakpoints,
			idx = 0, length = breakpoints.length,

			prevbreakpoint,
			breakpoint,
			nextbreakpoint;

		for (; idx < length; idx++) {
			prevbreakpoint =  breakpoints[idx - 1];
			breakpoint = breakpoints[idx];
			nextbreakpoint = breakpoints[idx + 1];

			// this is the first breakpoint and we're at it
			if (!prevbreakpoint && _width <= breakpoint) {
				return breakpoint;
			}

			// no next breakpoint. window is at the largest breakpoint available
			if (!nextbreakpoint) { return breakpoint; }

			// window is between two breakpoints
			if (_width >= breakpoint && _width < nextbreakpoint) {
				return breakpoint;
			}
		}

		return -1;
	};

	/**
	 * When the window resizes, determine if the breakpoint
	 * has changed. If it has, exit from the current breakpoint
	 * and enter the new one
	 */
	var _resize = function() {
		var resizeBreakpoint = _determineCurrentBreakpoint();
		// No change in breakpoint, stop
		if (resizeBreakpoint === _currentBreakpoint) { return; }

		// Breakpoint has changed
		_exitBreakpoint(_currentBreakpoint);
		_enterBreakpoint(resizeBreakpoint);
		_currentBreakpoint = resizeBreakpoint;
	};

	// Enter | Exit ------------------------------

	var _enterBreakpoint = function(breakpoint) {
		if (!breakpoint || breakpoint <= 0) { return; }

		if (_options.classBody) { _getBody().addClass('breakpoint-' + breakpoint); }

		_observable.trigger('enter' + breakpoint, breakpoint);
		_observable.trigger('enter', breakpoint);
	};

	var _exitBreakpoint = function(breakpoint) {
		if (!breakpoint || breakpoint <= 0) { return; }

		if (_options.classBody) { _getBody().removeClass('breakpoint-' + breakpoint); }

		_observable.trigger('exit' + breakpoint, breakpoint);
		_observable.trigger('exit', breakpoint);
	};

	/**
	 * Body, only needed if changing css classes
	 * @type {jQuery}
	 */
	var _body = null;
	var _getBody = function() {
		// Store the body once
		return _body || (_body = $('body'));
	};

	/** Expose to jquery */
	_observable.configure = _configure;
	_observable.getConfig = _getConfig;
	_observable.getCurrent = _getCurrent;
	_observable.reset = _reset;
	
	Signal.breakpoint = _observable;

}(Signal, $, window));
