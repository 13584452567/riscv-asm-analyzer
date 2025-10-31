# riscv-asm-analyzer

riscv-asm-analyzer 是一个用于在 VS Code 中分析 RISC-V 汇编代码的扩展。它提供指令解析、反汇编/汇编支持、寄存器显示与错误提示，方便开发者在编辑器内快速查看汇编结构与语义信息。

## 主要功能

- 高质量的 RISC-V 指令解析与语义分析
- 支持多种指令集（rv32i/rv64i/rvc 等）和扩展集
- 从选中文本快速加载并分析汇编块（右键菜单/编辑器标题）
- 在侧边栏以可读格式显示反汇编/寄存器/错误信息

## 安装

在 VS Code 中搜索 `riscv-asm-analyzer` 并安装，或者从 VSIX 文件安装。

## 使用示例

1. 打开一个包含 RISC-V 汇编的文件（`.s`, `.asm` 等）。
2. 选中一段汇编代码，右键选择 “Load selection” 或使用命令面板命令 `riscv-asm-analyzer.loadSelection`。
3. 查看侧边栏的反汇编视图。

## 配置

本扩展提供如下用户设置（在 `settings.json` 中）：

- `riscvAsmAnalyzer.cliPath` (string) — 可选，指向本地外部分析工具的路径（如果你需要将处理委托给外部 CLI）。
- `riscvAsmAnalyzer.defaultArgs` (string[]) — 当使用外部 CLI 时的默认参数。

## 常见问题

- Q: 如何更改图标或侧边栏图标？
	A: 图标文件位于 `images/` 目录（`images/icon.png` 与 `images/riscv-view.svg`），可替换这些文件并在 `package.json` 中保留或更新 `icon` 字段。

## 贡献

欢迎通过提交 issue 或 pull request 的方式贡献代码。仓库地址：

https://github.com/13584452567/riscv-asm-analyzer

在提交 PR 前请确保已运行 `npm run lint` 和 `npm run compile`。

## 许可

本项目采用 MIT 许可（`LICENSE`）。