import { supabase } from '../lib/supabase';

interface CopyResult {
  worksCount: number;
  materialsCount: number;
  totalCopied: number;
}

/**
 * Copy all BOQ items (works and materials) from source position to target position
 * Preserves parent_work_item_id relationships using array indices
 */
export async function copyBoqItems(
  sourcePositionId: string,
  targetPositionId: string
): Promise<CopyResult> {
  // Validate positions exist and are from same tender
  const { data: sourcePosition, error: sourceError } = await supabase
    .from('client_positions')
    .select('id, tender_id')
    .eq('id', sourcePositionId)
    .single();

  if (sourceError || !sourcePosition) {
    throw new Error('Исходная позиция не найдена');
  }

  const { data: targetPosition, error: targetError } = await supabase
    .from('client_positions')
    .select('id, tender_id')
    .eq('id', targetPositionId)
    .single();

  if (targetError || !targetPosition) {
    throw new Error('Целевая позиция не найдена');
  }

  if (sourcePosition.tender_id !== targetPosition.tender_id) {
    throw new Error('Позиции должны принадлежать одному тендеру');
  }

  // Step 1: Get all source items in order
  const { data: sourceItems, error: fetchError } = await supabase
    .from('boq_items')
    .select('*')
    .eq('client_position_id', sourcePositionId)
    .order('sort_number', { ascending: true });

  if (fetchError) {
    throw new Error(`Ошибка получения элементов: ${fetchError.message}`);
  }

  if (!sourceItems || sourceItems.length === 0) {
    throw new Error('Нет элементов для копирования');
  }

  // Step 2: Insert all items with new IDs and temporarily null parent_work_item_id
  const itemsToInsert = sourceItems.map((item, index) => ({
    tender_id: item.tender_id,
    client_position_id: targetPositionId,
    sort_number: index + 1,
    boq_item_type: item.boq_item_type,
    material_type: item.material_type,
    material_name_id: item.material_name_id,
    work_name_id: item.work_name_id,
    unit_code: item.unit_code,
    quantity: item.quantity,
    base_quantity: item.base_quantity,
    consumption_coefficient: item.consumption_coefficient,
    conversion_coefficient: item.conversion_coefficient,
    parent_work_item_id: null, // Temporarily null, will update in step 3
    delivery_price_type: item.delivery_price_type,
    delivery_amount: item.delivery_amount,
    currency_type: item.currency_type,
    unit_rate: item.unit_rate,
    total_amount: item.total_amount,
    detail_cost_category_id: item.detail_cost_category_id,
    quote_link: item.quote_link,
    description: item.description,
    commercial_markup: item.commercial_markup,
    total_commercial_material_cost: item.total_commercial_material_cost,
    total_commercial_work_cost: item.total_commercial_work_cost,
  }));

  const { data: newItems, error: insertError } = await supabase
    .from('boq_items')
    .insert(itemsToInsert)
    .select();

  if (insertError || !newItems) {
    throw new Error(`Ошибка вставки элементов: ${insertError?.message}`);
  }

  // Step 3: Restore parent_work_item_id relationships using array indices
  // Key insight: sourceItems[i] maps to newItems[i] (same order preserved)
  const updates: Array<{ id: string; parent_work_item_id: string }> = [];

  sourceItems.forEach((sourceItem, i) => {
    if (sourceItem.parent_work_item_id) {
      // Find the index of the parent work in source array
      const parentIndex = sourceItems.findIndex(
        (x) => x.id === sourceItem.parent_work_item_id
      );

      if (parentIndex !== -1) {
        // Use the same index to get the new parent work ID
        updates.push({
          id: newItems[i].id,
          parent_work_item_id: newItems[parentIndex].id,
        });
      }
    }
  });

  // Batch update parent_work_item_id
  if (updates.length > 0) {
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('boq_items')
        .update({ parent_work_item_id: update.parent_work_item_id })
        .eq('id', update.id);

      if (updateError) {
        console.error('Error updating parent_work_item_id:', updateError);
        // Continue with other updates even if one fails
      }
    }
  }

  // Step 4: Recalculate position totals
  // Sum up materials and works for the target position
  const { data: totals, error: totalsError } = await supabase
    .from('boq_items')
    .select('boq_item_type, total_amount')
    .eq('client_position_id', targetPositionId);

  if (!totalsError && totals) {
    const totalMaterial = totals
      .filter((item) =>
        ['мат', 'суб-мат', 'мат-комп.'].includes(item.boq_item_type)
      )
      .reduce((sum, item) => sum + (item.total_amount || 0), 0);

    const totalWorks = totals
      .filter((item) => ['раб', 'суб-раб', 'раб-комп.'].includes(item.boq_item_type))
      .reduce((sum, item) => sum + (item.total_amount || 0), 0);

    // Update target position totals
    await supabase
      .from('client_positions')
      .update({
        total_material: totalMaterial,
        total_works: totalWorks,
      })
      .eq('id', targetPositionId);
  }

  // Calculate counts for return
  const worksCount = sourceItems.filter((item) => item.work_name_id).length;
  const materialsCount = sourceItems.filter((item) => item.material_name_id).length;

  return {
    worksCount,
    materialsCount,
    totalCopied: newItems.length,
  };
}
