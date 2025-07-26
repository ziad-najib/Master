'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import Header from '../components/Header';
import ShoppingCart from '../components/ShoppingCart';
import AdminDashboard from '../components/AdminDashboard';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { 
  Star, 
  Heart, 
  Truck, 
  Shield, 
  Headphones, 
  Globe,
  Filter,
  SortAsc,
  Grid,
  List,
  Zap,
  Gift,
  Users,
  TrendingUp,
  MessageCircle
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import toast from 'react-hot-toast';

const HomePage = () => {
  const { user } = useAuth();
  const { 
    addToCart, 
    addToWishlist, 
    removeFromWishlist, 
    wishlist, 
    formatPrice, 
    language,
    currency
  } = useStore();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showAuth, setShowAuth] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('featured');
  const [filterCategory, setFilterCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, filterCategory, priceRange, sortBy, searchQuery]);

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
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(product => product.category === filterCategory);
    }

    // Price range filter
    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(Number);
      filtered = filtered.filter(product => {
        const price = product.price;
        return max ? (price >= min && price <= max) : price >= min;
      });
    }

    // Sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default: // featured
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    setFilteredProducts(filtered);
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => item.id === productId);
  };

  const handleWishlistToggle = (product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
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
      <Header 
        onAuthClick={() => setShowAuth(true)}
        onCartClick={() => setShowCart(true)}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              {language === 'ar' ? 'متجرك الإلكتروني الشامل' : 'Your Complete Online Store'}
            </h2>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              {language === 'ar' 
                ? 'إلكترونيات • ملابس • مواد غذائية • وأكثر - دعم العملات المتعددة'
                : 'Electronics • Clothing • Food • and More - Multi-Currency Support'
              }
            </p>
            
            {/* Feature Highlights */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { icon: Zap, text: 'سرعة في التوصيل' },
                { icon: Shield, text: 'دفع آمن' },
                { icon: Gift, text: 'عروض حصرية' },
                { icon: MessageCircle, text: 'دعم WhatsApp' }
              ].map((feature, index) => (
                <div key={index} className="flex flex-col items-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                  <feature.icon className="w-8 h-8 mb-2" />
                  <span className="text-sm">{feature.text}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-center mb-8">
              <img 
                src="https://images.unsplash.com/photo-1592839930500-3445eb72b8ad?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjBzaG9wcGluZ3xlbnwwfHx8Ymx1ZXwxNzUzNTYyMzc1fDA&ixlib=rb-4.1.0&q=85" 
                alt="متجر إلكتروني" 
                className="rounded-lg shadow-2xl max-w-md w-full transform hover:scale-105 transition-transform"
              />
            </div>
            
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-8 py-3 hover:scale-105 transition-transform"
            >
              {language === 'ar' ? 'ابدأ التسوق الآن' : 'Start Shopping Now'}
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { number: '1000+', label: 'منتج متنوع', icon: Package },
              { number: '50+', label: 'علامة تجارية', icon: Star },
              { number: '24/7', label: 'دعم العملاء', icon: Headphones },
              { number: '99%', label: 'رضا العملاء', icon: Users }
            ].map((stat, index) => (
              <div key={index} className="p-6">
                <stat.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                <div className="text-3xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">
            {language === 'ar' ? 'تسوق حسب القسم' : 'Shop by Category'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Card 
                key={category.id} 
                className="cursor-pointer hover:shadow-xl transition-all duration-300 group overflow-hidden"
                onClick={() => setFilterCategory(category.slug)}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-full h-32 mb-4 rounded-lg overflow-hidden">
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <span className="text-4xl mb-2 block">{category.icon}</span>
                  <h4 className="font-semibold text-lg">{category.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {/* Section Header with Filters */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-12">
            <h3 className="text-3xl font-bold mb-4 md:mb-0">
              {language === 'ar' ? 'منتجاتنا المميزة' : 'Featured Products'}
            </h3>
            
            <div className="flex items-center space-x-4 space-x-reverse">
              {/* Search */}
              <div className="relative">
                <Input
                  placeholder="البحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48"
                />
              </div>

              {/* Category Filter */}
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="القسم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأقسام</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Price Range Filter */}
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="السعر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأسعار</SelectItem>
                  <SelectItem value="0-50">أقل من $50</SelectItem>
                  <SelectItem value="50-200">$50 - $200</SelectItem>
                  <SelectItem value="200-500">$200 - $500</SelectItem>
                  <SelectItem value="500">أكثر من $500</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="الترتيب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">المميز</SelectItem>
                  <SelectItem value="newest">الأحدث</SelectItem>
                  <SelectItem value="price-low">السعر: منخفض إلى عالي</SelectItem>
                  <SelectItem value="price-high">السعر: عالي إلى منخفض</SelectItem>
                  <SelectItem value="rating">الأعلى تقييماً</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {filteredProducts.map((product) => (
              <Card key={product.id} className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.discount && (
                      <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                        -{product.discount}%
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`absolute top-2 right-2 bg-white/80 hover:bg-white transition-colors ${
                        isInWishlist(product.id) ? 'text-red-500' : 'text-gray-600'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWishlistToggle(product);
                      }}
                    >
                      <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                  
                  <div className="p-4">
                    <h4 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h4>
                    
                    <div className="flex items-center mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.floor(product.rating || 0) 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500 mr-1">
                        ({product.reviews || 0})
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-lg font-bold text-primary">
                          {formatPrice(product.price)}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-sm text-gray-500 line-through mr-2">
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {product.stock > 0 ? `متوفر (${product.stock})` : 'نفد المخزون'}
                      </Badge>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      disabled={product.stock === 0}
                    >
                      {product.stock > 0 ? '🛒 أضف للسلة' : 'نفد المخزون'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">لا توجد منتجات تطابق البحث</p>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">لماذا تختار متجرنا؟</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                icon: Truck, 
                title: 'شحن سريع', 
                description: 'توصيل مجاني للطلبات أكثر من $100',
                color: 'text-blue-500'
              },
              { 
                icon: Shield, 
                title: 'دفع آمن', 
                description: 'معاملات محمية بأحدث التقنيات',
                color: 'text-green-500'
              },
              { 
                icon: Headphones, 
                title: 'دعم 24/7', 
                description: 'خدمة عملاء متاحة على مدار الساعة',
                color: 'text-purple-500'
              },
              { 
                icon: Globe, 
                title: 'عملات متعددة', 
                description: 'ادفع بالعملة التي تناسبك',
                color: 'text-orange-500'
              }
            ].map((feature, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-lg hover:shadow-lg transition-shadow">
                <feature.icon className={`w-12 h-12 ${feature.color} mx-auto mb-4`} />
                <h4 className="font-semibold mb-2 text-lg">{feature.title}</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} />
      )}

      {/* Shopping Cart */}
      <ShoppingCart isOpen={showCart} onClose={() => setShowCart(false)} />

      {/* Admin Dashboard */}
      {user?.role === 'admin' && (
        <>
          <Button
            onClick={() => setShowAdmin(true)}
            className="fixed bottom-4 left-4 z-40"
            size="lg"
          >
            🔧 لوحة التحكم
          </Button>
          <AdminDashboard isOpen={showAdmin} onClose={() => setShowAdmin(false)} />
        </>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h5 className="font-bold text-lg mb-4">متجري</h5>
              <p className="text-gray-400 mb-4">
                متجرك الإلكتروني الشامل لكل احتياجاتك مع دعم العملات المتعددة
              </p>
              <div className="flex space-x-4 space-x-reverse">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  📘
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  📷
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  🐦
                </Button>
              </div>
            </div>
            
            <div>
              <h6 className="font-semibold mb-4">روابط سريعة</h6>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-white cursor-pointer">الرئيسية</li>
                <li className="hover:text-white cursor-pointer">المنتجات</li>
                <li className="hover:text-white cursor-pointer">العروض</li>
                <li className="hover:text-white cursor-pointer">اتصل بنا</li>
              </ul>
            </div>
            
            <div>
              <h6 className="font-semibold mb-4">الدعم</h6>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-white cursor-pointer">مركز المساعدة</li>
                <li className="hover:text-white cursor-pointer">سياسة الإرجاع</li>
                <li className="hover:text-white cursor-pointer">الشحن والتوصيل</li>
                <li className="hover:text-white cursor-pointer">الأمان والخصوصية</li>
              </ul>
            </div>
            
            <div>
              <h6 className="font-semibold mb-4">تواصل معنا</h6>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  +963 955 186 181
                </li>
                <li>📧 info@mystore.com</li>
                <li>🌍 دمشق، سوريا</li>
              </ul>
              <div className="mt-4">
                <h6 className="font-semibold mb-2">العملات المدعومة</h6>
                <div className="flex flex-wrap gap-2">
                  {['USD', 'EUR', 'SAR', 'AED', 'SYP'].map(curr => (
                    <Badge key={curr} variant="outline" className="text-gray-400">
                      {curr}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2024 متجري. جميع الحقوق محفوظة. | Built with ❤️ for modern e-commerce</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Auth Modal Component (existing code...)
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
      toast.success(isLogin ? 'مرحباً بك مرة أخرى!' : 'مرحباً بك في متجرنا!');
    } catch (error) {
      setError(error.message);
      toast.error('خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md m-4">
        <CardHeader>
          <CardTitle className="text-center">
            {isLogin ? '🔐 تسجيل دخول' : '🎉 حساب جديد'}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin 
              ? 'أدخل بياناتك لتسجيل الدخول' 
              : 'انشئ حساباً جديداً واحصل على 2000 ل.س رصيد ترحيبي'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label className="block text-sm font-medium mb-1">الاسم الكامل</Label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  placeholder="أدخل اسمك الكامل"
                />
              </div>
            )}
            <div>
              <Label className="block text-sm font-medium mb-1">البريد الإلكتروني</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="example@email.com"
              />
            </div>
            <div>
              <Label className="block text-sm font-medium mb-1">كلمة المرور</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="أدخل كلمة المرور"
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'جارٍ التحميل...' : (isLogin ? '🚀 تسجيل دخول' : '🎊 إنشاء حساب')}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline text-sm"
            >
              {isLogin ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب؟ سجل دخول'}
            </button>
          </div>
          
          <Button variant="ghost" onClick={onClose} className="w-full mt-4">
            إغلاق
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;