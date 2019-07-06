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

export default {
	drag: drag
};
