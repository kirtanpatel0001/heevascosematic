'use server';

import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabaseServer';

type POSPaymentMethod = 'CASH' | 'UPI' | 'CARD';

type POSInputItem = {
  productId: string;
  quantity: number;
};

type CreatePOSSaleInput = {
  customerName: string;
  customerPhone: string;
  paymentMethod: POSPaymentMethod;
  items: POSInputItem[];
};

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function assertAdminUser() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized.');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || profile?.role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  return user;
}

export async function createPosSale(input: CreatePOSSaleInput): Promise<{ saleId: string }> {
  await assertAdminUser();

  const customerName = input.customerName.trim();
  const customerPhone = input.customerPhone.trim();
  const paymentMethod = input.paymentMethod;

  if (!customerName) throw new Error('Customer name is required.');
  if (!/^[0-9+\\-\\s()]{7,20}$/.test(customerPhone)) {
    throw new Error('Invalid customer phone number.');
  }
  if (!['CASH', 'UPI', 'CARD'].includes(paymentMethod)) {
    throw new Error('Invalid payment method.');
  }
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new Error('Cart is empty.');
  }

  const normalized = input.items
    .map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
    }))
    .filter((item) => item.productId && Number.isInteger(item.quantity) && item.quantity > 0);

  if (normalized.length === 0) {
    throw new Error('Invalid cart payload.');
  }

  // Merge duplicate product IDs.
  const merged = new Map<string, number>();
  for (const item of normalized) {
    merged.set(item.productId, (merged.get(item.productId) || 0) + item.quantity);
  }

  const productIds = Array.from(merged.keys());

  const { data: products, error: productsError } = await supabaseAdmin
    .from('products')
    .select('id, name, price, stock, is_visible')
    .in('id', productIds);

  if (productsError || !products || products.length !== productIds.length) {
    throw new Error('Some products are not available.');
  }

  const productsById = new Map(products.map((p) => [p.id, p]));
  const saleItems: Array<{
    product_id: string;
    name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }> = [];

  let totalAmount = 0;
  for (const [productId, quantity] of merged.entries()) {
    const product = productsById.get(productId);
    if (!product || !product.is_visible) {
      throw new Error('Some products are not available.');
    }
    if (quantity > product.stock) {
      throw new Error(`Insufficient stock for ${product.name}.`);
    }

    const lineTotal = quantity * Number(product.price);
    totalAmount += lineTotal;

    saleItems.push({
      product_id: product.id,
      name: product.name,
      quantity,
      unit_price: Number(product.price),
      line_total: lineTotal,
    });
  }

  let saleId: string | null = null;
  const adjusted: Array<{ productId: string; quantity: number }> = [];

  try {
    const { data: sale, error: saleError } = await supabaseAdmin
      .from('pos_sales')
      .insert({
        customer_name: customerName,
        customer_phone: customerPhone,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        items: saleItems,
      })
      .select('id')
      .single();

    if (saleError || !sale) {
      throw new Error('Failed to create POS sale.');
    }
    saleId = sale.id;

    for (const item of saleItems) {
      const { data: rows, error: stockError } = await supabaseAdmin
        .from('products')
        .update({
          stock: (productsById.get(item.product_id)?.stock || 0) - item.quantity,
        })
        .eq('id', item.product_id)
        .gte('stock', item.quantity)
        .select('id');

      if (stockError) throw new Error(`Stock update failed for ${item.name}.`);
      if (!rows || rows.length === 0) throw new Error(`Insufficient stock for ${item.name}.`);

      adjusted.push({ productId: item.product_id, quantity: item.quantity });
    }

    return { saleId: sale.id };
  } catch (err) {
    if (saleId) {
      await supabaseAdmin.from('pos_sales').delete().eq('id', saleId);
    }

    // Best-effort stock rollback.
    for (const row of adjusted) {
      const { data: current } = await supabaseAdmin
        .from('products')
        .select('stock')
        .eq('id', row.productId)
        .single();
      if (current && typeof current.stock === 'number') {
        await supabaseAdmin
          .from('products')
          .update({ stock: current.stock + row.quantity })
          .eq('id', row.productId);
      }
    }

    throw err instanceof Error ? err : new Error('POS checkout failed.');
  }
}

