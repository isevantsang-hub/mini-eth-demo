#!/usr/bin/env node
/**
 * 在指定目录生成与当前项目相同的基本 Hardhat 3 目录结构。
 * 用法: node scripts/scaffold-new-project.mjs <目标路径>
 * 示例: node scripts/scaffold-new-project.mjs ../my-new-token
 */

import fs from "fs";
import path from "path";

const targetDir = process.argv[2];
if (!targetDir) {
  console.error("用法: node scripts/scaffold-new-project.mjs <目标路径>");
  console.error("示例: node scripts/scaffold-new-project.mjs ../my-new-token");
  process.exit(1);
}

const root = path.resolve(process.cwd(), targetDir);
const projectName = path.basename(root);

function write(filePath, content) {
  const full = path.join(root, filePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf8");
  console.log("  +", filePath);
}

console.log("在目录生成项目结构:", root);
fs.mkdirSync(root, { recursive: true });

// contracts
write(
  "contracts/Counter.sol",
  `// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Counter {
  uint public x;

  event Increment(uint by);

  function inc() public {
    x++;
    emit Increment(1);
  }

  function incBy(uint by) public {
    require(by > 0, "incBy: increment should be positive");
    x += by;
    emit Increment(by);
  }
}
`
);

write(
  "contracts/Counter.t.sol",
  `// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Counter} from "./Counter.sol";
import {Test} from "forge-std/Test.sol";

contract CounterTest is Test {
  Counter counter;

  function setUp() public {
    counter = new Counter();
  }

  function test_InitialValue() public view {
    require(counter.x() == 0, "Initial value should be 0");
  }

  function testFuzz_Inc(uint8 x) public {
    for (uint8 i = 0; i < x; i++) {
      counter.inc();
    }
    require(counter.x() == x, "Value after calling inc x times should be x");
  }

  function test_IncByZero() public {
    vm.expectRevert();
    counter.incBy(0);
  }
}
`
);

// scripts
write(
  "scripts/send-op-tx.ts",
  `import { network } from "hardhat";

const { viem } = await network.connect({
  network: "hardhatOp",
  chainType: "op",
});

console.log("Sending transaction using the OP chain type");

const publicClient = await viem.getPublicClient();
const [senderClient] = await viem.getWalletClients();

console.log("Sending 1 wei from", senderClient.account.address, "to itself");

const l1Gas = await publicClient.estimateL1Gas({
  account: senderClient.account.address,
  to: senderClient.account.address,
  value: 1n,
});

console.log("Estimated L1 gas:", l1Gas);

console.log("Sending L2 transaction");
const tx = await senderClient.sendTransaction({
  to: senderClient.account.address,
  value: 1n,
});

await publicClient.waitForTransactionReceipt({ hash: tx });

console.log("Transaction sent successfully");
`
);

// test
write(
  "test/Counter.ts",
  `import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("Counter", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

  it("Should emit the Increment event when calling the inc() function", async function () {
    const counter = await viem.deployContract("Counter");

    await viem.assertions.emitWithArgs(
      counter.write.inc(),
      counter,
      "Increment",
      [1n],
    );
  });

  it("The sum of the Increment events should match the current value", async function () {
    const counter = await viem.deployContract("Counter");
    const deploymentBlockNumber = await publicClient.getBlockNumber();

    for (let i = 1n; i <= 10n; i++) {
      await counter.write.incBy([i]);
    }

    const events = await publicClient.getContractEvents({
      address: counter.address,
      abi: counter.abi,
      eventName: "Increment",
      fromBlock: deploymentBlockNumber,
      strict: true,
    });

    let total = 0n;
    for (const event of events) {
      total += event.args.by;
    }

    assert.equal(total, await counter.read.x());
  });
});
`
);

// ignition
write(
  "ignition/modules/Counter.ts",
  `import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CounterModule", (m) => {
  const counter = m.contract("Counter");

  m.call(counter, "incBy", [5n]);

  return { counter };
});
`
);

// hardhat.config.ts
write(
  "hardhat.config.ts",
  `import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
  },
});
`
);

// tsconfig.json
write(
  "tsconfig.json",
  `{
  "compilerOptions": {
    "lib": ["es2023"],
    "module": "node16",
    "target": "es2022",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node16",
    "outDir": "dist"
  }
}
`
);

// package.json
write(
  "package.json",
  JSON.stringify(
    {
      name: projectName.replace(/\s+/g, "-").toLowerCase(),
      version: "1.0.0",
      description: "",
      main: "index.js",
      scripts: {
        compile: "hardhat compile",
        test: "hardhat test",
        "test:solidity": "hardhat test solidity",
        "test:node": "hardhat test nodejs",
        "deploy:local": "hardhat ignition deploy ignition/modules/Counter.ts",
        "deploy:sepolia":
          "hardhat ignition deploy --network sepolia ignition/modules/Counter.ts",
        "send-op-tx": "hardhat run scripts/send-op-tx.ts",
        quickstart: "npm run compile && npm test && npm run deploy:local",
      },
      type: "module",
      devDependencies: {
        "@nomicfoundation/hardhat-ignition": "^3.0.9",
        "@nomicfoundation/hardhat-toolbox": "^7.0.0",
        "@nomicfoundation/hardhat-toolbox-viem": "^5.0.3",
        "@types/node": "^22.19.15",
        "forge-std": "github:foundry-rs/forge-std#v1.9.4",
        hardhat: "^3.1.11",
        typescript: "~5.8.0",
        viem: "^2.47.0",
      },
      dependencies: {
        "@openzeppelin/contracts": "^5.6.1",
      },
    },
    null,
    2
  )
);

// .gitignore
write(
  ".gitignore",
  `# Node modules
/node_modules

# Compilation output
/dist

# Hardhat
/artifacts
/cache
/types
/coverage
`
);

// README.md
write(
  "README.md",
  `# ${projectName}

Hardhat 3 + viem 示例项目。

## 快速开始

\`\`\`bash
npm install
npm run quickstart
\`\`\`

## 常用命令

- \`npm run compile\` - 编译合约
- \`npm test\` - 运行测试
- \`npm run deploy:local\` - 本地部署
`
);

console.log("\n生成完成。进入项目目录并安装依赖：");
console.log("  cd", targetDir);
console.log("  npm install");
console.log("  npm run quickstart");
console.log("");
