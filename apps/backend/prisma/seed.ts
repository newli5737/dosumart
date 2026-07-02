import { PrismaClient, Role, CouponType, InventoryTransactionType, OrderChannel, OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const IMG = {
  miGoi: ['https://res.cloudinary.com/dn00btmpw/image/upload/v1782982220/ixcojihbccd9fbk7bb6f.jpg'],
  gao: ['https://res.cloudinary.com/dn00btmpw/image/upload/v1782982225/rup5vzulptao4eogljpl.jpg'],
  nuocMam: ['https://res.cloudinary.com/dn00btmpw/image/upload/v1782982230/qbwjzsifhqiv0vorkqyc.jpg'],
  tuongOt: ['https://res.cloudinary.com/dn00btmpw/image/upload/v1782982234/jgacmy3nlbali3ffsfix.webp'],
  hatNem: ['https://res.cloudinary.com/dn00btmpw/image/upload/v1782982238/s2n5tvt42izklcvoczuc.jpg'],
  dauAn: ['https://res.cloudinary.com/dn00btmpw/image/upload/v1782982243/uimsuan8jjtuivoo7wio.png'],
  bia: ['https://res.cloudinary.com/dn00btmpw/image/upload/v1782982246/rnacgojnlt9akynpv6rs.webp'],
  caPhe: ['https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=800&q=80'],
  nuocKhoang: ['https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&q=80'],
  traXanh: ['https://res.cloudinary.com/dn00btmpw/image/upload/v1782982253/xy8mus3kkt24m0wlko0e.jpg'],
  banh: ['https://res.cloudinary.com/dn00btmpw/image/upload/v1782982259/zj3hncfi1y2n2wktccm5.jpg', 'https://res.cloudinary.com/dn00btmpw/image/upload/v1782982262/kxqjnodcynjvv7bvhsv5.jpg'],
  keo: ['https://res.cloudinary.com/dn00btmpw/image/upload/v1782982266/dezpihflfwv6avynmxbk.jpg'],
  snack: ['https://res.cloudinary.com/dn00btmpw/image/upload/v1782982275/wzoe1ofgwhvajq3x1bfl.jpg'],
  botGiat: ['https://res.cloudinary.com/dn00btmpw/image/upload/v1782982280/aq98l3l1zppgillc0smy.jpg'],
  dauGoi: ['https://res.cloudinary.com/dn00btmpw/image/upload/v1782982284/qkjgug2n24xlrn94mdnz.jpg'],
  kemDanhRang: ['https://res.cloudinary.com/dn00btmpw/image/upload/v1782982288/myw3xffwoc8csgseanmw.jpg'],
  nuocRuaChen: ['https://res.cloudinary.com/dn00btmpw/image/upload/v1782982292/csmmofia6r5igyzmdtb3.jpg']
};

async function upsertProduct(
  warehouseId: string,
  data: {
    name: string;
    slug: string;
    description: string;
    categoryId: string;
    brandId?: string;
    basePrice: number;
    images: string[];
    featured?: boolean;
    sku: string;
    stock?: number;
  },
) {
  const product = await prisma.product.upsert({
    where: { slug: data.slug },
    update: {
      name: data.name,
      description: data.description,
      images: data.images,
      basePrice: data.basePrice,
      isFeatured: data.featured ?? false,
      isActive: true,
      deletedAt: null,
      categoryId: data.categoryId,
      brandId: data.brandId,
    },
    create: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      categoryId: data.categoryId,
      brandId: data.brandId,
      images: data.images,
      basePrice: data.basePrice,
      isFeatured: data.featured ?? false,
    },
  });

  const variant = await prisma.productVariant.upsert({
    where: { sku: data.sku },
    update: {
      price: data.featured ? data.basePrice * 0.85 : data.basePrice,
      costPrice: data.basePrice * 0.7, // Tạp hóa biên độ thấp hơn
      deletedAt: null,
      productId: product.id,
    },
    create: {
      productId: product.id,
      sku: data.sku,
      barcode: `893${data.sku.replace(/[^A-Z0-9]/gi, '').slice(0, 8)}`,
      attributes: { variant: 'Tiêu chuẩn' },
      price: data.featured ? data.basePrice * 0.85 : data.basePrice,
      costPrice: data.basePrice * 0.7,
    },
  });

  const stock = data.stock ?? 200;
  const inventory = await prisma.inventory.findUnique({
    where: { warehouseId_variantId: { warehouseId, variantId: variant.id } },
  });

  if (!inventory) {
    await prisma.inventory.create({
      data: { warehouseId, variantId: variant.id, quantity: stock },
    });
    await prisma.inventoryTransaction.create({
      data: {
        warehouseId,
        variantId: variant.id,
        type: InventoryTransactionType.IMPORT,
        quantity: stock,
        note: 'Nhập kho ban đầu (Tạp hóa)',
      },
    });
  }

  return product;
}

async function main() {
  console.log('Đang seed dữ liệu Tạp hóa DoSuMart...');

  const branch = await prisma.branch.upsert({
    where: { code: 'BR-MAIN' },
    update: {},
    create: {
      name: 'Chi nhánh chính',
      code: 'BR-MAIN',
      address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
      phone: '0281234567',
    },
  });

  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'WH-MAIN' },
    update: {},
    create: { name: 'Kho chính', code: 'WH-MAIN', branchId: branch.id, isDefault: true },
  });

  const password = await bcrypt.hash('123456', 12);

  await prisma.user.upsert({
    where: { email: 'admin@dosumart.vn' },
    update: {},
    create: { email: 'admin@dosumart.vn', password, fullName: 'Quản trị viên', role: Role.SUPER_ADMIN },
  });

  await prisma.user.upsert({
    where: { email: 'thungan@dosumart.vn' },
    update: {},
    create: { email: 'thungan@dosumart.vn', password, fullName: 'Thu ngân Demo', role: Role.CASHIER },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'khach@dosumart.vn' },
    update: {},
    create: { email: 'khach@dosumart.vn', password, fullName: 'Khách hàng Demo', role: Role.CUSTOMER },
  });

  // Xóa các danh mục cũ nếu cần thiết hoặc chỉ tạo mới
  // Ở đây tạo mới / cập nhật danh mục Tạp Hóa
  const catThucPham = await prisma.category.upsert({
    where: { slug: 'thuc-pham' },
    update: { name: 'Thực phẩm khô' },
    create: { name: 'Thực phẩm khô', slug: 'thuc-pham' },
  });

  const catGiaVi = await prisma.category.upsert({
    where: { slug: 'gia-vi' },
    update: { name: 'Gia vị' },
    create: { name: 'Gia vị', slug: 'gia-vi' },
  });

  const catDoUong = await prisma.category.upsert({
    where: { slug: 'do-uong' },
    update: { name: 'Đồ uống' },
    create: { name: 'Đồ uống', slug: 'do-uong' },
  });

  const catAnVat = await prisma.category.upsert({
    where: { slug: 'an-vat' },
    update: { name: 'Đồ ăn vặt' },
    create: { name: 'Đồ ăn vặt', slug: 'an-vat' },
  });

  const catHoaPham = await prisma.category.upsert({
    where: { slug: 'hoa-pham' },
    update: { name: 'Hóa mỹ phẩm' },
    create: { name: 'Hóa mỹ phẩm', slug: 'hoa-pham' },
  });

  const brandMasan = await prisma.brand.upsert({
    where: { slug: 'masan' },
    update: { name: 'Masan' },
    create: { name: 'Masan', slug: 'masan' },
  });

  const brandAcecook = await prisma.brand.upsert({
    where: { slug: 'acecook' },
    update: { name: 'Acecook' },
    create: { name: 'Acecook', slug: 'acecook' },
  });

  const brandTrungNguyen = await prisma.brand.upsert({
    where: { slug: 'trung-nguyen' },
    update: { name: 'Trung Nguyên' },
    create: { name: 'Trung Nguyên', slug: 'trung-nguyen' },
  });

  const brandSabeco = await prisma.brand.upsert({
    where: { slug: 'sabeco' },
    update: { name: 'Sabeco' },
    create: { name: 'Sabeco', slug: 'sabeco' },
  });

  const brandUnilever = await prisma.brand.upsert({
    where: { slug: 'unilever' },
    update: { name: 'Unilever' },
    create: { name: 'Unilever', slug: 'unilever' },
  });

  const brandOrion = await prisma.brand.upsert({
    where: { slug: 'orion' },
    update: { name: 'Orion' },
    create: { name: 'Orion', slug: 'orion' },
  });

  const products = [
    {
      name: 'Mì Hảo Hảo tôm chua cay (Thùng 30 gói)',
      slug: 'mi-hao-hao-tom-chua-cay',
      description: 'Mì ăn liền Hảo Hảo hương vị tôm chua cay quen thuộc, thơm ngon dai giòn.',
      categoryId: catThucPham.id,
      brandId: brandAcecook.id,
      basePrice: 110000,
      images: IMG.miGoi,
      featured: true,
      sku: 'TH-MHH-01',
    },
    {
      name: 'Gạo thơm Thái ST25 (Túi 5kg)',
      slug: 'gao-thom-thai-st25',
      description: 'Gạo ST25 chuẩn vị, hạt dẻo thơm, không nở xốp, được trồng chuẩn sạch.',
      categoryId: catThucPham.id,
      basePrice: 185000,
      images: IMG.gao,
      featured: true,
      sku: 'TH-GST-02',
    },
    {
      name: 'Nước mắm Nam Ngư Đệ Nhị 900ml',
      slug: 'nuoc-mam-nam-ngu',
      description: 'Nước mắm Nam Ngư đậm đà hương vị cá cơm, thích hợp dùng làm nước chấm hoặc gia vị tẩm ướp.',
      categoryId: catGiaVi.id,
      brandId: brandMasan.id,
      basePrice: 45000,
      images: IMG.nuocMam,
      featured: true,
      sku: 'GV-NN-03',
    },
    {
      name: 'Tương ớt Chinsu 250g',
      slug: 'tuong-ot-chinsu',
      description: 'Tương ớt Chinsu cay ngon tự nhiên, đánh thức mọi vị giác.',
      categoryId: catGiaVi.id,
      brandId: brandMasan.id,
      basePrice: 15000,
      images: IMG.tuongOt,
      sku: 'GV-CS-04',
    },
    {
      name: 'Hạt nêm Knorr thịt thăn xương ống 400g',
      slug: 'hat-nem-knorr',
      description: 'Hạt nêm Knorr giúp món ăn thêm đậm đà, tròn vị với chiết xuất từ thịt thăn và xương ống.',
      categoryId: catGiaVi.id,
      brandId: brandUnilever.id,
      basePrice: 38000,
      images: IMG.hatNem,
      sku: 'GV-KN-05',
    },
    {
      name: 'Dầu ăn Simply nguyên chất 1L',
      slug: 'dau-an-simply',
      description: 'Dầu ăn Simply chiết xuất 100% đậu nành, tốt cho sức khỏe tim mạch.',
      categoryId: catGiaVi.id,
      basePrice: 55000,
      images: IMG.dauAn,
      featured: true,
      sku: 'GV-SP-06',
    },
    {
      name: 'Bia 333 Export (Thùng 24 lon x 330ml)',
      slug: 'bia-333-export',
      description: 'Bia 333 thơm ngon, đậm vị men Việt. Sản phẩm truyền thống của Sabeco.',
      categoryId: catDoUong.id,
      brandId: brandSabeco.id,
      basePrice: 275000,
      images: IMG.bia,
      featured: true,
      sku: 'DU-333-07',
    },
    {
      name: 'Cà phê hòa tan G7 3in1 (Hộp 21 gói)',
      slug: 'ca-phe-g7-3in1',
      description: 'Cà phê G7 3in1 mang lại sự tỉnh táo tức thì với hương vị đậm đà khó quên.',
      categoryId: catDoUong.id,
      brandId: brandTrungNguyen.id,
      basePrice: 52000,
      images: IMG.caPhe,
      featured: true,
      sku: 'DU-G7-08',
    },
    {
      name: 'Nước khoáng Lavie 500ml (Lốc 6 chai)',
      slug: 'nuoc-khoang-lavie',
      description: 'Nước khoáng thiên nhiên Lavie bổ sung vi khoáng tốt cho sức khỏe.',
      categoryId: catDoUong.id,
      basePrice: 28000,
      images: IMG.nuocKhoang,
      sku: 'DU-LV-09',
    },
    {
      name: 'Trà xanh Không Độ (Chai 500ml)',
      slug: 'tra-xanh-khong-do',
      description: 'Trà xanh Không Độ giải tỏa căng thẳng mệt mỏi, chiết xuất từ lá trà xanh tự nhiên.',
      categoryId: catDoUong.id,
      basePrice: 10000,
      images: IMG.traXanh,
      sku: 'DU-KD-10',
    },
    {
      name: 'Bánh Chocopie (Hộp 12 cái)',
      slug: 'banh-chocopie',
      description: 'Bánh Chocopie với lớp vỏ sô cô la mềm mịn và lớp marshmallow dai ngon hoàn hảo.',
      categoryId: catAnVat.id,
      brandId: brandOrion.id,
      basePrice: 58000,
      images: IMG.banh,
      featured: true,
      sku: 'AV-CP-11',
    },
    {
      name: 'Bánh quy Cosy Marie (Gói 300g)',
      slug: 'banh-quy-cosy',
      description: 'Bánh quy Cosy bơ sữa giòn tan, vị ngọt dịu nhẹ, ăn hoài không ngán.',
      categoryId: catAnVat.id,
      basePrice: 35000,
      images: IMG.banh,
      sku: 'AV-CS-12',
    },
    {
      name: 'Kẹo dừa Bến Tre truyền thống',
      slug: 'keo-dua-ben-tre',
      description: 'Kẹo dừa đặc sản Bến Tre ngọt thanh, dẻo béo vị cốt dừa tự nhiên.',
      categoryId: catAnVat.id,
      basePrice: 25000,
      images: IMG.keo,
      sku: 'AV-KD-13',
    },
    {
      name: 'Snack khoai tây Oishi',
      slug: 'snack-khoai-tay-oishi',
      description: 'Bim bim khoai tây giòn rụm tẩm vị đậm đà.',
      categoryId: catAnVat.id,
      basePrice: 6000,
      images: IMG.snack,
      sku: 'AV-OS-14',
    },
    {
      name: 'Bột giặt Omo hệ bọt thông minh 800g',
      slug: 'bot-giat-omo',
      description: 'Bột giặt Omo loại bỏ 99.9% vết bẩn cứng đầu chỉ với một lần vò.',
      categoryId: catHoaPham.id,
      brandId: brandUnilever.id,
      basePrice: 42000,
      images: IMG.botGiat,
      featured: true,
      sku: 'HP-OM-15',
    },
    {
      name: 'Dầu gội Clear mát lạnh bạc hà 650g',
      slug: 'dau-goi-clear-bac-ha',
      description: 'Dầu gội Clear đánh bay gàu, mang lại cảm giác the mát sảng khoái suốt 24h.',
      categoryId: catHoaPham.id,
      brandId: brandUnilever.id,
      basePrice: 155000,
      images: IMG.dauGoi,
      featured: true,
      sku: 'HP-CL-16',
    },
    {
      name: 'Kem đánh răng P/S bảo vệ 123 200g',
      slug: 'kem-danh-rang-ps',
      description: 'Kem đánh răng P/S bảo vệ răng miệng toàn diện: ngừa sâu răng, thơm mát, trắng sáng.',
      categoryId: catHoaPham.id,
      brandId: brandUnilever.id,
      basePrice: 28000,
      images: IMG.kemDanhRang,
      sku: 'HP-PS-17',
    },
    {
      name: 'Nước rửa chén Sunlight chanh 750g',
      slug: 'nuoc-rua-chen-sunlight',
      description: 'Nước rửa chén Sunlight đánh bay dầu mỡ nhanh chóng, hương chanh dễ chịu.',
      categoryId: catHoaPham.id,
      brandId: brandUnilever.id,
      basePrice: 32000,
      images: IMG.nuocRuaChen,
      featured: true,
      sku: 'HP-SL-18',
    }
  ];

  for (const p of products) {
    await upsertProduct(warehouse.id, p);
  }

  await prisma.storeSetting.upsert({
    where: { key: 'store' },
    update: {
      value: {
        name: 'Tạp Hóa Việt',
        tagline: 'Hàng tiêu dùng chính hãng - Giá cả bình dân',
        address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
        phone: '028 1234 5678',
        email: 'hotro@dosumart.vn',
        taxCode: '0123456789',
        logo: '/dosumart.png',
        banners: [
          {
            image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&q=80',
            title: 'Tạp Hóa Việt',
            subtitle: 'Mua sắm tiện lợi',
            desc: 'Cung cấp các mặt hàng nhu yếu phẩm, thực phẩm, gia vị hàng ngày. Cam kết hàng chính hãng, giá bình dân.',
            btnText: 'Mua sắm ngay',
            link: '/san-pham'
          },
          {
            image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1600&q=80',
            title: 'Gia vị gia đình',
            subtitle: 'Đậm đà mâm cơm',
            desc: 'Nước mắm, tương ớt, hạt nêm từ các thương hiệu hàng đầu Việt Nam như Masan, Chinsu, Nam Ngư.',
            btnText: 'Khám phá gia vị',
            link: '/san-pham?category=gia-vi'
          },
          {
            image: 'https://images.unsplash.com/photo-1605338275525-452f1b490453?w=1600&q=80',
            title: 'Khát khao sảng khoái',
            subtitle: 'Đồ uống mát lạnh',
            desc: 'Giải khát với bia 333, nước ngọt, cà phê, trà xanh tự nhiên.',
            btnText: 'Mua đồ uống',
            link: '/san-pham?category=do-uong'
          }
        ]
      },
    },
    create: {
      key: 'store',
      value: {
        name: 'Tạp Hóa Việt',
        tagline: 'Hàng tiêu dùng chính hãng - Giá cả bình dân',
        address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
        phone: '028 1234 5678',
        email: 'hotro@dosumart.vn',
        taxCode: '0123456789',
        logo: '/dosumart.png',
        banners: [
          {
            image: 'https://res.cloudinary.com/dn00btmpw/image/upload/v1782982295/d0ocynjittjuki4jpjco.jpg',
            title: 'Tạp Hóa Việt',
            subtitle: 'Mua sắm tiện lợi',
            desc: 'Cung cấp các mặt hàng nhu yếu phẩm, thực phẩm, gia vị hàng ngày. Cam kết hàng chính hãng, giá bình dân.',
            btnText: 'Mua sắm ngay',
            link: '/san-pham'
          },
          {
            image: 'https://res.cloudinary.com/dn00btmpw/image/upload/v1782982299/wvaktc01edu6gltawozq.jpg',
            title: 'Gia vị gia đình',
            subtitle: 'Đậm đà mâm cơm',
            desc: 'Nước mắm, tương ớt, hạt nêm từ các thương hiệu hàng đầu Việt Nam như Masan, Chinsu, Nam Ngư.',
            btnText: 'Khám phá gia vị',
            link: '/san-pham?category=gia-vi'
          },
          {
            image: 'https://res.cloudinary.com/dn00btmpw/image/upload/v1782982302/zydt80mvgl2lslywmmzu.jpg',
            title: 'Khát khao sảng khoái',
            subtitle: 'Đồ uống mát lạnh',
            desc: 'Giải khát với bia 333, nước ngọt, cà phê, trà xanh tự nhiên.',
            btnText: 'Mua đồ uống',
            link: '/san-pham?category=do-uong'
          }
        ]
      },
    },
  });

  // Seed đơn hàng mẫu + doanh thu dashboard
  const existingSales = await prisma.dailySales.count();
  if (existingSales === 0) {
    const variants = await prisma.productVariant.findMany({
      take: 10,
      include: { product: true },
    });

    for (let day = 13; day >= 0; day--) {
      const ordersToday = 2 + Math.floor(Math.random() * 3);
      for (let o = 0; o < ordersToday; o++) {
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - day);
        createdAt.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60), 0, 0);

        const channel = o % 3 === 0 ? OrderChannel.POS : OrderChannel.ONLINE;
        const pick = variants[Math.floor(Math.random() * variants.length)];
        const qty = 1 + Math.floor(Math.random() * 4);
        const price = Number(pick.price);
        const cost = Number(pick.costPrice || 0);
        const subtotal = price * qty;
        const shippingFee = channel === OrderChannel.ONLINE ? 15000 : 0;
        const total = subtotal + shippingFee;
        const code = `DH${createdAt.toISOString().slice(0, 10).replace(/-/g, '')}${String(day).padStart(2, '0')}${String(o).padStart(2, '0')}`;

        await prisma.order.create({
          data: {
            code,
            userId: channel === OrderChannel.ONLINE ? customer.id : undefined,
            channel,
            status: OrderStatus.COMPLETED,
            paymentMethod: channel === OrderChannel.POS ? PaymentMethod.CASH : PaymentMethod.COD,
            paymentStatus: PaymentStatus.PAID,
            subtotal,
            shippingFee,
            total,
            createdAt,
            items: {
              create: [{
                variantId: pick.id,
                productName: pick.product.name,
                sku: pick.sku,
                price,
                costPrice: pick.costPrice,
                quantity: qty,
                lineTotal: subtotal,
              }],
            },
          },
        });

        const salesDate = new Date(createdAt);
        salesDate.setHours(0, 0, 0, 0);
        const profit = subtotal - cost * qty;

        await prisma.dailySales.upsert({
          where: { date_channel: { date: salesDate, channel } },
          create: {
            date: salesDate,
            channel,
            orderCount: 1,
            revenue: total,
            profit,
          },
          update: {
            orderCount: { increment: 1 },
            revenue: { increment: total },
            profit: { increment: profit },
          },
        });
      }
    }
    console.log('Đã seed đơn hàng mẫu cho dashboard doanh thu.');
  }

  console.log(`Seed hoàn tất! ${products.length} sản phẩm Tạp Hóa Việt.`);
  console.log('Tài khoản:');
  console.log('  Admin: admin@dosumart.vn / 123456');
  console.log('  Thu ngân: thungan@dosumart.vn / 123456');
  console.log('  Khách hàng: khach@dosumart.vn / 123456');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
