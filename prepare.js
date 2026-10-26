// 需要 Node.js 18 及以上
// 每周一 00:00 执行（服务器时区）
// 0 0 * * 1 node /home/TheC/www/extra/PixivWall/prepare.js
const fs = require('fs');
const path = require('path');

const imageDir = path.join(__dirname, 'w');
const sourcePath = path.join(__dirname, 'source.json');

async function request(url) {
    const response = await fetch(url, {
        signal: AbortSignal.timeout(30000),
        headers: { 'user-agent': 'PixivWall/2.0 (Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
    return response;
}

async function main() {
    // 从 Yande.re 获取过去 30 天内评分最高的 20 张图片
    const date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const params = new URLSearchParams({ limit: 20, tags: `order:score date:>=${date}` });
    const posts = await (await request(`https://yande.re/post.json?${params}`)).json();

    if (!Array.isArray(posts) || !posts.length) throw new Error('图片列表为空或格式不正确');
    const images = posts.slice(0, 20);

    await fs.promises.mkdir(imageDir, { recursive: true });
    for (const image of images) {
        const filePath = path.join(imageDir, `${image.id}.jpg`);
        if (fs.existsSync(filePath)) continue;

        const response = await request(image.jpeg_url);
        await fs.promises.writeFile(filePath, Buffer.from(await response.arrayBuffer()));
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 下载完成后再更新列表、清理旧图片。
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
