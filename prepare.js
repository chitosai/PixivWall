// 每周一 00:00 执行（服务器时区）
// 0 0 * * 1 node /home/TheC/www/extra/PixivWall/prepare.js 
const fs = require('fs');
const path = require('path');
const got = require('got');
const sharp = require('sharp');

const imageDir = path.join(__dirname, 'w');
const sourcePath = path.join(__dirname, 'source.json');

const request = got.extend({
    timeout: { request: 30000 },
    headers: { 'user-agent': 'PixivWall/2.0 (Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36' }
});

async function main() {
    // 获取 Wallhaven 二次元热门第 4 页的前 20 张图片
    const params = new URLSearchParams({ categories: '010', purity: '100', sorting: 'hot', order: 'desc' });
    const { data: posts } = await request(`https://wallhaven.cc/api/v1/search?${params}`).json();

    if (!Array.isArray(posts) || !posts.length) throw new Error('图片列表为空或格式不正确');
    const images = posts.slice(0, 20);

    await fs.promises.mkdir(imageDir, { recursive: true });
    for (const image of images) {
        const filePath = path.join(imageDir, `${image.id}.jpg`);
        if (!fs.existsSync(filePath)) {
            const buffer = await request(image.path).buffer();
            await fs.promises.writeFile(filePath, buffer);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // 原图大于 2 MB 时进行压缩，等比缩至 3840×2160 范围内，再以质量 80 保存
        const needsResize = (await fs.promises.stat(filePath)).size > 2 * 1024 * 1024;
        const processor = sharp(await fs.promises.readFile(filePath));
        if (needsResize || (await processor.metadata()).format !== 'jpeg') {
            if (needsResize) processor.resize(3840, 2160, { fit: 'inside', withoutEnlargement: true });
            await fs.promises.writeFile(filePath, await processor.jpeg({ quality: 80 }).toBuffer());
        }
    }

    // 下载完成后再更新 json、清理旧图片
    await fs.promises.writeFile(sourcePath, JSON.stringify(images));
    const filenames = new Set(images.map(image => `${image.id}.jpg`));
    for (const file of await fs.promises.readdir(imageDir, { withFileTypes: true })) {
        if (file.isFile() && /\.(jpe?g|png|webp|gif)$/i.test(file.name) && !filenames.has(file.name)) {
            await fs.promises.unlink(path.join(imageDir, file.name));
        }
    }
    console.log(`已更新 ${images.length} 张图片`);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
