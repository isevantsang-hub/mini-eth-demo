# 从 0 到交互：一个简单 ETH 项目（开发→测试→部署→交互）

你的目标是用这个仓库**初步了解一个最简单的 ETH 项目怎么做**：写合约、测试、部署、交互，并尽量在测试环境完成闭环。下面按“最短可跑通路径”组织，你照做一遍就能形成肌肉记忆。

---

## 你现在的目录结构是否推荐？

结论：**对“合约为主的最小项目”来说，你当前结构是推荐的**；如果你要做“带前端的 DApp”，长期更推荐 monorepo（你已有文档 `readme/定制模板-Hardhat3+Ignition+ERC20+前端.md` 里那种 `apps/web + packages/contracts`）。

### 当前结构适合什么

- **适合**：先把 Hardhat/viem/Ignition 跑通；写合约、写测试、写脚本；部署到本地/测试网；用脚本交互
- **不够方便**：当你要接前端时，ABI/地址同步、前后端依赖隔离、环境变量管理会更复杂

你现在的结构（单工程）：

- `contracts/`：Solidity 合约（以及 `.t.sol` Solidity 单测）
- `test/`：TypeScript 集成测试（`node:test` + `viem`）
- `ignition/modules/`：Ignition 部署模块（“怎么部署、部署后要不要初始化调用”）
- `scripts/`：脚本（部署后交互、发交易等）
- `hardhat.config.ts`：网络/插件/编译配置

---

## Cursor 没有 Remix 那种“内置测试账户”，我怎么测试？

Remix 的“内置账户”本质是：它帮你连了一个环境（JS VM / 注入 provider / 测试网 provider）并给你准备了账号。

在 Hardhat 这套里，你有三种常见“测试环境 + 账户”来源：

### A) **测试时的内置账户（推荐先用这个）**

跑 `npm test` 时，Hardhat 会在进程里启动模拟链（EDR），并提供**一组自动注入的测试账户**。你的 `test/Counter.ts` 就在用这种方式：

- `await network.connect()` 拿到 `viem`
- `await viem.getWalletClients()` 直接拿到可签名的账户客户端

你不需要手动创建账号、也不需要 MetaMask。

### B) **本地节点 + MetaMask 账户（做前端交互必用）**

启动本地节点（`npx hardhat node`）后，它会打印出一串本地测试账号/私钥。你把其中一个私钥导入 MetaMask，就得到和 Remix 类似的“本地测试账户体验”。

### C) **测试网账户（Sepolia）**

你自己准备一个测试网账户，领测试币（faucet），然后在本地用环境变量 `SEPOLIA_PRIVATE_KEY` + `SEPOLIA_RPC_URL` 部署和交互。

---

## 最短闭环（建议你先完成这条）

### 0) 环境准备

- Node.js：建议 >= 20
- 在仓库根目录：

```bash
npm install
```

### 1) 编译→测试（确认你能跑通）

```bash
npm run compile
npm test
```

你将同时跑两套测试：

- `contracts/Counter.t.sol`：Solidity 测试
- `test/Counter.ts`：TS 集成测试（部署合约、读写、验事件）

### 2) 本地部署（Ignition）

```bash
npm run deploy:local
```

这会部署 `ignition/modules/Counter.ts`，并在部署后执行一次 `incBy(5)`。

### 3) 本地交互（先用“测试/脚本”的方式）

你已经有“交互范式”了：

- **测试里交互**：`test/Counter.ts` 通过 `counter.read.x()`、`counter.write.incBy(...)` 读写合约
- **脚本里交互**：`scripts/` 里可以写 `hardhat run` 脚本，用同样的 `viem` 客户端读写

如果你想立刻加一个“部署后读一下 x”的脚本，推荐新建 `scripts/read-counter.ts`，思路是：

- 连接网络拿 `publicClient`
- 从 Ignition 部署结果里拿合约地址（或你手动从部署输出里复制地址）
- 用 ABI + address 读 `x()`

（你现在先不用急着做 ABI/地址自动同步；等你开始做前端时再做会更顺滑。）

---

## 进入“像 Remix 一样”的开发体验：本地节点 + MetaMask + 前端交互

当你要做真正的 DApp 交互（浏览器钱包签名），推荐按下面顺序走。

### 1) 启动本地节点

新开一个终端：

```bash
npx hardhat node
```

终端会打印：

- 本地 RPC（通常是 `http://127.0.0.1:8545`）
- 多个测试账号和私钥（用于导入 MetaMask）

### 2) 部署到本地节点

再开一个终端，在项目根目录执行：

```bash
npx hardhat ignition deploy --network localhost ignition/modules/Counter.ts
```

如果你更希望复用 `npm run deploy:local`，也可以后续把 `package.json` 里加一个 `deploy:localhost` 脚本（可选，不影响你理解主线）。

### 3) 在 MetaMask 里连接本地链并导入账户

- **添加网络**：RPC 填 `http://127.0.0.1:8545`，ChainId 通常是 `31337`
- **导入账户**：把 `hardhat node` 打印出的某个私钥导入

这一步完成后，你就拥有了“Remix 本地账户”的同等体验：有钱、有链、可签名。

### 4) 前端交互（两种路线）

- **路线 1（最快）**：先不搭完整前端，只写一个最小页面调用合约（Vite + viem）
- **路线 2（长期推荐）**：用 monorepo，把前端放 `apps/web`，合约放 `packages/contracts`，并做“部署后自动同步 ABI/地址到前端”

你已经有路线 2 的详细文档：`readme/定制模板-Hardhat3+Ignition+ERC20+前端.md`。

---

## 上测试网（Sepolia）：部署 + 交互（推荐你作为第二阶段）

你的 `hardhat.config.ts` 已经配置了 `sepolia`：

- `SEPOLIA_RPC_URL`
- `SEPOLIA_PRIVATE_KEY`

### 1) 准备环境变量（不要提交到 git）

在当前终端里临时导出（示例）：

```bash
export SEPOLIA_RPC_URL="你的 sepolia rpc"
export SEPOLIA_PRIVATE_KEY="你的私钥（0x 开头）"
```

或用你习惯的方式放到本机的安全位置（例如 `.env`，并确保被 `.gitignore` 忽略）。

### 2) 部署到 Sepolia

```bash
npm run deploy:sepolia
```

### 3) 交互

推荐先用脚本/测试的方式交互（可控、可复现），等你把“地址 + ABI 同步到前端”的流程做好，再用前端交互。

---

## 你最终要达成的能力清单（按学习顺序）

- **能力 1：能跑通本仓库**：`npm run quickstart`
- **能力 2：会改合约并补测试**：改 `Counter.sol`，让测试先失败、再修到通过
- **能力 3：会用 Ignition 写部署模块**：理解 `ignition/modules/Counter.ts` 里的“部署 + 部署后调用”
- **能力 4：会在本地用脚本/测试交互**：用 `viem` 读写合约
- **能力 5：会用本地节点 + MetaMask**：本地链、导入账户、钱包签名
- **能力 6：会上测试网**：环境变量、部署、交互、排错（RPC/nonce/余额/chainId）
- **能力 7（可选加分）：前后端联动**：自动把 ABI/地址同步给前端，做到“一部署前端立刻可用”

---

## 常见卡点（快速排错）

- **编译需要联网**：第一次会下载 solc，网络不通会卡住
- **`MultiProcessMutexTimeoutError`（编译器下载锁超时）**：通常是 Cursor/VSCode 的 Hardhat 插件后台进程正在占用 Hardhat 编译器缓存锁。解决方式：
  - 最干净：临时关闭 Hardhat Solidity 插件（或重启编辑器）
  - 快速绕过（macOS/Linux）：运行命令前先结束插件后台进程再执行，例如：

```bash
pkill -f "hardhat-solidity-0.8.28-universal/server/out/index.js" || true
npm test
```
- **Sepolia 部署失败**：优先检查 `RPC_URL`、私钥格式、账户是否有测试币、是否选对链
- **前端连不上本地链**：确认 MetaMask 网络是 `localhost:8545`、链 ID 正确、Hardhat node 正在运行

