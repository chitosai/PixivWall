const got = require('got');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);

const tempPath = path.join(__dirname, 'w');

const download = async (url, filename) => {
    return new Promise((resolve) => {
        const fileFullPath = path.join(tempPath, filename + '.jpg');
        // 检查文件是否已下载
        fs.promises.access(fileFullPath, fs.constants.F_OK)
        .then(resolve) // 已存在就直接返回
        .catch(async () => {
            // 不存在就下载
            await pipeline(
                got.stream(url),
                fs.createWriteStream(fileFullPath)
            )
            // 等1s，安全第一
            setTimeout(resolve, 1000);
        })
    });
};

async function main() {
    const raw = await got('https://konachan.com/post.json?limit=25&tags=width:1920%20height:1080');
    let json;
    // 检查一下数据是否是正确json，解析出错就直接退出吧，我也不想写日志啥的，太麻烦了
    json = JSON.parse(raw.body);
    // 生成一个id列表，用于在后面删除已经过期的图片
    const idList = json.map(item=>String(item.id));
    // konachan的图片有两次302，有时候加载不出来，还是自己把图片下到本地备用吧
    for( let i = 0; i < json.length; i++ ) {
        await download(json[i].jpeg_url, json[i].id);
    }
    fs.writeFile(path.join(__dirname, 'source.json'), raw.body, (err) => {
        if (err) throw err;
    });
    // 删除今天之前的图片
    const tempFileList = await fs.promises.readdir(tempPath);
    for( let i = 0; i < tempFileList.length; i++ ) {
        const id = tempFileList[i].split('.')[0];
        if( !idList.includes(id) ) {
            fs.rm(path.join(tempPath, tempFileList[i]), ()=>{});
        }
    }
}

main();