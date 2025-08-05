const solanaWeb3 = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');
const bs58 = require('bs58').default;

// ====== 用户自定义参数 ======
// 前3位字符（可中英文，留空则不限制）
const PREFIX = (process.argv[2] || '').trim();
const PREFIX_SET = PREFIX ? PREFIX.split('') : null;
// 允许出现的数字字符（最少4位，留空或全空格表示不限制）
const ALLOWED_DIGITS_INPUT = (process.argv[3] || '').trim();
const ALLOWED_DIGITS = ALLOWED_DIGITS_INPUT ? ALLOWED_DIGITS_INPUT.split('') : null;
// 需要的靓号数量
const TARGET_COUNT = Number(process.argv[4]) || 1;
// ============================

function isValidAddress(address) {
    // 检查前三位字符是否都属于用户输入集合
    if (PREFIX_SET) {
        for (let i = 0; i < 3; i++) {
            if (!PREFIX_SET.includes(address[i])) return false;
        }
    }
    // 检查所有数字字符
    if (ALLOWED_DIGITS) {
        for (let c of address) {
            if (c >= '0' && c <= '9' && !ALLOWED_DIGITS.includes(c)) {
                return false;
            }
        }
    }
    return true;
}

let found = 0;
let attempts = 0;
const outputPath = path.join(__dirname, 'lucky-wallet.json');
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}
// 初始化文件为空数组
fs.writeFileSync(outputPath, JSON.stringify([], null, 2));

while (found < TARGET_COUNT) {
    const keypair = solanaWeb3.Keypair.generate();
    const address = keypair.publicKey.toBase58();
    attempts++;
    
    if (attempts % 10000 === 0) {
        console.log(`已尝试 ${attempts} 次，找到 ${found} 个符合条件的地址`);
    }
    
    if (isValidAddress(address)) {
        const wallet = {
            address,
            secret: bs58.encode(Buffer.from(keypair.secretKey))
        };
        // 读取当前文件内容，追加新钱包，再写回去
        let wallets = [];
        try {
            wallets = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
        } catch (e) {}
        wallets.push(wallet);
        fs.writeFileSync(outputPath, JSON.stringify(wallets, null, 2));
        found++;
        console.log(`找到第${found}个: ${address}`);
    }
}

console.log(`总共尝试 ${attempts} 次，已保存到 ${outputPath}`); 