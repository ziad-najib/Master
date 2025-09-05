'use client';

import React, { useState } from 'react';
import { useStore } from '../contexts/StoreContext';
import { useAuth } from '../contexts/AuthContext';
import CheckoutModal from './CheckoutModal';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { X, Plus, Minus, ShoppingBag, Trash2, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ShoppingCart = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { 
    cart, 
    removeFromCart, 
    updateCartQuantity, 
    clearCart, 
    getCartTotal, 
    formatPrice,
    language 
  } = useStore();

  const [showCheckout, setShowCheckout] = useState(false);

  const handleCheckout = () => {
    if (!user) {
      toast.error('يرجى تسجيل الدخول أولاً');
      onClose();
      return;
    }

    if (cart.length === 0) {
      toast.error('السلة فارغة');
      return;
    }

    setShowCheckout(true);
  };

  const createWhatsAppMessage = () => {
    const customerInfo = `
🛍️ *طلب جديد من متجري*

👤 *معلومات العميل:*
الاسم: ${user.displayName || 'غير محدد'}
البريد الإلكتروني: ${user.email}
رصيد المحفظة: ${formatPrice(user.walletBalance || 0)}

📦 *تفاصيل الطلب:*`;

    let itemsText = '';
    cart.forEach((item, index) => {
      itemsText += `
${index + 1}. ${item.name}
   الكمية: ${item.quantity}
   السعر: ${formatPrice(item.price)} × ${item.quantity} = ${formatPrice(item.price * item.quantity)}`;
    });

    const totalText = `

💰 *الإجمالي: ${formatPrice(getCartTotal())}*

📅 تاريخ الطلب: ${new Date().toLocaleDateString('ar-SA')}
🕐 وقت الطلب: ${new Date().toLocaleTimeString('ar-SA')}

---
تم إرسال هذا الطلب من متجري الإلكتروني`;

    return customerInfo + itemsText + totalText;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl">
            🛍️ {language === 'ar' ? 'سلة التسوق' : 'Shopping Cart'}
          </CardTitle>
          <div className="flex items-center space-x-2 space-x-reverse">
            {cart.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearCart}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg mb-4">
                {language === 'ar' ? 'السلة فارغة' : 'Your cart is empty'}
              </p>
              <Button onClick={onClose}>
                {language === 'ar' ? 'ابدأ التسوق' : 'Start Shopping'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 space-x-reverse p-4 border rounded-lg">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.name}</h4>
                    <p className="text-sm text-gray-500 mb-2">
                      {formatPrice(item.price)}
                    </p>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-8 h-8 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      
                      <span className="text-sm font-medium w-12 text-center">
                        {item.quantity}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-primary">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 mt-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        {cart.length > 0 && (
          <div className="border-t p-6">
            <div className="space-y-4">
              {/* Cart Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>المنتجات ({cart.reduce((sum, item) => sum + item.quantity, 0)}):</span>
                  <span>{formatPrice(getCartTotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>الشحن:</span>
                  <span className="text-green-600">مجاني</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>الإجمالي:</span>
                  <span className="text-primary">{formatPrice(getCartTotal())}</span>
                </div>
              </div>

              {/* User Balance Info */}
              {user && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center text-sm">
                    <span>رصيد محفظتك:</span>
                    <Badge variant="secondary">
                      {formatPrice(user.walletBalance || 0)}
                    </Badge>
                  </div>
                  {user.walletBalance >= getCartTotal() && (
                    <p className="text-green-600 text-xs mt-1">
                      ✅ رصيدك كافٍ لهذا الطلب
                    </p>
                  )}
                </div>
              )}

              {/* Checkout Buttons */}
              <div className="space-y-2">
                <Button onClick={handleCheckout} className="w-full" size="lg">
                  🔥 اطلب عبر الواتساب
                </Button>
                <Button variant="outline" className="w-full" onClick={onClose}>
                  متابعة التسوق
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ShoppingCart;