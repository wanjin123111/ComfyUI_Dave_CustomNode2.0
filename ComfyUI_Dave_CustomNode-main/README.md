# ComfyUI Dave's Custom Nodes

Custom nodes for [ComfyUI](https://github.com/comfyanonymous/ComfyUI) that focus on Multi Area Conditioning and Multi Latent Compositing.

**✨ Updated for ComfyUI v0.3.43** with enhanced rotation control and optimized layout.

## 🎯 Features

- **MultiAreaConditioning**: Visually select and condition multiple areas with **rotation support**
- **MultiLatentComposite**: Efficiently composite multiple latent images with advanced blending options  
- **ConditioningUpscale**: Scale conditioning areas proportionally
- **ConditioningStretch**: Stretch conditioning to new resolutions
- **ConditioningDebug**: Debug and inspect conditioning areas with rotation info

## ✨ Latest Updates (v2.5.1)

🔄 **ComfyUI v0.3.43 Compatibility**: Fully updated for the [latest ComfyUI version](https://github.com/comfyanonymous/ComfyUI/commit/e18f53cca9062cc6b165e16712772437b80333f2)  
🎨 **Rotation Control**: New rotation parameter (-180° to 180°) for area conditioning  
📐 **Optimized Layout**: Canvas at top, parameters compactly arranged at bottom  
🎯 **Visual Indicators**: Rotation arrows and enhanced area visualization  
🛠️ **Enhanced Metadata**: Complete compatibility information and error handling

## 🚀 New Rotation Features

- **Angle Control**: Precise rotation from -180° to 180°
- **Visual Feedback**: Real-time rotation preview in canvas
- **Direction Indicator**: White arrows show rotation direction
- **Backward Compatible**: Existing workflows automatically work (rotation defaults to 0°)

## 📦 Installation

1. Navigate to your ComfyUI custom nodes directory:
   ```bash
   cd ComfyUI/custom_nodes/
   ```
2. Clone this repository:
   ```bash
   git clone https://github.com/Davemane42/ComfyUI_Dave_CustomNode.git
   ```
3. Restart ComfyUI
4. Nodes will appear as "Multi Area Conditioning (Dave)" etc.

## 🎛️ Usage

### MultiAreaConditioning
1. **Connect Inputs**: At least conditioning0 (others optional)
2. **Set Resolution**: Configure resolutionX and resolutionY
3. **Select Area**: Use index slider to choose area (0-3)
4. **Adjust Parameters**: 
   - Position: x, y coordinates
   - Size: width, height
   - Effect: strength (0.0-10.0)
   - **Rotation**: angle (-180° to 180°) ✨
5. **Visual Preview**: See real-time effects in canvas
6. **Click to Position**: Click canvas to set x,y coordinates

### Advanced Features
- **Right-click Menu**: Add/remove conditioning inputs
- **Multiple Areas**: Support for 4+ conditioning areas
- **8-pixel Alignment**: Automatic alignment for optimal results

### MultiLatentComposite
1. **Connect Latents**: Connect multiple latent inputs
2. **Position Control**: Set x, y coordinates for each layer
3. **Feathering**: Use feather parameter for smooth blending
4. **Visual Preview**: See layer positioning in real-time

## 🔧 Compatibility

### ComfyUI Versions
- **Current**: ComfyUI v0.3.43 ✅
- **Minimum**: ComfyUI v0.3.40+
- **Tested**: 0.3.40, 0.3.41, 0.3.42, 0.3.43

### System Requirements
- **Python**: 3.9+
- **Dependencies**: torch (included with ComfyUI)
- **Browser**: Modern browser with JavaScript ES6+ support

## 📊 Node Layout

```
Multi Area Conditioning Node:
┌─────────────────────────────────┐
│ [Visual Canvas - 250px]         │ ← Real-time preview with rotation
├─ resolutionX                    │ ← Image dimensions
├─ resolutionY                    │ 
├─ index                          │ ← Area selector (0-3)
├─ strength                       │ ← Effect intensity (0.0-10.0)
├─ rotation ✨                   │ ← Rotation angle (-180° to 180°)
├─ x, y                           │ ← Position coordinates  
└─ width, height                  │ ← Area dimensions
└─────────────────────────────────┘
```

## 🔄 Migration Guide

### From v2.5.0 to v2.5.1
- No breaking changes
- Rotation parameter added automatically
- Existing workflows continue to work
- New rotation defaults to 0° (no rotation)

### Upgrading Steps
1. Backup existing workflows
2. Update node files
3. Restart ComfyUI
4. Test workflows (should work automatically)
5. Explore new rotation features!

## 🛠️ Troubleshooting

### Common Issues
1. **Nodes not appearing**: 
   - Check ComfyUI version >= 0.3.40
   - Restart ComfyUI completely
   - Clear browser cache

2. **Rotation not working**:
   - Ensure using latest version (v2.5.1)
   - Check browser console for errors
   - Verify parameters are updating

3. **Layout issues**:
   - Refresh browser page
   - Check node size (should be 400x580)
   - Reset node if needed

## 📸 Screenshots

<details>
<summary>Click to see interface examples</summary>

### MultiAreaConditioning with Rotation
- Visual canvas with rotation indicators
- Compact parameter layout
- Real-time preview

### Right-click Menu
- Add/remove conditioning inputs
- Swap layer order
- Delete specific areas

</details>

## 📚 Documentation

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and update notes.

## 🏗️ All Available Nodes

| Node Name | Description | Version |
|-----------|-------------|---------|
| Multi Area Conditioning (Dave) | Visual area conditioning with rotation | v2.5.1 |
| Multi Latent Composite (Dave) | Advanced latent compositing | v2.5.1 |
| Conditioning Upscale (Dave) | Proportional conditioning scaling | v2.5.1 |
| Conditioning Stretch (Dave) | Resolution-aware conditioning | v2.5.1 |
| Conditioning Debug (Dave) | Debug conditioning with rotation info | v2.5.1 |

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Submit pull request with detailed description

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Credits

Created by **Davemane42** for the ComfyUI community.

Special thanks to:
- ComfyUI development team for the excellent framework
- Community contributors and testers
- Users who provided feedback for improvements

---

**Version**: 2.5.1 | **ComfyUI**: v0.3.43 | **Updated**: 2025-01-27