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

function preloadNextImage(i) {
  const image = new Image();
  image.src = IMAGES[i].src;
  LOADED_IMAGE_COUNT++;
}

function prepareImage() {
  // 初始化图片数量
  LOADED_IMAGE_COUNT = 0;
  IMAGE_CURRENT = 0;
  IMAGES = [];

  $.getJSON('source.json', (json) => {
    IMAGES = json.map(pic => ({
      id: pic.id,
      src: `/w/${pic.id}.jpg`,
      fullSizeSrc: pic.file_url
    }));
    function preloadInitialImages(i) {
      const image = new Image();
      image.addEventListener('load', () => {
        if( ++LOADED_IMAGE_COUNT < PRELOAD ) {
          // 继续加载下一张图片
          $('#loading-process').text(LOADED_IMAGE_COUNT + '/' + PRELOAD);
          preloadInitialImages(LOADED_IMAGE_COUNT);
        } else {
          startAnimation();
        }
      });
      image.src = IMAGES[i].src;
    }
    // 预加载 PRELOAD 张图片
    preloadInitialImages(0);
  });
}

let LOOP = 0;
function startAnimation() {
  $('#loading').fadeOut();
  doAnimation();
  // 开始循环
  LOOP = setInterval(doAnimation, DELAY * 1000);
}

function pauseAnimation() {
  clearInterval(LOOP);
}

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

  // 下载地址
  $('#konachan').attr('href', IMAGES[IMAGE_CURRENT].fullSizeSrc);
  // 切换图片
  IMAGE_CURRENT++;
  if( IMAGE_CURRENT >= LOADED_IMAGE_COUNT ) {
    IMAGE_CURRENT = 0;
  }
  // 每播放一张图片就再往后预加载一张
  if( LOADED_IMAGE_COUNT < IMAGES.length ) {
    preloadNextImage(LOADED_IMAGE_COUNT);
  }
}

// 当页面失去焦点时暂停动画
function watchVisiblity() {
  document.addEventListener('visibilitychange', (evt) => {
    if( document.hidden ) {
      pauseAnimation();
    } else {
      startAnimation();
    }
  });
}

$(document).ready(function() {
  layout();
  prepareImage();
  watchVisiblity();
});
$(window).resize(function(){
  layout();
});

