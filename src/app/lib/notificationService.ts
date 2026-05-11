import { notificationStorage, productStorage } from './storage';
import { Product } from './types';

export const notificationService = {
  checkLowStock: (shopId: string, product: Product) => {
    if (product.totalQuantity <= (product.lowStockAlert || 5)) {
      // Check if a recent notification already exists for this product to avoid spam
      const existing = notificationStorage.getByUser(shopId).find(
        n => n.type === 'low_stock' && n.details?.productId === product.id && !n.read
      );

      if (!existing) {
        notificationStorage.create({
          shopId,
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${product.name} is running low (${product.totalQuantity} left)`,
          read: false,
          details: { productId: product.id }
        });
      }
    }
  },

  checkAllLowStock: (shopId: string) => {
    const products = productStorage.getByShop(shopId);
    products.forEach(p => {
      if (p.totalQuantity <= (p.lowStockAlert || 5)) {
         // Same check as above
         const existing = notificationStorage.getByUser(shopId).find(
          n => n.type === 'low_stock' && n.details?.productId === p.id && !n.read
        );
        if (!existing) {
          notificationStorage.create({
            shopId,
            type: 'low_stock',
            title: 'Low Stock Alert',
            message: `${p.name} is running low (${p.totalQuantity} left)`,
            read: false,
            details: { productId: p.id }
          });
        }
      }
    });
  }
};
