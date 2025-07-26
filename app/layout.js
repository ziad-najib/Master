import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'

export const metadata = {
  title: 'متجري الإلكتروني - تسوق كل شيء',
  description: 'متجر إلكتروني متكامل يبيع الإلكترونيات والملابس والمواد الغذائية وأكثر',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-sans bg-background text-foreground">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}