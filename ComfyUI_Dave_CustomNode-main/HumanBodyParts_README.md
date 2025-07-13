# Human Body Parts Conditioning 人体部件条件控制

## 🎯 功能概述

**Human Body Parts Conditioning** 是一个专为人物拆解功能设计的高级条件节点，支持10个主要人体部件的精确控制。这个节点可以自动将输入的条件分类到对应的人体部件上，实现专业级的人体解剖学条件控制。

## 🏗️ 节点结构

### 主要节点
- **HumanBodyPartsConditioning** - 人体部件条件控制主节点
- **HumanBodyPartsDebug** - 人体部件调试节点

### 支持的人体部件

| 部件ID | 中文名称 | 英文名称 | 默认颜色 | 功能描述 |
|--------|----------|----------|----------|----------|
| head | 头部 | Head | #FF6B6B | 面部、头发、颈部区域 |
| torso | 躯干 | Torso | #4ECDC4 | 胸部、腹部、背部区域 |
| left_upper_arm | 左大臂 | Left Upper Arm | #45B7D1 | 左侧肩膀到肘部 |
| left_forearm | 左小臂 | Left Forearm | #96CEB4 | 左侧肘部到手腕 |
| right_upper_arm | 右大臂 | Right Upper Arm | #FECA57 | 右侧肩膀到肘部 |
| right_forearm | 右小臂 | Right Forearm | #FF9FF3 | 右侧肘部到手腕 |
| left_thigh | 左大腿 | Left Thigh | #54A0FF | 左侧臀部到膝盖 |
| left_calf | 左小腿 | Left Calf | #5F27CD | 左侧膝盖到脚踝 |
| right_thigh | 右大腿 | Right Thigh | #00D2D3 | 右侧臀部到膝盖 |
| right_calf | 右小腿 | Right Calf | #FF6348 | 右侧膝盖到脚踝 |

## 🎮 使用方法

### 1. 基础使用流程

```
1. 添加 HumanBodyPartsConditioning 节点
2. 连接主要的 conditioning 输入
3. 设置图像分辨率 (resolution_x, resolution_y)
4. 选择要调整的人体部件
5. 调整该部件的位置、大小、强度、旋转
6. 可选：连接特定部件的专用 conditioning 输入
```

### 2. 节点输入

#### 必需输入
- **conditioning** - 主要条件输入（如果没有专用部件条件，将应用到所有部件）
- **resolution_x** - 图像宽度 (64-4096, 步长8, 默认640)
- **resolution_y** - 图像高度 (64-4096, 步长8, 默认1024)

#### 可选输入（专用部件条件）
- **conditioning_head** - 头部专用条件
- **conditioning_torso** - 躯干专用条件
- **conditioning_left_upper_arm** - 左大臂专用条件
- **conditioning_left_forearm** - 左小臂专用条件
- **conditioning_right_upper_arm** - 右大臂专用条件
- **conditioning_right_forearm** - 右小臂专用条件
- **conditioning_left_thigh** - 左大腿专用条件
- **conditioning_left_calf** - 左小腿专用条件
- **conditioning_right_thigh** - 右大腿专用条件
- **conditioning_right_calf** - 右小腿专用条件

### 3. 界面控件

#### 分辨率控制
- **resolution_x** - 设置目标图像宽度
- **resolution_y** - 设置目标图像高度

#### 部件选择
- **selected_part** - 下拉菜单选择当前编辑的人体部件

#### 部件参数（针对选中部件）
- **x** - 部件X坐标位置
- **y** - 部件Y坐标位置  
- **width** - 部件宽度
- **height** - 部件高度
- **strength** - 条件强度 (0.0-10.0)
- **rotation** - 旋转角度 (-180°到180°)

## 🎨 可视化界面

### 人体结构图
- **彩色区域显示** - 每个部件用不同颜色标识
- **连接线显示** - 显示人体部件之间的解剖学连接关系
- **选中高亮** - 当前选中的部件会高亮显示并显示边框
- **旋转指示器** - 带旋转的部件会显示方向指示器
- **实时信息** - 底部显示当前部件的位置和大小信息

### 连接关系
```
头部 ── 躯干 ── 左大臂 ── 左小臂
        │
        ├── 右大臂 ── 右小臂
        │
        ├── 左大腿 ── 左小腿
        │
        └── 右大腿 ── 右小腿
```

## 💡 使用技巧

### 1. 专业人物拆解工作流

```
CLIP Text Encode (描述头部) → conditioning_head
CLIP Text Encode (描述躯干) → conditioning_torso
CLIP Text Encode (描述手臂) → conditioning_left_upper_arm
...
CLIP Text Encode (主要描述) → conditioning (主输入)
                            ↓
                HumanBodyPartsConditioning
                            ↓
                    KSampler (生成)
```

### 2. 快速配置

#### 右键菜单选项：
- **🔄 重置所有部件** - 恢复所有部件到默认配置
- **👤 标准人体比例** - 应用标准人体解剖学比例

### 3. 高级技巧

#### A. 分层控制
```python
# 可以为不同部件使用不同的条件输入
头部条件: "beautiful face, detailed eyes, perfect skin"
躯干条件: "elegant dress, detailed fabric"
手臂条件: "graceful arms, detailed hands"
```

#### B. 动态调整
- 通过调整 **strength** 参数控制每个部件的条件强度
- 使用 **rotation** 参数适应不同的人物姿态
- 精确的位置和大小控制确保部件准确对应

#### C. 批量处理
- 可以通过修改分辨率自动按比例缩放所有部件
- 部件配置会自动保存在节点属性中

## 🔧 技术特性

### 8像素对齐
- 所有区域坐标自动进行8像素对齐，确保与AI模型的最佳兼容性

### 旋转支持
- 每个部件都支持独立的旋转控制
- 旋转中心自动计算为部件中心点
- 可视化界面显示旋转指示器

### 边界检查
- 自动确保所有部件区域不会超出图像边界
- 智能的尺寸限制和位置修正

### 条件合并
- 支持主条件和专用部件条件的智能合并
- 如果没有专用条件，自动使用主条件
- 每个部件的条件独立处理，不会相互影响

## 🐛 调试功能

### HumanBodyPartsDebug 节点
连接到 HumanBodyPartsConditioning 的输出，可以查看：
- 每个部件的详细配置信息
- 条件张量的形状和内容
- 区域坐标和变换信息
- 强度和旋转参数

### 调试输出示例
```
=== 人体部件条件调试信息 ===

条件 #1:
  张量形状: torch.Size([1, 77, 768])
  人体部件: 头部 (head)
  区域 #1: x=256, y=48, w=184, h=224
  强度: 1.000
  旋转: 0.0°

条件 #2:
  张量形状: torch.Size([1, 77, 768])
  人体部件: 躯干 (torso)
  区域 #1: x=200, y=280, w=240, h=360
  强度: 1.200
  旋转: 15.0°
  旋转中心: (320, 460)
```

## 📝 使用案例

### 1. 时装设计
```
头部: "fashion model face, professional makeup"
躯干: "elegant evening gown, silk fabric, detailed embroidery"
手臂: "graceful arms, jewelry, gloves"
腿部: "long legs, high heels"
```

### 2. 角色设计
```
头部: "anime character, blue eyes, blonde hair"
躯干: "magical armor, glowing runes"
左臂: "mechanical arm, cyberpunk style"
右臂: "organic arm, natural skin"
腿部: "armored boots, detailed metal"
```

### 3. 医学可视化
```
头部: "anatomical head, medical illustration"
躯干: "skeletal structure, internal organs"
四肢: "muscle definition, anatomical accuracy"
```

## ⚠️ 注意事项

1. **分辨率设置** - 确保设置正确的目标图像分辨率
2. **部件重叠** - 避免部件区域过度重叠，可能导致条件冲突
3. **条件兼容性** - 确保不同部件的条件描述相互兼容
4. **性能考虑** - 大量部件和高分辨率会增加计算负担

## 🔄 版本兼容性

- **ComfyUI版本**: v0.3.43 (推荐) / v0.3.40+ (兼容)
- **前端API**: v1.23.4
- **Python版本**: 3.8+
- **PyTorch**: 最新稳定版

## 📞 支持与反馈

如有问题或建议，请通过以下方式联系：
- GitHub Issues: [项目地址]
- 社区论坛: ComfyUI Discord
- 作者: Davemane42

---

*Human Body Parts Conditioning v3.0.0 - 专业的人体解剖学条件控制解决方案* 