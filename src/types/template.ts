export interface TemplateManifest {
    id: string; // 模板唯一ID，例如 "quiz-template"
    name: string; // 模板显示名称，例如 "问答游戏模板"
    description: string; // 模板的简短描述
    version: string; // 模板版本
    previewImageUrl?: string; // 模板预览图的相对路径 (相对于模板根目录)
    entryPoint: string; // 模板示例的入口HTML文件名，例如 "index.html"
    tags?: string[]; // 模板标签，用于分类和搜索
    author?: string; // 模板作者
    createdAt?: string; // 创建日期
}