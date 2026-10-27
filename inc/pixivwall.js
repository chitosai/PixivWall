let DISPLAYED_IMAGE = null;
let PRELOADING = false;

// 布局
function layout() {
    // 计算需要多少方块来填充屏幕
    var cube_size = CUBE_SIZE,
        sw = $(window).width(),
        sh = $(window).height(),
        cube_real_size = cube_size + 1,
        cube_each_row = parseInt(sw / cube_real_size) + 1,
        cube_rows = parseInt(sh / cube_real_size) + 1;

    // 边界对齐屏幕像素，缝隙固定为 1 个屏幕像素。
    var pixel_ratio = window.devicePixelRatio || 1,
        snap = value => Math.round(value * pixel_ratio) / pixel_ratio,
        gap = 1 / pixel_ratio;

    // 存成全局变量以后用
    CUBE_EACH_ROW = cube_each_row;
    CUBE_ROWS = cube_rows;
    // 总块数
    CUBE_TOTAL = cube_rows * cube_each_row;
    // 以及尺寸
    WALL_WIDTH = snap(cube_each_row * cube_real_size) - gap,
    WALL_HEIGHT = snap(cube_rows * cube_real_size) - gap;

    // 给#wall定位，让wall全屏居中
    var wall = $('<div>').attr('id', 'wall').css({
        'top': snap((sh - WALL_HEIGHT) / 2) + 'px',
        'left': snap((sw - WALL_WIDTH) / 2) + 'px'
    });

    // 添加方块
    for (var i = 0; i < cube_rows; i++) {
        for (var j = 0; j < cube_each_row; j++) {
            var left = snap(cube_real_size * j),
                top = snap(cube_real_size * i),
                width = snap(cube_real_size * (j + 1)) - left - gap,
                height = snap(cube_real_size * (i + 1)) - top - gap;
            var cube = $('<div>').attr('id', 'cube-' + i + '-' + j).addClass('cube').css({
                'width': width,
                'height': height,
                'left': left,
                'top': top
            });
            // 每个方块里面带两个缓冲层来做动画效果
            $('<div>').addClass('buffer_a').css({
                'width': width,
                'height': height,
                'backgroundPosition': -left + 'px ' + -top + 'px'
            }).appendTo(cube);
            $('<div>').addClass('buffer_b').css({
                'width': width,
                'height': height,
                'backgroundPosition': -left + 'px ' + -top + 'px'
            }).appendTo(cube);
            cube.appendTo(wall);
        }
    }

    // 插入DOM
    wall.prependTo($('#wall-wrapper').empty());
    // 初始化缓冲层
    BUFFER_CURRENT = $('.buffer_a');
    BUFFER_BACK = $('.buffer_b');

    // 重新布局后立即恢复当前图片，不推进轮播。
    if (DISPLAYED_IMAGE) {
        renderImage(DISPLAYED_IMAGE);
        BUFFER_CURRENT.css('zIndex', 3);
    }
}

function preloadNextImage(onComplete) {
    if (PRELOADING || LOADED_IMAGE_COUNT >= IMAGES.length) return;
    PRELOADING = true;

    const i = LOADED_IMAGE_COUNT;
    const image = new Image();
    image.addEventListener('load', () => {
        IMAGES[i].width = image.naturalWidth;
        IMAGES[i].height = image.naturalHeight;
        LOADED_IMAGE_COUNT++;
        PRELOADING = false;
        if (onComplete) onComplete();
    });
    image.addEventListener('error', () => {
        // 跳过失败图片，已加载的图片仍然可以继续轮播
        IMAGES.splice(i, 1);
        PRELOADING = false;
        if (LOADED_IMAGE_COUNT < IMAGES.length) {
            preloadNextImage(onComplete);
        } else if (onComplete) {
            onComplete();
        }
    });
    image.src = IMAGES[i].src;
}

function showLoadError() {
    pauseAnimation();
    $('#loading').addClass('failed').show();
    $('#preloader').attr('src', 'inc/load-error.svg');
    $('#loading p').text('加载失败');
}

function prepareImage() {
    // 初始化图片数量
    LOADED_IMAGE_COUNT = 0;
    IMAGE_CURRENT = 0;
    IMAGES = [];

    $.getJSON('source.json', (json) => {
        if (!Array.isArray(json) || !json.length) {
            showLoadError();
            return;
        }
        IMAGES = json.map(pic => ({
            id: pic.id,
            src: `/w/${pic.id}.jpg`,
            fullSizeSrc: pic.file_url
        }));
        function preloadInitialImages() {
            const total = Math.min(PRELOAD, IMAGES.length);
            $('#loading-process').text(LOADED_IMAGE_COUNT + '/' + total);
            if (LOADED_IMAGE_COUNT < total) {
                preloadNextImage(preloadInitialImages);
            } else if (LOADED_IMAGE_COUNT) {
                startAnimation();
            } else {
                showLoadError();
            }
        }
        preloadInitialImages();
    }).fail(showLoadError);
}

let LOOP = null;
function startAnimation() {
    // 等预加载完成且页面可见后再启动，避免重复创建定时器
    if (LOOP !== null || document.hidden || !LOADED_IMAGE_COUNT ||
        LOADED_IMAGE_COUNT < Math.min(PRELOAD, IMAGES.length)) return;

    $('#loading').fadeOut();
    doAnimation();
    // 开始循环
    LOOP = setInterval(doAnimation, DELAY * 1000);
}

function pauseAnimation() {
    clearInterval(LOOP);
    LOOP = null;
}

function renderImage(image) {
    // 更新缓冲层
    BUFFER_CURRENT.css({
        'backgroundImage': 'url(\'' + image.src + '\')'
    });

    // 计算图片位差，使图片始终居中
    var wall = $('#wall')[0],
        dx = ($(window).width() - image.width) / 2 - parseFloat(wall.style.left),
        dy = ($(window).height() - image.height) / 2 - parseFloat(wall.style.top);
    // 调整图片位置
    BUFFER_CURRENT.each(function() {
        const cube = this.parentNode;
        $(this).css('backgroundPosition', (dx - parseFloat(cube.style.left)) + 'px ' + (dy - parseFloat(cube.style.top)) + 'px');
    });
}

function doAnimation() {
    var image = IMAGES[IMAGE_CURRENT];
    if (!image || !image.width || !image.height) return;

    // 切换缓冲层
    var BUFFER_TMP = BUFFER_CURRENT;
    BUFFER_CURRENT = BUFFER_BACK;
    BUFFER_BACK = BUFFER_TMP;

    renderImage(image);
    DISPLAYED_IMAGE = image;

    // 随机选一种效果，翻转！
    fx();

    // 下载地址
    $('#source-site-link').attr('href', `https://yande.re/post/show/${image.id}`);
    // 切换图片
    IMAGE_CURRENT++;
    if (IMAGE_CURRENT >= LOADED_IMAGE_COUNT) {
        IMAGE_CURRENT = 0;
    }
    // 每播放一张图片就再往后预加载一张
    if (LOADED_IMAGE_COUNT < IMAGES.length) {
        preloadNextImage();
    }
}

// 当页面失去焦点时暂停动画
function watchVisiblity() {
    document.addEventListener('visibilitychange', (evt) => {
        if (document.hidden) {
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
$(window).resize(function() {
    layout();
});
