'use client';

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Check, X, Gift, Percent, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

const CouponSystem = ({ orderTotal, onCouponApply }) => {
  const { user } = useAuth();
  const { formatPrice, language } = useStore();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('أدخل كود الخصم');
      return;
    }

    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode,
          userId: user.uid,
          total: orderTotal
        })
      });

      const data = await response.json();

      if (response.ok) {
        setAppliedCoupon({
          ...data,
          code: couponCode.toUpperCase()
        });
        onCouponApply && onCouponApply({
          code: couponCode.toUpperCase(),
          discount: data.discount,
          finalAmount: data.finalAmount
        });
        toast.success(`تم تطبيق كود الخصم! وفرت ${formatPrice(data.discount)}`);
        setCouponCode('');
      } else {
        toast.error(data.error || 'كود خصم غير صالح');
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      toast.error('خطأ في التحقق من كود الخصم');
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    onCouponApply && onCouponApply(null);
    toast.success('تم إزالة كود الخصم');
  };

  const fetchAvailableCoupons = async () => {
    try {
      const response = await fetch('/api/coupons');
      const coupons = await response.json();
      setAvailableCoupons(coupons);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    }
  };

  React.useEffect(() => {
    if (user) {
      fetchAvailableCoupons();
    }
  }, [user]);

  return (
    <div className="space-y-4">
      {/* Applied Coupon Display */}
      {appliedCoupon && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Check className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">
                    كود الخصم: {appliedCoupon.code}
                  </p>
                  <p className="text-sm text-green-600">
                    {appliedCoupon.description}
                  </p>
                  <p className="text-sm text-green-600">
                    توفير: {formatPrice(appliedCoupon.discount)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeCoupon}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coupon Input */}
      {!appliedCoupon && (
        <Card>
          <CardContent className="p-4">
            <div className="flex space-x-2 space-x-reverse">
              <div className="flex-1 relative">
                <Input
                  placeholder="أدخل كود الخصم"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && validateCoupon()}
                  className="pr-10"
                />
                <Gift className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              <Button onClick={validateCoupon} disabled={loading}>
                {loading ? 'جاري التحقق...' : 'تطبيق'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Coupons */}
      {availableCoupons.length > 0 && !appliedCoupon && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Gift className="w-5 h-5 mr-2" />
              كوبونات متاحة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid gap-3">
              {availableCoupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setCouponCode(coupon.code)}
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      coupon.type === 'percentage' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {coupon.type === 'percentage' ? <Percent className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-semibold">{coupon.code}</p>
                      <p className="text-sm text-gray-600">{coupon.description}</p>
                      {coupon.minOrderAmount && (
                        <p className="text-xs text-gray-500">
                          الحد الأدنى: {formatPrice(coupon.minOrderAmount)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={orderTotal >= (coupon.minOrderAmount || 0) ? 'default' : 'secondary'}>
                    {coupon.type === 'percentage' 
                      ? `${coupon.value}%` 
                      : formatPrice(coupon.value)
                    }
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CouponSystem;