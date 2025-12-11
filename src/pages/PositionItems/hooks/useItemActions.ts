import { message } from 'antd';
import {
  supabase,
  type ClientPosition,
  type BoqItemInsert,
  type BoqItemType,
  type MaterialType,
  type CurrencyType,
  type DeliveryPriceType,
  type WorkLibraryFull,
  type MaterialLibraryFull,
  type BoqItemFull,
} from '../../../lib/supabase';
import { insertTemplateItems } from '../../../utils/insertTemplateItems';

interface UseItemActionsProps {
  position: ClientPosition | null;
  works: WorkLibraryFull[];
  materials: MaterialLibraryFull[];
  items: BoqItemFull[];
  getCurrencyRate: (currency: CurrencyType) => number;
  fetchItems: () => Promise<void>;
}

export const useItemActions = ({
  position,
  works,
  materials,
  items,
  getCurrencyRate,
  fetchItems,
}: UseItemActionsProps) => {
  const updateClientPositionTotals = async (positionId: string) => {
    try {
      const { data: boqItems, error: fetchError } = await supabase
        .from('boq_items')
        .select('boq_item_type, total_amount')
        .eq('client_position_id', positionId);

      if (fetchError) throw fetchError;

      const totalMaterial = (boqItems || [])
        .filter(item => ['мат', 'суб-мат', 'мат-комп.'].includes(item.boq_item_type))
        .reduce((sum, item) => sum + (item.total_amount || 0), 0);

      const totalWorks = (boqItems || [])
        .filter(item => ['раб', 'суб-раб', 'раб-комп.'].includes(item.boq_item_type))
        .reduce((sum, item) => sum + (item.total_amount || 0), 0);

      const { error } = await supabase
        .from('client_positions')
        .update({
          total_material: totalMaterial,
          total_works: totalWorks,
        })
        .eq('id', positionId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Ошибка обновления итогов позиции:', error.message);
    }
  };

  const handleAddWork = async (workNameId: string) => {
    if (!workNameId || !position) {
      message.error('Выберите работу');
      return;
    }

    try {
      const workLib = works.find(w => w.work_name_id === workNameId);
      if (!workLib) throw new Error('Работа не найдена в библиотеке');

      const maxSort = Math.max(...items.map(i => i.sort_number || 0), 0);

      const quantity = 1;
      const unitRate = workLib.unit_rate || 0;
      const rate = getCurrencyRate(workLib.currency_type as CurrencyType);
      const totalAmount = quantity * unitRate * rate;

      const newItem: BoqItemInsert = {
        tender_id: position.tender_id,
        client_position_id: position.id,
        sort_number: maxSort + 1,
        boq_item_type: workLib.item_type as BoqItemType,
        work_name_id: workLib.work_name_id,
        unit_code: workLib.unit,
        quantity: quantity,
        unit_rate: unitRate,
        currency_type: workLib.currency_type as CurrencyType,
        total_amount: totalAmount,
      };

      const { error } = await supabase.from('boq_items').insert(newItem);

      if (error) throw error;

      message.success('Работа добавлена');
      await fetchItems();
      await updateClientPositionTotals(position.id);
    } catch (error: any) {
      message.error('Ошибка добавления работы: ' + error.message);
    }
  };

  const handleAddMaterial = async (materialNameId: string) => {
    if (!materialNameId || !position) {
      message.error('Выберите материал');
      return;
    }

    try {
      const matLib = materials.find(m => m.material_name_id === materialNameId);
      if (!matLib) throw new Error('Материал не найден в библиотеке');

      const maxSort = Math.max(...items.map(i => i.sort_number || 0), 0);

      // Для непривязанных материалов используем количество ГП из позиции
      const gpVolume = position.manual_volume || 0;
      // base_quantity должно быть > 0 из-за CHECK constraint
      const baseQuantity = gpVolume > 0 ? gpVolume : 1;
      const consumptionCoeff = matLib.consumption_coefficient || 1;
      const quantity = baseQuantity * consumptionCoeff;
      const unitRate = matLib.unit_rate || 0;
      const rate = getCurrencyRate(matLib.currency_type as CurrencyType);

      let deliveryPrice = 0;
      if (matLib.delivery_price_type === 'не в цене') {
        deliveryPrice = Math.round(unitRate * rate * 0.03 * 100) / 100;
      } else if (matLib.delivery_price_type === 'суммой' && matLib.delivery_amount) {
        deliveryPrice = matLib.delivery_amount;
      }

      const totalAmount = quantity * (unitRate * rate + deliveryPrice);

      const newItem: BoqItemInsert = {
        tender_id: position.tender_id,
        client_position_id: position.id,
        sort_number: maxSort + 1,
        boq_item_type: matLib.item_type as BoqItemType,
        material_type: matLib.material_type as MaterialType,
        material_name_id: matLib.material_name_id,
        unit_code: matLib.unit,
        quantity: quantity,
        base_quantity: baseQuantity,
        unit_rate: unitRate,
        consumption_coefficient: matLib.consumption_coefficient,
        currency_type: matLib.currency_type as CurrencyType,
        delivery_price_type: matLib.delivery_price_type as DeliveryPriceType,
        delivery_amount: matLib.delivery_amount,
        total_amount: totalAmount,
      };

      const { error } = await supabase.from('boq_items').insert(newItem);

      if (error) throw error;

      message.success('Материал добавлен');
      await fetchItems();
      await updateClientPositionTotals(position.id);
    } catch (error: any) {
      message.error('Ошибка добавления материала: ' + error.message);
    }
  };

  const handleAddTemplate = async (templateId: string, setLoading: (loading: boolean) => void) => {
    if (!templateId || !position) {
      message.error('Выберите шаблон');
      return;
    }

    try {
      setLoading(true);
      const result = await insertTemplateItems(templateId, position.id);

      message.success(
        `Вставлено из шаблона: ${result.worksCount} работ, ${result.materialsCount} материалов`
      );
      await fetchItems();
      await updateClientPositionTotals(position.id);
    } catch (error: any) {
      message.error('Ошибка вставки шаблона: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('boq_items').delete().eq('id', id);

      if (error) throw error;

      message.success('Элемент удален');
      await fetchItems();
      if (position) {
        await updateClientPositionTotals(position.id);
      }
    } catch (error: any) {
      message.error('Ошибка удаления: ' + error.message);
    }
  };

  const updateLinkedMaterialsQuantity = async (workId: string) => {
    try {
      const { data: workData, error: workError } = await supabase
        .from('boq_items')
        .select('quantity')
        .eq('id', workId)
        .single();

      if (workError) throw workError;

      const workQuantity = workData.quantity || 0;

      const { data: linkedMaterials, error: materialsError } = await supabase
        .from('boq_items')
        .select('id, conversion_coefficient, consumption_coefficient, unit_rate, currency_type, delivery_price_type, delivery_amount')
        .eq('parent_work_item_id', workId);

      if (materialsError) throw materialsError;

      for (const material of linkedMaterials || []) {
        const conversionCoeff = material.conversion_coefficient || 1;
        const consumptionCoeff = material.consumption_coefficient || 1;
        const newQuantity = workQuantity * conversionCoeff * consumptionCoeff;

        const unitRate = material.unit_rate || 0;
        const rate = getCurrencyRate(material.currency_type as CurrencyType);
        let deliveryPrice = 0;

        if (material.delivery_price_type === 'не в цене') {
          deliveryPrice = Math.round(unitRate * rate * 0.03 * 100) / 100;
        } else if (material.delivery_price_type === 'суммой' && material.delivery_amount) {
          deliveryPrice = material.delivery_amount;
        }

        const totalAmount = newQuantity * (unitRate * rate + deliveryPrice);

        await supabase
          .from('boq_items')
          .update({
            quantity: newQuantity,
            total_amount: totalAmount,
          })
          .eq('id', material.id);
      }
    } catch (error: any) {
      console.error('Ошибка обновления количества материалов:', error.message);
    }
  };

  const handleFormSave = async (
    data: any,
    expandedRowKeys: string[],
    items: BoqItemFull[],
    onSuccess: () => void
  ) => {
    try {
      const recordId = expandedRowKeys[0];
      if (!recordId) return;

      const { error } = await supabase
        .from('boq_items')
        .update(data)
        .eq('id', recordId);

      if (error) throw error;

      const updatedItem = items.find(item => item.id === recordId);
      if (updatedItem && ['раб', 'суб-раб', 'раб-комп.'].includes(updatedItem.boq_item_type)) {
        await updateLinkedMaterialsQuantity(recordId);
      }

      message.success('Изменения сохранены');
      await fetchItems();
      if (position) {
        await updateClientPositionTotals(position.id);
      }
      onSuccess();
    } catch (error: any) {
      message.error('Ошибка сохранения: ' + error.message);
    }
  };

  const handleSaveGPData = async (
    positionId: string,
    gpVolume: number,
    gpNote: string,
    onSuccess: () => void
  ) => {
    try {
      const { error } = await supabase
        .from('client_positions')
        .update({
          manual_volume: gpVolume,
          manual_note: gpNote,
        })
        .eq('id', positionId);

      if (error) throw error;
      onSuccess();
    } catch (error: any) {
      message.error('Ошибка сохранения данных ГП: ' + error.message);
    }
  };

  const handleSaveAdditionalWorkData = async (
    positionId: string,
    workName: string,
    unitCode: string,
    onSuccess: () => void
  ) => {
    try {
      const { error } = await supabase
        .from('client_positions')
        .update({
          work_name: workName,
          unit_code: unitCode,
        })
        .eq('id', positionId);

      if (error) throw error;
      onSuccess();
      message.success('Данные дополнительной работы сохранены');
    } catch (error: any) {
      message.error('Ошибка сохранения данных: ' + error.message);
    }
  };

  return {
    handleAddWork,
    handleAddMaterial,
    handleAddTemplate,
    handleDelete,
    handleFormSave,
    handleSaveGPData,
    handleSaveAdditionalWorkData,
  };
};
