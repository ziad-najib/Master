'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const StoreContext = createContext();

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

export const StoreProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('ar');
  const [exchangeRates, setExchangeRates] = useState({
    USD: 1,
    EUR: 0.85,
    SAR: 3.75,
    AED: 3.67,
    SYP: 2500
  });

  // Currency conversion
  const convertPrice = (price, fromCurrency = 'USD', toCurrency = null) => {
    const targetCurrency = toCurrency || currency;
    if (fromCurrency === targetCurrency) return price;
    
    const usdPrice = price / exchangeRates[fromCurrency];
    return usdPrice * exchangeRates[targetCurrency];
  };

  // Format price with currency symbol
  const formatPrice = (price, currencyCode = null) => {
    const targetCurrency = currencyCode || currency;
    const convertedPrice = convertPrice(price, 'USD', targetCurrency);
    
    const currencySymbols = {
      USD: '$',
      EUR: '€',
      SAR: 'ر.س',
      AED: 'د.إ',
      SYP: 'ل.س'
    };

    const formatter = new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: targetCurrency === 'SYP' ? 'USD' : targetCurrency,
      minimumFractionDigits: targetCurrency === 'SYP' ? 0 : 2
    });

    if (targetCurrency === 'SYP') {
      return `${Math.round(convertedPrice).toLocaleString('ar-SA')} ل.س`;
    }

    return formatter.format(convertedPrice);
  };

  // Add to cart
  const addToCart = (product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        const updatedCart = prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
        toast.success('تم تحديث كمية المنتج في السلة');
        return updatedCart;
      }
      
      toast.success('تم إضافة المنتج إلى السلة');
      return [...prevCart, { ...product, quantity }];
    });
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart(prevCart => {
      const updatedCart = prevCart.filter(item => item.id !== productId);
      toast.success('تم إزالة المنتج من السلة');
      return updatedCart;
    });
  };

  // Update cart quantity
  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    toast.success('تم إفراغ السلة');
  };

  // Add to wishlist
  const addToWishlist = (product) => {
    setWishlist(prevWishlist => {
      const existingItem = prevWishlist.find(item => item.id === product.id);
      if (existingItem) {
        toast.error('المنتج موجود بالفعل في قائمة الأمنيات');
        return prevWishlist;
      }
      
      toast.success('تم إضافة المنتج إلى قائمة الأمنيات');
      return [...prevWishlist, product];
    });
  };

  // Remove from wishlist
  const removeFromWishlist = (productId) => {
    setWishlist(prevWishlist => {
      const updatedWishlist = prevWishlist.filter(item => item.id !== productId);
      toast.success('تم إزالة المنتج من قائمة الأمنيات');
      return updatedWishlist;
    });
  };

  // Get cart total
  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const itemPrice = convertPrice(item.price, 'USD', currency);
      return total + (itemPrice * item.quantity);
    }, 0);
  };

  // Get cart count
  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedWishlist = localStorage.getItem('wishlist');
    const savedCurrency = localStorage.getItem('currency');
    const savedLanguage = localStorage.getItem('language');

    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }

    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist));
      } catch (error) {
        console.error('Error loading wishlist from localStorage:', error);
      }
    }

    if (savedCurrency) setCurrency(savedCurrency);
    if (savedLanguage) setLanguage(savedLanguage);
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const value = {
    // Cart
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    
    // Wishlist
    wishlist,
    addToWishlist,
    removeFromWishlist,
    
    // Currency & Language
    currency,
    setCurrency,
    language,
    setLanguage,
    exchangeRates,
    convertPrice,
    formatPrice,
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};