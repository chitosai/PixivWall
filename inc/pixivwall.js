// 布局
function layout() {
  // 计算需要多少方块来填充屏幕
  var cube_size = CUBE_SIZE,
      sw = $(window).width(), 
      sh = $(window).height(),
      cube_real_size = cube_size + 1,
      cube_each_row = parseInt( sw / cube_real_size ) + 1,
      cube_rows = parseInt( sh / cube_real_size ) + 1;

  // 存成全局变量以后用
  CUBE_EACH_ROW = cube_each_row;
  CUBE_ROWS = cube_rows;
  // 总块数
  CUBE_TOTAL = cube_rows * cube_each_row;
  // 以及尺寸
  WALL_WIDTH = cube_each_row * cube_size,
  WALL_HEIGHT = cube_rows * cube_size;

  // 给#wall定位，让wall全屏居中
  var wall = $('<div>').attr('id', 'wall').css({
    'top'  : '-' + (cube_rows * cube_real_size - sh) / 2 + 'px',
    'left' : '-' + (cube_each_row * cube_real_size - sw) / 2 + 'px'
  });

  // 添加方块
  for( var i = 0; i < cube_rows; i++ ) {
    for( var j = 0; j < cube_each_row; j++ ) {
      var cube = $('<div>').attr('id', 'cube-' + i + '-' + j).addClass('cube').css({
        'width' : cube_size + 'px',
        'height': cube_size + 'px',
        'left'  : cube_size * j + j + 'px',
        'top'   : cube_size * i + i + 'px'
      });
      // 每个方块里面带两个缓冲层来做动画效果
      $('<div>').addClass('buffer_a').css({
        'width'              : cube_size, 
        'height'             : cube_size,
        'backgroundPosition' : '-' + j * cube_size + 'px -' + i * cube_size + 'px'
      }).appendTo(cube);
      $('<div>').addClass('buffer_b').css({
        'width'              : cube_size, 
        'height'             : cube_size,
        'backgroundPosition' : '-' + j * cube_size + 'px -' + i * cube_size + 'px'
      }).appendTo(cube);
      cube.appendTo(wall);
    }
  }

  // 插入DOM
  wall.prependTo($('#wall-wrapper').empty());
  // 初始化缓冲层
  BUFFER_CURRENT = $('.buffer_a');
  BUFFER_BACK = $('.buffer_b');
}

function prepareImage() {
  // 初始化图片数量
  IMAGE_TOTAL = 0;
  IMAGE_CURRENT = 0;

  // 绑定依次加载
  IMAGES = [];
  $('.origin').each(function() {
    var self = this;

    $(this).on('load', function() {
      var image = {};
          image.width = self.width;
          image.height = self.height;
          image.src = self.src;
      IMAGES.push(image);
      IMAGE_TOTAL = IMAGES.length;

      // 检查是否已经加载了足够多的图片
      if( IMAGE_TOTAL > PRELOAD ) {
        startAnimation();
      } else {
        $('#loading-process').text(IMAGE_TOTAL + '/' + PRELOAD);
      }

      // 加载下一张图片
      var next = $(self).next();
      if( next.length ) next.attr('src', next.data('src'));
    });
  });

  // 开始加载
  var first = $('.origin').eq(0);
  first.attr('src', first.data('src'));
}


function startAnimation() {
  // 默认动画时间就1s吧
  DURATION = DURATION ? DURATION : 1;
  
  $('#loading').fadeOut();
  doAnimation();
  // 开始循环
  LOOP = setInterval(doAnimation, DELAY * 1000);

  startAnimation = _void_;
}

function _void_() {}

function doAnimation() {
  var image = IMAGES[IMAGE_CURRENT];

  // 切换缓冲层 
  var BUFFER_TMP = BUFFER_CURRENT;
  BUFFER_CURRENT = BUFFER_BACK;
  BUFFER_BACK = BUFFER_TMP;


  // 更新缓冲层
  BUFFER_CURRENT.css({
    'backgroundImage': 'url(\'' + image.src + '\')'
  });
  
  // 计算图片位差，使图片始终居中
  var dx = (WALL_WIDTH - image.width)/2,
      dy = (WALL_HEIGHT - image.height)/2;
  // 调整图片位置
  for( var i = 0; i < CUBE_ROWS; i++ ) {
    for( var j = 0; j < CUBE_EACH_ROW; j++ ) {
      BUFFER_CURRENT.eq(i*CUBE_EACH_ROW + j).css('backgroundPosition', (dx - j * CUBE_SIZE) + 'px ' + (dy -i * CUBE_SIZE) + 'px');
    }
  }

  // 随机选一种效果，翻转！
  fx();

  // 切换图片
  IMAGE_CURRENT++;
  if( IMAGE_CURRENT >= IMAGE_TOTAL ) IMAGE_CURRENT = 0;
}

$(document).ready(function() {
  layout();
  prepareImage();
});
$(window).resize(function(){
  layout();
});

