import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'

// MongoDB connection
let client
let db

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()

    // Root endpoint
    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "E-commerce API is running" }))
    }

    // Users endpoints
    if (route === '/users' && method === 'POST') {
      const userData = await request.json()
      
      const user = {
        id: uuidv4(),
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('users').insertOne(user)
      const { _id, ...userResponse } = user
      return handleCORS(NextResponse.json(userResponse))
    }

    if (route.startsWith('/users/') && method === 'GET') {
      const uid = path[1]
      const user = await db.collection('users').findOne({ uid })
      
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'User not found' }, { status: 404 }))
      }

      const { _id, ...userResponse } = user
      return handleCORS(NextResponse.json(userResponse))
    }

    // Admin Users endpoint
    if (route === '/admin/users' && method === 'GET') {
      const users = await db.collection('users').find({}).toArray()
      const cleanedUsers = users.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleanedUsers))
    }

    // Products endpoints
    if (route === '/products' && method === 'GET') {
      const productsCount = await db.collection('products').countDocuments()
      
      if (productsCount === 0) {
        await seedProducts(db)
      }

      const products = await db.collection('products')
        .find({})
        .limit(50)
        .toArray()

      const cleanedProducts = products.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleanedProducts))
    }

    // Admin Products endpoints
    if (route === '/admin/products' && method === 'GET') {
      const products = await db.collection('products').find({}).toArray()
      const cleanedProducts = products.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleanedProducts))
    }

    if (route === '/admin/products' && method === 'POST') {
      const productData = await request.json()
      
      const product = {
        id: uuidv4(),
        ...productData,
        featured: productData.featured || false,
        rating: productData.rating || 4.5,
        reviews: productData.reviews || 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('products').insertOne(product)
      const { _id, ...productResponse } = product
      return handleCORS(NextResponse.json(productResponse))
    }

    if (route.startsWith('/admin/products/') && method === 'DELETE') {
      const productId = path[2]
      await db.collection('products').deleteOne({ id: productId })
      return handleCORS(NextResponse.json({ message: 'Product deleted successfully' }))
    }

    // Categories endpoints
    if (route === '/categories' && method === 'GET') {
      const categoriesCount = await db.collection('categories').countDocuments()
      
      if (categoriesCount === 0) {
        await seedCategories(db)
      }

      const categories = await db.collection('categories')
        .find({ active: true })
        .toArray()

      const cleanedCategories = categories.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleanedCategories))
    }

    // Orders endpoints
    if (route === '/orders' && method === 'POST') {
      const orderData = await request.json()
      
      const order = {
        id: uuidv4(),
        orderNumber: `ORD${Date.now()}`,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: orderData.paymentMethod || 'wallet',
        total: orderData.total,
        items: orderData.items,
        shippingAddress: orderData.shippingAddress,
        customerNotes: orderData.customerNotes || '',
        userId: orderData.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('orders').insertOne(order)
      
      if (order.paymentMethod === 'wallet') {
        await db.collection('users').updateOne(
          { uid: orderData.userId },
          { 
            $inc: { walletBalance: -order.total },
            $set: { updatedAt: new Date() }
          }
        )
      }

      const { _id, ...orderResponse } = order
      return handleCORS(NextResponse.json(orderResponse))
    }

    // Admin Orders endpoints
    if (route === '/admin/orders' && method === 'GET') {
      const orders = await db.collection('orders').find({}).sort({ createdAt: -1 }).toArray()
      const cleanedOrders = orders.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleanedOrders))
    }

    if (route.startsWith('/admin/orders/') && method === 'PUT') {
      const orderId = path[2]
      const updateData = await request.json()
      
      await db.collection('orders').updateOne(
        { id: orderId },
        { 
          $set: { 
            ...updateData, 
            updatedAt: new Date() 
          }
        }
      )
      
      return handleCORS(NextResponse.json({ message: 'Order updated successfully' }))
    }

    // Coupons endpoints
    if (route === '/coupons' && method === 'GET') {
      const coupons = await db.collection('coupons')
        .find({ active: true, expiresAt: { $gt: new Date() } })
        .toArray()

      const cleanedCoupons = coupons.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleanedCoupons))
    }

    if (route === '/coupons/validate' && method === 'POST') {
      const { code, userId, total } = await request.json()
      
      const coupon = await db.collection('coupons').findOne({
        code: code.toUpperCase(),
        active: true,
        expiresAt: { $gt: new Date() }
      })

      if (!coupon) {
        return handleCORS(NextResponse.json(
          { error: 'كود الخصم غير صالح أو منتهي الصلاحية' }, 
          { status: 400 }
        ))
      }

      // Check if user already used this coupon
      if (coupon.usedBy && coupon.usedBy.includes(userId)) {
        return handleCORS(NextResponse.json(
          { error: 'تم استخدام هذا الكود من قبل' }, 
          { status: 400 }
        ))
      }

      // Check minimum order amount
      if (coupon.minOrderAmount && total < coupon.minOrderAmount) {
        return handleCORS(NextResponse.json(
          { error: `الحد الأدنى للطلب ${coupon.minOrderAmount}` }, 
          { status: 400 }
        ))
      }

      // Calculate discount
      let discount = 0
      if (coupon.type === 'percentage') {
        discount = Math.min((total * coupon.value) / 100, coupon.maxDiscount || Infinity)
      } else {
        discount = Math.min(coupon.value, total)
      }

      const { _id, ...couponResponse } = coupon
      return handleCORS(NextResponse.json({ 
        ...couponResponse, 
        discount,
        finalAmount: total - discount 
      }))
    }

    // Wallet endpoints
    if (route === '/wallet/recharge' && method === 'POST') {
      const rechargeData = await request.json()
      
      const transaction = {
        id: uuidv4(),
        type: 'recharge',
        method: rechargeData.method,
        amount: rechargeData.amount,
        status: rechargeData.method === 'qr_code' ? 'completed' : 'pending',
        userId: rechargeData.userId,
        reference: rechargeData.reference || '',
        receiptImage: rechargeData.receiptImage || '',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('wallet_transactions').insertOne(transaction)

      if (transaction.method === 'qr_code') {
        await db.collection('users').updateOne(
          { uid: rechargeData.userId },
          { 
            $inc: { walletBalance: transaction.amount },
            $set: { updatedAt: new Date() }
          }
        )
      }

      const { _id, ...transactionResponse } = transaction
      return handleCORS(NextResponse.json(transactionResponse))
    }

    // Notifications endpoints
    if (route === '/notifications' && method === 'POST') {
      const notificationData = await request.json()
      
      const notification = {
        id: uuidv4(),
        type: notificationData.type || 'info',
        title: notificationData.title,
        message: notificationData.message,
        userId: notificationData.userId,
        read: false,
        createdAt: new Date()
      }

      await db.collection('notifications').insertOne(notification)
      const { _id, ...notificationResponse } = notification
      return handleCORS(NextResponse.json(notificationResponse))
    }

    if (route.startsWith('/notifications/') && method === 'GET') {
      const userId = path[1]
      const notifications = await db.collection('notifications')
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray()

      const cleanedNotifications = notifications.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleanedNotifications))
    }

    // Reviews endpoints
    if (route === '/reviews' && method === 'POST') {
      const reviewData = await request.json()
      
      const review = {
        id: uuidv4(),
        productId: reviewData.productId,
        userId: reviewData.userId,
        userName: reviewData.userName,
        rating: reviewData.rating,
        comment: reviewData.comment,
        verified: false, // Will be verified after purchase confirmation
        createdAt: new Date()
      }

      await db.collection('reviews').insertOne(review)
      const { _id, ...reviewResponse } = review
      return handleCORS(NextResponse.json(reviewResponse))
    }

    if (route.startsWith('/reviews/') && method === 'GET') {
      const productId = path[1]
      const reviews = await db.collection('reviews')
        .find({ productId, verified: true })
        .sort({ createdAt: -1 })
        .toArray()

      const cleanedReviews = reviews.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleanedReviews))
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` }, 
      { status: 404 }
    ))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    ))
  }
}

// Seed functions
async function seedProducts(db) {
  const sampleProducts = [
    {
      id: uuidv4(),
      name: 'آيفون 15 برو',
      nameEn: 'iPhone 15 Pro',
      price: 850,
      originalPrice: 950,
      description: 'أحدث إصدار من آيفون بكاميرا متطورة ومعالج قوي A17 Pro',
      descriptionEn: 'Latest iPhone with advanced camera and powerful A17 Pro processor',
      category: 'electronics',
      categoryAr: 'الإلكترونيات',
      image: 'https://images.unsplash.com/photo-1652862938332-815e45390b3c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwyfHxlLWNvbW1lcmNlfGVufDB8fHxibHVlfDE3NTM1NjIzNzB8MA&ixlib=rb-4.1.0&q=85',
      images: ['https://images.unsplash.com/photo-1652862938332-815e45390b3c'],
      rating: 4.8,
      reviews: 128,
      stock: 50,
      discount: 11,
      featured: true,
      specifications: {
        brand: 'Apple',
        model: 'iPhone 15 Pro',
        storage: '256GB',
        color: 'Titanium Blue'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      name: 'سامسونج جالاكسي S24',
      nameEn: 'Samsung Galaxy S24',
      price: 720,
      originalPrice: 800,
      description: 'هاتف ذكي متطور مع كاميرا AI وشاشة Dynamic AMOLED',
      descriptionEn: 'Advanced smartphone with AI camera and Dynamic AMOLED display',
      category: 'electronics',
      categoryAr: 'الإلكترونيات',
      image: 'https://images.unsplash.com/photo-1652862938332-815e45390b3c',
      images: ['https://images.unsplash.com/photo-1652862938332-815e45390b3c'],
      rating: 4.6,
      reviews: 95,
      stock: 35,
      discount: 10,
      featured: true,
      specifications: {
        brand: 'Samsung',
        model: 'Galaxy S24',
        storage: '512GB',
        color: 'Phantom Black'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      name: 'قميص قطني أنيق',
      nameEn: 'Elegant Cotton Shirt',
      price: 45,
      originalPrice: 65,
      description: 'قميص مصنوع من القطن الخالص، مريح وأنيق للارتداء اليومي والمناسبات',
      descriptionEn: 'Made from pure cotton, comfortable and elegant for daily wear and occasions',
      category: 'clothing',
      categoryAr: 'الملابس',
      image: 'https://images.pexels.com/photos/7563569/pexels-photo-7563569.jpeg',
      images: ['https://images.pexels.com/photos/7563569/pexels-photo-7563569.jpeg'],
      rating: 4.5,
      reviews: 45,
      stock: 100,
      discount: 31,
      featured: true,
      specifications: {
        material: '100% Cotton',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['White', 'Blue', 'Black', 'Gray']
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      name: 'جاكيت شتوي فاخر',
      nameEn: 'Premium Winter Jacket',
      price: 120,
      originalPrice: 160,
      description: 'جاكيت شتوي مقاوم للماء والرياح مع عزل حراري متطور',
      descriptionEn: 'Water and wind resistant winter jacket with advanced thermal insulation',
      category: 'clothing',
      categoryAr: 'الملابس',
      image: 'https://images.pexels.com/photos/7563569/pexels-photo-7563569.jpeg',
      images: ['https://images.pexels.com/photos/7563569/pexels-photo-7563569.jpeg'],
      rating: 4.7,
      reviews: 67,
      stock: 25,
      discount: 25,
      featured: false,
      specifications: {
        material: 'Polyester + Down',
        sizes: ['M', 'L', 'XL', 'XXL'],
        colors: ['Black', 'Navy', 'Olive']
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      name: 'كيكة الشوكولاتة الفاخرة',
      nameEn: 'Premium Chocolate Cake',
      price: 25,
      originalPrice: 35,
      description: 'كيكة شوكولاتة فاخرة محضرة بأجود أنواع الكاكاو البلجيكي',
      descriptionEn: 'Premium chocolate cake made with finest Belgian cocoa',
      category: 'food',
      categoryAr: 'المواد الغذائية',
      image: 'https://images.unsplash.com/photo-1716535232783-38a9e49eeffa',
      images: ['https://images.unsplash.com/photo-1716535232783-38a9e49eeffa'],
      rating: 4.9,
      reviews: 87,
      stock: 15,
      discount: 29,
      featured: true,
      specifications: {
        weight: '1kg',
        serves: '8-10 people',
        ingredients: 'Belgian Chocolate, Flour, Sugar, Eggs, Butter'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      name: 'قهوة عربية فاخرة',
      nameEn: 'Premium Arabic Coffee',
      price: 35,
      originalPrice: 45,
      description: 'مزيج فاخر من أجود حبوب القهوة العربية المحمصة بإتقان',
      descriptionEn: 'Premium blend of finest Arabic coffee beans expertly roasted',
      category: 'food',
      categoryAr: 'المواد الغذائية',
      image: 'https://images.unsplash.com/photo-1716535232783-38a9e49eeffa',
      images: ['https://images.unsplash.com/photo-1716535232783-38a9e49eeffa'],
      rating: 4.6,
      reviews: 156,
      stock: 80,
      discount: 22,
      featured: false,
      specifications: {
        weight: '500g',
        origin: 'Yemen + Colombia',
        roast: 'Medium Dark'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      name: 'حقيبة تسوق عصرية',
      nameEn: 'Modern Shopping Bag',
      price: 75,
      originalPrice: 95,
      description: 'حقيبة أنيقة ومتينة مصنوعة من الجلد الطبيعي مثالية للتسوق والاستخدام اليومي',
      descriptionEn: 'Elegant and durable bag made from genuine leather, perfect for shopping and daily use',
      category: 'accessories',
      categoryAr: 'الإكسسوارات',
      image: 'https://images.pexels.com/photos/6995253/pexels-photo-6995253.jpeg',
      images: ['https://images.pexels.com/photos/6995253/pexels-photo-6995253.jpeg'],
      rating: 4.7,
      reviews: 62,
      stock: 45,
      discount: 21,
      featured: true,
      specifications: {
        material: 'Genuine Leather',
        dimensions: '40x30x15 cm',
        colors: ['Black', 'Brown', 'Red', 'Beige']
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      name: 'ساعة ذكية رياضية',
      nameEn: 'Smart Sports Watch',
      price: 180,
      originalPrice: 220,
      description: 'ساعة ذكية متطورة لتتبع الأنشطة الرياضية مع GPS ومقاوم للماء',
      descriptionEn: 'Advanced smartwatch for fitness tracking with GPS and waterproof design',
      category: 'electronics',
      categoryAr: 'الإلكترونيات',
      image: 'https://images.unsplash.com/photo-1652862938332-815e45390b3c',
      images: ['https://images.unsplash.com/photo-1652862938332-815e45390b3c'],
      rating: 4.4,
      reviews: 203,
      stock: 60,
      discount: 18,
      featured: false,
      specifications: {
        display: 'AMOLED 1.4"',
        battery: '7 days',
        waterproof: 'IP68',
        sensors: 'Heart Rate, GPS, Accelerometer'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  await db.collection('products').insertMany(sampleProducts)
}

async function seedCategories(db) {
  const sampleCategories = [
    {
      id: uuidv4(),
      name: 'الإلكترونيات',
      nameEn: 'Electronics',
      slug: 'electronics',
      description: 'أجهزة إلكترونية وتقنية متطورة',
      descriptionEn: 'Electronic devices and advanced technology',
      image: 'https://images.unsplash.com/photo-1652862938332-815e45390b3c',
      icon: '📱',
      parentId: null,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      name: 'الملابس',
      nameEn: 'Clothing',
      slug: 'clothing',
      description: 'أزياء وملابس للرجال والنساء',
      descriptionEn: 'Fashion and clothing for men and women',
      image: 'https://images.pexels.com/photos/7563569/pexels-photo-7563569.jpeg',
      icon: '👕',
      parentId: null,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      name: 'المواد الغذائية',
      nameEn: 'Food',
      slug: 'food',
      description: 'مواد غذائية طازجة وعالية الجودة',
      descriptionEn: 'Fresh and high-quality food products',
      image: 'https://images.unsplash.com/photo-1716535232783-38a9e49eeffa',
      icon: '🍎',
      parentId: null,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      name: 'الإكسسوارات',
      nameEn: 'Accessories',
      slug: 'accessories',
      description: 'حقائب وإكسسوارات عصرية',
      descriptionEn: 'Modern bags and accessories',
      image: 'https://images.pexels.com/photos/6995253/pexels-photo-6995253.jpeg',
      icon: '👜',
      parentId: null,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  await db.collection('categories').insertMany(sampleCategories)

  // Seed some coupons
  const sampleCoupons = [
    {
      id: uuidv4(),
      code: 'WELCOME20',
      type: 'percentage',
      value: 20,
      maxDiscount: 50,
      minOrderAmount: 100,
      description: 'خصم ترحيبي 20%',
      active: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      usedBy: [],
      createdAt: new Date()
    },
    {
      id: uuidv4(),
      code: 'SAVE10',
      type: 'fixed',
      value: 10,
      minOrderAmount: 50,
      description: 'خصم ثابت $10',
      active: true,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      usedBy: [],
      createdAt: new Date()
    }
  ]

  await db.collection('coupons').insertMany(sampleCoupons)
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute