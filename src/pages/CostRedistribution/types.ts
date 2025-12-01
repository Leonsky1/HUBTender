export interface CostCategory {
  id: string;
  name: string;
}

export interface DetailCostCategory {
  id: string;
  cost_category_id: string;
  name: string;
  location: string | null;
  full_name: string; // "Категория / Детализация / Локация"
}
