const fs = require('fs');

const files = {
  'src/db/schema.ts': `import { pgTable, serial, varchar, integer, timestamp, decimal } from 'drizzle-orm/pg-core';\n\nexport const products = pgTable('products', {\n  id: serial('id').primaryKey(),\n  name: varchar('name', { length: 255 }).notNull().unique(),\n  price: decimal('price', { precision: 10, scale: 2 }).notNull(),\n});\n\nexport const sales = pgTable('sales', {\n  id: serial('id').primaryKey(),\n  productId: integer('product_id').references(() => products.id).notNull(),\n  quantity: integer('quantity').notNull(),\n  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),\n  createdAt: timestamp('created_at').defaultNow().notNull(),\n});`,
  
  'src/db/index.ts': `import { neon } from '@neondatabase/serverless';\nimport { drizzle } from 'drizzle-orm/neon-http';\nimport * as schema from './schema';\n\nconst sql = neon(process.env.DATABASE_URL!);\nexport const db = drizzle(sql, { schema });`,
  
  'drizzle.config.ts': `import { defineConfig } from 'drizzle-kit';\nimport * as dotenv from 'dotenv';\n\ndotenv.config({ path: '.env' });\n\nexport default defineConfig({\n  schema: './src/db/schema.ts',\n  out: './drizzle',\n  dialect: 'postgresql',\n  dbCredentials: {\n    url: process.env.DATABASE_URL!,\n  },\n});`
};

// Klasörleri aç
fs.mkdirSync('src/db', { recursive: true });

// Dosyaları içleri dolu şekilde oluştur
for (const [file, content] of Object.entries(files)) {
  fs.writeFileSync(file, content);
}

console.log('Kral, butun dosyalar ve klasorler jilet gibi olusturuldu! Dukkan hazir.');
