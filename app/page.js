'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ShoppingCart, User, Search, Heart, Star, Truck, Shield, Headphones, Globe } from 'lucide-react';
import { Input } from '../components/ui/input';

const HomePage = () => {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [showAuth, setShowAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories')
      ]);
      
      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();
      
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4 space-x-reverse">
              <h1 className="text-2xl font-bold text-primary">متجري</h1>
              <div className="hidden md:flex relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="ابحث عن المنتجات..."
                  className="pr-10 w-64"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4 space-x-reverse">
              {user ? (
                <div className="flex items-center space-x-4 space-x-reverse">
                  <span className="text-sm">مرحبا، {user.displayName}</span>
                  <Badge variant="secondary">{user.walletBalance || 2000} ل.س</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {cart.length > 0 && (
                      <Badge className="absolute -top-2 -right-2 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {cart.reduce((sum, item) => sum + item.quantity, 0)}
                      </Badge>
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowAuth(true)}>
                    <User className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={logout}>
                    تسجيل خروج
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setShowAuth(true)}>
                  تسجيل دخول / حساب جديد
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-4">متجرك الإلكتروني الشامل</h2>
          <p className="text-xl md:text-2xl mb-8">إلكترونيات • ملابس • مواد غذائية • وأكثر</p>
          <div className="flex justify-center mb-8">
            <img 
              src="https://images.unsplash.com/photo-1592839930500-3445eb72b8ad?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjBzaG9wcGluZ3xlbnwwfHx8Ymx1ZXwxNzUzNTYyMzc1fDA&ixlib=rb-4.1.0&q=85" 
              alt="متجر إلكتروني" 
              className="rounded-lg shadow-2xl max-w-md w-full"
            />
          </div>
          <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
            ابدأ التسوق الآن
          </Button>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">تسوق حسب القسم</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'الإلكترونيات', icon: '📱', image: 'https://images.unsplash.com/photo-1652862938332-815e45390b3c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwyfHxlLWNvbW1lcmNlfGVufDB8fHxibHVlfDE3NTM1NjIzNzB8MA&ixlib=rb-4.1.0&q=85' },
              { name: 'الملابس', icon: '👕', image: 'https://images.pexels.com/photos/7563569/pexels-photo-7563569.jpeg' },
              { name: 'المواد الغذائية', icon: '🍎', image: 'https://images.unsplash.com/photo-1716535232783-38a9e49eeffa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwzfHxlLWNvbW1lcmNlfGVufDB8fHxibHVlfDE3NTM1NjIzNzB8MA&ixlib=rb-4.1.0&q=85' },
              { name: 'المنزل والحديقة', icon: '🏠', image: 'https://images.pexels.com/photos/6995253/pexels-photo-6995253.jpeg' }
            ].map((category, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow group">
                <CardContent className="p-6 text-center">
                  <div className="w-full h-32 mb-4 rounded-lg overflow-hidden">
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="text-4xl mb-2 block">{category.icon}</span>
                  <h4 className="font-semibold">{category.name}</h4>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">المنتجات المميزة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                id: 1,
                name: 'آيفون 15 برو',
                price: 850000,
                originalPrice: 950000,
                rating: 4.8,
                reviews: 128,
                image: 'https://images.unsplash.com/photo-1652862938332-815e45390b3c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwyfHxlLWNvbW1lcmNlfGVufDB8fHxibHVlfDE3NTM1NjIzNzB8MA&ixlib=rb-4.1.0&q=85',
                discount: 11
              },
              {
                id: 2,
                name: 'قميص قطني أنيق',
                price: 25000,
                originalPrice: 35000,
                rating: 4.5,
                reviews: 45,
                image: 'https://images.pexels.com/photos/7563569/pexels-photo-7563569.jpeg',
                discount: 29
              },
              {
                id: 3,
                name: 'كيكة الشوكولاتة الفاخرة',
                price: 15000,
                originalPrice: 20000,
                rating: 4.9,
                reviews: 87,
                image: 'https://images.unsplash.com/photo-1716535232783-38a9e49eeffa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwzfHxlLWNvbW1lcmNlfGVufDB8fHxibHVlfDE3NTM1NjIzNzB8MA&ixlib=rb-4.1.0&q=85',
                discount: 25
              },
              {
                id: 4,
                name: 'حقيبة تسوق عصرية',
                price: 45000,
                originalPrice: 55000,
                rating: 4.7,
                reviews: 62,
                image: 'https://images.pexels.com/photos/6995253/pexels-photo-6995253.jpeg',
                discount: 18
              }
            ].map((product) => (
              <Card key={product.id} className="group cursor-pointer hover:shadow-lg transition-all">
                <CardContent className="p-0">
                  <div className="relative">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform"
                    />
                    {product.discount && (
                      <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                        -{product.discount}%
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold mb-2 line-clamp-2">{product.name}</h4>
                    <div className="flex items-center mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500 mr-1">({product.reviews})</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-lg font-bold text-primary">{product.price.toLocaleString()} ل.س</span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through mr-2">
                            {product.originalPrice.toLocaleString()} ل.س
                          </span>
                        )}
                      </div>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => addToCart(product)}
                    >
                      أضف للسلة
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: Truck, title: 'شحن سريع', description: 'توصيل مجاني للطلبات أكثر من 100,000 ل.س' },
              { icon: Shield, title: 'دفع آمن', description: 'معاملات محمية بأحدث التقنيات' },
              { icon: Headphones, title: 'دعم 24/7', description: 'خدمة عملاء متاحة على مدار الساعة' },
              { icon: Globe, title: 'شحن عالمي', description: 'نوصل إلى جميع أنحاء العالم' }
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <feature.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                <h4 className="font-semibold mb-2">{feature.title}</h4>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} />
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h5 className="font-bold text-lg mb-4">متجري</h5>
              <p className="text-gray-400">متجرك الإلكتروني الشامل لكل احتياجاتك</p>
            </div>
            <div>
              <h6 className="font-semibold mb-4">روابط سريعة</h6>
              <ul className="space-y-2 text-gray-400">
                <li>الرئيسية</li>
                <li>المنتجات</li>
                <li>العروض</li>
                <li>اتصل بنا</li>
              </ul>
            </div>
            <div>
              <h6 className="font-semibold mb-4">الدعم</h6>
              <ul className="space-y-2 text-gray-400">
                <li>مركز المساعدة</li>
                <li>سياسة الإرجاع</li>
                <li>الشحن والتوصيل</li>
                <li>الأمان والخصوصية</li>
              </ul>
            </div>
            <div>
              <h6 className="font-semibold mb-4">تواصل معنا</h6>
              <ul className="space-y-2 text-gray-400">
                <li>📞 +963 123 456 789</li>
                <li>📧 info@mystore.com</li>
                <li>🌍 دمشق، سوريا</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 متجري. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Auth Modal Component
const AuthModal = ({ onClose }) => {
  const { signup, login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, name);
      }
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md m-4">
        <CardHeader>
          <CardTitle>{isLogin ? 'تسجيل دخول' : 'حساب جديد'}</CardTitle>
          <CardDescription>
            {isLogin ? 'أدخل بياناتك لتسجيل الدخول' : 'انشئ حساباً جديداً واحصل على 2000 ل.س رصيد ترحيبي'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-1">الاسم الكامل</label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">كلمة المرور</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'جارٍ التحميل...' : (isLogin ? 'تسجيل دخول' : 'إنشاء حساب')}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline text-sm"
            >
              {isLogin ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب؟ سجل دخول'}
            </button>
          </div>
          <Button variant="ghost" onClick={onClose} className="w-full mt-2">
            إغلاق
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;