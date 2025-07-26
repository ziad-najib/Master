import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { StoreProvider } from '../contexts/StoreContext'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  title: 'متجري الإلكتروني - تسوق كل شيء',
  description: 'متجر إلكتروني متكامل يبيع الإلكترونيات والملابس والمواد الغذائية وأكثر - دعم العملات المتعددة وتكامل WhatsApp',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-sans bg-background text-foreground antialiased">
        <AuthProvider>
          <StoreProvider>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                  direction: 'rtl',
                },
              }}
            />
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  )
}