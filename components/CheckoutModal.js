'use client';

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import CouponSystem from './CouponSystem';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  X, 
  MapPin, 
  Phone, 
  User, 
  MessageCircle,
  Wallet,
  CreditCard,
  Truck,
  Clock,
  CheckCircle
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import toast from 'react-hot-toast';

const CheckoutModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { cart, getCartTotal, formatPrice, clearCart, language } = useStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Info, 2: Payment, 3: Confirmation
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  
  // Form states
  const [customerInfo, setCustomerInfo] = useState({
    name: user?.displayName || '',
    phone: '',
    email: user?.email || '',
    address: {
      street: '',
      city: '',
      area: '',
      details: ''
    },
    notes: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState('whatsapp');
  const [orderSummary, setOrderSummary] = useState(null);

  const totalAmount = getCartTotal();
  const discountAmount = appliedCoupon?.discount || 0;
  const finalAmount = totalAmount - discountAmount;

  const handleCustomerInfoChange = (field, value) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressChange = (field, value) => {
    setCustomerInfo(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const validateStep1 = () => {
    if (!customerInfo.name || !customerInfo.phone) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return false;
    }
    
    if (!customerInfo.address.street || !customerInfo.address.city) {
      toast.error('يرجى ملء معلومات العنوان');
      return false;
    }
    
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2) {
      processOrder();
    }
  };

  const processOrder = async () => {
    setLoading(true);
    try {
      // Create order in database
      const orderData = {
        userId: user.uid,
        items: cart,
        total: finalAmount,
        originalTotal: totalAmount,
        discount: discountAmount,
        couponCode: appliedCoupon?.code || null,
        customerInfo,
        paymentMethod,
        status: 'pending'
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const order = await response.json();

      if (response.ok) {
        setOrderSummary(order);
        
        if (paymentMethod === 'whatsapp') {
          sendWhatsAppOrder(order);
        } else if (paymentMethod === 'wallet') {
          await processWalletPayment(order);
        }
        
        setStep(3);
        clearCart();
        toast.success('تم إرسال طلبك بنجاح!');
      } else {
        throw new Error(order.error || 'فشل في إنشاء الطلب');
      }
    } catch (error) {
      console.error('Error processing order:', error);
      toast.error('خطأ في معالجة الطلب');
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsAppOrder = (order) => {
    const message = createWhatsAppMessage(order);
    const whatsappUrl = `https://wa.me/963955186181?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const createWhatsAppMessage = (order) => {
    return `
🛍️ *طلب جديد من متجري*
رقم الطلب: #${order.orderNumber}

👤 *معلومات العميل:*
الاسم: ${customerInfo.name}
الهاتف: ${customerInfo.phone}
البريد: ${customerInfo.email}

📍 *عنوان التسليم:*
${customerInfo.address.street}, ${customerInfo.address.area}
${customerInfo.address.city}
${customerInfo.address.details ? `تفاصيل إضافية: ${customerInfo.address.details}` : ''}

📦 *تفاصيل الطلب:*
${cart.map((item, index) => 
  `${index + 1}. ${item.name}\n   الكمية: ${item.quantity} × ${formatPrice(item.price)} = ${formatPrice(item.price * item.quantity)}`
).join('\n')}

${appliedCoupon ? `\n🎟️ كود الخصم: ${appliedCoupon.code}\nخصم: -${formatPrice(discountAmount)}\n` : ''}

💰 *الإجمالي: ${formatPrice(finalAmount)}*

${customerInfo.notes ? `\n📝 ملاحظات: ${customerInfo.notes}` : ''}

🕐 تاريخ الطلب: ${new Date().toLocaleString('ar-SA')}
💳 طريقة الدفع: ${paymentMethod === 'whatsapp' ? 'عند الاستلام' : 'محفظة إلكترونية'}

---
تم إرسال هذا الطلب من متجري الإلكتروني
    `.trim();
  };

  const processWalletPayment = async (order) => {
    // Wallet payment is already processed in the backend
    toast.success(`تم خصم ${formatPrice(finalAmount)} من محفظتك`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl">
            {step === 1 && '📋 معلومات الطلب'}
            {step === 2 && '💳 طريقة الدفع'}
            {step === 3 && '✅ تم إرسال الطلب'}
          </CardTitle>
          <Button variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Step 1: Customer Information */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Progress */}
              <div className="flex items-center justify-center space-x-4 space-x-reverse mb-8">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <span className="mr-2">معلومات العميل</span>
                </div>
                <div className="w-16 h-0.5 bg-gray-300"></div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <span className="mr-2">طريقة الدفع</span>
                </div>
                <div className="w-16 h-0.5 bg-gray-300"></div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <span className="mr-2">تأكيد الطلب</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    معلومات العميل
                  </h3>
                  
                  <div>
                    <Label htmlFor="name">الاسم الكامل *</Label>
                    <Input
                      id="name"
                      value={customerInfo.name}
                      onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                      placeholder="أدخل اسمك الكامل"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">رقم الهاتف *</Label>
                    <Input
                      id="phone"
                      value={customerInfo.phone}
                      onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                      placeholder="+963 XXX XXX XXX"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                      placeholder="example@email.com"
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-semibold flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      عنوان التسليم
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">المدينة *</Label>
                        <Select value={customerInfo.address.city} onValueChange={(value) => handleAddressChange('city', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المدينة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="damascus">دمشق</SelectItem>
                            <SelectItem value="aleppo">حلب</SelectItem>
                            <SelectItem value="homs">حمص</SelectItem>
                            <SelectItem value="latakia">اللاذقية</SelectItem>
                            <SelectItem value="tartus">طرطوس</SelectItem>
                            <SelectItem value="hama">حماة</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="area">المنطقة *</Label>
                        <Input
                          id="area"
                          value={customerInfo.address.area}
                          onChange={(e) => handleAddressChange('area', e.target.value)}
                          placeholder="مثال: المزة"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="street">الشارع والعنوان التفصيلي *</Label>
                      <Input
                        id="street"
                        value={customerInfo.address.street}
                        onChange={(e) => handleAddressChange('street', e.target.value)}
                        placeholder="مثال: شارع الثورة، بناء رقم 15"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="details">تفاصيل إضافية</Label>
                      <Input
                        id="details"
                        value={customerInfo.address.details}
                        onChange={(e) => handleAddressChange('details', e.target.value)}
                        placeholder="رقم الطابق، رقم الشقة، نقاط مرجعية"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">ملاحظات خاصة</Label>
                    <Textarea
                      id="notes"
                      value={customerInfo.notes}
                      onChange={(e) => handleCustomerInfoChange('notes', e.target.value)}
                      placeholder="أي ملاحظات أو طلبات خاصة"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Order Summary */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">ملخص الطلب</h3>
                  
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-gray-500">الكمية: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />
                  
                  {/* Coupon System */}
                  <CouponSystem 
                    orderTotal={totalAmount}
                    onCouponApply={setAppliedCoupon}
                  />

                  <Separator />

                  {/* Total Calculation */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>المجموع الفرعي:</span>
                      <span>{formatPrice(totalAmount)}</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>خصم ({appliedCoupon.code}):</span>
                        <span>-{formatPrice(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span>الشحن:</span>
                      <span className="text-green-600">مجاني</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>الإجمالي:</span>
                      <span className="text-primary">{formatPrice(finalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 space-x-reverse pt-4">
                <Button variant="outline" onClick={onClose}>
                  إلغاء
                </Button>
                <Button onClick={handleNextStep}>
                  التالي: طريقة الدفع
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Payment Method */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Progress */}
              <div className="flex items-center justify-center space-x-4 space-x-reverse mb-8">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    ✓
                  </div>
                  <span className="mr-2">معلومات العميل</span>
                </div>
                <div className="w-16 h-0.5 bg-green-500"></div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <span className="mr-2">طريقة الدفع</span>
                </div>
                <div className="w-16 h-0.5 bg-gray-300"></div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <span className="mr-2">تأكيد الطلب</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Methods */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">اختر طريقة الدفع</h3>
                  
                  {/* WhatsApp Order */}
                  <Card 
                    className={`cursor-pointer transition-colors ${paymentMethod === 'whatsapp' ? 'ring-2 ring-primary bg-blue-50' : 'hover:bg-gray-50'}`}
                    onClick={() => setPaymentMethod('whatsapp')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <MessageCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">طلب عبر WhatsApp</h4>
                          <p className="text-sm text-gray-600">
                            سيتم إرسال طلبك عبر الواتساب ودفع عند الاستلام
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Badge variant="secondary">الأكثر شيوعاً</Badge>
                          <Clock className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Wallet Payment */}
                  {user && (user.walletBalance >= finalAmount) && (
                    <Card 
                      className={`cursor-pointer transition-colors ${paymentMethod === 'wallet' ? 'ring-2 ring-primary bg-blue-50' : 'hover:bg-gray-50'}`}
                      onClick={() => setPaymentMethod('wallet')}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4 space-x-reverse">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Wallet className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">المحفظة الإلكترونية</h4>
                            <p className="text-sm text-gray-600">
                              ادفع من رصيد محفظتك الإلكترونية
                            </p>
                            <p className="text-sm text-blue-600">
                              الرصيد الحالي: {formatPrice(user.walletBalance)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Badge variant="default">فوري</Badge>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Coming Soon Payment Methods */}
                  <Card className="opacity-50">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-500">البطاقات الائتمانية</h4>
                          <p className="text-sm text-gray-400">
                            Visa, MasterCard, PayPal
                          </p>
                        </div>
                        <Badge variant="outline">قريباً</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Order Summary */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">ملخص الطلب النهائي</h3>
                  
                  <Card className="border-2">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>العناصر ({cart.length}):</span>
                          <span>{formatPrice(totalAmount)}</span>
                        </div>
                        {appliedCoupon && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>خصم {appliedCoupon.code}:</span>
                            <span>-{formatPrice(discountAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span>الشحن:</span>
                          <span className="text-green-600">مجاني</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>المبلغ الإجمالي:</span>
                          <span className="text-primary">{formatPrice(finalAmount)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start space-x-3 space-x-reverse">
                      <Truck className="w-5 h-5 text-blue-600 mt-1" />
                      <div>
                        <h4 className="font-semibold text-blue-800">معلومات الشحن</h4>
                        <p className="text-sm text-blue-600 mt-1">
                          • شحن مجاني لجميع الطلبات
                          <br />
                          • التوصيل خلال 2-5 أيام عمل
                          <br />
                          • إمكانية التتبع المباشر
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  السابق: معلومات العميل
                </Button>
                <Button 
                  onClick={handleNextStep} 
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? 'جاري المعالجة...' : '🔥 تأكيد الطلب'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Order Confirmation */}
          {step === 3 && orderSummary && (
            <div className="text-center space-y-6 py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-green-800 mb-2">
                  تم إرسال طلبك بنجاح! 🎉
                </h2>
                <p className="text-gray-600">
                  رقم الطلب: <span className="font-semibold">#{orderSummary.orderNumber}</span>
                </p>
              </div>

              <Card className="max-w-md mx-auto">
                <CardContent className="p-6">
                  <div className="space-y-3 text-right">
                    <div className="flex justify-between">
                      <span>إجمالي الطلب:</span>
                      <span className="font-semibold">{formatPrice(finalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>طريقة الدفع:</span>
                      <span>{paymentMethod === 'whatsapp' ? 'عند الاستلام' : 'محفظة إلكترونية'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>حالة الطلب:</span>
                      <Badge>قيد المعالجة</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <p className="text-gray-600">
                  {paymentMethod === 'whatsapp' 
                    ? '📱 تم فتح تطبيق الواتساب لإرسال تفاصيل الطلب'
                    : '✅ تم خصم المبلغ من محفظتك الإلكترونية'
                  }
                </p>
                
                <div className="flex space-x-4 space-x-reverse justify-center">
                  <Button 
                    onClick={() => window.open(`https://wa.me/963955186181`, '_blank')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    تواصل معنا
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    العودة للمتجر
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutModal;