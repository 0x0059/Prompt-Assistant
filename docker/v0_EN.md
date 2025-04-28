# Prompt Assistant 🚀

<div align="center">

[English](README_EN.md) | [中文](README.md)

</div>

## 📖 Introduction

Prompt Assistant is a powerful AI prompt optimization tool that helps you write more effective AI prompts and significantly improve AI response quality. It supports both web application and Chrome extension to meet different scenarios.

### 🎥 Feature Demonstration

<div align="center">
  <img src="images/contrast.png" alt="Feature Demonstration" width="90%">
</div>

## ✨ Core Features

- 🎯 **Intelligent Optimization** - One-click prompt optimization with multi-round iterations to greatly enhance AI response accuracy and relevance
- 🔄 **Comparison Testing** - Real-time comparison between original and optimized prompts to visually demonstrate quality improvements
- 🌐 **Multi-model Support** - Seamless integration with mainstream AI models including OpenAI, Gemini, DeepSeek, etc., suitable for different needs
- 🔒 **Privacy Protection** - Pure client-side processing with direct data interaction with AI providers, no intermediate server storage
- 💾 **Local Storage** - Local encrypted storage of history records and API keys, ensuring data security
- 📱 **Multi-platform Support** - Both web application and Chrome extension available, accommodating desktop and mobile use cases
- 🔌 **Cross-domain Support** - Edge Runtime proxy for CORS issues when deployed on Vercel, ensuring stable API connections

## Quick Start

### 1. Use Online Version (Recommended)

### 3. Docker Deployment
```bash
# Basic deployment (default config)
docker run -d -p 80:80 --restart unless-stopped --name prompt_assistant 0x0059/prompt_assistant

# Advanced deployment (with API key)
docker run -d -p 80:80 \
  -e VITE_OPENAI_API_KEY=your_key \
  --restart unless-stopped \
  --name prompt_assistant \
  0x0059/prompt_assistant
```

### 4. Docker Compose Deployment
```bash
# 1. Clone repository
git clone https://github.com/0x0059/prompt_assistant.git
cd prompt_assistant

# 2. Create .env file for API keys (optional)
cat > .env << EOF
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key
EOF

# 3. Start the service
docker compose up -d
```

## ⚙️ API Key Configuration

### Method 1: Via Interface (Recommended)
1. Click the "⚙️Settings" button in the upper right corner
2. Select the "Model Management" tab
3. Click on the model you need to configure (OpenAI, Gemini, DeepSeek, etc.)
4. Enter the corresponding API key in the configuration box
5. Click "Save" to complete configuration

### Method 2: Via Environment Variables
Configure environment variables through the `-e` parameter when deploying with Docker:
```bash
-e VITE_OPENAI_API_KEY=your_key
-e VITE_GEMINI_API_KEY=your_key
-e VITE_DEEPSEEK_API_KEY=your_key
-e VITE_CUSTOM_API_KEY=your_custom_api_key
-e VITE_CUSTOM_API_BASE_URL=your_custom_api_base_url
```

## 🧩 Models Supported

- **OpenAI** - Support for GPT-3.5-Turbo, GPT-4, and more
- **Gemini** - Support for Gemini-2.0-Flash and more  
- **DeepSeek** - Support for DeepSeek-V3 and more
- **Custom API** - Support for OpenAI-compatible interfaces, can connect to local models or other services

## 🔧 Local Development

```bash
# 1. Clone project
git clone https://github.com/0x0059/prompt_assistant.git
cd prompt_assistant

# 2. Install dependencies
pnpm install

# 3. Start development server
pnpm dev               # Main development command: build core/ui and run web app
pnpm dev:web          # Run web app only
pnpm dev:fresh        # Complete reset and restart development environment
```

For detailed development guidelines, see [Development Documentation](docs/dev.md)

## 🗺️ Roadmap

- [x] Basic feature development complete
- [x] Web application launched
- [x] Custom model support
- [x] Multi-model integration optimization
- [x] Internationalization support improved
- [ ] Mobile responsive optimization
- [ ] Enterprise deployment solutions

For detailed project progress, see [Project Status Document](docs/project-status.md)

## 📖 Related Documentation

- [Documentation Index](docs/README.md) - Index of all documentation
- [Technical Development Guide](docs/technical-development-guide.md) - Technology stack and development specifications
- [Project Structure](docs/project-structure.md) - Detailed project structure description
- [Project Status](docs/project-status.md) - Current progress and plans
- [Product Requirements](docs/prd.md) - Product requirements document

## 📊 Usage Data

<a href="https://star-history.com/#0x0059/prompt_assistant&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=0x0059/prompt_assistant&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=0x0059/prompt_assistant&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=0x0059/prompt_assistant&type=Date" />
 </picture>
</a>

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the [MIT](LICENSE) License.

---

If this project is helpful to you, please consider giving it a Star ⭐️

## 👥 Contact Us

- Submit an Issue
- Create a Pull Request
- Join the discussion group 