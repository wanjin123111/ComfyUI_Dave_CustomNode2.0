#!/usr/bin/env python3
"""
ComfyUI Dave Custom Node - Version Compatibility Checker
兼容性检查器 - 适配ComfyUI v0.3.43

This script checks if the current ComfyUI installation is compatible
with Dave's Custom Nodes v2.5.2
"""

import sys
import os
import importlib.util
from typing import Tuple, Optional

def get_comfyui_version() -> Optional[str]:
    """
    获取当前ComfyUI版本
    Get current ComfyUI version
    """
    try:
        # 方法1：从comfyui_version模块导入
        try:
            from comfyui_version import VERSION
            return VERSION
        except ImportError:
            pass
        
        # 方法2：从comfy模块导入
        try:
            import comfy
            return getattr(comfy, '__version__', None)
        except ImportError:
            pass
        
        # 方法3：从__init__.py或main.py读取
        try:
            import __main__
            if hasattr(__main__, '__file__'):
                comfyui_dir = os.path.dirname(os.path.realpath(__main__.__file__))
                version_file = os.path.join(comfyui_dir, 'comfyui_version.py')
                if os.path.exists(version_file):
                    spec = importlib.util.spec_from_file_location("comfyui_version", version_file)
                    module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(module)
                    return getattr(module, 'VERSION', None)
        except Exception:
            pass
        
        return None
        
    except Exception as e:
        print(f"Error getting ComfyUI version: {e}")
        return None

def check_python_version() -> Tuple[bool, str]:
    """
    检查Python版本兼容性
    Check Python version compatibility
    """
    major, minor = sys.version_info[:2]
    
    if major < 3 or (major == 3 and minor < 8):
        return False, f"Python {major}.{minor} is too old. Requires Python 3.8+"
    elif major == 3 and minor == 8:
        return True, f"Python {major}.{minor} is supported but Python 3.10+ is recommended"
    elif major == 3 and minor >= 9:
        return True, f"Python {major}.{minor} is fully supported"
    else:
        return True, f"Python {major}.{minor} should work but is not tested"

def check_torch_availability() -> Tuple[bool, str]:
    """
    检查PyTorch可用性
    Check PyTorch availability
    """
    try:
        import torch
        version = torch.__version__
        
        # 检查CUDA支持
        cuda_available = torch.cuda.is_available()
        cuda_info = f"CUDA: {'Available' if cuda_available else 'Not Available'}"
        
        return True, f"PyTorch {version} ({cuda_info})"
        
    except ImportError:
        return False, "PyTorch not found. Please install PyTorch."

def check_comfyui_modules() -> Tuple[bool, str]:
    """
    检查ComfyUI核心模块
    Check ComfyUI core modules
    """
    required_modules = [
        'nodes',
        'comfy.model_management',
        'comfy.utils',
        'folder_paths'
    ]
    
    missing_modules = []
    available_modules = []
    
    for module_name in required_modules:
        try:
            importlib.import_module(module_name)
            available_modules.append(module_name)
        except ImportError:
            missing_modules.append(module_name)
    
    if missing_modules:
        return False, f"Missing modules: {', '.join(missing_modules)}"
    else:
        return True, f"All required modules available: {', '.join(available_modules)}"

def parse_version(version_str: str) -> Tuple[int, int, int]:
    """
    解析版本字符串
    Parse version string
    """
    try:
        # 移除前缀如 'v' 并分割版本号
        clean_version = version_str.lstrip('v')
        parts = clean_version.split('.')
        
        major = int(parts[0]) if len(parts) > 0 else 0
        minor = int(parts[1]) if len(parts) > 1 else 0
        patch = int(parts[2]) if len(parts) > 2 else 0
        
        return major, minor, patch
    except (ValueError, IndexError):
        return 0, 0, 0

def check_comfyui_version_compatibility(current_version: str) -> Tuple[bool, str]:
    """
    检查ComfyUI版本兼容性
    Check ComfyUI version compatibility
    """
    if not current_version:
        return False, "Could not determine ComfyUI version"
    
    try:
        current = parse_version(current_version)
        min_required = (0, 3, 40)  # 最低要求版本
        recommended = (0, 3, 43)   # 推荐版本
        
        if current >= recommended:
            return True, f"ComfyUI {current_version} is fully compatible (recommended)"
        elif current >= min_required:
            return True, f"ComfyUI {current_version} is compatible but v0.3.43+ is recommended"
        else:
            return False, f"ComfyUI {current_version} is too old. Requires v0.3.40+"
            
    except Exception as e:
        return False, f"Error checking version compatibility: {e}"

def check_frontend_compatibility() -> Tuple[bool, str]:
    """
    检查前端兼容性
    Check frontend compatibility
    """
    try:
        # 检查是否能访问前端目录
        import __main__
        if hasattr(__main__, '__file__'):
            comfyui_dir = os.path.dirname(os.path.realpath(__main__.__file__))
            
            # 检查可能的前端路径
            frontend_paths = [
                os.path.join(comfyui_dir, 'web'),
                os.path.join(comfyui_dir, 'app'),
                os.path.join(comfyui_dir, 'frontend')
            ]
            
            for path in frontend_paths:
                if os.path.exists(path):
                    return True, f"Frontend directory found: {path}"
            
            return False, "No frontend directory found"
        else:
            return True, "Frontend check skipped (no main file)"
            
    except Exception as e:
        return True, f"Frontend check failed but continuing: {e}"

def main():
    """
    主检查函数
    Main check function
    """
    print("=" * 60)
    print("ComfyUI Dave Custom Node - Compatibility Checker v2.5.2")
    print("Compatible with ComfyUI v0.3.43")
    print("=" * 60)
    
    all_checks_passed = True
    
    # 检查Python版本
    python_ok, python_msg = check_python_version()
    print(f"✓ Python Version: {python_msg}" if python_ok else f"✗ Python Version: {python_msg}")
    if not python_ok:
        all_checks_passed = False
    
    # 检查PyTorch
    torch_ok, torch_msg = check_torch_availability()
    print(f"✓ PyTorch: {torch_msg}" if torch_ok else f"✗ PyTorch: {torch_msg}")
    if not torch_ok:
        all_checks_passed = False
    
    # 检查ComfyUI模块
    modules_ok, modules_msg = check_comfyui_modules()
    print(f"✓ ComfyUI Modules: {modules_msg}" if modules_ok else f"✗ ComfyUI Modules: {modules_msg}")
    if not modules_ok:
        all_checks_passed = False
    
    # 检查ComfyUI版本
    comfyui_version = get_comfyui_version()
    if comfyui_version:
        version_ok, version_msg = check_comfyui_version_compatibility(comfyui_version)
        print(f"✓ ComfyUI Version: {version_msg}" if version_ok else f"✗ ComfyUI Version: {version_msg}")
        if not version_ok:
            all_checks_passed = False
    else:
        print("⚠ ComfyUI Version: Could not determine version (may still work)")
    
    # 检查前端兼容性
    frontend_ok, frontend_msg = check_frontend_compatibility()
    print(f"✓ Frontend: {frontend_msg}" if frontend_ok else f"⚠ Frontend: {frontend_msg}")
    
    print("=" * 60)
    
    if all_checks_passed:
        print("🎉 All compatibility checks passed!")
        print("Dave's Custom Nodes should work correctly with your ComfyUI installation.")
    else:
        print("❌ Some compatibility issues detected.")
        print("Please address the issues above before using Dave's Custom Nodes.")
    
    print("\nNode Information:")
    print("- Multi Area Conditioning (Dave): Visual area conditioning with rotation support")
    print("- Multi Latent Composite (Dave): Advanced latent image compositing")
    print("- Conditioning Upscale (Dave): Scale conditioning areas")
    print("- Conditioning Stretch (Dave): Stretch conditioning to new resolutions")
    print("- Conditioning Debug (Dave): Debug conditioning data")
    
    print("\nFor support and updates:")
    print("- GitHub: https://github.com/davemane42/ComfyUI_Dave_CustomNode")
    print("- ComfyUI Forum: https://forum.comfy.org/")
    
    return 0 if all_checks_passed else 1

if __name__ == "__main__":
    sys.exit(main()) 