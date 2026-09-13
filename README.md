# dsh-grok-goals

```sh
dsh plugin --profile web add github:aa2246740/dsh-grok-goals
```

PATH 上需要官方 `dsh`（或 `npx @deepseek-ai/dsh`）和 **pnpm**。`dsh plugin add` 会在 `$DSH_HOME/profiles/web` 里跑 pnpm，并因为本包装了 `dsh.bundle.patch` 而写入 profile bundles。然后**重启这个 Host，再刷新页面**。它只写 profile，不会热挂正在跑的进程。

仓库已提交 `lib/`，git 安装不用再构建，也不走 `prepare` / `allowBuilds`。需要 DeepSeek Harness **0.1.5-rc.2**，Node `^22.19.0` 或 `>=24`。

给根 agent 换一套 Grok Build 风格的 Goal：命令、工具、提示策略、持久状态和输入框旁的 dock。

原生 Harness Goal 服务仍装着，参与的根 agent 上处于休眠。`/goal`、`create_goal`、`get_goal`、`update_goal` 和 `tool:goal` 会盖住自带注册。client 占用已有的 `conversation.input.dock`，id 为 `goal`。

已经 clone 过的目录也可以：

```sh
git clone https://github.com/aa2246740/dsh-grok-goals.git
dsh plugin --profile web add ./dsh-grok-goals
```

同样需要 pnpm，然后重启 Host 并刷新页面。

```sh
dsh plugin --profile web remove dsh-grok-goals
```

DSH.app 的 `desktop` profile 不接受 `github:`。用 `dsh web` 装进 web profile。

## 命令

```text
/goal <objective> [--budget <tokens>]
/goal status
/goal pause
/goal resume
/goal clear
```

只有末尾单独出现的正整数 `--budget` 会被吃掉。写在句子里的数字仍算目标正文。省略 `--budget` 时用插件设置里的默认额度；默认不限额，除非你在设置 → 插件里关掉。`create_goal` 不会自己选额度。

Dock 显示状态、目标、token、暂停/继续，以及计划、todos、verifier 缺口、strategist 备注、最近历史和完成摘要。Clear 要再确认一次。

新 Goal 会替换当前 Goal。工人自称完成或卡住只作参考。完成前要过 adversarial verifier。verifier 全挂会暂停，不会当成完成。恢复出来的进行中 Goal 会先暂停，等人点继续。改默认额度不会改写已经在跑的 Goal。

## 配置

插件卡片在 DSH 设置 → 插件。

```yaml
unlimitedTokenBudget: true
defaultTokenBudget: 200000
classifierMaxRuns: 10
verifierCount: 3
strategistEvery: 5
enabled: true
```

`verifierCount` 限制在 1–5。默认不限额、十次 verifier、三个 skeptic，连续五次被拒再请 strategist。

快照写在 Storage Domain sidecar，不写进官方 Session 日志。plugin-source 只使用 0.1.5 认的字段。dock 通过本机 loopback Connection RPC 读当前状态。

界面合同见 `DESIGN.md`。来源归属见 `THIRD_PARTY_NOTICES.md`。

## 从源码构建

日常安装不用这一步。改 TypeScript 后用 **pnpm** 重建已提交的 `lib/`：

```sh
pnpm install --ignore-workspace
pnpm test
pnpm build
```
