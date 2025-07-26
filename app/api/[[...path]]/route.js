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

    // Products endpoints
    if (route === '/products' && method === 'GET') {
      // Initialize sample products if collection is empty
      const productsCount = await db.collection('products').countDocuments()
      
      if (productsCount === 0) {
        const sampleProducts = [
          {
            id: uuidv4(),
            name: 'آيفون 15 برو',
            nameEn: 'iPhone 15 Pro',
            price: 850000,
            originalPrice: 950000,
            description: 'أحدث إصدار من آيفون بكاميرا متطورة ومعالج قوي',
            descriptionEn: 'Latest iPhone with advanced camera and powerful processor',
            category: 'electronics',
            categoryAr: 'الإلكترونيات',
            image: 'https://images.unsplash.com/photo-1652862938332-815e45390b3c',
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
            name: 'قميص قطني أنيق',
            nameEn: 'Elegant Cotton Shirt',
            price: 25000,
            originalPrice: 35000,
            description: 'قميص مصنوع من القطن الخالص، مريح وأنيق للارتداء اليومي',
            descriptionEn: 'Made from pure cotton, comfortable and elegant for daily wear',
            category: 'clothing',
            categoryAr: 'الملابس',
            image: 'https://images.pexels.com/photos/7563569/pexels-photo-7563569.jpeg',
            images: ['https://images.pexels.com/photos/7563569/pexels-photo-7563569.jpeg'],
            rating: 4.5,
            reviews: 45,
            stock: 100,
            discount: 29,
            featured: true,
            specifications: {
              material: '100% Cotton',
              sizes: ['S', 'M', 'L', 'XL'],
              colors: ['White', 'Blue', 'Black']
            },
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            name: 'كيكة الشوكولاتة الفاخرة',
            nameEn: 'Premium Chocolate Cake',
            price: 15000,
            originalPrice: 20000,
            description: 'كيكة شوكولاتة فاخرة محضرة بأجود المكونات',
            descriptionEn: 'Premium chocolate cake made with finest ingredients',
            category: 'food',
            categoryAr: 'المواد الغذائية',
            image: 'https://images.unsplash.com/photo-1716535232783-38a9e49eeffa',
            images: ['https://images.unsplash.com/photo-1716535232783-38a9e49eeffa'],
            rating: 4.9,
            reviews: 87,
            stock: 25,
            discount: 25,
            featured: true,
            specifications: {
              weight: '1kg',
              serves: '8-10 people',
              ingredients: 'Chocolate, Flour, Sugar, Eggs, Butter'
            },
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            name: 'حقيبة تسوق عصرية',
            nameEn: 'Modern Shopping Bag',
            price: 45000,
            originalPrice: 55000,
            description: 'حقيبة أنيقة ومتينة مثالية للتسوق والاستخدام اليومي',
            descriptionEn: 'Elegant and durable bag perfect for shopping and daily use',
            category: 'accessories',
            categoryAr: 'الإكسسوارات',
            image: 'https://images.pexels.com/photos/6995253/pexels-photo-6995253.jpeg',
            images: ['https://images.pexels.com/photos/6995253/pexels-photo-6995253.jpeg'],
            rating: 4.7,
            reviews: 62,
            stock: 75,
            discount: 18,
            featured: true,
            specifications: {
              material: 'Genuine Leather',
              dimensions: '40x30x15 cm',
              colors: ['Black', 'Brown', 'Red']
            },
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]

        await db.collection('products').insertMany(sampleProducts)
      }

      const products = await db.collection('products')
        .find({})
        .limit(50)
        .toArray()

      // Remove MongoDB's _id field from response
      const cleanedProducts = products.map(({ _id, ...rest }) => rest)
      
      return handleCORS(NextResponse.json(cleanedProducts))
    }

    // Categories endpoints
    if (route === '/categories' && method === 'GET') {
      const categoriesCount = await db.collection('categories').countDocuments()
      
      if (categoriesCount === 0) {
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
            name: 'المنزل والحديقة',
            nameEn: 'Home & Garden',
            slug: 'home-garden',
            description: 'أدوات منزلية ومستلزمات الحديقة',
            descriptionEn: 'Home tools and garden supplies',
            image: 'https://images.pexels.com/photos/6995253/pexels-photo-6995253.jpeg',
            icon: '🏠',
            parentId: null,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]

        await db.collection('categories').insertMany(sampleCategories)
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
      
      // If payment method is wallet, deduct from user's balance
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

    // Wallet endpoints
    if (route === '/wallet/recharge' && method === 'POST') {
      const rechargeData = await request.json()
      
      const transaction = {
        id: uuidv4(),
        type: 'recharge',
        method: rechargeData.method, // 'authorized_center', 'money_transfer', 'qr_code'
        amount: rechargeData.amount,
        status: rechargeData.method === 'qr_code' ? 'completed' : 'pending',
        userId: rechargeData.userId,
        reference: rechargeData.reference || '',
        receiptImage: rechargeData.receiptImage || '',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('wallet_transactions').insertOne(transaction)

      // If QR code payment, add to balance immediately
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

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute