# dsh-grok-goals

给 DeepSeek Harness RC8 根 agent 换一套 Grok Build 风格的 Goal：命令、工具、提示策略、持久状态和输入框旁的 dock。

原生 Harness Goal 服务仍装着，参与的根 agent 上处于休眠。`/goal`、`create_goal`、`get_goal`、`update_goal` 和 `tool:goal` 会盖住自带注册。client 占用已有的 `conversation.input.dock`，id 为 `goal`。

## 命令

```text
/goal <objective> [--budget <tokens>]
/goal status
/goal pause
/goal resume
/goal clear
```

只有末尾单独出现的正整数 `--budget` 会被吃掉。写在句子里的数字仍算目标正文。

Dock 显示状态、目标、token、暂停/继续，以及计划、todos、verifier 缺口、strategist 备注、最近历史和完成摘要。Clear 要再确认一次。

新 Goal 会替换当前 Goal。工人自称完成或卡住只作参考。完成前要过 adversarial verifier。verifier 全挂会暂停，不会当成完成。恢复出来的进行中 Goal 会先暂停，等人点继续。

## 配置

```yaml
classifierMaxRuns: 10
verifierCount: 3
strategistEvery: 5
enabled: true
```

`verifierCount` 限制在 1–5。默认十次 verifier、三个 skeptic，连续五次被拒再请 strategist。

快照写在 Storage Domain sidecar，不写进官方 Session 日志。dock 通过本机 loopback Connection RPC 读当前状态。

## 构建

```sh
pnpm install --ignore-workspace
pnpm test
pnpm build
dshx check dsh-grok-goals
```

`tsdown.config.ts` 必须继续用 dshx 的 `externalClientBundle`。RC8 仓库内的 client bundler 不接受树外的 `my-plugins/*`。

界面合同见 `DESIGN.md`。来源归属见 `THIRD_PARTY_NOTICES.md`。
