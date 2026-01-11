# Teachers Management System

> A comprehensive web application for managing teacher schedules and finding cover teachers for absences.

## ✨ Features

- 📊 **Schedule Import**: Upload Excel schedules (supports 76+ teachers, 3,000+ classes)
- 🔍 **Smart Cover Finder**: Automatically finds available teachers (excludes busy & KH teachers)
- 📅 **Teacher Schedules**: View any teacher's complete weekly schedule
- 📈 **Dashboard**: Real-time stats and absence tracking
- 👥 **Multi-Teacher Support**: Handle multiple simultaneous absences

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

Visit `http://localhost:3000`

## 📖 Full Documentation

- **[Deployment Guide](./deployment_guide.md)** - Deploy to Vercel, Railway, or your own server
- **[Walkthrough](./walkthrough.md)** - Complete feature overview with screenshots

## 🎯 Next Steps

1. **Deploy to Vercel** (Recommended - Free & Easy):
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Upload your schedule data** at the home page
3. **Share the URL** with your colleagues

## 🛠️ Tech Stack

- Next.js 14, TypeScript, Prisma, PostgreSQL, Tailwind CSS

## 📄 License

MIT License - free to use for your school!

