# -*- coding: utf-8 -*-
import platform, sys, os

CONFIG = {
    'page_title'         : 'ただ一人の楽園', # 静态页面标题
    'animation_duration' : 1,               # 动画持续时间
    'animation_delay'    : 6,               # 图片更换间隔
    'cube_size'          : 100,             # 区块大小
    'preload_number'     : 5,               # 运行js前读取的图片张数
}

# 分隔符
if platform.system() == 'Windows': SLASH = '\\'
else: SLASH = '/'

ABS_PATH = sys.path[0] + SLASH

HTML = '''
<!doctype html>
<html lang="cn">
<head>
    <meta charset="UTF-8">
    <title>%s</title>
    <link rel="stylesheet" href="inc/pixivwall.css">
    <script>
        DURATION = %s;
        DELAY = %s;
        CUBE_SIZE = %s;
        PRELOAD_TOTAL = %s;
    </script>
    <script src="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-2.0.0.min.js"></script>
    <script src="inc/pixivwall.animations.js"></script>
    <script src="inc/pixivwall.js"></script>
    <script type="text/javascript">

      var _gaq = _gaq || [];
      _gaq.push(['_setAccount', 'UA-24680734-2']);
      _gaq.push(['_setDomainName', 'thec.me']);
      _gaq.push(['_trackPageview']);

      (function() {
        var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
        ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
        var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
      })();

    </script>
</head>
<body>
    <div id="loading">正在预读图片</div>
    <div id="wall-wrapper"></div>
    <div id="origins">%s</div>
</body>
</html>
'''

# 生成静态页面
def GenerateHTML():
    # 获取图片列表
    IMAGE_PATH = sys.path[0] + SLASH + 'images' + SLASH
    IMAGE_LIST = os.listdir(IMAGE_PATH)

    IMAGES = '\n'
    i = 0
    for image in IMAGE_LIST:
        if image == '.gitignore' : continue
        output = '\t\t<img class="origin" src="images/' + image + '"'

        if i < CONFIG['preload_number']:
            output += ' onload=\'loaded();\''
            i += 1

        output += ' />\n'
        IMAGES += output
    IMAGES += '\t'
    # 生成新静态页面
    f = open('index.html', 'w')
    f.write( HTML % (
        CONFIG['page_title'],
        CONFIG['animation_duration'],
        CONFIG['animation_delay'], 
        CONFIG['cube_size'],
        CONFIG['preload_number'],
        IMAGES, 
    ))
    f.close()


GenerateHTML()

