import { Inject, Injectable, Logger } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { ItemBase, ItemNonTradable, ItemRemote, ItemResponse, ItemTradable, QueryGeneric } from "../../common/dto";
import { createHash } from "crypto";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { Sql } from "postgres";
import { gunzip, gzip } from "node:zlib";

@Injectable()
export class ItemsService {
  private readonly logger = new Logger(ItemsService.name)
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly dataBaseService: DatabaseService,
  ) {
  }

  async initItems() {
    const [tradableItems, nonTradableItems]: [ItemTradable[], ItemNonTradable[]] = await Promise.all([
      this.parseItems<ItemTradable[]>(true),
      this.parseItems<ItemNonTradable[]>()
    ]);

    const sql = await this.dataBaseService.query();

    const batchSize = 1000;
    await Promise.all([
      this.insertTradableItems(sql, tradableItems, batchSize),
      this.updateNonTradableItems(sql, nonTradableItems, batchSize)
    ]);
  }

  async parseApi(filter?: QueryGeneric): Promise<ItemBase[]>{
    const cacheKey = `items_all`;
    const cachedData: any = await this.cacheManager.get(cacheKey);

    if (cachedData) {
      await this.logger.log('Get cached all');
      const decompressedData = await this.decompressData(Buffer.from(cachedData, 'base64'));
      if (filter) {
        const startIndex: number = (filter.page - 1) * filter.pageSize;
        const endIndex = startIndex + Number(filter.pageSize);
        console.log(startIndex, endIndex)
        return decompressedData.slice(startIndex, endIndex) as ItemBase[];
      } else {
        return decompressedData as ItemBase[];
      }
    }

    const [tradableItems, nonTradableItems]: [ItemTradable[], ItemNonTradable[]] = await Promise.all([
      this.parseItems<ItemTradable[]>(true),
      this.parseItems<ItemNonTradable[]>()
    ]);

    const items: ItemBase[] = tradableItems.map((item) => ({
      name: item.name,
      min_tradable: item.min_tradable,
      min_non_tradable: 0
    }))

    nonTradableItems.map((item) => {
      const existingItem = items.find((i) => i.name === item.name);
      if (existingItem) {
        existingItem.min_non_tradable = item.min_non_tradable;
      } else {
        items.push({
          name: item.name,
          min_tradable: 0,
          min_non_tradable: item.min_non_tradable
        })
      }
    })

    const returningItems = items.map((x) => (x.min_tradable === 0
      ? { ...x, min_tradable: null } :
      (x.min_non_tradable === 0 ? { ...x, min_non_tradable: null } : x)));

    const compressedData = await this.compressData(returningItems);
    await this.cacheManager.set(cacheKey, compressedData.toString('base64'), 300e3);
    await this.logger.log('Cached all');

    if (filter) {
      const startIndex: number = (filter.page - 1) * filter.pageSize;
      const endIndex = startIndex + Number(filter.pageSize);
      return returningItems.slice(startIndex, endIndex);
    } else {
      return returningItems;
    }
  }

  async insertTradableItems(sql: Sql, items: ItemTradable[], batchSize: number) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      batches.push(sql`INSERT INTO items ${sql(batch)} ON CONFLICT (name) DO UPDATE SET
            quantity = items.quantity,
            min_tradable = items.min_tradable`);
    }
    await Promise.all(batches);
  }

  async updateNonTradableItems(sql: Sql, items: ItemNonTradable[], batchSize: number) {
    const batches = [];
    for (let j = 0; j < items.length; j += batchSize) {
      const batch = items.slice(j, j + batchSize).map((x) => [x.name, x.quantity, x.min_non_tradable]);
      batches.push(sql`UPDATE items SET min_non_tradable = t.min_price::float
            FROM (VALUES ${sql(batch)}) AS t(name, quantity, min_price)
            WHERE items.name = t.name::text`);
    }
    await Promise.all(batches);
  }

  async parseItems<T>(tradable: boolean = false): Promise<T> {
    const cacheKey = tradable ? `items_tradable` : `items_non_tradable`;
    const cachedData: any = await this.cacheManager.get(cacheKey);

    if (cachedData) {
      await this.logger.log('Get cached tradable = ' + tradable);
      const decompressedData = await this.decompressData(Buffer.from(cachedData, 'base64'));
      return decompressedData as T;
    }

    const res = await fetch(`https://api.skinport.com/v1/items?app_id=730&tradable=${tradable}`);
    if (res.status === 200) {
      const itemsArray: ItemRemote[] = await res.json();
      const itemsRemote = itemsArray.map((x) => this.parseFields(tradable, x));
      const compressedData = await this.compressData(itemsRemote);
      await this.cacheManager.set(cacheKey, compressedData.toString('base64'), 300e3);
      await this.logger.log('Cached tradable = ' + tradable);
      return itemsRemote as T;
    } else if (res.status === 429) {
      throw new Error(`Too many requests with external API on tradable = ${tradable} and no cached data`);
    } else {
      throw new Error(`Something went wrong with external API on tradable = ${tradable} with code ${res.status}`);
    }
  }


  parseFields(tradable: boolean, x: ItemRemote) {
    const base = { name: x.market_hash_name, quantity: x.quantity };
    return tradable ? { ...base, min_tradable: x.min_price } : { ...base, min_non_tradable: x.min_price };
  }

  async getItems(filter: QueryGeneric): Promise<ItemResponse[]> {
    const key = await this.getHashKey(filter);
    const cached: ItemResponse[] | undefined = await this.cacheManager.get(key);
    if (cached) {
      this.logger.log('Get items from cache')
      return cached;
    }
    const sql = await this.dataBaseService.query();
    const items: ItemResponse[] = await sql<ItemResponse[]>`
        SELECT * FROM items LIMIT ${filter.pageSize} OFFSET ${(filter.page - 1) * (filter.pageSize)}
    `;
    await this.cacheManager.set(
      key,
      items,
      300e3
    );
    this.logger.log('Get items from request. Result cached')
    return items;
  }

  async getHashKey(params: QueryGeneric) {
    const uniqueString = JSON.stringify(params);
    const hash = createHash('sha256').update(uniqueString).digest('hex');
    const keyString = hash.slice(0, 16);
    return `items_find_${keyString}`;
  }

  async clearCache() {
    const keys = await this.cacheManager.store.keys();
    const keysDel = keys.filter((x) => x.startsWith(`items_find_`))
    for (const key of keysDel) {
      await this.cacheManager.del(key)
    }
  }

  async compressData<T extends any[]>(data: T): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      gzip(JSON.stringify(data), (err, buffer) => {
        if (err) {
          return reject(err);
        }
        resolve(buffer);
      });
    });
  }

  async decompressData<T extends any[]>(data: Buffer): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      gunzip(data, (err, buffer) => {
        if (err) {
          return reject(err);
        }
        resolve(JSON.parse(buffer.toString()) as T);
      });
    });
  }
}
