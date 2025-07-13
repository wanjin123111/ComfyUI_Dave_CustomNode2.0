# 🎨 Flux Kontext ComfyUI 自定义节点集成指南

## 📋 概述

本文档介绍了为ComfyUI开发的Flux Kontext自定义节点集成，基于Black Forest Labs最新开源的Flux.1 Kontext模型架构。这套节点适配了Flux Kontext的Flow-Matching架构和双文本编码器系统，为用户提供了专业级别的图像编辑能力。

### 🏗️ **Flux Kontext架构特点**

1. **Flow-Matching架构** - 相比传统扩散模型提供3-5倍的处理速度提升
2. **双文本编码器系统** - 结合CLIP-L和T5编码器，实现精确的文本理解
3. **上下文感知机制** - 专门优化的图像到图像编辑能力
4. **角色一致性维护** - 确保编辑过程中关键特征保持稳定
5. **多种宽高比支持** - 从1:4到4:1的完整比例范围

### 📊 **支持的编辑类型**

- **风格转换** (`style_transfer`) - 艺术风格应用和转换
- **背景替换** (`background_replacement`) - 智能背景更换
- **对象修改** (`object_modification`) - 精确的对象属性更改
- **文本编辑** (`text_editing`) - 图像中文本内容的修改
- **通用编辑** (`general_editing`) - 其他复合编辑任务

---

## 🛠️ 安装和配置

### 前置要求

1. **ComfyUI版本**: v0.3.40或更高（推荐v0.3.43）
2. **Python依赖**: PyTorch, NumPy
3. **VRAM要求**: 
   - 最低12GB（FP8量化模型）
   - 推荐24GB+（完整精度模型）

### 安装步骤

1. **复制节点文件**到ComfyUI自定义节点目录
2. **重启ComfyUI**以注册新节点
3. **验证安装**：在节点菜单中查找"Davemane42/FluxKontext"分类

---

## 🎯 节点使用指南

### 1. 🎨 Flux Kontext Editor (主编辑节点)

**核心功能**: 执行基于Flux Kontext架构的高级图像编辑

**输入参数**:
- `image`: 源图像输入
- `prompt`: 编辑指令文本
- `aspect_ratio`: 宽高比选择（1:4到4:1）
- `prompt_upsampling`: 提示词智能增强开关
- `guidance_scale`: 引导强度（1.0-20.0，推荐7.0）
- `num_inference_steps`: 推理步数（1-100，推荐20）
- `seed`: 随机种子（-1为随机）
- `mask` (可选): 编辑区域遮罩
- `controlnet_image` (可选): 结构控制图像

**输出**:
- `edited_image`: 编辑后的图像
- `used_prompt`: 实际使用的提示词
- `edit_metadata`: 编辑过程元数据

**使用技巧**:
```text
✅ 好的提示词: "Change the red car to a blue bicycle, keep the background and lighting unchanged"
❌ 不好的提示词: "Make it better"

✅ 好的提示词: "Transform to oil painting style, while maintaining the original composition"
❌ 不好的提示词: "Oil painting"
```

### 2. 🔗 Flux Kontext Image Stitch (图像拼接节点)

**核心功能**: 将多个图像拼接为单个图像，支持官方多图像工作流

**输入参数**:
- `image1`, `image2`: 必需的两张图像
- `image3`, `image4`: 可选的额外图像
- `stitch_direction`: 拼接方向（水平/垂直）
- `alignment`: 对齐方式（顶部/居中/底部）
- `gap`: 图像间间隙像素数

**使用场景**:
- 创建对比编辑展示
- 多角度图像合并编辑
- 序列图像批处理

### 3. 💡 Flux Kontext Prompt Helper (提示词助手)

**核心功能**: 提供最佳实践的提示词模板和编辑建议

**预设模板**:
1. **对象修改**: `Change [object] to [new_object], keep [preserve_elements] unchanged`
2. **风格转换**: `Transform to [art_style], while maintaining [composition/character/other] unchanged`
3. **背景替换**: `Change the background to [new_background], keep the subject in exact same position`
4. **文本编辑**: `Replace '[original_text]' with '[new_text]', maintain the same font style`
5. **角色一致性**: `Change [clothing/pose] while preserving facial features, hairstyle, and expression`

**输出分析**:
- 编辑类型检测
- 复杂度评估
- 最佳引导强度建议
- 专业编辑建议

---

## 📝 最佳实践指南

### ✅ 提示词编写原则

1. **具体和明确** - 使用精确的描述，避免主观词汇
   ```text
   ✅ "Change the woman's red dress to a blue evening gown"
   ❌ "Make her dress nicer"
   ```

2. **分步骤编辑** - 将复杂修改拆分为简单步骤
   ```text
   第一步: "Change the background to a beach scene"
   第二步: "Change the clothing to summer wear, keeping the same pose"
   ```

3. **明确保持元素** - 清楚说明哪些要保持不变
   ```text
   ✅ "Change the car color to red, preserve the background and lighting"
   ❌ "Change the car color to red"
   ```

4. **动词选择** - 使用直接的动作动词
   ```text
   ✅ 推荐: "Change", "Replace", "Remove", "Add"
   ❌ 避免: "Transform", "Make", "Turn into"
   ```

### 🎨 编辑类型最佳实践

#### 风格转换
```text
模板: "Convert to [具体风格名称], maintain [构图/角色] unchanged"
示例: "Convert to Van Gogh impressionist style with visible brushstrokes, maintain the original portrait composition"
```

#### 背景替换
```text
模板: "Change background to [详细背景描述], keep subject in exact same position"
示例: "Change the background to a bustling Tokyo street at night with neon signs, keep the person in the exact same position and pose"
```

#### 对象修改
```text
模板: "Replace [具体对象] with [新对象], preserve [周围元素]"
示例: "Replace the wooden chair with a modern office chair, preserve the room lighting and floor"
```

#### 文本编辑
```text
模板: "Replace '[原文本]' with '[新文本]', maintain [格式要求]"
示例: "Replace 'OPEN' with 'CLOSED' on the shop sign, maintain the same red neon font style"
```

---

## 🔧 技术架构详解

### Flow-Matching处理流程

```python
# 核心处理流程伪代码
def flux_kontext_pipeline(image, prompt, params):
    # 1. 双文本编码器处理
    clip_embedding = clip_encoder(prompt)
    t5_embedding = t5_encoder(prompt)
    
    # 2. 图像编码
    latent = vae_encode(image)
    
    # 3. Flow-Matching推理
    for step in range(num_steps):
        noise_pred = unet(latent, clip_embedding, t5_embedding, step)
        latent = flow_matching_step(latent, noise_pred)
    
    # 4. 解码输出
    result = vae_decode(latent)
    return result
```

### 支持的宽高比配置

```python
SUPPORTED_ASPECT_RATIOS = [
    ("1:4", 0.25),   # 极窄竖版
    ("2:7", 2/7),    # 手机竖版
    ("3:8", 3/8),    # 宽屏竖版
    ("9:21", 9/21),  # 超宽竖版
    ("9:16", 9/16),  # 标准竖版
    ("2:3", 2/3),    # 经典竖版
    ("3:4", 3/4),    # 传统竖版
    ("1:1", 1.0),    # 正方形
    ("4:3", 4/3),    # 传统横版
    ("3:2", 3/2),    # 经典横版
    ("16:9", 16/9),  # 标准横版
    ("21:9", 21/9),  # 超宽横版
    ("8:3", 8/3),    # 宽屏横版
    ("7:2", 7/2),    # 手机横版
    ("4:1", 4.0),    # 极宽横版
]
```

---

## 🚀 使用示例

### 示例1: 风格转换

```python
# 节点配置
image = load_image("portrait.jpg")
prompt = "Transform to Ghibli animation style with soft colors and gentle shading, while maintaining the person's facial features and pose"
aspect_ratio = "1:1"
prompt_upsampling = True
guidance_scale = 7.5

# 预期结果: 保持原始人像特征的宫崎骏风格转换
```

### 示例2: 背景替换

```python
# 节点配置  
image = load_image("person_indoors.jpg")
prompt = "Change the background to a serene mountain landscape at sunset, keep the person in the exact same position, scale, and pose"
aspect_ratio = "16:9"
prompt_upsampling = False
guidance_scale = 8.0

# 预期结果: 人物位置不变的背景替换
```

### 示例3: 多图像拼接编辑

```python
# 步骤1: 图像拼接
image1 = load_image("before.jpg")
image2 = load_image("reference.jpg")
stitched = flux_kontext_stitch(image1, image2, direction="horizontal")

# 步骤2: 联合编辑
prompt = "Apply the color palette from the right image to the left image, maintaining the original composition"
result = flux_kontext_edit(stitched, prompt)
```

---

## 🔍 故障排除

### 常见问题及解决方案

#### 1. 角色特征变化过大
```text
问题: "Turn the person into a astronaut"
解决: "Change the person's clothes to a white NASA astronaut suit, preserve facial features and hair"
```

#### 2. 位置偏移
```text
问题: "Put him on a beach"  
解决: "Change the background to a beach scene, keep the person in exact same position and pose"
```

#### 3. 风格应用不准确
```text
问题: "Make it a sketch"
解决: "Convert to pencil sketch with natural graphite lines and visible paper texture"
```

#### 4. 编辑强度过高/过低
- **过高**: 降低guidance_scale (6.0-7.0)
- **过低**: 提高guidance_scale (8.0-9.0)
- **调整步数**: 质量要求高用30-50步，快速预览用10-15步

### 性能优化建议

1. **内存优化**:
   - 使用FP8量化模型减少VRAM占用
   - 调整批处理大小
   - 启用模型卸载

2. **速度优化**:
   - 使用较少的推理步数（15-25步）
   - 选择合适的宽高比避免不必要的裁剪
   - 批量处理多个编辑任务

3. **质量优化**:
   - 启用提示词增强功能
   - 使用具体详细的描述
   - 针对不同编辑类型调整引导强度

---

## 📚 技术参考

### API参数对照表

| 参数名 | 类型 | 范围 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `guidance_scale` | float | 1.0-20.0 | 7.0 | 提示词遵循强度 |
| `num_inference_steps` | int | 1-100 | 20 | 推理迭代次数 |
| `aspect_ratio` | str | 预定义列表 | "1:1" | 输出宽高比 |
| `prompt_upsampling` | bool | True/False | False | 智能提示词增强 |
| `seed` | int | -1 到 2^31-1 | -1 | 随机种子 |

### 编辑类型引导强度建议

| 编辑类型 | 推荐引导强度 | 说明 |
|----------|--------------|------|
| 风格转换 | 7.5 | 平衡风格应用和细节保持 |
| 背景替换 | 8.0 | 确保背景完全替换 |
| 对象修改 | 6.5 | 保持周围环境稳定 |
| 文本编辑 | 9.0 | 精确的文本替换 |
| 通用编辑 | 7.0 | 通用平衡设置 |

---

## 🔄 版本更新日志

### v1.0.0 (2025-01-27)
- ✅ 初始发布
- ✅ 支持Flux Kontext Flow-Matching架构
- ✅ 双文本编码器集成（CLIP-L + T5）
- ✅ 15种宽高比支持
- ✅ 智能提示词处理和增强
- ✅ 多图像拼接工作流
- ✅ 提示词助手和最佳实践模板
- ✅ 完整的中文本地化支持

### 未来计划
- 🔲 本地模型推理集成
- 🔲 更多编辑预设模板
- 🔲 批处理工作流优化
- 🔲 更高级的遮罩编辑功能

---

## 📞 支持和反馈

- **问题报告**: 请在GitHub Issues中提交
- **功能建议**: 欢迎提出改进建议  
- **文档改进**: 帮助完善使用指南

---

*本文档最后更新: 2025-01-27*
*开发者: Davemane42*
*兼容ComfyUI版本: v0.3.40+* 