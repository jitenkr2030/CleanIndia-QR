# 🚽 CleanIndia QR

**Smart Toilet Monitoring & Hygiene Feedback Platform**

A comprehensive QR-based hygiene monitoring system that enables public users to give instant feedback, staff to record cleaning activity, and admins to monitor hygiene in real-time.

## 🌟 Features

### 📱 **QR Code Feedback System**
- **Instant Mobile Feedback**: No login required for public users
- **Star Rating System**: 1-5 star rating with visual feedback
- **Issue Reporting**: Select from common issues (Dirty Floor, No Soap, etc.)
- **Photo Upload**: Optional photo evidence for complaints
- **Real-time Status**: Shows last cleaned time and hygiene rating
- **Trust Building**: "Maintained by CleanIndia QR" badge

### 👨‍💼 **Admin Dashboard**
- **Real-time Statistics**: Total toilets, average rating, today's feedback
- **Live Monitoring**: Recent feedback with ratings and issues
- **Multi-location Support**: Manage buildings, floors, and individual toilets
- **Staff Performance**: Track cleaning efficiency and ratings
- **Alert System**: Low ratings and missed cleaning alerts

### 🧹 **Cleaning Staff Portal**
- **Assigned Toilets**: View assigned toilets with status
- **Digital Checklist**: 7-item cleaning checklist (Floor, Seat, Trash, etc.)
- **Cleaning Logs**: Record cleaning activity with notes
- **Real-time Updates**: Automatic status updates after cleaning
- **Performance Tracking**: Individual staff performance metrics

### 🏢 **Multi-Location Management**
- **Hierarchical Structure**: Company → Location → Floor → Toilet
- **Scalable Architecture**: Support for hundreds of toilets
- **Location Analytics**: Per-location hygiene scores and reports

## 🛠 Technology Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (New York style)
- **Icons**: Lucide React
- **State Management**: React Hooks, Zustand
- **Forms**: React Hook Form with Zod validation

### Backend
- **API**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Validation**: Zod schemas
- **Error Handling**: Comprehensive error management

### Development
- **Package Manager**: Bun
- **Linting**: ESLint with Next.js rules
- **Code Quality**: TypeScript strict mode

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jitenkr2030/CleanIndia-QR.git
   cd CleanIndia-QR
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL
   ```

4. **Set up the database**
   ```bash
   bun run db:push
   ```

5. **Seed sample data (optional)**
   ```bash
   bunx tsx seed.ts
   ```

6. **Start the development server**
   ```bash
   bun run dev
   ```

7. **Open your browser**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
CleanIndia-QR/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── feedback/     # Feedback submission/retrieval
│   │   │   ├── dashboard/    # Dashboard statistics
│   │   │   ├── toilets/      # Toilet management
│   │   │   └── cleaning-logs/ # Cleaning activity logs
│   │   ├── globals.css       # Global styles
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Main application page
│   ├── components/
│   │   └── ui/               # shadcn/ui components
│   ├── lib/
│   │   ├── db.ts             # Database client
│   │   └── utils.ts          # Utility functions
│   └── hooks/
│       └── use-toast.ts      # Toast notifications
├── public/                   # Static assets
├── seed.ts                   # Database seeding script
└── README.md                 # This file
```

## 🎯 Usage Guide

### For Public Users
1. Scan QR code at any toilet location
2. Rate hygiene (1-5 stars)
3. Select issues if any (optional)
4. Add comments (optional)
5. Submit feedback

### For Admin Users
1. Access Admin Dashboard
2. Monitor real-time statistics
3. Review feedback and complaints
4. Track staff performance
5. Manage locations and toilets

### For Cleaning Staff
1. Access Staff Portal
2. View assigned toilets
3. Complete cleaning checklist
4. Mark toilets as cleaned
5. Add cleaning notes

## 🔧 API Endpoints

### Feedback
- `POST /api/feedback` - Submit new feedback
- `GET /api/feedback` - Get all feedback (admin)

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

### Toilets
- `GET /api/toilets` - Get toilets with filtering
- `POST /api/toilets` - Create new toilet

### Cleaning Logs
- `POST /api/cleaning-logs` - Log cleaning activity
- `GET /api/cleaning-logs` - Get cleaning history

## 📊 Database Schema

### Core Entities
- **Company**: Organization managing facilities
- **Location**: Physical building/facility
- **Floor**: Floor within a location
- **Toilet**: Individual toilet unit with QR code
- **Feedback**: User feedback and ratings
- **Staff**: Cleaning staff members
- **CleaningLog**: Cleaning activity records

### Relationships
- Company → Locations → Floors → Toilets
- Staff → StaffAssignments → Toilets
- Toilets → Feedback (one-to-many)
- Toilets → CleaningLogs (one-to-many)

## 🎨 UI/UX Features

- **Mobile-First Design**: Optimized for smartphones
- **Responsive Layout**: Works on all screen sizes
- **Accessibility**: ARIA labels, keyboard navigation
- **Loading States**: Smooth loading indicators
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Non-intrusive feedback
- **Dark Mode Support**: Ready for theme switching

## 🔒 Security Features

- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Prisma ORM
- **XSS Protection**: React's built-in protection
- **Rate Limiting**: Ready for implementation
- **CORS Configuration**: Secure API access

## 📈 Performance

- **Optimized Images**: Next.js Image component
- **Code Splitting**: Automatic route-based splitting
- **Caching**: Database query optimization
- **Bundle Size**: Optimized with Tree Shaking

## 🧪 Testing

```bash
# Run linting
bun run lint

# Type checking
bun run type-check

# Database operations
bun run db:push
bun run db:studio
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect repository to Vercel
2. Set environment variables
3. Deploy automatically

### Docker
```bash
# Build image
docker build -t cleanindia-qr .

# Run container
docker run -p 3000:3000 cleanindia-qr
```

### Traditional Hosting
```bash
# Build for production
bun run build

# Start production server
bun start
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://www.prisma.io/) - Database toolkit
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Lucide](https://lucide.dev/) - Icon library

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: support@cleanindiaqr.com
- Documentation: [Wiki](https://github.com/jitenkr2030/CleanIndia-QR/wiki)

---

**CleanIndia QR** - Building trust through transparency and accountability in public hygiene. 🚽✨