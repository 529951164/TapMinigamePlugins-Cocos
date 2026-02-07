#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
脚本用途：重新打包 Tap小游戏的 game.zip 文件
使用场景：开发者手动修改 build/TapBuild/game/ 目录后，需要重新生成 game.zip

使用方法：
    python3 repack_game.py
    或者
    python3 repack_game.py --game-dir /path/to/game
"""

import os
import sys
import zipfile
import argparse
from pathlib import Path


def validate_game_directory(game_dir: Path) -> bool:
    """验证 game 目录是否有效"""
    if not game_dir.exists():
        print(f"❌ 错误：目录不存在: {game_dir}")
        return False

    if not game_dir.is_dir():
        print(f"❌ 错误：路径不是目录: {game_dir}")
        return False

    # 检查是否包含必要的文件
    required_files = ['game.js', 'game.json']
    missing_files = [f for f in required_files if not (game_dir / f).exists()]

    if missing_files:
        print(f"⚠️  警告：缺少必要文件: {', '.join(missing_files)}")
        response = input("是否继续打包？[y/N] ").lower()
        if response != 'y':
            return False

    return True


def count_files(game_dir: Path) -> int:
    """统计目录中的文件数量"""
    count = 0
    for item in game_dir.rglob('*'):
        if item.is_file():
            count += 1
    return count


def create_game_zip(game_dir: Path, output_zip: Path, compression_level: int = 9) -> bool:
    """
    创建 game.zip 文件

    关键：ZIP 内部结构必须是文件直接在根目录，不能包含 'game' 文件夹
    正确结构：game.zip/game.js, game.zip/game.json
    错误结构：game.zip/game/game.js, game.zip/game/game.json

    Args:
        game_dir: game 目录的路径
        output_zip: 输出的 ZIP 文件路径
        compression_level: 压缩级别 (0-9)

    Returns:
        bool: 是否成功
    """
    try:
        # 删除旧的 ZIP 文件
        if output_zip.exists():
            print(f"🗑️  删除旧的 ZIP 文件: {output_zip.name}")
            output_zip.unlink()

        # 统计文件数量
        total_files = count_files(game_dir)
        print(f"📦 开始打包 {total_files} 个文件...")

        # 创建 ZIP 文件
        processed_files = 0
        with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED, compresslevel=compression_level) as zf:
            for item in game_dir.rglob('*'):
                if item.is_file():
                    # 计算相对路径（关键：这样 ZIP 内部就不会包含 'game' 目录）
                    relative_path = item.relative_to(game_dir)

                    # 写入 ZIP（使用相对路径）
                    zf.write(item, relative_path)

                    processed_files += 1
                    if processed_files % 100 == 0:
                        print(f"  进度: {processed_files}/{total_files} 个文件")

        # 获取文件大小
        zip_size_bytes = output_zip.stat().st_size
        zip_size_mb = zip_size_bytes / (1024 * 1024)

        print(f"\n✅ 打包完成！")
        print(f"   文件数量: {processed_files}")
        print(f"   ZIP 大小: {zip_size_mb:.2f} MB")
        print(f"   输出路径: {output_zip}")

        return True

    except Exception as e:
        print(f"\n❌ 打包失败: {str(e)}")
        return False


def verify_zip_structure(zip_path: Path, sample_count: int = 5) -> None:
    """验证 ZIP 文件的内部结构（显示前几个文件路径）"""
    print(f"\n🔍 验证 ZIP 内部结构（前 {sample_count} 个文件）：")
    try:
        with zipfile.ZipFile(zip_path, 'r') as zf:
            file_list = zf.namelist()[:sample_count]
            for filename in file_list:
                print(f"   ✓ {filename}")

            # 检查是否有错误的目录结构
            has_game_prefix = any(f.startswith('game/') for f in zf.namelist())
            if has_game_prefix:
                print(f"\n⚠️  警告：检测到错误的目录结构（包含 'game/' 前缀）")
                print("   这可能导致 TapTap 小游戏无法正常运行！")
            else:
                print(f"\n✓ 目录结构正确（文件在 ZIP 根目录）")

    except Exception as e:
        print(f"   验证失败: {str(e)}")


def main():
    parser = argparse.ArgumentParser(
        description='重新打包 Tap小游戏的 game.zip 文件',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
示例:
  # 使用默认路径 (build/TapBuild/game)
  python3 repack_game.py

  # 指定自定义路径
  python3 repack_game.py --game-dir /path/to/custom/game

  # 使用较低的压缩级别（更快，但文件更大）
  python3 repack_game.py --compression 6
        '''
    )

    parser.add_argument(
        '--game-dir',
        type=str,
        default='build/TapBuild/game',
        help='game 目录的路径（默认: build/TapBuild/game）'
    )

    parser.add_argument(
        '--compression',
        type=int,
        default=9,
        choices=range(0, 10),
        help='ZIP 压缩级别 0-9（默认: 9 最大压缩）'
    )

    args = parser.parse_args()

    # 解析路径
    game_dir = Path(args.game_dir).resolve()
    output_zip = game_dir.parent / 'game.zip'

    print("=" * 60)
    print("TapTap 小游戏重新封包工具")
    print("=" * 60)
    print(f"📁 game 目录: {game_dir}")
    print(f"📦 输出文件: {output_zip}")
    print(f"🗜️  压缩级别: {args.compression}/9")
    print("=" * 60)
    print()

    # 验证目录
    if not validate_game_directory(game_dir):
        sys.exit(1)

    # 创建 ZIP
    success = create_game_zip(game_dir, output_zip, args.compression)

    if not success:
        sys.exit(1)

    # 验证 ZIP 结构
    verify_zip_structure(output_zip)

    print("\n" + "=" * 60)
    print("✅ 全部完成！game.zip 可以上传到 TapTap 开发者中心")
    print("=" * 60)


if __name__ == '__main__':
    main()
