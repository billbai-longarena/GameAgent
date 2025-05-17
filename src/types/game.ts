export interface GameListItem {
    id: string; // 游戏或模板的唯一ID
    name: string; // 显示名称
    description?: string; // 简短描述
    version?: string; // 版本号，主要用于模板
    previewImageUrl?: string; // 预览图的相对路径
    entryPoint: string; // 游戏主入口HTML文件名或路径
    tags?: string[]; // 标签，用于分类和搜索
    author?: string; // 作者
    isGenerated: boolean; // 标记是否为AI生成的游戏
    generatedAt?: string; // AI生成游戏的时间戳 (ISO string)
    // 可以根据需要添加更多特定于生成游戏的字段
    // 例如：generationPrompt?: string; // 生成该游戏的提示
}