import { PrismaService } from '../database/prisma.service';
import { generateOrderCode } from '@dosumart/utils';

export async function generateUniqueOrderCode(prisma: PrismaService): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const code = generateOrderCode(8);
    const exists = await prisma.order.findFirst({
      where: { code, deletedAt: null },
      select: { id: true },
    });
    if (!exists) return code;
  }
  throw new Error('Không thể tạo mã đơn hàng');
}
