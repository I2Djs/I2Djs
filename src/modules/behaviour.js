let dragObject = {
	dragStart: function (fun) {
		if (typeof fun === 'function') {
			this.onDragStart = fun;
		}
		return this;
	},
	drag: function (fun) {
		if (typeof fun === 'function') {
			this.onDrag = fun;
		}
		return this;
	},
	dragEnd: function (fun) {
		if (typeof fun === 'function') {
			this.onDragEnd = fun;
		}
		return this;
	}
};

let drag = function () {
	return Object.create(dragObject);
};

let touchObject = {
	touchStart: function (fun) {
		if (typeof fun === 'function') {
			this.onTouchStart = fun;
		}
		return this;
	},
	touch: function (fun) {
		if (typeof fun === 'function') {
			this.onTouch = fun;
		}
		return this;
	},
	touchEnd: function (fun) {
		if (typeof fun === 'function') {
			this.onTouchEnd = fun;
		}
		return this;
	}
};

let touch = function () {
	return Object.create(touchObject);
};

export default {
	drag: drag,
	touch: touch
};
