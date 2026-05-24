"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
async function migrateOrderItems() {
    console.log('🔄 Starting migration: Fix order_items.restaurant_id...\n');
    try {
        console.log('📊 Step 1: Checking current state...');
        const { data: nullCount, error: nullError } = await supabase
            .from('order_items')
            .select('id', { count: 'exact', head: true })
            .is('restaurant_id', true);
        if (nullError) {
            console.error('❌ Error checking null count:', nullError);
            return;
        }
        console.log(`   Found ${nullCount?.length ?? 0} order_items with NULL restaurant_id\n`);
        if ((nullCount?.length ?? 0) > 0) {
            console.log('📝 Step 2: Populating restaurant_id from orders table...');
            const { error: updateError } = await supabase.rpc('fix_order_items_restaurant_id');
            if (updateError) {
                console.error('❌ Error during population:', updateError);
                return;
            }
            console.log('   ✅ Population completed\n');
        }
        else {
            console.log('   ✅ No NULL values to populate\n');
        }
        console.log('🔍 Step 3: Validating data consistency...');
        const { data: stillNull } = await supabase
            .from('order_items')
            .select('id')
            .is('restaurant_id', true);
        if ((stillNull?.length ?? 0) > 0) {
            console.warn(`   ⚠️  Warning: ${stillNull?.length ?? 0} order_items still have NULL restaurant_id`);
        }
        else {
            console.log('   ✅ All order_items have restaurant_id set');
        }
        const { data: mismatches } = await supabase.rpc('validate_order_items_consistency');
        if ((mismatches?.length ?? 0) > 0) {
            console.warn(`   ⚠️  Warning: ${mismatches?.length ?? 0} order_items have mismatched restaurant_id`);
            console.log('   Mismatches:', mismatches);
        }
        else {
            console.log('   ✅ All order_items have consistent restaurant_id with their orders');
        }
        console.log('\n✅ Migration completed successfully!');
        console.log('Next: Run validation tests to ensure RLS policies are working correctly.');
    }
    catch (error) {
        console.error('❌ Unexpected error:', error);
        process.exit(1);
    }
}
async function ensureHelperFunctions() {
    async function createRpcFunction(sql) {
        try {
            await supabase.rpc('exec_sql', { sql });
        }
        catch {
        }
    }
    await createRpcFunction(`
      create or replace function fix_order_items_restaurant_id()
      returns void as $$
      begin
        update public.order_items oi
        set restaurant_id = o.restaurant_id
        from public.orders o
        where oi.order_id = o.id
          and oi.restaurant_id is null;
      end;
      $$ language plpgsql;
    `);
    await createRpcFunction(`
      create or replace function validate_order_items_consistency()
      returns table(order_item_id uuid, order_restaurant uuid, items_restaurant uuid) as $$
      begin
        return query
        select oi.id, o.restaurant_id, oi.restaurant_id
        from public.order_items oi
        join public.orders o on o.id = oi.order_id
        where o.restaurant_id <> oi.restaurant_id;
      end;
      $$ language plpgsql;
    `);
}
migrateOrderItems().catch(console.error);
//# sourceMappingURL=migration-fix-order-items.js.map