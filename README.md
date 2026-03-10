## mini-eth-token 项目简介

这是一个基于 **Hardhat 3 + viem** 的示例项目，包含：

- **合约**：`Counter` 计数器合约（`contracts/Counter.sol`）
- **Foundry 风格 Solidity 单测**：`contracts/Counter.t.sol`
- **TypeScript 集成测试**：`test/Counter.ts`（使用 `node:test` + `viem`）
- **Ignition 部署模块**：`ignition/modules/Counter.ts`
- **脚本示例**：`scripts/send-op-tx.ts`，演示在 OP 模式下发送交易

## 目录结构说明

- `contracts/`：存放 Solidity 合约与基于 `forge-std` 的 Solidity 测试
- `test/`：存放 TypeScript 集成测试（通过 Hardhat + viem 与链交互）
- `scripts/`：存放 Hardhat 脚本（部署、发送交易、调用合约等）
- `ignition/`：Ignition 部署模块（描述如何部署合约及初始化调用）
- `node_modules/`：依赖包目录（无需手动修改）
- `hardhat.config.ts`：Hardhat 3 主配置文件（网络、编译器、插件等）
- `tsconfig.json`：TypeScript 配置
- `package.json`：npm 脚本与依赖声明

## 常用命令

在项目根目录执行（已在 `package.json` 里配置好）：

- 运行所有测试：

  ```bash
  npm test
  ```

- 只跑 Solidity 测试：

  ```bash
  npm run test:solidity
  ```

- 只跑 TypeScript (`node:test`) 测试：

  ```bash
  npm run test:node
  ```

- 本地网络上用 Ignition 部署 `Counter`：

  ```bash
  npm run deploy:local
  ```

- 部署到 Sepolia（需要设置 `SEPOLIA_RPC_URL` 和 `SEPOLIA_PRIVATE_KEY`）：

  ```bash
  npm run deploy:sepolia
  ```

- 在 OP 模式下发送一笔示例交易：

  ```bash
  npm run send-op-tx
  ```

## 环境变量（可选）

- `SEPOLIA_RPC_URL`：Sepolia RPC 地址
- `SEPOLIA_PRIVATE_KEY`：用于部署合约的账户私钥

可以通过 shell 环境变量或 Hardhat keystore 进行配置。

## 文档

- **[入门教程.md](./入门教程.md)**：编写 → 测试 → 部署 最简三步 + 一键 `quickstart`
- **[如何生成新项目.md](./如何生成新项目.md)**：用本仓库当模板复制，或用脚手架脚本生成相同结构的新项目
- **[定制模板-Hardhat3+Ignition+ERC20+前端.md](./定制模板-Hardhat3+Ignition+ERC20+前端.md)**：标准 monorepo 模板步骤（合约+前端联动）
