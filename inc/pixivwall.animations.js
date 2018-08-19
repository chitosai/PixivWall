// 动画列表
const ANIMATIONS = [
	// opacity
	{
		opacity: [{
			value: 0
		}, {
			value: 1
		}],
		translateX: [{
			value: 0,
			duration: 0
		}],
		translateY: [{
			value: 0,
			duration: 0
		}]
	},
	// left in
	{
		translateX: [{
			value: '-100%'
		}, {
			value: 0
		}],
		opacity: [{
			value: 0
		}, {
			value: 1
		}]
	},
	// right in
	{
		translateX: [{
			value: '100%'
		}, {
			value: 0
		}],
		opacity: [{
			value: 0
		}, {
			value: 1
		}]
	},
	// top in
	{
		translateY: [{
			value: '100%'
		}, {
			value: 0
		}],
		opacity: [{
			value: 0
		}, {
			value: 1
		}]
	},
	// bottom in
	{
		translateY: [{
			value: '-100%'
		}, {
			value: 0
		}],
		opacity: [{
			value: 0
		}, {
			value: 1
		}]
	},
	// scale out
	{
		scale: [{
			value: 0
		}, {
			value: 1
		}]
	},
	// scale in 
	{
		scale: [{
			value: 2
		}, {
			value: 1
		}]
	}
];

function _applyFx(fx, opt) {
	function reverseProperty(key, value) {
		if( key.startsWith('translate') ) {
			switch(typeof(value)) {
				case 'string': return value.startsWith('-') ? value.slice(1) : `-${value}`;
				case 'number': return value ? -value : 0;
				default: return value;
			}
		} else if( key.startsWith('scale') ) {
			switch(value) {
				case 0: return 2;
				case 2: return 0;
				case 1: return 1;
			}
		} else {
			return value;
		}
	}
	let _fx = JSON.parse(JSON.stringify(fx));
	// 保持没有用到的参数回归初始值
	_fx = Object.assign({
		opacity: [{
			value: 0
		}, {
			value: 1
		}],
		translateX: [{
			value: 0,
			duration: 0
		}],
		translateY: [{
			value: 0,
			duration: 0
		}],
		scale: [{
			value: 1,
			duration: 0
		}]
	}, _fx);
	for( let key in _fx ) {
		const property = _fx[key];
		if( property.length == 1 ) {
			continue;
		}
		// 交换并翻转起始、结束的动画状态
		if( opt.reverse ) {
			const tmp = property[0].value;
			property[0].value = reverseProperty(key, property[1].value);
			property[1].value = reverseProperty(key, tmp);
		}
		// 加上duration和delay
		property[0].duration = property[0].delay = 0;
		property[1].duration = opt.duration;
		property[1].delay = opt.delay;
	}
	// 最后再加上animejs需要的参数
	_fx.targets = opt.targets;
	_fx.easing = opt.easing;
	return _fx;
}

// 给予一个随机效果
function fx() {
	const fx = ANIMATIONS[random(ANIMATIONS.length)];
	for( let i = 0; i < CUBE_TOTAL; i++ ) {
		// 生成一个随机delay
		const delay = Math.random() * 600;
		const duration = (DURATION + Math.random()) * 1000;
		// animejs
		anime(_applyFx(fx, {
			targets: BUFFER_CURRENT[i],
			easing: 'easeInOutQuad',
			duration,
			delay
		}));
		anime(_applyFx(fx, {
			targets: BUFFER_BACK[i],
			easing: 'easeInOutQuad',
			duration,
			delay,
			reverse: true
		}));
		// 更换前后层关系
		setTimeout(() => {
			BUFFER_CURRENT.eq(i).css('zIndex', 3);
			BUFFER_BACK.eq(i).css('zIndex', 1);
		}, 0);
	}
}

// 生成随机数
function random(range) {
  return Math.floor( Math.random() * range );
}