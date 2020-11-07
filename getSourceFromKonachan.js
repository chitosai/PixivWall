const got = require('got');
const fs = require('fs');
const path = require('path');

async function main() {
    const raw = await got('https://konachan.com/post.json?limit=50&tags=width:1920%20height:1080');
    let json;
    // 检查一下数据是否是正确json，解析出错就直接退出吧，我也不想写日志啥的，太麻烦了
    json = JSON.parse(raw.body);
    fs.writeFile(path.join(__dirname, 'source.json'), raw.body, (err) => {
        if (err) throw err;
    });
}

main();