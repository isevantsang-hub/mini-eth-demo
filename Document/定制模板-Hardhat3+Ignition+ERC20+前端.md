# 定制基础模板：Hardhat 3 + Ignition + ERC20 + 前端（可开发）

这份文档把你想要的“默认模板一定要包含 Ignition + ERC20 + 前端”的标准做法整理成 **一套可复用的项目骨架**，适合长期开发。

---

## 目标与原则（为什么这么拆）

- **合约工程**：专注合约、测试、部署（Hardhat 3 + Ignition）
- **前端工程**：专注 UI 与交互（连接钱包、读写合约）
- **联动**：部署后把 **合约地址 + ABI** 自动同步给前端，做到“一部署，前端立刻能用”

最推荐的形态是 **monorepo（一个仓库里两个工程）**。

---

## 推荐目录结构（最终长这样）

```bash
my-web3-template/
  package.json                 # 根：workspaces + 一键脚本（可选但推荐）
  apps/
    web/                       # 前端：Vite React TypeScript + viem
      src/
  packages/
    contracts/                 # 合约：Hardhat 3 + Ignition + ERC20
      contracts/
      ignition/modules/
      scripts/
      test/
      hardhat.config.ts
      package.json
      tsconfig.json
```

---

## 从 0 生成模板（最简步骤）

下面步骤完全可以手动创建一份“可开发模板”。你按顺序执行即可。

### 0) 准备环境

- Node.js：建议 **>= 20**
- npm：默认即可

---

### 1) 创建根目录（workspaces / monorepo）

```bash
mkdir my-web3-template
cd my-web3-template
npm init -y
```

编辑根 `package.json`，建议至少加：

- `private: true`
- `workspaces: ["apps/*", "packages/*"]`
- 一些把命令转发到子工程的脚本（示例）：

```json
{
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "contracts:compile": "npm -w packages/contracts run compile",
    "contracts:test": "npm -w packages/contracts run test",
    "contracts:deploy:local": "npm -w packages/contracts run deploy:local",
    "web:dev": "npm -w apps/web run dev"
  }
}
```

---

### 2) 创建合约工程（Hardhat 3 + Ignition + ERC20）

```bash
mkdir -p packages/contracts
cd packages/contracts
npm init -y
```

安装依赖（推荐组合：Hardhat 3 + viem toolbox + Ignition + TS + OpenZeppelin）：

```bash
npm install --save-dev \
  hardhat \
  @nomicfoundation/hardhat-toolbox-viem \
  @nomicfoundation/hardhat-ignition \
  typescript ts-node @types/node

npm install @openzeppelin/contracts
```

初始化 Hardhat 工程：

```bash
npx hardhat init
```

然后把你的“基础模板内容”放齐（最小建议）：

- **ERC20 合约**：`packages/contracts/contracts/MyToken.sol`
  - 建议直接继承 OpenZeppelin 的 `ERC20`
  - 可选：加 `Ownable`、`permit`、`burnable` 等（等你熟了再加）
- **Ignition 部署模块**：`packages/contracts/ignition/modules/MyToken.ts`
  - 负责部署 `MyToken`，并把构造参数（name/symbol/initialSupply）写清楚
- **测试**：`packages/contracts/test/MyToken.ts`
  - 最小测试建议包含：`totalSupply`、`balanceOf`、`transfer`（成功和失败场景）

在 `packages/contracts/package.json` 里放脚本（示例）：

```json
{
  "scripts": {
    "compile": "hardhat compile",
    "test": "hardhat test",
    "deploy:local": "hardhat ignition deploy ignition/modules/MyToken.ts"
  }
}
```

---

### 3) 创建前端工程（Vite React TS + viem）

回到仓库根目录：

```bash
cd ../../
npm create vite@latest apps/web -- --template react-ts
cd apps/web
npm install
npm install viem
```

前端最小“可交互”目标（建议你第一天就做出来）：

- **连接钱包**：拿到当前账号 address
- **读合约**：`name()` / `symbol()` / `balanceOf(address)`
- **写合约**：`transfer(to, amount)`

实现建议：直接用 viem 的

- `createPublicClient`（读链）
- `createWalletClient`（发交易，需要 `window.ethereum`）

---

## 关键：让部署结果自动喂给前端（地址 + ABI）

要让前端真正“随时可用”，你需要在部署后把两样东西同步给前端：

- **合约地址**（每次部署可能变）
- **合约 ABI**（前端调用合约方法需要）

### 推荐输出位置（前端侧）

把合约信息写到前端工程里一个固定目录，例如：

```bash
apps/web/src/contracts/
  MyToken.abi.json
  deployments.json
```

### 推荐做法（合约侧）

在 `packages/contracts/scripts/` 里写一个导出脚本（例如 `export-frontend.mjs`），做这件事：

- 从 Hardhat artifacts 里读 `MyToken` 的 ABI
- 从 Ignition 部署产物/输出里拿到地址
- 写到 `apps/web/src/contracts/` 对应文件里

然后把 `deploy:local` 脚本变成：

```bash
hardhat ignition deploy ignition/modules/MyToken.ts && node scripts/export-frontend.mjs ../../apps/web
```

这样你每次部署完，前端就立刻能读取到最新 ABI/地址，直接交互。

---

## 你最终如何跑起来（最像真实开发）

在仓库根目录：

```bash
npm install
npm run contracts:compile
npm run contracts:test
npm run contracts:deploy:local
npm run web:dev
```

---

## 最后一个提示：如果你想要“我帮你把它做成一条命令生成”

你可以这样做：

1. **告诉我你要的前端框架**：`Vite` 还是 `Next.js`
2. **告诉我你想生成到哪里**：例如 `../my-web3-template`

我就可以在你当前这个仓库里新增/升级一个脚手架脚本，让你最终做到：

```bash
# 例：一条命令生成完整 monorepo 模板
node scripts/scaffold-web3-monorepo.mjs ../my-web3-template --frontend vite
```

生成后你只需要：

```bash
cd ../my-web3-template
npm install
npm run contracts:deploy:local
npm run web:dev
```

就能得到一套 **Hardhat 3 + Ignition + ERC20 + 前端可交互** 的“开箱即用”模板。

