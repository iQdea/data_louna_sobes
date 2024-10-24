import { Injectable, Logger } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { ItemResponsePurchase, PurchaseRequest, PurchaseResponse, UserBalance } from "../../common/dto";

@Injectable()
export class PurchaseService {
  private readonly logger = new Logger(PurchaseService.name)
  constructor(
    private readonly dataBaseService: DatabaseService
  ) {
  }

  async buyItemsWithBlock(data: PurchaseRequest): Promise<PurchaseResponse> {
    const { userId, items } = data;
    const sql = await this.dataBaseService.query();

    return await sql.begin<PurchaseResponse>(async sql => {
      const [userStart]: UserBalance[] = await sql<UserBalance[]>`SELECT balance 
                             FROM public.users 
                             WHERE id = ${userId} FOR UPDATE`;
      let totalAmount = 0;


      for (const item of items) {
        const [itemDetails]: ItemResponsePurchase[] = await sql<ItemResponsePurchase[]>`SELECT id, quantity, min_tradable, min_non_tradable 
                                      FROM public.items WHERE id = ${item.id} FOR UPDATE`;

        if (itemDetails.quantity < item.quantity) {
          throw new Error(`Недостаточно предметов: ${itemDetails.id}`);
        }

        totalAmount += (itemDetails.min_tradable || itemDetails.min_non_tradable) * item.quantity;
      }

      if (userStart.balance < totalAmount) {
        throw new Error('Недостаточно средств на счету.');
      }
      await new Promise(f => setTimeout(f, 5000));

      for (const item of items) {
        await sql`UPDATE public.items SET quantity = quantity - ${item.quantity} WHERE id = ${item.id}`;
      }

      const [userEnd]: UserBalance[] = await sql<UserBalance[]>`UPDATE public.users SET balance = balance - ${totalAmount} WHERE id = ${userId} RETURNING balance`;

      const [purchase]: { id: string }[] = await sql<{ id: string }[]>`INSERT INTO public.purchases ${sql([{
        user_id: userId,
        total_amount: totalAmount
      }])} RETURNING id`;

      await sql`INSERT INTO public.purchase_items ${sql(items.map((x) => ({
        purchase_id: purchase.id,
        item_id: x.id,
        quantity: x.quantity
      })))}`;

      return { balance: userEnd.balance, total: totalAmount };
    });
  }
  async buyItemsWithoutBlock(data: PurchaseRequest): Promise<PurchaseResponse> {
    const { userId, items } = data;
    const sql = await this.dataBaseService.query();

    return await sql.begin<PurchaseResponse>(async sql => {

      let totalAmount = 0;

      const itemIds = items.map(item => item.id);

      const itemDetails: ItemResponsePurchase[] = await sql<ItemResponsePurchase[]>`
                                                        SELECT id, quantity, min_tradable, min_non_tradable 
                                                        FROM public.items 
                                                        WHERE id IN ${sql(itemIds)}`;

      const itemMap: Record<string, Omit<ItemResponsePurchase, 'id'>> = {};
      for (const item of itemDetails) {
        const { id, ...info } = item
        itemMap[item.id] = info;
      }

      for (const item of items) {
        const itemDetail = itemMap[item.id];
        if (!itemDetail || itemDetail.quantity < item.quantity) {
          throw new Error(`Недостаточно предметов: ${item.id}`);
        }
        totalAmount += (itemDetail.min_tradable || itemDetail.min_non_tradable) * item.quantity;
      }

      const [userStart]: UserBalance[] = await sql<UserBalance[]>`SELECT balance 
                             FROM public.users 
                             WHERE id = ${userId} AND balance >= ${totalAmount}` ;
      if (!userStart) {
        throw new Error('Недостаточно средств на счету.');
      }

      await new Promise(f => setTimeout(f, 5000));

      const itemsRows = items.map((x) => [x.id, x.quantity])
      const affectedRows = await sql`
          UPDATE public.items
          SET quantity = public.items.quantity - t.quantity::int
          FROM (values ${sql(itemsRows)}) AS t(id, quantity)
          WHERE public.items.id = t.id::uuid
            AND public.items.quantity >= t.quantity::int
      `;

      if (affectedRows.count === 0) {
        throw new Error('Не удалось обновить количество предметов.');
      }

      const [userEnd]: UserBalance[] = await sql<UserBalance[]>`UPDATE public.users 
                                                                SET balance = balance - ${totalAmount} 
                                                                WHERE id = ${userId} AND balance >= ${totalAmount} RETURNING balance`;

      if (!userEnd) {
        throw new Error('Не удалось обновить баланс пользователя.');
      }

      const [purchase]: { id: string }[] = await sql<{ id: string }[]>`INSERT INTO public.purchases ${sql([{
        user_id: userId,
        total_amount: totalAmount
      }])} RETURNING id`;

      await sql`INSERT INTO public.purchase_items ${sql(items.map((x) => ({
        purchase_id: purchase.id,
        item_id: x.id,
        quantity: x.quantity
      })))}`;

      return { balance: userEnd.balance, total: totalAmount };
    });
  }
}
